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
    // If ASSISTANT_ID is configured, use Assistants API
    if (ASSISTANT_ID) {
      return await askViaAssistant(userMessage, mode);
    } else {
      // Fallback to direct chat completions (legacy behavior)
      console.warn('OPENAI_ASSISTANT_ID not configured, using fallback chat completions');
      return await askViaChat(userMessage, mode);
    }
  } catch (error: any) {
    console.error('OpenAI API error:', error);
    throw new Error('Erro ao processar sua pergunta. Tente novamente.');
  }
}

// New: Use OpenAI Assistants API (Responses API)
async function askViaAssistant(userMessage: string, mode: 'essential' | 'premium'): Promise<string> {
  try {
    // Create a thread for this conversation
    const thread = await openai.beta.threads.create();

    // Add the user's message to the thread
    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: userMessage,
    });

    // Create a run with the configured Assistant
    const run = await openai.beta.threads.runs.createAndPoll(thread.id, {
      assistant_id: ASSISTANT_ID!,
      // Add mode-specific instructions as additional instructions
      additional_instructions: mode === 'premium'
        ? 'Forneça uma análise exegética profunda e detalhada, incluindo comparações teológicas, contexto histórico-cultural completo, e insights acadêmicos. Use linguagem formal apropriada para pregadores e professores de teologia.'
        : 'Forneça uma explicação básica e clara, usando linguagem acessível para estudantes iniciantes de Bíblia.',
      max_completion_tokens: mode === 'premium' ? 2048 : 1024,
    });

    if (run.status === 'completed') {
      // Retrieve the assistant's response
      const messages = await openai.beta.threads.messages.list(thread.id);
      const assistantMessage = messages.data.find(msg => msg.role === 'assistant');

      if (assistantMessage && assistantMessage.content[0]) {
        const content = assistantMessage.content[0];
        if (content.type === 'text') {
          return content.text.value;
        }
      }
    } else if (run.status === 'failed' || run.status === 'cancelled' || run.status === 'expired') {
      console.error(`Assistant run failed with status: ${run.status}`);
      throw new Error(`Assistente falhou: ${run.status}`);
    }

    return "Desculpe, não consegui gerar uma resposta.";
  } catch (error: any) {
    console.error('Assistant API error:', error);
    // Fallback to chat if assistant fails
    return await askViaChat(userMessage, mode);
  }
}

// Legacy: Direct chat completions (fallback)
async function askViaChat(userMessage: string, mode: 'essential' | 'premium'): Promise<string> {
  const systemPrompt = mode === 'premium' 
    ? `Você é um Professor avançado especializado em estudos bíblicos profundos. Forneça análises exegéticas detalhadas, comparações teológicas, contexto histórico-cultural completo, e insights acadêmicos. Use linguagem formal e acadêmica adequada para pregadores e professores de teologia.`
    : `Você é um Professor que fornece explicações básicas e contexto cultural simples sobre passagens bíblicas. Use linguagem clara e acessível para estudantes iniciantes.`;

  const response = await openai.chat.completions.create({
    model: "gpt-5",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage }
    ],
    max_completion_tokens: mode === 'premium' ? 2048 : 1024,
  });

  return response.choices[0]?.message?.content || "Desculpe, não consegui gerar uma resposta.";
}

// Keep legacy export for backward compatibility
export const askTheologicalQuestion = askProfessor;
