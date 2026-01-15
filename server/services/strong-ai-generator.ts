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
  portugueseDefinition: z.string().min(100, "Portuguese definition must be at least 100 characters for 7-layer depth"),
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

Forneça uma análise COMPLETA seguindo as 7 CAMADAS DE SIGNIFICADO estilo Bíblia Almeida Strong para o número {{NUMERO}}.

IMPORTANTE: Retorne APENAS um objeto JSON válido, sem texto adicional. Use este formato exato:

{
  "word": "palavra original em hebraico/grego com caracteres originais e nikkud/acentos (ex: אָב para hebraico, λόγος para grego)",
  "transliteration": "transliteração acadêmica precisa seguindo convenções SBL (Society of Biblical Literature)",
  "pronunciation": "pronúncia com acentuação tônica, divisão silábica e guia fonético aproximado em português",
  "definition": "definição concisa EM PORTUGUÊS (1-2 frases) - NUNCA em inglês",
  "portugueseDefinition": "AS 7 CAMADAS DE SIGNIFICADO em português brasileiro (mínimo 200 palavras), estruturadas assim:

**CAMADA 1 - SIGNIFICADO LITERAL/PRIMÁRIO:** O sentido mais básico e concreto da palavra, sua raiz etimológica e significado original.

**CAMADA 2 - SIGNIFICADO AMPLIADO:** Extensões de significado que a palavra adquiriu, usos metafóricos e figurativos comuns.

**CAMADA 3 - USO NO ANTIGO TESTAMENTO:** Como a palavra é usada especificamente no AT, frequência, contextos principais (Torá, Profetas, Escritos).

**CAMADA 4 - USO NO NOVO TESTAMENTO:** Como a palavra ou seu equivalente grego é usado no NT, evolução semântica entre Testamentos.

**CAMADA 5 - DIMENSÃO TEOLÓGICA:** O significado teológico profundo, como a palavra comunica verdades sobre Deus, salvação, aliança, etc.

**CAMADA 6 - APLICAÇÃO DEVOCIONAL:** Como entender esta palavra enriquece a vida espiritual, oração, adoração e relacionamento com Deus.

**CAMADA 7 - CONEXÃO CRISTOLÓGICA:** Como a palavra se conecta com Cristo, tipologias messiânicas, cumprimento em Jesus.",

  "morphologicalInfo": "Análise morfológica COMPLETA: Para hebraico: raiz trilítera, padrão verbal (binyan: Qal, Nifal, Piel, Pual, Hifil, Hofal, Hitpael), gênero, número, estado (absoluto/construto). Para grego: raiz, tempo verbal, voz, modo, caso, número, declinação. Inclua formas derivadas e cognatas.",
  
  "synonymsRelated": "FAMÍLIA SEMÂNTICA COMPLETA: Liste 8-12 termos relacionados com números Strong, organizados em: a) Sinônimos próximos com nuances distintas; b) Antônimos; c) Termos do mesmo campo semântico. Explique as diferenças sutis. Ex: 'H2617 חֶסֶד (chesed) amor leal pactual vs H160 אַהֲבָה (ahavah) amor afetivo - chesed enfatiza compromisso de aliança, ahavah enfatiza afeição emocional'",
  
  "verseReferences": "15-20 VERSÍCULOS-CHAVE organizados por categoria: a) Primeira ocorrência bíblica; b) Passagens paradigmáticas; c) Uso nos Salmos/Sabedoria; d) Uso profético; e) Citações no NT; f) Passagens teologicamente significativas. Formato: 'Gênesis 1:1 - contexto; João 1:1 - paralelo'",
  
  "etymology": "ETIMOLOGIA PROFUNDA: 1) Raiz proto-semítica ou indo-europeia; 2) Cognatos em línguas irmãs (ugarítico, acadiano, aramaico, fenício, árabe para hebraico; grego clássico, latim para NT); 3) Evolução histórica do significado através dos séculos; 4) Como a palavra chegou às traduções modernas; 5) Empréstimos e influências linguísticas.",
  
  "historicalContext": "CONTEXTO HISTÓRICO-CULTURAL EXPANDIDO: 1) Uso da palavra no Antigo Oriente Médio (textos de Ugarit, Mari, Nuzi, El-Amarna, papiros egípcios); 2) Parallelos em literatura do Segundo Templo (Qumran, Pseudoepígrafos, LXX); 3) Uso na literatura rabínica (Mishná, Talmud, Midrash); 4) Interpretação dos Pais da Igreja; 5) Evidências arqueológicas relevantes; 6) Inscrições e documentos antigos que iluminam o termo.",
  
  "theologicalSignificance": "SIGNIFICADO TEOLÓGICO PROFUNDO: 1) Papel do conceito na teologia bíblica sistemática; 2) Desenvolvimento da doutrina através da história da redenção; 3) Conexões tipológicas AT-NT; 4) Como os rabinos e pais da igreja interpretaram; 5) Relevância para doutrinas fundamentais (Trindade, Cristologia, Soteriologia, Eclesiologia, Escatologia); 6) Implicações para a cosmovisão bíblica; 7) Contrastes com conceitos pagãos contemporâneos.",
  
  "semanticRange": "AMPLITUDE SEMÂNTICA COMPLETA: Organize todos os significados do mais literal ao mais abstrato: 1) Sentido físico/concreto; 2) Sentido social/relacional; 3) Sentido emocional/psicológico; 4) Sentido ético/moral; 5) Sentido religioso/cultual; 6) Sentido escatológico/profético. Indique em quais gêneros literários cada sentido predomina (narrativa, poesia, profecia, apocalipse, sabedoria, lei).",
  
  "culturalBackground": "CONTEXTO CULTURAL ABRANGENTE: 1) Práticas, costumes e rituais do mundo antigo que iluminam o significado; 2) Estruturas sociais (família patriarcal, clã, tribo, nação); 3) Sistema econômico (agricultura, pastoreio, comércio); 4) Práticas religiosas e cultuais; 5) Cosmovisão do mundo antigo; 6) Comparação com práticas de povos vizinhos; 7) Como o conhecimento cultural enriquece a compreensão do texto."
}

