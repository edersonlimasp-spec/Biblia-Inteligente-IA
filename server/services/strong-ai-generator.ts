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
}

// Zod schema for validating OpenAI response
const AIResponseSchema = z.object({
  word: z.string().min(1, "Word is required"),
  transliteration: z.string().default(""),
  pronunciation: z.string().optional().default(""),
  definition: z.string().min(5, "Definition must be at least 5 characters"),
  portugueseDefinition: z.string().min(20, "Portuguese definition must be at least 20 characters"),
  morphologicalInfo: z.string().default(""),
  synonymsRelated: z.string().default(""),
  verseReferences: z.string().default(""),
});

const STRONG_GENERATION_PROMPT = `Você é um especialista em línguas bíblicas (hebraico, aramaico e grego). Forneça uma explicação COMPLETA e DETALHADA para o número de Strong {{NUMERO}}.

IMPORTANTE: Retorne APENAS um objeto JSON válido, sem texto adicional. Use este formato exato:

{
  "word": "palavra original em hebraico/grego com caracteres originais",
  "transliteration": "transliteração em caracteres latinos",
  "pronunciation": "pronúncia aproximada",
  "definition": "definição concisa em inglês (1-2 frases)",
  "portugueseDefinition": "definição detalhada em português (3-5 frases explicando o significado teológico e contextual)",
  "morphologicalInfo": "análise morfológica completa: categoria gramatical, raiz, tempo/voz/modo se for verbo, gênero, número, etc.",
  "synonymsRelated": "sinônimos e termos relacionados na Bíblia (listar 3-5 palavras com seus números Strong se conhecidos)",
  "verseReferences": "5-10 versículos importantes onde o termo aparece (formato: Livro Capítulo:Versículo)"
}

Se o número começar com H, é hebraico/aramaico. Se começar com G, é grego.
Seja preciso e acadêmico. A qualidade deve ser comparável à Bíblia Almeida RA com números de Strong.`;

export async function generateStrongDefinition(
  strongNumber: string,
  existingWord?: string
): Promise<AIGeneratedStrongEntry | null> {
  try {
    const upperNumber = strongNumber.toUpperCase();
    const language = upperNumber.startsWith('H') ? 'hebrew' : 'greek';
    
    const prompt = STRONG_GENERATION_PROMPT.replace('{{NUMERO}}', upperNumber);
    
    const contextHint = existingWord 
      ? `\n\nDica: A palavra original pode ser "${existingWord}".`
      : '';

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Você é um lexicógrafo bíblico especializado. Responda APENAS com JSON válido, sem markdown ou texto adicional."
        },
        {
          role: "user",
          content: prompt + contextHint
        }
      ],
      max_tokens: 1500,
      temperature: 0.3,
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
      console.error("[Strong AI] Invalid JSON from OpenAI:", cleanedContent.substring(0, 200));
      return null;
    }

    // Validate and sanitize with Zod
    const parseResult = AIResponseSchema.safeParse(rawParsed);
    if (!parseResult.success) {
      console.error("[Strong AI] Validation failed:", parseResult.error.issues);
      return null;
    }

    const validated = parseResult.data;

    // Quality check: ensure Portuguese definition meets Almeida RA standards
    if (validated.portugueseDefinition.length < 20) {
      console.error("[Strong AI] Portuguese definition too short for quality standards");
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
