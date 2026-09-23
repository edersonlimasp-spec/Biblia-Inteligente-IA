const OFFER_ORIGIN = "https://bibliainteligente.replit.app";
const TITLE = "Bíblia Inteligente IA — Estude a Bíblia com mais profundidade";
const DESCRIPTION = "Bíblia com 66 livros, Professor IA, Strong em hebraico e grego, transcrição de sermões e planos de leitura. Baixe para iPhone ou Android. É gratuito para começar.";

/** Fixed trusted metadata; never reflects host headers or campaign parameters. */
export function withOfferMetadata(template: string): string {
  return template
    .replace(/<title>[^<]*<\/title>/, `<title>${TITLE}</title>`)
    .replace(/<meta name="description" content="[^"]*"\s*\/>/, `<meta name="description" content="${DESCRIPTION}" />`)
    .replace(/<meta property="og:title" content="[^"]*"\s*\/>/, `<meta property="og:title" content="${TITLE}" />`)
    .replace(/<meta property="og:description" content="[^"]*"\s*\/>/, `<meta property="og:description" content="${DESCRIPTION}" />`)
    .replace(/<meta name="twitter:title" content="[^"]*"\s*\/>/, `<meta name="twitter:title" content="${TITLE}" />`)
    .replace(/<meta name="twitter:description" content="[^"]*"\s*\/>/, `<meta name="twitter:description" content="${DESCRIPTION}" />`)
    .replace(/<meta (property="og:image"|name="twitter:image") content="[^"]*"\s*\/>/g, `<meta $1 content="${OFFER_ORIGIN}/download-preview.png" />`)
    .replace(/<meta property="og:image:width" content="[^"]*"\s*\/>/, '<meta property="og:image:width" content="1200" />')
    .replace(/<meta property="og:image:height" content="[^"]*"\s*\/>/, '<meta property="og:image:height" content="630" />')
    .replace("</head>", `<link rel="canonical" href="${OFFER_ORIGIN}/oferta" />\n<meta property="og:url" content="${OFFER_ORIGIN}/oferta" />\n</head>`);
}