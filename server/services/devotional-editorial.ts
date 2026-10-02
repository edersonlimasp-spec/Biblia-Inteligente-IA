import OpenAI from "openai";
import { and, eq, gte, lte, or } from "drizzle-orm";
import { devotionalContentSchema, type DevotionalContent } from "@shared/devotional";
import { bibleWords, dailyDevotionals, strongEntries } from "@shared/schema";
import { db } from "../db";
import { addCalendarDays } from "./mel-calendar";
import { devotionalReserve, reserveForDate } from "./devotional-reserve";
import { devotionalPassage } from "./devotional-moments";

export async function validateDevotionalApproval(content: DevotionalContent) {
  const passage = await devotionalPassage(content, "ACF");
  const [strong] = await db.select({ id: strongEntries.id }).from(strongEntries)
    .where(eq(strongEntries.strongNumber, content.strongNumber)).limit(1);
  if (!strong) throw new Error("O número Strong não existe no dicionário do app.");
  const curated = content.routine === "noite"
    ? content.book === "psa" && content.chapter === 4 && content.verse === 8 && content.strongNumber === "H7965"
    : devotionalReserve.some((v) => v.book === content.book && v.chapter === content.chapter
      && v.verse === content.verse && v.strong === content.strongNumber);
  if (!curated) {
    const [word] = await db.select({ id: bibleWords.id }).from(bibleWords).where(and(
      eq(bibleWords.book, content.book), eq(bibleWords.chapter, content.chapter),
      gte(bibleWords.verse, content.verse), lte(bibleWords.verse, content.endVerse ?? content.verse),
      or(eq(bibleWords.strongNumber, content.strongNumber), eq(bibleWords.pdfStrong, content.strongNumber)),
    )).limit(1);
    if (!word) throw new Error("A Palavra Raiz precisa estar comprovada no trecho bíblico selecionado.");
  }
  if (content.routine === "manha") {
    const count = content.reflection.trim().split(/\s+/).length;
    if (count < 150 || count > 200) throw new Error(`A reflexão da manhã deve ter 150–200 palavras (atual: ${count}).`);
  }
  // Preserve verified text in the JSON content for future missing Bible data.
  content.verseText = passage.text;
  content.verseVersion = passage.versionCode;
}

export async function generateDevotionalDrafts(startDate: string, days: number) {
  const client = new OpenAI({ baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
    apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY, timeout: 60000, maxRetries: 1 });
  let created = 0;
  let skipped = 0;
  let failed = 0;
  const generateDate = async (offset: number) => {
    const date = addCalendarDays(startDate, offset);
    const existing = await db.select({ routine: dailyDevotionals.routine }).from(dailyDevotionals).where(eq(dailyDevotionals.localDate, date));
    const missing = (["manha", "noite"] as const).filter((routine) => !existing.some((v) => v.routine === routine));
    skipped += 2 - missing.length;
    if (!missing.length) return;
    const morning = reserveForDate(date, "manha");
    const evening = reserveForDate(date, "noite");
    // Canonical Bible text guides the drafting. AI never writes Bible verses,
    // Strong data or Library text and cannot choose an unverified root.
    const passage = await devotionalPassage(morning, "ACF");
    const nightPassage = await devotionalPassage(evening, "ACF");
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini", temperature: 0.6, max_tokens: 2600,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "Você auxilia um editor cristão brasileiro. A Bíblia é a autoridade; a IA e a Mel são apenas apoio, nunca quem ensina. Escreva devocionais evangélicos fiéis ao contexto do texto bíblico, sem doutrinas controversas entre denominações, sem promessas de cura, prosperidade ou revelações particulares. Linguagem simples, calorosa e prática, em português do Brasil. Não invente citações bíblicas, palavras originais, significados Strong ou texto de Spurgeon. São rascunhos sujeitos à aprovação humana. Responda JSON com chaves manha e noite; cada uma contém APENAS title,reflection,action,prayer,question. Manhã: reflexão com 150–200 palavras. Noite: reflexão breve. Action: desafio concreto e seguro para o dia. Prayer: oração curta dirigida a Deus. Question: uma pergunta pessoal, não diagnóstica. Não use emojis." },
        { role: "user", content: JSON.stringify({ date, morning: { reference: passage.reference, text: passage.text },
          evening: { reference: nightPassage.reference, text: nightPassage.text }, guidance: "A noite retoma o desafio prático da manhã; não faça afirmações sobre o que a pessoa viveu." }) },
      ],
    });
    const generated = JSON.parse(response.choices[0]?.message.content || "{}");
    for (const routine of missing) {
      const input = generated[routine];
      if (!input || typeof input !== "object") throw new Error("A IA não retornou um rascunho válido.");
      const base = routine === "manha" ? morning : evening;
      const parsed = devotionalContentSchema.parse({
        ...base, title: input.title, reflection: input.reflection, action: input.action,
        prayer: input.prayer, question: input.question, status: "rascunho",
      });
      // Reject unsupported length/source data even before editorial approval.
      await validateDevotionalApproval(parsed);
      const rows = await db.insert(dailyDevotionals).values({
        localDate: date, routine, status: "rascunho", content: parsed,
      }).onConflictDoNothing({ target: [dailyDevotionals.localDate, dailyDevotionals.routine] }).returning({ id: dailyDevotionals.id });
      created += rows.length;
      if (!rows.length) skipped++;
    }
  };
  for (let offset = 0; offset < days; offset += 3) {
    await Promise.all(Array.from({ length: Math.min(3, days - offset) }, (_, index) =>
      generateDate(offset + index).catch(() => { failed++; })));
  }
  return { created, skipped, failed,
    message: failed ? `${created} rascunhos salvos; ${failed} data(s) não puderam ser geradas. Nada foi aprovado automaticamente.` : "Rascunhos salvos. Revise e aprove cada rotina antes da publicação." };
}