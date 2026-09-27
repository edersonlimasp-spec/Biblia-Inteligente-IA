import OpenAI from "openai";

export interface EditorialSettings {
  tone: string;
  audience: string;
  editorial_rules: string;
}

export interface KeywordSuggestion {
  keyword: string;
  intent: string;
  relevance: number;
  reason: string;
}

export interface RelatedArticle {
  title: string;
  slug: string;
}

const chat = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  timeout: 90_000,
});
const images = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 120_000 });

async function jsonCompletion(system: string, user: string) {
  const response = await chat.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    temperature: 0.4,
    max_completion_tokens: 6500,
    messages: [{ role: "system", content: system }, { role: "user", content: user }],
  });
  const text = response.choices[0]?.message?.content;
  if (!text || response.choices[0]?.finish_reason === "length") {
    throw new Error("A resposta da IA foi interrompida. Tente novamente.");
  }
  return JSON.parse(text) as Record<string, unknown>;
}

// Only Google-supplied strings enter the suggestion list; the model can rank,
// classify or discard them, but cannot invent search queries.
export async function suggestKeywords(seed: string): Promise<KeywordSuggestion[]> {
  const candidates = new Set<string>();
  for (const term of [seed, `${seed} `]) {
    const url = new URL("https://suggestqueries.google.com/complete/search");
    url.search = new URLSearchParams({ client: "firefox", hl: "pt-BR", gl: "br", q: term }).toString();
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; BibliaInteligente/1.0)" },
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) throw new Error(`Autocompletar Google indisponível (${response.status})`);
    const result: unknown = await response.json();
    if (!Array.isArray(result) || !Array.isArray(result[1])) {
      throw new Error("Resposta inesperada do autocompletar Google");
    }
    for (const item of result[1]) {
      if (typeof item === "string" && item.trim().length <= 140) candidates.add(item.trim());
    }
  }
  if (candidates.size === 0) return [];
  const choices = Array.from(candidates).slice(0, 30);
  const classified = await jsonCompletion(
    "Classifique somente as sugestões reais recebidas. Responda JSON {\"suggestions\":[{\"keyword\":\"texto exato da lista\",\"intent\":\"informacional|navegacional|comercial|transacional\",\"relevance\":1-5,\"reason\":\"motivo curto\"}]}. Não crie consultas novas. Descarte consultas sem relação com estudo bíblico e com o app Bíblia Inteligente. Português do Brasil.",
    JSON.stringify({ seed, suggestionsFromGoogle: choices }),
  );
  const allowed = new Map(choices.map((value) => [value.toLocaleLowerCase("pt-BR"), value]));
  const seen = new Set<string>();
  const output: KeywordSuggestion[] = [];
  for (const row of Array.isArray(classified.suggestions) ? classified.suggestions : []) {
    if (!row || typeof row !== "object") continue;
    const item = row as Record<string, unknown>;
    const key = String(item.keyword ?? "").trim().toLocaleLowerCase("pt-BR");
    const original = allowed.get(key);
    if (!original || seen.has(key)) continue;
    seen.add(key);
    const intent = String(item.intent ?? "");
    output.push({
      keyword: original,
      intent: ["informacional", "navegacional", "comercial", "transacional"].includes(intent)
        ? intent : "informacional",
      relevance: Math.min(5, Math.max(1, Math.round(Number(item.relevance) || 1))),
      reason: String(item.reason ?? "").slice(0, 250),
    });
  }
  return output;
}

export function slugify(input: string) {
  return input.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 88).replace(/-$/g, "");
}

