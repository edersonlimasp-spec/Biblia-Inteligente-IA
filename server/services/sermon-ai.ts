import OpenAI from "openai";
import { toFile } from "openai";

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY
});

const openaiWhisper = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export interface SermonSummaryResult {
  summaryJson: {
    titulo_tema?: string;
    versiculo_base?: string;
    contexto?: string;
    pontos_principais?: string[];
    ilustracoes_exemplos?: string[];
    aplicacoes_praticas?: string[];
    decisoes_e_desafios?: string[];
    citacoes_marcantes?: string[];
    oracao_sugerida?: string;
  };
  summaryText: string;
}

export async function transcribeAudio(audioBuffer: Buffer, mimeType: string): Promise<string> {
  try {
    const extension = mimeType.includes("mp3") ? "mp3" : 
                      mimeType.includes("mp4") || mimeType.includes("m4a") ? "m4a" :
                      mimeType.includes("wav") ? "wav" : "webm";
    
    const file = await toFile(audioBuffer, `audio.${extension}`, { type: mimeType });
    
    const transcription = await openaiWhisper.audio.transcriptions.create({
      file: file,
      model: "whisper-1",
      language: "pt",
      response_format: "text"
    });
    
    return transcription;
  } catch (error) {
    console.error("[Sermon AI] Transcription error:", error);
    throw new Error("Falha na transcrição do áudio");
  }
}

const SUMMARY_PROMPT = `Você é um assistente de anotações cristãs. A partir da transcrição abaixo, gere um resumo estruturado e conciso.
Retorne primeiro um JSON válido com os campos:
- titulo_tema (string): tema principal do sermão
- versiculo_base (string): versículo base citado, se houver
- contexto (string): contexto em 2-4 linhas
- pontos_principais (array de strings): lista de pontos principais
- ilustracoes_exemplos (array de strings): ilustrações e exemplos usados
- aplicacoes_praticas (array de strings): aplicações práticas para a vida
- decisoes_e_desafios (array de strings): decisões e desafios propostos
- citacoes_marcantes (array de strings): frases marcantes do pregador
- oracao_sugerida (string): uma oração curta baseada na mensagem

Depois do JSON, em uma nova linha, escreva "---TEXTO---" e gere uma versão formatada em texto com títulos e bullet points para leitura fácil.

Transcrição:
<<< {transcriptText} >>>`;

export async function generateSermonSummary(transcriptText: string): Promise<SermonSummaryResult> {
  try {
    const prompt = SUMMARY_PROMPT.replace("{transcriptText}", transcriptText);
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Você é um assistente especializado em resumir sermões e estudos bíblicos." },
        { role: "user", content: prompt }
      ],
      temperature: 0.2
    });
    
    const outputText = response.choices[0]?.message?.content || "";
    
    const parts = outputText.split("---TEXTO---");
    const jsonPart = parts[0].trim();
    const textPart = parts.length > 1 ? parts[1].trim() : "";
    
    let summaryJson: SermonSummaryResult["summaryJson"] = {};
    try {
      const jsonMatch = jsonPart.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        summaryJson = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.warn("[Sermon AI] Failed to parse JSON, using empty object:", e);
    }
    
    const summaryText = textPart || formatSummaryFromJson(summaryJson);
    
    return { summaryJson, summaryText };
  } catch (error) {
    console.error("[Sermon AI] Summary generation error:", error);
    throw new Error("Falha na geração do resumo");
  }
}

function formatSummaryFromJson(json: SermonSummaryResult["summaryJson"]): string {
  const lines: string[] = [];
  
  if (json.titulo_tema) {
    lines.push(`# ${json.titulo_tema}\n`);
  }
  
  if (json.versiculo_base) {
    lines.push(`**Versículo Base:** ${json.versiculo_base}\n`);
  }
  
  if (json.contexto) {
    lines.push(`## Contexto\n${json.contexto}\n`);
  }
  
  if (json.pontos_principais?.length) {
    lines.push(`## Pontos Principais`);
    json.pontos_principais.forEach(p => lines.push(`• ${p}`));
    lines.push("");
  }
  
  if (json.ilustracoes_exemplos?.length) {
    lines.push(`## Ilustrações e Exemplos`);
    json.ilustracoes_exemplos.forEach(p => lines.push(`• ${p}`));
    lines.push("");
  }
  
  if (json.aplicacoes_praticas?.length) {
    lines.push(`## Aplicações Práticas`);
    json.aplicacoes_praticas.forEach(p => lines.push(`• ${p}`));
    lines.push("");
  }
  
  if (json.decisoes_e_desafios?.length) {
    lines.push(`## Decisões e Desafios`);
    json.decisoes_e_desafios.forEach(p => lines.push(`• ${p}`));
    lines.push("");
  }
  
  if (json.citacoes_marcantes?.length) {
    lines.push(`## Citações Marcantes`);
    json.citacoes_marcantes.forEach(p => lines.push(`"${p}"`));
    lines.push("");
  }
  
  if (json.oracao_sugerida) {
    lines.push(`## Oração Sugerida\n${json.oracao_sugerida}`);
  }
  
  return lines.join("\n");
}

export function generateShareToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}
