import { randomUUID } from "node:crypto";
import { Router, type Express, type Request, type Response, type NextFunction } from "express";
import rateLimit from "express-rate-limit";
import { ensureAdmin } from "../auth";
import { blogPool, ensureBlogTables } from "../blog/db";
import { generateArticle, generateCover, slugify, suggestKeywords } from "../blog/generation";
import type { EditorialSettings } from "../blog/generation";
import { registerPublicBlogRoutes } from "../blog/public";
import { validateBiblicalReferences } from "../blog/references";

type Handler = (req: Request, res: Response) => Promise<unknown>;
const asyncRoute = (fn: Handler) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res)).catch(next);
};
const uuid = (value: string) => /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value);
const text = (value: unknown, max: number) => typeof value === "string" ? value.trim().slice(0, max) : "";
const keyFor = (keyword: string) => keyword.toLocaleLowerCase("pt-BR").replace(/\s+/g, " ").trim();

async function articleResponse(id: string) {
  const { rows } = await blogPool.query(
    `SELECT id,keyword_id,title,slug,meta_description,body_markdown,cover_alt,
            cover_image IS NOT NULL AS has_cover,status,created_at,updated_at,published_at
       FROM blog_articles WHERE id=$1`, [id],
  );
  return rows[0];
}

async function createDraft(keywordId: string, source: "manual" | "scheduled", replaceId?: string, expectedUpdatedAt?: string) {
  const claimId = randomUUID();
  const claimed = await blogPool.query(
    `UPDATE blog_keywords SET status='generating',claim_id=$2,updated_at=now()
      WHERE id=$1 AND status IN ('new','queued','used') RETURNING *`,
    [keywordId, claimId],
  );
  if (!claimed.rowCount) throw Object.assign(new Error("Palavra-chave indisponível ou já em geração."), { status: 409 });
  const keyword = claimed.rows[0];
  const previousStatus = replaceId ? "used" : "queued";
  try {
    if (!replaceId) {
      const duplicate = await blogPool.query(
        `SELECT 1 FROM blog_articles WHERE keyword_id=$1 AND status='published' LIMIT 1`, [keywordId],
      );
      if (duplicate.rowCount) throw Object.assign(new Error("Este tema já tem um artigo publicado."), { status: 409 });
    }
    const settings = (await blogPool.query("SELECT * FROM blog_settings WHERE id=1")).rows[0] as EditorialSettings;
    const related = (await blogPool.query(
      "SELECT title,slug FROM blog_articles WHERE status='published' ORDER BY published_at DESC LIMIT 40",
    )).rows;
    const draft = await generateArticle(keyword.keyword, keyword.intent, settings, related);
    await validateBiblicalReferences(draft.body_markdown);
    const cover = await generateCover(draft.cover_prompt);
    const client = await blogPool.connect();
    try {
      await client.query("BEGIN");
      const ownership = await client.query(
        "SELECT id FROM blog_keywords WHERE id=$1 AND claim_id=$2 AND status='generating' FOR UPDATE",
        [keywordId, claimId],
      );
      if (!ownership.rowCount) throw Object.assign(new Error("A geração perdeu a posse da palavra-chave; tente novamente."), { status: 409 });
      let articleId = replaceId;
      if (replaceId) {
        const result = await client.query(
          `UPDATE blog_articles SET title=$2,meta_description=$3,body_markdown=$4,
            cover_image=$5,cover_mime=$10,cover_alt=$6,status='draft',
            slug=$8,published_at=NULL,updated_at=now()
            WHERE id=$1 AND keyword_id=$7 AND status IN ('draft','rejected')
              AND updated_at=$9::timestamptz RETURNING id`,
          [replaceId, draft.title, draft.meta_description, draft.body_markdown, cover.data, draft.cover_alt,
            keywordId, `${draft.slug.slice(0, 76).replace(/-$/g, "")}-${replaceId.slice(0, 8)}`, expectedUpdatedAt, cover.mime],
        );
        if (!result.rowCount) throw Object.assign(new Error("O artigo mudou durante a geração ou já foi publicado; recarregue e tente novamente."), { status: 409 });
      } else {
        articleId = randomUUID();
        // A short UUID suffix avoids collisions without changing an existing published URL.
        const slug = `${draft.slug.slice(0, 76).replace(/-$/g, "")}-${articleId.slice(0, 8)}`;
        await client.query(
          `INSERT INTO blog_articles
            (id,keyword_id,title,slug,meta_description,body_markdown,cover_image,cover_mime,cover_alt,generation_source)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
          [articleId, keywordId, draft.title, slug, draft.meta_description, draft.body_markdown, cover.data, cover.mime, draft.cover_alt, source],
        );
      }
      const completed = await client.query(
        "UPDATE blog_keywords SET status='used',claim_id=NULL,updated_at=now() WHERE id=$1 AND claim_id=$2 AND status='generating'",
        [keywordId, claimId],
      );
      if (!completed.rowCount) throw Object.assign(new Error("A geração expirou; nenhum rascunho foi salvo."), { status: 409 });
      await client.query("COMMIT");
      return articleResponse(articleId!);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    await blogPool.query(
      "UPDATE blog_keywords SET status=$2,claim_id=NULL,updated_at=now() WHERE id=$1 AND claim_id=$3 AND status='generating'",
      [keywordId, previousStatus, claimId],
    );
    throw error;
  }
}

let schedulerStarted = false;
export function startBlogScheduler() {
  if (schedulerStarted) return;
  schedulerStarted = true;
  const tick = async () => {
    await ensureBlogTables();
    const client = await blogPool.connect();
    try {
      const acquired = await client.query("SELECT pg_try_advisory_lock(81731103) AS locked");
      if (!acquired.rows[0]?.locked) return;
      try {
        // Recover a claim left by a terminated process; never touch other tables.
        await client.query(
          "UPDATE blog_keywords SET status='queued',claim_id=NULL,updated_at=now() WHERE status='generating' AND updated_at < now() - interval '30 minutes'",
        );
        const settings = (await client.query("SELECT schedule_enabled,daily_limit FROM blog_settings WHERE id=1")).rows[0];
        if (!settings?.schedule_enabled) return;
        const count = await client.query(
          `SELECT count(*)::int AS total FROM blog_articles
            WHERE generation_source='scheduled' AND created_at >= current_date`,
        );
        const remaining = Math.max(0, settings.daily_limit - count.rows[0].total);
        for (let i = 0; i < remaining; i++) {
          const next = await client.query(
            "SELECT id FROM blog_keywords WHERE status='queued' ORDER BY relevance DESC,created_at ASC LIMIT 1",
          );
          if (!next.rowCount) break;
          try {
            await createDraft(next.rows[0].id, "scheduled");
          } catch (error) {
            console.error("[blog] Geração agendada falhou; nenhum artigo foi publicado:", error);
            break;
          }
        }
      } finally {
        await client.query("SELECT pg_advisory_unlock(81731103)");
      }
    } finally {
      client.release();
    }
  };
  // Disabled in settings by default; even when enabled this only makes drafts.
  const timer = setInterval(() => void tick().catch((error) =>
    console.error("[blog] Agendamento de rascunhos falhou:", error)), 60 * 60 * 1000);
  timer.unref();
  setTimeout(() => void tick().catch((error) =>
    console.error("[blog] Agendamento inicial falhou:", error)), 60_000).unref();
}

export function registerBlogRoutes(app: Express) {
  registerPublicBlogRoutes(app);
  const admin = Router();
  admin.use(ensureAdmin);
  admin.use((_req, _res, next) => { void ensureBlogTables().then(() => next(), next); });
  const suggestLimit = rateLimit({ windowMs: 60 * 60 * 1000, limit: 20, standardHeaders: "draft-7", legacyHeaders: false });
  const generationLimit = rateLimit({ windowMs: 60 * 60 * 1000, limit: 8, standardHeaders: "draft-7", legacyHeaders: false });

  admin.get("/keywords", asyncRoute(async (_req, res) => {
    const { rows } = await blogPool.query("SELECT id,seed,keyword,intent,relevance,reason,status,created_at FROM blog_keywords ORDER BY created_at DESC LIMIT 300");
    res.json({ keywords: rows });
  }));
  admin.post("/keywords/suggest", suggestLimit, asyncRoute(async (req, res) => {
    const seed = text(req.body?.seed, 140);
    if (seed.length < 3) return res.status(400).json({ message: "Digite um tema com pelo menos 3 caracteres." });
    const suggestions = await suggestKeywords(seed);
    for (const item of suggestions) {
      await blogPool.query(
        `INSERT INTO blog_keywords (id,seed,keyword,keyword_key,intent,relevance,reason)
          VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (keyword_key) DO NOTHING`,
        [randomUUID(), seed, item.keyword, keyFor(item.keyword), item.intent, item.relevance, item.reason],
      );
    }
    const { rows } = await blogPool.query(
      "SELECT id,seed,keyword,intent,relevance,reason,status,created_at FROM blog_keywords WHERE seed=$1 ORDER BY relevance DESC,created_at DESC LIMIT 50",
      [seed],
    );
    res.json({ keywords: rows });
  }));
  admin.patch("/keywords/:id", asyncRoute(async (req, res) => {
    if (!uuid(req.params.id) || !["new", "queued", "discarded"].includes(req.body?.status)) {
      return res.status(400).json({ message: "Status ou ID inválido." });
    }
    const { rows } = await blogPool.query(
      `UPDATE blog_keywords SET status=$2,updated_at=now() WHERE id=$1 AND status IN ('new','queued','discarded')
        RETURNING id,seed,keyword,intent,relevance,reason,status,created_at`,
      [req.params.id, req.body.status],
    );
    if (!rows[0]) return res.status(409).json({ message: "Palavra-chave já usada ou em geração." });
    res.json({ keyword: rows[0] });
  }));
  admin.post("/keywords/:id/generate", generationLimit, asyncRoute(async (req, res) => {
    if (!uuid(req.params.id)) return res.status(400).json({ message: "ID inválido." });
    const article = await createDraft(req.params.id, "manual");
    res.status(201).json({ article });
  }));

  admin.get("/articles", asyncRoute(async (req, res) => {
    const status = ["draft", "published", "rejected"].includes(String(req.query.status)) ? req.query.status : "draft";
    const { rows } = await blogPool.query(
      `SELECT id,keyword_id,title,slug,meta_description,body_markdown,cover_alt,
        cover_image IS NOT NULL AS has_cover,status,created_at,updated_at,published_at
        FROM blog_articles WHERE status=$1 ORDER BY updated_at DESC LIMIT 150`, [status],
    );
    res.json({ articles: rows });
  }));
  admin.patch("/articles/:id", asyncRoute(async (req, res) => {
    if (!uuid(req.params.id)) return res.status(400).json({ message: "ID inválido." });
    const title = text(req.body?.title, 150);
    const slug = text(req.body?.slug, 90);
    const expected = typeof req.body?.expected_updated_at === "string" ? req.body.expected_updated_at : "";
    const meta = text(req.body?.meta_description, 155);
    const body = typeof req.body?.body_markdown === "string" ? req.body.body_markdown.trim() : "";
    const alt = text(req.body?.cover_alt, 250);
    if (!title || !meta || !body || !alt || !slug || slug !== slugify(slug) ||
      !Number.isFinite(Date.parse(expected)) ||
      body.length > 35_000 || body.length < 1000) {
      return res.status(400).json({ message: "Confira título, slug, descrição, texto e alt da capa." });
    }
    const { rows } = await blogPool.query(
      `UPDATE blog_articles SET title=$2,slug=$3,meta_description=$4,body_markdown=$5,
       cover_alt=$6,updated_at=now() WHERE id=$1 AND updated_at=$7::timestamptz
       AND (status<>'published' OR slug=$3) RETURNING id`,
      [req.params.id, title, slug, meta, body, alt, expected],
    );
    if (!rows[0]) return res.status(409).json({ message: "O artigo foi alterado por outra pessoa ou seu endereço publicado não pode ser trocado. Recarregue antes de salvar." });
    res.json({ article: await articleResponse(req.params.id) });
  }));
  admin.post("/articles/:id/publish", asyncRoute(async (req, res) => {
    if (!uuid(req.params.id)) return res.status(400).json({ message: "ID inválido." });
    const selected = (await blogPool.query(
      `SELECT body_markdown,updated_at FROM blog_articles
        WHERE id=$1 AND status='draft' AND cover_image IS NOT NULL`, [req.params.id],
    )).rows[0];
    if (!selected) return res.status(409).json({ message: "Só um rascunho completo com capa pode ser publicado." });
    const wordCount = selected.body_markdown.trim().split(/\s+/).length;
    if (wordCount < 1200 || wordCount > 2000 ||
      !/## Perguntas frequentes/i.test(selected.body_markdown) ||
      (selected.body_markdown.match(/^### /gm) ?? []).length < 3) {
      return res.status(400).json({ message: "Para publicar, o artigo precisa de 1.200 a 2.000 palavras e uma seção de perguntas frequentes." });
    }
    await validateBiblicalReferences(selected.body_markdown);
    const { rows } = await blogPool.query(
      `UPDATE blog_articles SET status='published',published_at=now(),updated_at=now()
        WHERE id=$1 AND status='draft' AND cover_image IS NOT NULL
        AND updated_at=$2::timestamptz RETURNING id`,
      [req.params.id, selected.updated_at],
    );
    if (!rows[0]) return res.status(409).json({ message: "O rascunho foi alterado durante a revisão. Recarregue e tente novamente." });
    res.json({ article: await articleResponse(req.params.id) });
  }));
  admin.post("/articles/:id/reject", asyncRoute(async (req, res) => {
    if (!uuid(req.params.id)) return res.status(400).json({ message: "ID inválido." });
    const { rows } = await blogPool.query(
      "UPDATE blog_articles SET status='rejected',updated_at=now() WHERE id=$1 AND status='draft' RETURNING id",
      [req.params.id],
    );
    if (!rows[0]) return res.status(409).json({ message: "Só rascunhos podem ser reprovados." });
    res.json({ article: await articleResponse(req.params.id) });
  }));
  admin.post("/articles/:id/unpublish", asyncRoute(async (req, res) => {
    if (!uuid(req.params.id)) return res.status(400).json({ message: "ID inválido." });
    const { rows } = await blogPool.query(
      "UPDATE blog_articles SET status='draft',published_at=NULL,updated_at=now() WHERE id=$1 AND status='published' RETURNING id",
      [req.params.id],
    );
    if (!rows[0]) return res.status(409).json({ message: "Só artigos publicados podem ser despublicados." });
    res.json({ article: await articleResponse(req.params.id) });
  }));
  admin.post("/articles/:id/regenerate", generationLimit, asyncRoute(async (req, res) => {
    if (!uuid(req.params.id)) return res.status(400).json({ message: "ID inválido." });
    const expected = typeof req.body?.expected_updated_at === "string" ? req.body.expected_updated_at : "";
    if (!Number.isFinite(Date.parse(expected))) return res.status(400).json({ message: "Versão do artigo obrigatória." });
    const existing = await blogPool.query(
      "SELECT keyword_id FROM blog_articles WHERE id=$1 AND status IN ('draft','rejected') AND updated_at=$2::timestamptz",
      [req.params.id, expected],
    );
    if (!existing.rows[0]?.keyword_id) return res.status(409).json({ message: "Artigo não pode ser regenerado." });
    res.json({ article: await createDraft(existing.rows[0].keyword_id, "manual", req.params.id, expected) });
  }));
  admin.post("/articles/:id/cover", generationLimit, asyncRoute(async (req, res) => {
    if (!uuid(req.params.id)) return res.status(400).json({ message: "ID inválido." });
    const existing = await blogPool.query(
      "SELECT title,body_markdown FROM blog_articles WHERE id=$1 AND status IN ('draft','rejected')", [req.params.id],
    );
    if (!existing.rows[0]) return res.status(409).json({ message: "Capa editável apenas antes da publicação." });
    const image = await generateCover(existing.rows[0].title);
    const updated = await blogPool.query(
      "UPDATE blog_articles SET cover_image=$2,cover_mime=$3,updated_at=now() WHERE id=$1 AND status IN ('draft','rejected')",
      [req.params.id, image.data, image.mime],
    );
    if (!updated.rowCount) return res.status(409).json({ message: "Artigo publicado durante a geração da capa. Nenhuma capa foi alterada." });
    res.json({ article: await articleResponse(req.params.id) });
  }));
  admin.get("/articles/:id/cover", asyncRoute(async (req, res) => {
    if (!uuid(req.params.id)) return res.status(400).json({ message: "ID inválido." });
    const { rows } = await blogPool.query("SELECT cover_image,cover_mime FROM blog_articles WHERE id=$1", [req.params.id]);
    if (!rows[0]?.cover_image) return res.sendStatus(404);
    res.set({ "Cache-Control": "private, no-store", "Content-Type": rows[0].cover_mime || "image/png" });
    res.send(rows[0].cover_image);
  }));
  admin.get("/settings", asyncRoute(async (_req, res) => {
    const { rows } = await blogPool.query(
      "SELECT tone,audience,editorial_rules,schedule_enabled,daily_limit FROM blog_settings WHERE id=1",
    );
    res.json({ settings: rows[0] });
  }));
  admin.put("/settings", asyncRoute(async (req, res) => {
    const tone = text(req.body?.tone, 600);
    const audience = text(req.body?.audience, 600);
    const rules = text(req.body?.editorial_rules, 3000);
    const enabled = req.body?.schedule_enabled;
    const limit = req.body?.daily_limit;
    if (!tone || !audience || !rules || typeof enabled !== "boolean" ||
      !Number.isInteger(limit) || limit < 1 || limit > 5) {
      return res.status(400).json({ message: "Configurações inválidas; limite diário de 1 a 5." });
    }
    const { rows } = await blogPool.query(
      `UPDATE blog_settings SET tone=$1,audience=$2,editorial_rules=$3,
        schedule_enabled=$4,daily_limit=$5,updated_at=now() WHERE id=1
        RETURNING tone,audience,editorial_rules,schedule_enabled,daily_limit`,
      [tone, audience, rules, enabled, limit],
    );
    res.json({ settings: rows[0] });
  }));
  app.use("/api/admin/blog", admin);
}