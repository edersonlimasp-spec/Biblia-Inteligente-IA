import { randomUUID } from "node:crypto";
import type { Express, Request, Response, NextFunction } from "express";
import { blogPool, ensureBlogTables } from "./db";
import { renderMarkdown } from "./markup";
import { blogStorageReady, uploadBlogCover } from "./storage";

// Importa automaticamente os artigos publicados no Soro (trysoro.com) para o
// blog proprio (blog_articles). Roda ao iniciar, a cada hora (se passaram 6h
// desde a ultima sincronizacao) e tambem sob demanda quando /blog ou a
// Biblioteca sao abertos — assim funciona mesmo no deploy autoscale.
const SORO_BASE = "https://app.trysoro.com";
const SORO_TOKEN = process.env.SORO_EMBED_TOKEN || "37c421bb-5141-4448-8e08-bb2b19f5003b";
const SYNC_EVERY_MS = 6 * 60 * 60 * 1000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

type SoroArticle = {
  id: string; title: string; slug: string; excerpt?: string;
  content?: string; isoDate?: string; image?: string | null;
};
export type SoroSyncResult = { imported: number; skipped: number; errors: string[] };

let running: Promise<SoroSyncResult> | null = null;
let lastRun = 0;
let schedulerStarted = false;
const disabled = () => process.env.SORO_SYNC_DISABLED === "1";

export function sanitizeSoroHtml(html: string): string {
  return html
    .replace(/<(script|style|iframe|object|embed|form|noscript)\b[\s\S]*?<\/\1\s*>/gi, "")
    .replace(/<\/?(script|style|iframe|object|embed|form|link|meta|base|noscript)\b[^>]*>/gi, "")
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/\s(href|src)\s*=\s*("|')\s*(javascript|data|vbscript):[^"']*\2/gi, ' $1="#"')
    .replace(/<h1(\s[^>]*)?>/gi, "<h2>").replace(/<\/h1\s*>/gi, "</h2>");
}

function slugify(value: string): string {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80).replace(/-+$/g, "");
}

async function get(url: string, ms = 15_000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { signal: controller.signal, headers: { "User-Agent": "BibliaInteligente-Sync/1.0" } });
  } finally {
    clearTimeout(timer);
  }
}

async function listSoroArticles(): Promise<SoroArticle[]> {
  const res = await get(`${SORO_BASE}/api/embed/${SORO_TOKEN}`);
  if (!res.ok) throw new Error(`Soro respondeu HTTP ${res.status}`);
  const script = await res.text();
  const match = script.match(/var\s+SORO_ARTICLES\s*=\s*(\[[\s\S]*?\]);\s*\n/);
  if (!match) throw new Error("Lista de artigos do Soro nao encontrada no script de embed");
  const list: unknown = JSON.parse(match[1]);
  if (!Array.isArray(list)) return [];
  return list.filter((a): a is SoroArticle =>
    Boolean(a && typeof a.id === "string" && UUID.test(a.id) && a.title && a.slug));
}

async function soroContent(article: SoroArticle): Promise<string> {
  if (article.content) return article.content;
  const res = await get(`${SORO_BASE}/api/embed/${SORO_TOKEN}/article/${article.id}`);
  if (!res.ok) throw new Error(`conteudo HTTP ${res.status}`);
  const data = await res.json() as { content?: unknown };
  return String(data?.content ?? "");
}

