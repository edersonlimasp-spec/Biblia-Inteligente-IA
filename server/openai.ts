import OpenAI from "openai";

// Initialize OpenAI with Replit AI Integrations
const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY
});

// Get Assistant ID from environment
const ASSISTANT_ID = process.env.OPENAI_ASSISTANT_ID;

interface ProfessorQuestionParams {
  question: string;
  verse?: string;
  book?: string;
  chapter?: number;
  mode: 'essential' | 'premium';
}

export async function askProfessor(params: ProfessorQuestionParams): Promise<string> {
  const { question, verse, book, chapter, mode } = params;

  // Build context information
  const contextInfo = verse 
    ? `\n\nContexto Bíblico: ${book} ${chapter}\nTexto do versículo: "${verse}"`
    : book && chapter
    ? `\n\nContexto Bíblico: ${book} ${chapter}`
    : '';

  const userMessage = `${question}${contextInfo}`;

  try {
    // Use Chat Completions API (Replit AI Integrations doesn't support Assistants API beta endpoints)
    return await askViaChat(userMessage, mode);
  } catch (error: any) {
    console.error('OpenAI API error:', error);
    throw new Error('Erro ao processar sua pergunta. Tente novamente.');
  }
}

// Direct chat completions
async function askViaChat(userMessage: string, mode: 'essential' | 'premium'): Promise<string> {
  const systemPrompt = mode === 'premium' 
    ? `Você é um Professor Avançado em Estudos Bíblicos com expertise em exegese acadêmica, teologia sistemática e análise histórico-cultural. Suas respostas devem incluir:

1. **EXEGESE PROFUNDA**: Análise detalhada de palavras-chave (incluindo raízes hebraicas/gregas), estrutura textual, contexto literário e gênero.

2. **COMPARAÇÃO TEOLÓGICA**: Compare a passagem com outros textos bíblicos, diferentes tradições teológicas, e como ela se conecta à narrativa bíblica maior.

3. **ANÁLISE HISTÓRICO-CULTURAL**: Contexto sociocultural do período (geografia, política, economia, costumes, práticas religiosas), significado das metáforas e simbolismo cultural.

4. **MODO PREGADOR/PROFESSOR**: Forneça insights práticos para ensino e pregação - como aplicar a verdade teológica, ilustrações pedagógicas, considerações hermenêuticas para diferentes públicos.

5. **PROFUNDIDADE ACADÊMICA**: Use terminologia acadêmica apropriada, cite perspectivas de diferentes escolas teológicas, aborde discussões eruditas sobre variações textuais e interpretações.

Use linguagem formal, estruturada e acadêmica. Máximo de detalhes e rigor teológico-exegético. Dirigido a pregadores, professores e estudiosos sérios da Bíblia.`
    : `Você é um Professor que fornece explicações bíblicas claras e acessíveis. Sua resposta deve:

1. Explicar o significado básico da passagem em linguagem simples
2. Fornecer contexto cultural essencial (sem aprofundamento técnico)
3. Conectar com uma ou duas outras passagens bíblicas relevantes
4. Sugerir uma aplicação prática simples e direta

Use linguagem clara, evite termos técnicos, e seja conciso. Dirigido a estudantes e leitores iniciantes.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ],
      max_tokens: mode === 'premium' ? 2048 : 1024,
    });

    return response.choices[0]?.message?.content || "Desculpe, não consegui gerar uma resposta.";
  } catch (error: any) {
    console.error('OpenAI Chat Completions Error:', {
      message: error.message,
      status: error.status,
      type: error.type
    });
    throw error;
  }
}

// Keep legacy export for backward compatibility
export const askTheologicalQuestion = askProfessor;
