import { DEFAULT_BLOG_ORIGIN } from "./db";

export function canonicalOrigin(configured: string = DEFAULT_BLOG_ORIGIN): string {
  const url = new URL(configured);
  if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash ||
      url.pathname !== "/") {
    throw new Error("O domínio canônico precisa ser uma origem HTTPS sem caminho.");
  }
  return url.origin;
}

export function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, (character) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!);
}

export function safeJson(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c").replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

function inline(markdown: string): string {
  const links: string[] = [];
  const placeholders = markdown.replace(/\[([^\]\n]{1,180})\]\((\/(?:baixar|oferta|blog\/[a-z0-9-]+))\)/g,
    (_match, label: string, url: string) => {
      links.push(`<a href="${escapeHtml(url)}">${escapeHtml(label)}</a>`);
      return `BLOG_LINK_PLACEHOLDER_${links.length - 1}_END`;
    });
  return escapeHtml(placeholders)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/BLOG_LINK_PLACEHOLDER_(\d+)_END/g, (_match, i: string) => links[Number(i)] ?? "");
}

// Rendering is deliberately restrictive: no raw HTML, script, external or javascript links.
export function renderMarkdown(markdown: string): string {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const html: string[] = [];
  let paragraph: string[] = [];
  let listing = false;
  const flush = () => {
    if (paragraph.length) html.push(`<p>${inline(paragraph.join(" "))}</p>`);
    paragraph = [];
  };
  const closeList = () => {
    if (listing) html.push("</ul>");
    listing = false;
  };
  for (const source of lines) {
    const line = source.trim();
    if (!line) { flush(); closeList(); continue; }
    const heading = /^(#{2,3})\s+(.+)$/.exec(line);
    if (heading) {
      flush(); closeList();
      html.push(`<h${heading[1].length}>${inline(heading[2])}</h${heading[1].length}>`);
      continue;
    }
    if (/^[-*]\s+/.test(line)) {
      flush();
      if (!listing) { html.push("<ul>"); listing = true; }
      html.push(`<li>${inline(line.replace(/^[-*]\s+/, ""))}</li>`);
      continue;
    }
    closeList();
    if (line.startsWith("> ")) {
      flush();
      html.push(`<blockquote>${inline(line.slice(2))}</blockquote>`);
    } else {
      paragraph.push(line);
    }
  }
  flush(); closeList();
  return html.join("\n");
}

function plain(markdown: string): string {
  return markdown.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/[*_`#]/g, "").trim();
}

export function extractFaq(body: string): Array<{ question: string; answer: string }> {
  const section = body.split(/^##\s+Perguntas frequentes\s*$/im)[1]?.split(/^##\s+/m)[0];
  if (!section) return [];
  return section.split(/^###\s+/m).slice(1).map((block) => {
    const [question, ...answer] = block.trim().split("\n");
    return { question: plain(question), answer: plain(answer.join(" ")) };
  }).filter(({ question, answer }) => question && answer).slice(0, 8);
}

const css = `
:root{color-scheme:light;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#243446;background:#f7f4ec}
*{box-sizing:border-box}body{margin:0;background:#f7f4ec}a{color:#87342f;text-underline-offset:3px}
header{background:#1b3d4d;color:#fff}header .wrap{display:flex;justify-content:space-between;align-items:center;gap:1rem;padding:1.1rem 1.5rem}
header a{color:#fff;text-decoration:none}header .brand{font-family:Georgia,serif;font-size:1.3rem;font-weight:bold}header nav{display:flex;gap:1.25rem;font-size:.9rem}
.wrap{max-width:1050px;margin:auto;padding:0 1.5rem}.hero{padding:4.2rem 0 3rem;border-bottom:1px solid #ded6c8;background:linear-gradient(135deg,#f8f3e8,#f0ece2)}
.eyebrow{color:#a3443d;font-size:.75rem;font-weight:750;letter-spacing:.14em;text-transform:uppercase}h1,h2,h3{font-family:Georgia,"Times New Roman",serif;color:#193d4c;line-height:1.18}
h1{font-size:clamp(2.4rem,5vw,4.4rem);letter-spacing:-.04em;margin:.65rem 0 1.2rem}h2{font-size:1.85rem;margin-top:2.8rem}h3{font-size:1.35rem;margin-top:1.8rem}
.intro{font-size:1.14rem;line-height:1.7;max-width:720px;color:#54606b}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:1.2rem;padding-top:2rem;padding-bottom:5rem}
.card{display:block;padding:1.7rem;border:1px solid #dfd6c5;border-radius:12px;background:#fffcf6;text-decoration:none;transition:transform .2s,border-color .2s}
.card:hover{transform:translateY(-3px);border-color:#a3443d}.card h2{font-size:1.4rem;margin:.5rem 0;color:#193d4c}.card p{color:#54606b;line-height:1.6}
.card-cover{display:block;width:100%;height:170px;object-fit:cover;border-radius:8px;margin-bottom:1rem}
.pill{font-size:.75rem;text-transform:uppercase;letter-spacing:.08em;color:#a3443d;font-weight:bold}.pagination{display:flex;gap:1rem;justify-content:center;margin:0 auto 4rem}
.pagination a{border:1px solid #b8ac97;border-radius:8px;padding:.7rem 1rem;text-decoration:none}
.article{max-width:760px;margin:auto;padding:3rem 1.5rem 5rem}.article p,.article li{font-size:1.08rem;line-height:1.82;color:#354656}.article li{margin-bottom:.5rem}
.article ul{padding-left:1.4rem}.article blockquote{border-left:4px solid #a3443d;background:#f2eadb;padding:1.15rem 1.4rem;margin:2rem 0}
.cover{width:100%;height:auto;max-height:490px;object-fit:cover;border-radius:12px;margin:2rem 0}
.meta{font-size:.85rem;color:#69737b}.cta{background:#1b3d4d;color:#fff;border-radius:14px;padding:2rem;margin-top:3rem}
.cta h2,.cta p{color:#fff;margin-top:0}.cta a{display:inline-block;background:#f6efe4;color:#1b3d4d;font-weight:bold;padding:.8rem 1.2rem;border-radius:8px;text-decoration:none}
footer{border-top:1px solid #dfd6c5;padding:2rem 0;color:#596873;font-size:.9rem}footer .wrap{display:flex;justify-content:space-between;gap:1rem}
@media(max-width:600px){header .wrap,footer .wrap{flex-direction:column}.hero{padding:3rem 0 2rem}.article{padding-top:2rem}}
`;

export function pageHtml(input: {
  title: string; description: string; path: string; body: string;
  image?: string; structured?: unknown[]; prev?: string; next?: string; origin?: string;
  verification?: string;
}): string {
  const origin = input.origin ?? DEFAULT_BLOG_ORIGIN;
  const canonical = origin + input.path;
  const title = `${input.title} | Bíblia Inteligente`;
  const image = input.image ?? `${origin}/logo.svg`;
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)}</title><meta name="description" content="${escapeHtml(input.description)}">
 ${input.verification ? `<meta name="google-site-verification" content="${escapeHtml(input.verification)}">` : ""}
<link rel="canonical" href="${escapeHtml(canonical)}">
${input.prev ? `<link rel="prev" href="${escapeHtml(origin + input.prev)}">` : ""}
${input.next ? `<link rel="next" href="${escapeHtml(origin + input.next)}">` : ""}
<meta property="og:type" content="${input.structured?.length ? "article" : "website"}">
<meta property="og:locale" content="pt_BR"><meta property="og:site_name" content="Bíblia Inteligente">
<meta property="og:title" content="${escapeHtml(title)}"><meta property="og:description" content="${escapeHtml(input.description)}">
<meta property="og:url" content="${escapeHtml(canonical)}"><meta property="og:image" content="${escapeHtml(image)}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escapeHtml(title)}">
<meta name="twitter:description" content="${escapeHtml(input.description)}"><meta name="twitter:image" content="${escapeHtml(image)}">
${(input.structured ?? []).map((item) => `<script type="application/ld+json">${safeJson(item)}</script>`).join("\n")}
<style>${css}</style></head><body>
<header><div class="wrap"><a class="brand" href="/">Bíblia Inteligente</a><nav aria-label="Navegação"><a href="/blog">Artigos</a><a href="/baixar">Baixar aplicativo</a></nav></div></header>
${input.body}
<footer><div class="wrap"><span>© Bíblia Inteligente</span><span><a href="/blog">Blog</a> · <a href="/baixar">Baixar</a></span></div></footer>
</body></html>`;
}