async function soroCover(url?: string | null): Promise<{ data: Buffer; mime: string } | null> {
  if (!url || !/^https:\/\//i.test(url)) return null;
  const res = await get(url, 20_000);
  if (!res.ok) return null;
  const mime = (res.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
  if (!/^image\/(png|jpe?g|webp|gif|avif)$/.test(mime)) return null;
  const data = Buffer.from(await res.arrayBuffer());
  if (!data.length || data.length > 6 * 1024 * 1024) return null;
  return { data, mime };
}

async function importArticle(article: SoroArticle): Promise<boolean> {
  const exists = await blogPool.query("SELECT 1 FROM blog_articles WHERE id=$1", [article.id]);
  if (exists.rowCount) return false; // ja importado (ou rejeitado no painel) — nunca sobrescreve

  let slug = SLUG.test(article.slug) && article.slug.length <= 80 ? article.slug : slugify(article.title);
  if (!slug) slug = `artigo-${article.id.slice(0, 8)}`;
  const clash = await blogPool.query("SELECT 1 FROM blog_articles WHERE slug=$1", [slug]);
  if (clash.rowCount) slug = `${slug}-${article.id.slice(0, 6)}`;

  const html = sanitizeSoroHtml(await soroContent(article));
  if (html.replace(/<[^>]+>/g, "").trim().length < 200) throw new Error("conteudo vazio");

  let coverKey: string | null = null;
  let coverBytes: Buffer | null = null;
  let coverMime: string | null = null;
  const cover = await soroCover(article.image).catch(() => null);
  if (cover) {
    coverMime = cover.mime;
    if (blogStorageReady()) {
      try { coverKey = await uploadBlogCover(article.id, cover.data, cover.mime); } catch { coverBytes = cover.data; }
    } else {
      coverBytes = cover.data;
    }
  }

  const date = article.isoDate && !Number.isNaN(Date.parse(article.isoDate)) ? new Date(article.isoDate) : new Date();
  const description = String(article.excerpt || article.title).slice(0, 300);
  const result = await blogPool.query(
    `INSERT INTO blog_articles (id,title,slug,meta_description,body_markdown,body_html,external_source,
       cover_image,cover_mime,cover_alt,cover_file_key,status,generation_source,published_at,created_at,updated_at)
     VALUES ($1,$2,$3,$4,'',$5,'soro',$6,$7,$8,$9,'published','manual',$10,$10,now())
     ON CONFLICT DO NOTHING`,
    [article.id, String(article.title).slice(0, 200), slug, description, html,
      coverBytes, coverMime, String(article.title).slice(0, 200), coverKey, date],
  );
  return Boolean(result.rowCount);
}

async function logRun(status: "succeeded" | "failed", message: string) {
  await blogPool.query(
    "INSERT INTO blog_job_runs (id,status,message,finished_at) VALUES ($1,$2,$3,now())",
    [randomUUID(), status, message.slice(0, 900)],
  ).catch(() => undefined);
}

export function syncSoroArticles(force = false): Promise<SoroSyncResult> {
  if (running) return running;
  if (disabled() || (!force && Date.now() - lastRun < SYNC_EVERY_MS)) {
    return Promise.resolve({ imported: 0, skipped: 0, errors: [] });
  }
  lastRun = Date.now();
  running = (async () => {
    const result: SoroSyncResult = { imported: 0, skipped: 0, errors: [] };
    try {
      await ensureBlogTables();
      const articles = await listSoroArticles();
      for (const article of articles) {
        try {
          if (await importArticle(article)) result.imported++; else result.skipped++;
        } catch (error) {
          result.errors.push(`${article.slug}: ${(error as Error).message}`);
        }
      }
      if (result.imported || result.errors.length) {
        await logRun(result.errors.length && !result.imported ? "failed" : "succeeded",
          `Soro: ${result.imported} importado(s), ${result.skipped} ja existente(s)` +
          (result.errors.length ? `; erros: ${result.errors.join(" | ")}` : ""));
      }
      if (result.imported) console.log(`[soro-sync] ${result.imported} artigo(s) importado(s) do Soro`);
    } catch (error) {
      lastRun = Date.now() - SYNC_EVERY_MS + 15 * 60 * 1000; // tenta de novo em 15 min
      result.errors.push((error as Error).message);
      console.error("[soro-sync] falhou:", (error as Error).message);
      await logRun("failed", `Soro: ${(error as Error).message}`);
    }
    return result;
  })().finally(() => { running = null; });
  return running;
}

// Espera a sincronizacao no maximo `maxWaitMs`; depois segue em segundo plano.
export async function syncSoroSoon(maxWaitMs = 5000): Promise<void> {
  await Promise.race([
    syncSoroArticles().catch(() => undefined),
    new Promise((resolve) => setTimeout(resolve, maxWaitMs)),
  ]);
}

export function startSoroScheduler() {
  if (schedulerStarted || disabled()) return;
  schedulerStarted = true;
  setTimeout(() => void syncSoroArticles(true).catch(() => undefined), 20_000);
  const timer = setInterval(() => void syncSoroArticles().catch(() => undefined), 60 * 60 * 1000);
  timer.unref?.();
}

type Handler = (req: Request, res: Response) => Promise<unknown>;
const route = (fn: Handler) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res)).catch(next);
};

// API usada pela aba "Artigos" da Biblioteca no app (iOS, Android e web).
export function registerArticleApi(app: Express) {
  app.get("/api/blog-articles", route(async (_req, res) => {
    await ensureBlogTables();
    await syncSoroSoon(4000);
    const { rows } = await blogPool.query(
      `SELECT id,title,slug,meta_description AS excerpt,published_at,
        (cover_file_key IS NOT NULL OR cover_image IS NOT NULL) AS has_cover
       FROM blog_articles WHERE status='published'
       ORDER BY published_at DESC,id DESC LIMIT 40`,
    );
    res.set("Cache-Control", "public, max-age=120").json(rows);
  }));
  app.get("/api/blog-articles/:slug", route(async (req, res) => {
    await ensureBlogTables();
    const { slug } = req.params;
    if (!SLUG.test(slug) || slug.length > 90) return res.sendStatus(404);
    const { rows } = await blogPool.query(
      `SELECT id,title,slug,meta_description AS excerpt,published_at,body_markdown,body_html,
        (cover_file_key IS NOT NULL OR cover_image IS NOT NULL) AS has_cover
       FROM blog_articles WHERE slug=$1 AND status='published'`, [slug],
    );
    const article = rows[0];
    if (!article) return res.sendStatus(404);
    const { body_markdown: markdown, body_html: html, ...rest } = article;
    res.set("Cache-Control", "public, max-age=300")
      .json({ ...rest, html: html || renderMarkdown(String(markdown || "")) });
  }));
}