DIRETRIZES DE QUALIDADE PREMIUM:
- OBRIGATÓRIO: TODO O CONTEÚDO DEVE SER EM PORTUGUÊS BRASILEIRO. NENHUMA palavra em inglês é permitida (exceto termos técnicos transliterados como "logos", "agape" etc).
- Se o número começar com H, é hebraico/aramaico do Antigo Testamento.
- Se começar com G, é grego koiné do Novo Testamento.
- Seja academicamente rigoroso mas acessível ao leitor brasileiro.
- Cite fontes (nomes podem ficar em formato original): HALOT, BDAG, TDNT, TWOT, NIDOTTE, TLOT, Gesenius, Thayer, Louw-Nida, Vine's.
- A qualidade deve SUPERAR significativamente a Bíblia Almeida Strong impressa.
- Priorize profundidade e riqueza - o usuário paga por conteúdo acadêmico premium.
- Cada campo deve ser EXTENSO e INFORMATIVO - evite respostas curtas.
- Inclua referências cruzadas entre Antigo e Novo Testamento sempre que possível.
- Destaque conexões messiânicas e cristológicas para leitores cristãos.
- JAMAIS use palavras como "faith", "hope", "love", "God" - use SEMPRE os equivalentes portugueses: "fé", "esperança", "amor", "Deus".`;

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
          content: "Você é um lexicógrafo bíblico de nível doutorado, especializado em hebraico bíblico e grego koiné. Responda APENAS com JSON válido, sem markdown ou texto adicional. REGRA CRÍTICA: TODO O CONTEÚDO DEVE SER EM PORTUGUÊS BRASILEIRO - nenhuma palavra em inglês é permitida. Seu objetivo é fornecer as 7 CAMADAS DE SIGNIFICADO estilo Bíblia Almeida Strong, com conteúdo RICO, PROFUNDO e EXTENSO que supere qualquer dicionário impresso."
        },
        {
          role: "user",
          content: prompt + contextHint
        }
      ],
      max_tokens: 6000,
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
      console.error("[Strong AI] Invalid JSON from OpenAI:", cleanedContent.substring(0, 300));
      return null;
    }

    const parseResult = AIResponseSchema.safeParse(rawParsed);
    if (!parseResult.success) {
      console.error("[Strong AI] Validation failed:", parseResult.error.issues);
      return null;
    }

    const validated = parseResult.data;

    if (validated.portugueseDefinition.length < 100) {
      console.error("[Strong AI] Portuguese definition too short for 7-layer academic quality standards");
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