function words(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export interface ArticleDraft {
  title: string;
  slug: string;
  meta_description: string;
  body_markdown: string;
  cover_alt: string;
  cover_prompt: string;
}

export async function generateArticle(
  keyword: string,
  intent: string,
  settings: EditorialSettings,
  related: RelatedArticle[],
): Promise<ArticleDraft> {
  const system = `Você redige artigos originais para o Bíblia Inteligente. Responda SOMENTE JSON com title, meta_description, body_markdown, cover_alt, cover_prompt.
Regras FIXAS, acima das configurações: português brasileiro; tom respeitoso e evangélico; sem polêmicas denominacionais; não invente citações bíblicas nem fatos históricos. Cite livro, capítulo e versículo de modo exato; se não tiver certeza de uma referência, não a cite. Não atribua palavras literais à Bíblia sem conferir. Não reproduza texto de outros sites. A IA/Professor IA do app é SEMPRE um apoio ou auxílio para aprofundar o conhecimento bíblico (contexto histórico/cultural, mapas, dicionários), NUNCA uma autoridade espiritual ou alguém que ensina. Não inclua afirmações promocionais enganosas. Não escreva HTML nem links inventados. Inclua em body_markdown uma introdução, seções ## e ###, seção ## Perguntas frequentes com ao menos 3 perguntas ### e respostas, e conclusão. Escreva de 1200 a 1850 palavras no corpo. Meta description até 155 caracteres. Capa ilustrativa reverente sem rostos realistas de Jesus e sem texto na imagem.`;
  const request = JSON.stringify({
    keyword, intent, tone: settings.tone, audience: settings.audience,
    additionalEditorialRules: settings.editorial_rules,
    publishedArticlesToAvoidRepeating: related.map((r) => r.title),
  });
  let article: Record<string, unknown> = await jsonCompletion(system, request);
  if (!/## Perguntas frequentes/i.test(String(article.body_markdown ?? "")) ||
    !String(article.title ?? "").trim() || !String(article.meta_description ?? "").trim()) {
    article = await jsonCompletion(system, request +
      "\nObrigatório: inclua título, meta_description e a seção literal ## Perguntas frequentes com ao menos três perguntas ###.");
  }
  let body = String(article.body_markdown ?? "").trim();
  // A single model response often stops around 800–1,000 words. Add new
  // editorial sections in separate bounded requests instead of accepting a
  // short article or repeatedly discarding a usable draft.
  for (let part = 0; words(body) < 1200 && part < 3; part++) {
    const missing = 1250 - words(body);
    const expansion = await jsonCompletion(
      `${system}\nAgora responda APENAS JSON {"expansion_markdown":"..."} com seções NOVAS (## título e parágrafos). Não repita o texto anterior nem inclua outra FAQ ou conclusão. Desenvolva ${Math.min(650, Math.max(300, missing + 100))} palavras, com citações bíblicas somente se puder verificá-las. Não adicione novos links.`,
      JSON.stringify({ keyword, bodyAlreadyWritten: body, topics: "Aprofunde ângulos que ainda não foram desenvolvidos, sem inventar fatos." }),
    );
    const addition = String(expansion.expansion_markdown ?? "").trim();
    if (words(addition) < 150 || !addition.includes("## ")) {
      throw new Error("A IA não expandiu o artigo com seções suficientes; tente novamente.");
    }
    const faq = body.search(/^## Perguntas frequentes/im);
    body = faq >= 0
      ? `${body.slice(0, faq).trim()}\n\n${addition}\n\n${body.slice(faq)}`
      : `${body}\n\n${addition}`;
  }
  const title = String(article.title ?? "").trim();
  const meta = String(article.meta_description ?? "").trim();
  const alt = String(article.cover_alt ?? "").trim();
  const prompt = String(article.cover_prompt ?? "").trim();
  if (words(body) < 1200 || words(body) > 1850 || !body.includes("## ") ||
    !/## Perguntas frequentes/i.test(body) || (body.match(/^### /gm) ?? []).length < 3 ||
    !title || title.length > 150 || !meta || meta.length > 155 || !alt || !prompt) {
    throw new Error(`A geração não atingiu os critérios editoriais (palavras: ${words(body)}; seções: ${(body.match(/^## /gm) ?? []).length}; perguntas: ${(body.match(/^### /gm) ?? []).length}; FAQ: ${/## Perguntas frequentes/i.test(body)}; meta: ${meta.length}). Tente novamente.`);
  }
  // The destination URLs are chosen by the server, never hallucinated by the model.
  const terms = new Set(slugify(keyword).split("-").filter((term) => term.length > 3));
  const nearby = related
    .filter((r) => r.slug && Array.from(terms).some((term) => slugify(r.title).includes(term)))
    .slice(0, 2);
  const links = nearby.map((r) => `- [${r.title}](/blog/${r.slug})`);
  links.push("- [Conheça o aplicativo Bíblia Inteligente](/baixar) para estudar com planos de leitura, recursos Strong e mapas.");
  if (["comercial", "transacional"].includes(intent) && links.length < 3) {
    links.push("- [Veja a oferta do aplicativo](/oferta) se desejar conhecer os recursos disponíveis.");
  }
  const linked = `${body}\n\n## Continue estudando\n\n${links.join("\n")}\n\n> Aprofunde seu estudo bíblico com o Bíblia Inteligente. [Baixe o aplicativo](/baixar).\n`;
  if (words(linked) > 2000) throw new Error("O artigo ultrapassou o limite de palavras.");
  const slug = slugify(title);
  if (!slug) throw new Error("Título inválido para gerar o endereço do artigo.");
  return { title, slug, meta_description: meta, body_markdown: linked, cover_alt: alt, cover_prompt: prompt };
}

export async function generateCover(prompt: string): Promise<{ data: Buffer; mime: string }> {
  const result = await images.images.generate({
    model: "dall-e-3",
    size: "1024x1024",
    quality: "standard",
    n: 1,
    prompt: `Ilustração editorial bíblica, respeitosa, contextualmente apropriada: ${prompt.slice(0, 700)}. Sem letras, palavras, logotipos, marcas d'água ou tipografia. Não representar Jesus com rosto realista. Sem violência gráfica.`,
  });
  const encoded = result.data?.[0]?.b64_json;
  const imageUrl = result.data?.[0]?.url;
  let data: Buffer;
  if (encoded) {
    data = Buffer.from(encoded, "base64");
  } else if (imageUrl) {
    const url = new URL(imageUrl);
    if (url.protocol !== "https:" || !(
      url.hostname === "openai.com" || url.hostname.endsWith(".openai.com") ||
      url.hostname.endsWith(".blob.core.windows.net")
    )) throw new Error("O gerador devolveu um endereço de imagem não confiável.");
    const response = await fetch(url, { signal: AbortSignal.timeout(60_000) });
    if (!response.ok || Number(response.headers.get("content-length")) > 8_000_000) {
      throw new Error("Não foi possível baixar a capa gerada.");
    }
    data = Buffer.from(await response.arrayBuffer());
  } else {
    throw new Error("O gerador de capas não devolveu uma imagem.");
  }
  if (!data.length || data.length > 8_000_000) throw new Error("Tamanho da capa inválido.");
  const mime = data.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex"))
    ? "image/png"
    : data.subarray(0, 3).equals(Buffer.from("ffd8ff", "hex")) ? "image/jpeg" : "";
  if (!mime) throw new Error("Formato de capa não suportado.");
  // The signed URL is never saved. The actual bytes are stored in PostgreSQL.
  return { data, mime };
}