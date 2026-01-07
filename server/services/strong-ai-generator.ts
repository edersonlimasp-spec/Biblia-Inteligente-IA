import OpenAI from "openai";
import { z } from "zod";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export interface AIGeneratedStrongEntry {
  number: string;
  word: string;
  transliteration: string;
  pronunciation?: string;
  definition: string;
  portugueseDefinition: string;
  morphologicalInfo: string;
  synonymsRelated: string;
  verseReferences: string;
  language: 'hebrew' | 'greek';
  aiGenerated: true;
  etymology?: string;
  historicalContext?: string;
  theologicalSignificance?: string;
  semanticRange?: string;
  culturalBackground?: string;
}

const AIResponseSchema = z.object({
  word: z.string().min(1, "Word is required"),
  transliteration: z.string().default(""),
  pronunciation: z.string().optional().default(""),
  definition: z.string().min(5, "Definition must be at least 5 characters"),
  portugueseDefinition: z.string().min(50, "Portuguese definition must be at least 50 characters for depth"),
  morphologicalInfo: z.string().default(""),
  synonymsRelated: z.string().default(""),
  verseReferences: z.string().default(""),
  etymology: z.string().optional().default(""),
  historicalContext: z.string().optional().default(""),
  theologicalSignificance: z.string().optional().default(""),
  semanticRange: z.string().optional().default(""),
  culturalBackground: z.string().optional().default(""),
});

const STRONG_GENERATION_PROMPT = `Você é um especialista acadêmico em línguas bíblicas (hebraico, aramaico e grego) com profundo conhecimento em lexicografia, teologia bíblica e história do Antigo Oriente Médio e mundo greco-romano.

Forneça uma análise COMPLETA, PROFUNDA e ACADÊMICA para o número de Strong {{NUMERO}}.

IMPORTANTE: Retorne APENAS um objeto JSON válido, sem texto adicional. Use este formato exato:

{
  "word": "palavra original em hebraico/grego com caracteres originais (ex: אָב para hebraico, λόγος para grego)",
  "transliteration": "transliteração precisa em caracteres latinos seguindo padrões acadêmicos",
  "pronunciation": "pronúncia aproximada com acentuação",
  "definition": "definição concisa em inglês (1-2 frases)",
  "portugueseDefinition": "Definição DETALHADA em português brasileiro (mínimo 100 palavras). Inclua: 1) Significado primário e nuances; 2) Como a palavra era entendida no contexto bíblico original; 3) Diferenças de uso no AT vs NT se aplicável; 4) Implicações práticas para compreensão do texto.",
  "morphologicalInfo": "Análise morfológica COMPLETA: raiz trilítera/verbal, padrão binyan (hebraico) ou tempo-voz-modo (grego), gênero, número, derivações, formas cognatas.",
  "synonymsRelated": "Liste 5-8 termos relacionados com seus números Strong, explicando as diferenças semânticas sutis entre cada um. Ex: 'H2617 chesed (amor leal) vs H160 ahavah (amor) - chesed enfatiza fidelidade pactual'",
  "verseReferences": "10-15 versículos-chave organizados por tema ou livro, mostrando a amplitude de uso. Inclua passagens do Pentateuco, Profetas, Salmos, Evangelhos e Epístolas conforme relevante.",
  "etymology": "Etimologia DETALHADA: raiz proto-semítica ou indo-europeia, cognatos em línguas irmãs (ugarítico, acadiano, aramaico, fenício para hebraico; grego clássico, koiné para NT), evolução histórica do significado.",
  "historicalContext": "Contexto histórico-cultural: como a palavra era usada no Antigo Oriente Médio ou mundo greco-romano contemporâneo aos escritores bíblicos. Inclua evidências de textos extra-bíblicos como Ugarit, Mari, Nuzi, papiros egípcios, literatura rabínica ou pais apostólicos.",
  "theologicalSignificance": "Significado teológico PROFUNDO: papel do conceito na teologia bíblica, desenvolvimento da doutrina, conexões tipológicas AT-NT, como os rabinos judeus e pais da igreja interpretaram este termo, relevância para doutrinas cristãs fundamentais.",
  "semanticRange": "Amplitude semântica: todos os significados possíveis organizados do mais literal ao mais figurativo. Indique em quais contextos cada significado é preferido (poético, narrativo, profético, legal, apocalíptico).",
  "culturalBackground": "Contexto cultural: práticas, costumes, rituais ou conceitos do mundo antigo que iluminam o significado. Ex: para termos de sacrifício, explique o sistema sacrificial; para termos de família, explique a estrutura familiar patriarcal."
}

DIRETRIZES DE QUALIDADE:
- Se o número começar com H, é hebraico/aramaico do Antigo Testamento.
- Se começar com G, é grego koiné do Novo Testamento.
- Seja academicamente rigoroso mas acessível ao leitor brasileiro interessado em estudos bíblicos.
- Cite fontes quando relevante (HALOT, BDAG, TDNT, TWOT, NIDOTTE, Gesenius, Thayer).
- A qualidade deve SUPERAR a Bíblia Almeida Strong e ser comparável a léxicos acadêmicos.
- Priorize profundidade sobre brevidade - o usuário quer entender a riqueza da palavra original.`;

