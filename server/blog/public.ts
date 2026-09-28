import type { Express, Request, Response, NextFunction } from "express";
import { blogPool, ensureBlogTables } from "./db";
import { DEFAULT_BLOG_ORIGIN } from "./db";
import { canonicalOrigin, escapeHtml, extractFaq, pageHtml, renderMarkdown } from "./markup";
import { downloadBlogCover } from "./storage";

type Handler = (req: Request, res: Response) => Promise<unknown>;
const asyncRoute = (fn: Handler) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res)).catch(next);
};

const pageSize = 10;
const xml = (value: string) => escapeHtml(value);
async function siteConfig() {
  const { rows } = await blogPool.query("SELECT canonical_origin,gsc_verification FROM blog_settings WHERE id=1");
  return {
    origin: canonicalOrigin(rows[0]?.canonical_origin ?? DEFAULT_BLOG_ORIGIN),
    verification: String(rows[0]?.gsc_verification ?? ""),
  };
}

export function registerPublicBlogRoutes(app: Express) {
  // Google Search Console's HTML-file method verifies the site's root without
  // replacing or modifying the application's existing home page.
  app.get(/^\/google[a-zA-Z0-9_-]+\.html$/, asyncRoute(async (req, res) => {
    await ensureBlogTables();
    const { rows } = await blogPool.query("SELECT gsc_html_file FROM blog_settings WHERE id=1");
    const filename = String(rows[0]?.gsc_html_file ?? "");
    if (!filename || req.path !== `/${filename}`) return res.sendStatus(404);
    res.type("text/plain").set("Cache-Control", "public, max-age=300")
      .send(`google-site-verification: ${filename}`);
  }));
  app.get("/robots.txt", asyncRoute(async (_req, res) => {
    await ensureBlogTables();
    const { origin } = await siteConfig();
    res.type("text/plain").set("Cache-Control", "public, max-age=3600").send(
      `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`,
    );
  }));
  app.get("/sitemap.xml", asyncRoute(async (_req, res) => {
    await ensureBlogTables();
    const { origin } = await siteConfig();
    const { rows } = await blogPool.query(
      "SELECT slug,updated_at FROM blog_articles WHERE status='published' ORDER BY published_at DESC",
    );
    const urls = ["/", "/baixar", "/oferta", "/blog"].map((path) => ({ path }));
    for (const row of rows) urls.push({ path: `/blog/${row.slug}`, updated_at: row.updated_at } as {path:string});
    const entries = urls.map((item) => `<url><loc>${xml(origin + item.path)}</loc>${
      "updated_at" in item && item.updated_at
        ? `<lastmod>${new Date(item.updated_at as string).toISOString().slice(0, 10)}</lastmod>` : ""
    }</url>`).join("");
    res.type("application/xml").set("Cache-Control", "public, max-age=300")
      .send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries}</urlset>`);
  }));

  app.get("/blog", asyncRoute(async (req, res) => {
    await ensureBlogTables();
    const { origin, verification } = await siteConfig();
    const rawPage = typeof req.query.page === "string" ? req.query.page : "1";
    if (!/^[1-9]\d{0,3}$/.test(rawPage)) return res.sendStatus(404);
    const page = Number(rawPage);
    const total = Number((await blogPool.query(
      "SELECT count(*)::int AS count FROM blog_articles WHERE status='published'",
    )).rows[0].count);
    const pages = Math.max(1, Math.ceil(total / pageSize));
    if (page > pages) return res.sendStatus(404);
    const { rows } = await blogPool.query(
      `SELECT id,title,slug,meta_description,published_at,
        (cover_file_key IS NOT NULL OR cover_image IS NOT NULL) AS has_cover
        FROM blog_articles WHERE status='published'
        ORDER BY published_at DESC,id DESC LIMIT $1 OFFSET $2`, [pageSize, (page - 1) * pageSize],
    );
    const cards = rows.map((article) => `<a class="card" href="/blog/${escapeHtml(article.slug)}">
      ${article.has_cover ? `<img class="card-cover" src="/blog/media/${article.id}" alt="" loading="lazy">` : ""}
      <span class="pill">Estudo bíblico · ${escapeHtml(new Date(article.published_at).toLocaleDateString("pt-BR"))}</span>
      <h2>${escapeHtml(article.title)}</h2><p>${escapeHtml(article.meta_description)}</p>
      <span>Leia o artigo →</span></a>`).join("");
    const pagination = pages > 1 ? `<nav class="pagination" aria-label="Páginas">
      ${page > 1 ? `<a href="${page === 2 ? "/blog" : `/blog?page=${page - 1}`}">← Anterior</a>` : ""}
      ${page < pages ? `<a href="/blog?page=${page + 1}">Próxima →</a>` : ""}
      </nav>` : "";
    const path = page === 1 ? "/blog" : `/blog?page=${page}`;
    res.type("html").set("Cache-Control", "public, max-age=60").send(pageHtml({
      origin, verification,
      title: page === 1 ? "Blog" : `Blog — página ${page}`,
      description: "Artigos de estudo bíblico, contexto histórico, vida cristã e recursos para aprofundar sua leitura das Escrituras.",
      path, prev: page > 1 ? (page === 2 ? "/blog" : `/blog?page=${page - 1}`) : undefined,
      next: page < pages ? `/blog?page=${page + 1}` : undefined,
      body: `<section class="hero"><div class="wrap"><span class="eyebrow">Biblioteca de artigos</span>
      <h1>Estude com mais contexto.</h1><p class="intro">Leituras para quem deseja conhecer melhor a Bíblia, sua história e suas palavras — com cuidado e respeito pelo texto.</p></div></section>
      <main class="wrap"><div class="grid">${cards || `<p>Os primeiros artigos estão em preparação.</p>`}</div>${pagination}</main>`,
    }));
  }));
  app.get("/blog/media/:id", asyncRoute(async (req, res) => {
    await ensureBlogTables();
    if (!/^[0-9a-f-]{36}$/i.test(req.params.id)) return res.sendStatus(404);
    const { rows } = await blogPool.query(
      "SELECT cover_file_key,cover_image,cover_mime FROM blog_articles WHERE id=$1 AND status='published'",
      [req.params.id],
    );
    if (!rows[0]?.cover_file_key && !rows[0]?.cover_image) return res.sendStatus(404);
    res.set("Cache-Control", "public, max-age=3600").type(rows[0].cover_mime || "image/png")
      .send(rows[0].cover_file_key ? await downloadBlogCover(rows[0].cover_file_key) : rows[0].cover_image);
  }));
  app.get("/blog/:slug", asyncRoute(async (req, res) => {
    await ensureBlogTables();
    const { origin, verification } = await siteConfig();
    const { slug } = req.params;
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 90) return res.sendStatus(404);
    const { rows } = await blogPool.query(
      `SELECT id,title,slug,meta_description,body_markdown,cover_alt,created_at,updated_at,published_at,
        (cover_file_key IS NOT NULL OR cover_image IS NOT NULL) AS has_cover FROM blog_articles
        WHERE slug=$1 AND status='published'`, [slug],
    );
    const article = rows[0];
    if (!article) return res.sendStatus(404);
    await blogPool.query(
      `INSERT INTO blog_article_views (article_id,day,views)
       VALUES ($1,(now() AT TIME ZONE 'America/Sao_Paulo')::date,1)
       ON CONFLICT (article_id,day) DO UPDATE SET views=blog_article_views.views+1`, [article.id],
    );
    const path = `/blog/${article.slug}`;
    const cover = article.has_cover ? `/blog/media/${article.id}` : undefined;
    const faq = extractFaq(article.body_markdown);
    const related = (await blogPool.query(
      `SELECT title,slug FROM blog_articles WHERE status='published' AND id<>$1
       ORDER BY published_at DESC LIMIT 3`, [article.id],
    )).rows;
    const schemas: unknown[] = [{
      "@context": "https://schema.org", "@type": "Article",
      headline: article.title, description: article.meta_description,
      mainEntityOfPage: origin + path,
      author: { "@type": "Organization", name: "Bíblia Inteligente" },
      publisher: { "@type": "Organization", name: "Bíblia Inteligente" },
      datePublished: new Date(article.published_at).toISOString(),
      dateModified: new Date(article.updated_at).toISOString(),
      ...(cover ? { image: origin + cover } : {}),
    }];
    schemas.push({
      "@context": "https://schema.org", "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Início", item: `${origin}/` },
        { "@type": "ListItem", position: 2, name: "Blog", item: `${origin}/blog` },
        { "@type": "ListItem", position: 3, name: article.title, item: `${origin}${path}` },
      ],
    });
    if (faq.length) schemas.push({
      "@context": "https://schema.org", "@type": "FAQPage",
      mainEntity: faq.map(({ question, answer }) => ({
        "@type": "Question", name: question,
        acceptedAnswer: { "@type": "Answer", text: answer },
      })),
    });
    res.type("html").set("Cache-Control", "public, max-age=60").send(pageHtml({
      origin, verification,
      title: article.title, description: article.meta_description, path,
      image: cover ? origin + cover : undefined, structured: schemas,
      body: `<main class="article" id="conteudo"><a href="/blog">← Todos os artigos</a>
      <p class="eyebrow">Artigo · Estudo bíblico</p><h1>${escapeHtml(article.title)}</h1>
      <p class="meta">Publicado em ${escapeHtml(new Date(article.published_at).toLocaleDateString("pt-BR"))}</p>
      ${cover ? `<img class="cover" src="${cover}" alt="${escapeHtml(article.cover_alt)}" width="1024" height="1024">` : ""}
      <div class="article-body">${renderMarkdown(article.body_markdown)}</div>
      <aside class="cta"><h2>Continue seu estudo bíblico</h2><p>Explore a Bíblia com planos de leitura, contexto histórico, mapas e recursos de apoio no aplicativo.</p>
       <a href="/baixar">Baixar Bíblia Inteligente</a></aside>
       ${related.length ? `<nav aria-label="Artigos relacionados"><h2>Leia também</h2><ul>${related.map((r) =>
         `<li><a href="/blog/${escapeHtml(r.slug)}">${escapeHtml(r.title)}</a></li>`).join("")}</ul></nav>` : ""}
       </main>`,
    }));
  }));
}