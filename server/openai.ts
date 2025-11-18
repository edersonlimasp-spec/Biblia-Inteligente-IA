import OpenAI from "openai";

// This is using Replit's AI Integrations service, which provides OpenAI-compatible API access without requiring your own OpenAI API key.
const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY
});

interface TheologicalQuestionParams {
  question: string;
  verse?: string;
  book?: string;
  chapter?: number;
  mode: 'essential' | 'premium';
}

export async function askTheologicalQuestion(params: TheologicalQuestionParams): Promise<string> {
  const { question, verse, book, chapter, mode } = params;

  const systemPrompt = mode === 'premium' 
    ? `Você é um Professor Teológico avançado especializado em estudos bíblicos profundos. Forneça análises exegéticas detalhadas, comparações teológicas, contexto histórico-cultural completo, e insights acadêmicos. Use linguagem formal e acadêmica adequada para pregadores e professores de teologia.`
    : `Você é um Professor Teológico que fornece explicações básicas e contexto cultural simples sobre passagens bíblicas. Use linguagem clara e acessível para estudantes iniciantes.`;

  const contextInfo = verse 
    ? `\n\nContexto: ${book} ${chapter}:${verse}\nTexto: "${verse}"`
    : book && chapter
    ? `\n\nContexto: ${book} ${chapter}`
    : '';

  const userPrompt = `${question}${contextInfo}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_completion_tokens: mode === 'premium' ? 2048 : 1024,
    });

    return response.choices[0]?.message?.content || "Desculpe, não consegui gerar uma resposta.";
  } catch (error: any) {
    console.error('OpenAI API error:', error);
    throw new Error('Erro ao processar sua pergunta. Tente novamente.');
  }
}