export async function generateStrongDefinition(
  strongNumber: string,
  existingWord?: string
): Promise<AIGeneratedStrongEntry | null> {
  try {
    const upperNumber = strongNumber.toUpperCase();
    const language = upperNumber.startsWith('H') ? 'hebrew' : 'greek';
    
    const prompt = STRONG_GENERATION_PROMPT.replace('{{NUMERO}}', upperNumber);
    
    const contextHint = existingWord 
      ? `\n\nDica: A palavra original pode ser "${existingWord}". Use isso como ponto de partida para sua análise completa.`
      : '';

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Você é um lexicógrafo bíblico de nível doutorado, especializado em hebraico bíblico e grego koiné. Responda APENAS com JSON válido, sem markdown ou texto adicional. Sua expertise inclui semitística comparada, estudos do NT, arqueologia bíblica e história das religiões."
        },
        {
          role: "user",
          content: prompt + contextHint
        }
      ],
      max_tokens: 3500,
      temperature: 0.25,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      console.error("[Strong AI] No content in OpenAI response");
      return null;
    }

    const cleanedContent = content
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    let rawParsed: unknown;
    try {
      rawParsed = JSON.parse(cleanedContent);
    } catch (jsonError) {
      console.error("[Strong AI] Invalid JSON from OpenAI:", cleanedContent.substring(0, 300));
      return null;
    }

    const parseResult = AIResponseSchema.safeParse(rawParsed);
    if (!parseResult.success) {
      console.error("[Strong AI] Validation failed:", parseResult.error.issues);
      return null;
    }

    const validated = parseResult.data;

    if (validated.portugueseDefinition.length < 50) {
      console.error("[Strong AI] Portuguese definition too short for academic quality standards");
      return null;
    }

    return {
      number: upperNumber,
      word: validated.word,
      transliteration: validated.transliteration,
      pronunciation: validated.pronunciation || '',
      definition: validated.definition,
      portugueseDefinition: validated.portugueseDefinition,
      morphologicalInfo: validated.morphologicalInfo || '',
      synonymsRelated: validated.synonymsRelated || '',
      verseReferences: validated.verseReferences || '',
      language,
      aiGenerated: true,
      etymology: validated.etymology || '',
      historicalContext: validated.historicalContext || '',
      theologicalSignificance: validated.theologicalSignificance || '',
      semanticRange: validated.semanticRange || '',
      culturalBackground: validated.culturalBackground || '',
    };
  } catch (error) {
    console.error("[Strong AI] Generation error:", error);
    return null;
  }
}

export function isEntryIncomplete(entry: {
  portugueseDef?: string | null;
  strongsDef?: string | null;
  kjvDef?: string | null;
  extendedDefinition?: string | null;
}): boolean {
  const hasPortuguese = entry.portugueseDef && entry.portugueseDef.length > 20;
  const hasStrongs = entry.strongsDef && entry.strongsDef.length > 20;
  const hasKjv = entry.kjvDef && entry.kjvDef.length > 20;
  const hasExtended = entry.extendedDefinition && entry.extendedDefinition.length > 50;
  
  return !hasPortuguese && !hasStrongs && !hasKjv && !hasExtended;
}
