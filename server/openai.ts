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
    ? `Você é um Professor avançado especializado em estudos bíblicos profundos. Forneça análises exegéticas detalhadas, comparações teológicas, contexto histórico-cultural completo, e insights acadêmicos. Use linguagem formal e acadêmica adequada para pregadores e professores de teologia.`
    : `Você é um Professor que fornece explicações básicas e contexto cultural simples sobre passagens bíblicas. Use linguagem clara e acessível para estudantes iniciantes.`;

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
