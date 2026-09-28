import { randomUUID } from "node:crypto";
import { Router, type Express, type Request, type Response, type NextFunction } from "express";
import rateLimit from "express-rate-limit";
import { ensureAdmin } from "../auth";
import { blogPool, ensureBlogTables } from "../blog/db";
import { generateArticle, generateCover, slugify, suggestKeywords } from "../blog/generation";
import type { EditorialSettings } from "../blog/generation";
import { registerPublicBlogRoutes } from "../blog/public";
import { validateBiblicalReferences } from "../blog/references";
import { canonicalOrigin } from "../blog/markup";
import { blogStorageReady, deleteBlogCover, downloadBlogCover, uploadBlogCover } from "../blog/storage";

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
            (cover_file_key IS NOT NULL OR cover_image IS NOT NULL) AS has_cover,
            status,created_at,updated_at,published_at
       FROM blog_articles WHERE id=$1`, [id],
  );
  return rows[0];
}

async function createDraft(keywordId: string, source: "manual" | "scheduled", replaceId?: string, expectedUpdatedAt?: string) {
  const claimId = randomUUID();
  const candidateId = replaceId ?? randomUUID();
  let newCoverKey: string | null = null;
  let newCoverMime: string | null = null;
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
    const previousCoverKey = replaceId
      ? (await blogPool.query("SELECT cover_file_key FROM blog_articles WHERE id=$1", [replaceId])).rows[0]?.cover_file_key
      : null;
    if (blogStorageReady()) {
      const cover = await generateCover(draft.cover_prompt, settings.image_style);
      newCoverKey = await uploadBlogCover(candidateId, cover.data, cover.mime);
      newCoverMime = cover.mime;
    }
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
            cover_image=NULL,cover_mime=$9,cover_file_key=$10,cover_alt=$5,status='draft',
            slug=$7,published_at=NULL,updated_at=now()
            WHERE id=$1 AND keyword_id=$6 AND status IN ('draft','rejected')
              AND updated_at=$8::timestamptz RETURNING id`,
          [replaceId, draft.title, draft.meta_description, draft.body_markdown, draft.cover_alt,
            keywordId, `${draft.slug.slice(0, 76).replace(/-$/g, "")}-${replaceId.slice(0, 8)}`, expectedUpdatedAt,
            newCoverMime, newCoverKey],
        );
        if (!result.rowCount) throw Object.assign(new Error("O artigo mudou durante a geração ou já foi publicado; recarregue e tente novamente."), { status: 409 });
      } else {
        articleId = candidateId;
        // A short UUID suffix avoids collisions without changing an existing published URL.
        const slug = `${draft.slug.slice(0, 76).replace(/-$/g, "")}-${articleId.slice(0, 8)}`;
        await client.query(
          `INSERT INTO blog_articles
            (id,keyword_id,title,slug,meta_description,body_markdown,cover_alt,generation_source,cover_file_key,cover_mime)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
          [articleId, keywordId, draft.title, slug, draft.meta_description, draft.body_markdown, draft.cover_alt,
            source, newCoverKey, newCoverMime],
        );
      }
      const completed = await client.query(
        "UPDATE blog_keywords SET status='used',claim_id=NULL,updated_at=now() WHERE id=$1 AND claim_id=$2 AND status='generating'",
        [keywordId, claimId],
      );
      if (!completed.rowCount) throw Object.assign(new Error("A geração expirou; nenhum rascunho foi salvo."), { status: 409 });
      await client.query("COMMIT");
      if (previousCoverKey && previousCoverKey !== newCoverKey) {
        void deleteBlogCover(previousCoverKey).catch((error) =>
          console.error("[blog] Não foi possível remover capa anterior:", error));
      }
      return articleResponse(articleId!);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    if (newCoverKey) await deleteBlogCover(newCoverKey).catch((cleanupError) =>
      console.error("[blog] Falha na limpeza de capa após erro de geração:", cleanupError));
    await blogPool.query(
      "UPDATE blog_keywords SET status=$2,claim_id=NULL,updated_at=now() WHERE id=$1 AND claim_id=$3 AND status='generating'",
      [keywordId, previousStatus, claimId],
    );
    throw error;
  }
}

async function publishReadyDraft(id: string, requireCover = false) {
  const selected = (await blogPool.query(
    `SELECT body_markdown,updated_at,(cover_file_key IS NOT NULL OR cover_image IS NOT NULL) AS has_cover
     FROM blog_articles WHERE id=$1 AND status='draft'`, [id],
  )).rows[0];
  if (!selected) throw Object.assign(new Error("Só um rascunho completo pode ser publicado."), { status: 409 });
  if (requireCover && !selected.has_cover) {
    throw Object.assign(new Error("A publicação automática exige uma capa salva no App Storage."), { status: 409 });
  }
  const wordCount = selected.body_markdown.trim().split(/\s+/).length;
  if (wordCount < 1500 || wordCount > 2500 ||
      !/## Perguntas frequentes/i.test(selected.body_markdown) ||
      (selected.body_markdown.match(/^### /gm) ?? []).length < 3) {
    throw Object.assign(new Error("Para publicar, o artigo precisa de 1.500 a 2.500 palavras e uma seção de perguntas frequentes."), { status: 400 });
  }
  await validateBiblicalReferences(selected.body_markdown);
  const result = await blogPool.query(
    `UPDATE blog_articles SET status='published',published_at=now(),updated_at=now()
     WHERE id=$1 AND status='draft' AND updated_at=$2::timestamptz RETURNING id`,
    [id, selected.updated_at],
  );
  if (!result.rowCount) throw Object.assign(new Error("O rascunho mudou durante a publicação; tente novamente."), { status: 409 });
  return articleResponse(id);
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
        const settings = (await client.query("SELECT schedule_enabled,daily_limit,auto_publish FROM blog_settings WHERE id=1")).rows[0];
        if (!settings?.schedule_enabled) return;
        if (settings.auto_publish && !blogStorageReady()) {
          console.error("[blog] Publicação automática pausada: configure App Storage antes de ativar capas.");
          return;
        }
        const today = (await client.query("SELECT (now() AT TIME ZONE 'America/Sao_Paulo')::date AS today")).rows[0].today;
        const count = await client.query(
          `SELECT count(*)::int AS total FROM blog_job_runs
           WHERE (started_at AT TIME ZONE 'America/Sao_Paulo')::date=$1::date`,
          [today],
        );
        const remaining = Math.max(0, settings.daily_limit - count.rows[0].total);
        for (let i = 0; i < remaining; i++) {
          const next = await client.query(
            `SELECT k.id FROM blog_keywords k WHERE k.status='queued' AND k.schedule_date<=$1::date
             AND NOT EXISTS (SELECT 1 FROM blog_job_runs r WHERE r.keyword_id=k.id
               AND (r.started_at AT TIME ZONE 'America/Sao_Paulo')::date=$1::date)
             ORDER BY k.schedule_date,relevance DESC,k.created_at ASC LIMIT 1`, [today],
          );
          if (!next.rowCount) break;
          const runId = randomUUID();
          await client.query(
            "INSERT INTO blog_job_runs (id,keyword_id,status) VALUES ($1,$2,'running')",
            [runId, next.rows[0].id],
          );
          try {
            const article = await createDraft(next.rows[0].id, "scheduled");
            if (settings.auto_publish) await publishReadyDraft(article.id, true);
            await client.query(
              `UPDATE blog_job_runs SET status='succeeded',article_id=$2,message=$3,finished_at=now() WHERE id=$1`,
              [runId, article.id, settings.auto_publish ? "Publicado automaticamente" : "Rascunho criado para revisão"],
            );
          } catch (error) {
            await client.query(
              `UPDATE blog_job_runs SET status='failed',message=$2,finished_at=now() WHERE id=$1`,
              [runId, String(error instanceof Error ? error.message : error).slice(0, 800)],
            );
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
  // Disabled by default; scheduled publication also requires an explicit opt-in.
  const timer = setInterval(() => void tick().catch((error) =>
    console.error("[blog] Agendamento do blog falhou:", error)), 60 * 60 * 1000);
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
    const { rows } = await blogPool.query("SELECT id,seed,keyword,intent,relevance,reason,status,source,monthly_volume_estimate,difficulty,schedule_date,created_at FROM blog_keywords ORDER BY created_at DESC LIMIT 300");
    res.json({ keywords: rows });
  }));
  admin.post("/keywords", asyncRoute(async (req, res) => {
    const input: unknown = req.body?.keywords;
    const lines = typeof input === "string" ? input.split(/[\r\n,;]+/).map((line) => line.trim()).filter(Boolean) : input;
    if (!Array.isArray(lines) || lines.length < 1 || lines.length > 100 ||
        lines.some((line) => typeof line !== "string" || line.trim().length < 3 || line.trim().length > 140)) {
      return res.status(400).json({ message: "Informe de 1 a 100 palavras-chave (3 a 140 caracteres cada)." });
    }
    let inserted = 0;
    for (const keyword of Array.from(new Set((lines as string[]).map((line) => line.trim())))) {
      const result = await blogPool.query(
        `INSERT INTO blog_keywords (id,seed,keyword,keyword_key,source)
         VALUES ($1,$2,$2,$3,'manual') ON CONFLICT (keyword_key) DO NOTHING`,
        [randomUUID(), keyword, keyFor(keyword)],
      );
      inserted += result.rowCount ?? 0;
    }
    res.status(201).json({ inserted, duplicates: lines.length - inserted });
  }));
  admin.post("/keywords/suggest", suggestLimit, asyncRoute(async (req, res) => {
    const seed = text(req.body?.seed, 140);
    if (seed.length < 3) return res.status(400).json({ message: "Digite um tema com pelo menos 3 caracteres." });
    const suggestions = await suggestKeywords(seed);
    for (const item of suggestions) {
      await blogPool.query(
        `INSERT INTO blog_keywords (id,seed,keyword,keyword_key,intent,relevance,reason,source,monthly_volume_estimate,difficulty)
          VALUES ($1,$2,$3,$4,$5,$6,$7,'google+ia',$8,$9) ON CONFLICT (keyword_key) DO NOTHING`,
        [randomUUID(), seed, item.keyword, keyFor(item.keyword), item.intent, item.relevance, item.reason,
          item.monthly_volume_estimate, item.difficulty],
      );
    }
    const { rows } = await blogPool.query(
      "SELECT id,seed,keyword,intent,relevance,reason,status,source,monthly_volume_estimate,difficulty,schedule_date,created_at FROM blog_keywords WHERE seed=$1 ORDER BY relevance DESC,created_at DESC LIMIT 50",
      [seed],
    );
    res.json({ keywords: rows });
  }));
  admin.patch("/keywords/:id", asyncRoute(async (req, res) => {
    if (!uuid(req.params.id) || !["new", "queued", "discarded"].includes(req.body?.status)) {
      return res.status(400).json({ message: "Status ou ID inválido." });
    }
    const { rows } = await blogPool.query(
      `UPDATE blog_keywords SET status=$2,schedule_date=CASE WHEN $2='queued' THEN schedule_date ELSE NULL END,updated_at=now()
       WHERE id=$1 AND status IN ('new','queued','discarded')
        RETURNING id,seed,keyword,intent,relevance,reason,status,schedule_date,created_at`,
      [req.params.id, req.body.status],
    );
    if (!rows[0]) return res.status(409).json({ message: "Palavra-chave já usada ou em geração." });
    res.json({ keyword: rows[0] });
  }));
  admin.patch("/keywords/:id/schedule", asyncRoute(async (req, res) => {
    const date = req.body?.date;
    if (!uuid(req.params.id) || typeof date !== "string" ||
        (date !== "" && (!/^\d{4}-\d{2}-\d{2}$/.test(date) ||
          Number.isNaN(Date.parse(`${date}T00:00:00Z`)) ||
          new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) !== date))) {
      return res.status(400).json({ message: "Informe uma data válida (AAAA-MM-DD) ou deixe em branco para limpar." });
    }
    const { rows } = await blogPool.query(
      `UPDATE blog_keywords SET schedule_date=NULLIF($2,'')::date,updated_at=now()
       WHERE id=$1 AND status='queued' RETURNING id,keyword,schedule_date,status`,
      [req.params.id, date],
    );
    if (!rows[0]) return res.status(409).json({ message: "Só pautas na fila podem ser agendadas." });
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
        (cover_file_key IS NOT NULL OR cover_image IS NOT NULL) AS has_cover,status,created_at,updated_at,published_at
        FROM blog_articles WHERE status=$1 ORDER BY updated_at DESC LIMIT 150`, [status],
    );
    res.json({ articles: rows });
  }));
  admin.patch("/articles/:id", asyncRoute(async (req, res) => {
    if (!uuid(req.params.id)) return res.status(400).json({ message: "ID inválido." });
    const title = text(req.body?.title, 60);
    const slug = text(req.body?.slug, 90);
    const expected = typeof req.body?.expected_updated_at === "string" ? req.body.expected_updated_at : "";
    const meta = text(req.body?.meta_description, 155);
    const body = typeof req.body?.body_markdown === "string" ? req.body.body_markdown.trim() : "";
    const alt = text(req.body?.cover_alt, 250);
    if (!title || (typeof req.body?.title === "string" && req.body.title.trim().length > 60) ||
      !meta || !body || !slug || slug !== slugify(slug) ||
      !Number.isFinite(Date.parse(expected)) ||
      body.length > 35_000 || body.length < 1000) {
      return res.status(400).json({ message: "Confira título, slug, descrição e texto." });
    }
    await validateBiblicalReferences(body);
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
    res.json({ article: await publishReadyDraft(req.params.id) });
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
    if (!blogStorageReady()) return res.status(503).json({ message: "Ative um bucket do App Storage para criar capas." });
    const existing = await blogPool.query(
      "SELECT title,body_markdown,cover_file_key FROM blog_articles WHERE id=$1 AND status IN ('draft','rejected')", [req.params.id],
    );
    if (!existing.rows[0]) return res.status(409).json({ message: "Capa editável apenas antes da publicação." });
    const style = (await blogPool.query("SELECT image_style FROM blog_settings WHERE id=1")).rows[0]?.image_style ?? "";
    const image = await generateCover(existing.rows[0].title, style);
    const key = await uploadBlogCover(req.params.id, image.data, image.mime);
    const updated = await blogPool.query(
      `UPDATE blog_articles SET cover_image=NULL,cover_file_key=$2,cover_mime=$3,updated_at=now()
       WHERE id=$1 AND status IN ('draft','rejected')`,
      [req.params.id, key, image.mime],
    );
    if (!updated.rowCount) {
      await deleteBlogCover(key);
      return res.status(409).json({ message: "Artigo publicado durante a geração da capa. Nenhuma capa foi alterada." });
    }
    if (existing.rows[0].cover_file_key) void deleteBlogCover(existing.rows[0].cover_file_key)
      .catch((error) => console.error("[blog] Não foi possível remover capa anterior:", error));
    res.json({ article: await articleResponse(req.params.id) });
  }));
  admin.get("/articles/:id/cover", asyncRoute(async (req, res) => {
    if (!uuid(req.params.id)) return res.status(400).json({ message: "ID inválido." });
    const { rows } = await blogPool.query("SELECT cover_file_key,cover_image,cover_mime FROM blog_articles WHERE id=$1", [req.params.id]);
    if (!rows[0]?.cover_file_key && !rows[0]?.cover_image) return res.sendStatus(404);
    res.set({ "Cache-Control": "private, no-store", "Content-Type": rows[0].cover_mime || "image/png" });
    res.send(rows[0].cover_file_key ? await downloadBlogCover(rows[0].cover_file_key) : rows[0].cover_image);
  }));
  admin.get("/settings", asyncRoute(async (_req, res) => {
    const { rows } = await blogPool.query(
      "SELECT tone,audience,editorial_rules,business_type,language,primary_topics,avoid_topics,product_description,image_style,canonical_origin,schedule_enabled,daily_limit,auto_publish,gsc_verification,gsc_html_file FROM blog_settings WHERE id=1",
    );
    res.json({ settings: rows[0] });
  }));
  admin.put("/settings", asyncRoute(async (req, res) => {
    const tone = text(req.body?.tone, 600);
    const audience = text(req.body?.audience, 600);
    const rules = text(req.body?.editorial_rules, 3000);
    const business = text(req.body?.business_type, 300);
    const language = text(req.body?.language, 80);
    const topics = text(req.body?.primary_topics, 1200);
    const avoid = text(req.body?.avoid_topics, 1200);
    const product = text(req.body?.product_description, 1200);
    const imageStyle = text(req.body?.image_style, 600);
    const verification = text(req.body?.gsc_verification, 200);
    const htmlFile = text(req.body?.gsc_html_file, 120);
    let origin: string;
    try { origin = canonicalOrigin(text(req.body?.canonical_origin, 250)); }
    catch { return res.status(400).json({ message: "Use um domínio HTTPS válido sem caminho para o endereço canônico." }); }
    const enabled = req.body?.schedule_enabled;
    const limit = req.body?.daily_limit;
    const autoPublish = req.body?.auto_publish;
    if (!tone || !audience || !rules || !business || !language || !topics || !avoid || !product ||
      !imageStyle || !/^[a-zA-Z0-9_-]*$/.test(verification) ||
      (htmlFile !== "" && !/^google[a-zA-Z0-9_-]{5,100}\.html$/.test(htmlFile)) ||
      typeof enabled !== "boolean" || typeof autoPublish !== "boolean" ||
      !Number.isInteger(limit) || limit < 1 || limit > 5) {
      return res.status(400).json({ message: "Configurações inválidas; limite diário de 1 a 5." });
    }
    if (autoPublish && !blogStorageReady()) {
      return res.status(503).json({ message: "Ative App Storage antes de habilitar a publicação automática com capa." });
    }
    const { rows } = await blogPool.query(
      `UPDATE blog_settings SET tone=$1,audience=$2,editorial_rules=$3,
        schedule_enabled=$4,daily_limit=$5,business_type=$6,language=$7,primary_topics=$8,
        avoid_topics=$9,product_description=$10,canonical_origin=$11,image_style=$12,
        auto_publish=$13,gsc_verification=$14,gsc_html_file=$15,updated_at=now() WHERE id=1
        RETURNING tone,audience,editorial_rules,business_type,language,primary_topics,avoid_topics,product_description,image_style,canonical_origin,schedule_enabled,daily_limit,auto_publish,gsc_verification,gsc_html_file`,
      [tone, audience, rules, enabled, limit, business, language, topics, avoid, product, origin,
        imageStyle, autoPublish, verification, htmlFile],
    );
    res.json({ settings: rows[0] });
  }));
  admin.get("/stats", asyncRoute(async (_req, res) => {
    const [{ rows: counts }, { rows: jobs }, { rows: top }] = await Promise.all([
      blogPool.query(`SELECT
        (SELECT count(*)::int FROM blog_keywords) AS keywords,
        (SELECT count(*)::int FROM blog_keywords WHERE status='queued') AS queued,
        (SELECT count(*)::int FROM blog_articles WHERE status='draft') AS drafts,
        (SELECT count(*)::int FROM blog_articles WHERE status='published') AS published,
        (SELECT count(*)::int FROM blog_job_runs WHERE status='failed') AS failures,
        (SELECT coalesce(sum(views),0)::int FROM blog_article_views) AS page_views`),
      blogPool.query(`SELECT id,keyword_id,article_id,status,message,started_at,finished_at
        FROM blog_job_runs ORDER BY started_at DESC LIMIT 30`),
      blogPool.query(`SELECT a.title,a.slug,coalesce(sum(v.views),0)::int AS views
        FROM blog_articles a LEFT JOIN blog_article_views v ON v.article_id=a.id
        WHERE a.status='published' GROUP BY a.id ORDER BY views DESC,a.published_at DESC LIMIT 10`),
    ]);
    res.json({ stats: counts[0], jobs, top_articles: top, storage_ready: blogStorageReady() });
  }));
  app.use("/api/admin/blog", admin);
}