export const DOWNLOAD_PUBLIC_ORIGIN = "https://bibliainteligente.replit.app";

export function withDownloadMetadata(template: string): string {
  const description = "Bíblia com IA, Strong em hebraico e grego e ferramentas para estudar as Escrituras.";
  const preview = `${DOWNLOAD_PUBLIC_ORIGIN}/download-preview.png`;
  return template
    .replace(/<title>[^<]*<\/title>/, "<title>Bíblia Inteligente IA</title>")
    .replace(/<meta name="description" content="[^"]*"\s*\/>/, `<meta name="description" content="${description}" />`)
    .replace(/<meta property="og:title" content="[^"]*"\s*\/>/, '<meta property="og:title" content="Bíblia Inteligente IA" />')
    .replace(/<meta property="og:description" content="[^"]*"\s*\/>/, `<meta property="og:description" content="${description}" />`)
    .replace(/<meta property="og:image" content="[^"]*"\s*\/>/, `<meta property="og:image" content="${preview}" />`)
    .replace(/<meta property="og:image:width" content="[^"]*"\s*\/>/, '<meta property="og:image:width" content="1200" />')
    .replace(/<meta property="og:image:height" content="[^"]*"\s*\/>/, '<meta property="og:image:height" content="630" />')
    .replace(/<meta name="twitter:image" content="[^"]*"\s*\/>/, `<meta name="twitter:image" content="${preview}" />`)
    .replace("</head>", `<meta property="og:url" content="${DOWNLOAD_PUBLIC_ORIGIN}/baixar" />\n    </head>`);
}