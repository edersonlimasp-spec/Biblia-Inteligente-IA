import { and, asc, eq, gte, ilike, lte, or } from "drizzle-orm";
import type { DevotionalContent, DevotionalJournalInput, DevotionalMoment, DevotionalRoutine } from "@shared/devotional";
import { bibleVerses, strongEntries, dailyDevotionals, devotionalJournal, libraryBooks, libraryChapters, prayerLists, prayerRequests } from "@shared/schema";
import { db } from "../db";
import { getBookById } from "../bible-data/books";
import { melDate } from "./mel-calendar";
import { getMelStatus, recordMelActivity } from "./mel";
import { reserveForDate } from "./devotional-reserve";

let schemaWarningLogged = false;
export function isMissingDevotionalSchema(error: unknown): boolean {
  const e = error as { code?: string; cause?: unknown } | null;
  return !!e && (e.code === "42P01" || (!!e.cause && isMissingDevotionalSchema(e.cause)));
}

export async function devotionalContentFor(date: string, routine: DevotionalRoutine): Promise<DevotionalContent & { source: "aprovado" | "reserva" }> {
  try {
    const [row] = await db.select().from(dailyDevotionals).where(and(
      eq(dailyDevotionals.localDate, date), eq(dailyDevotionals.routine, routine), eq(dailyDevotionals.status, "aprovado"),
    )).limit(1);
    if (row) return { ...row.content, date, routine, status: "aprovado", source: "aprovado" };
  } catch (error) {
    if (!isMissingDevotionalSchema(error)) throw error;
    if (!schemaWarningLogged) {
      schemaWarningLogged = true;
      console.warn("[Devocionais] Migração pendente; leitura disponível pela reserva editorial.");
    }
  }
  return { ...reserveForDate(date, routine), source: "reserva" };
}

export async function devotionalPassage(content: Pick<DevotionalContent, "book" | "chapter" | "verse" | "endVerse">, versionCode: string) {
  const verses = await db.select({ verse: bibleVerses.verse, text: bibleVerses.text }).from(bibleVerses).where(and(
    eq(bibleVerses.book, content.book), eq(bibleVerses.chapter, content.chapter), eq(bibleVerses.versionCode, versionCode),
    gte(bibleVerses.verse, content.verse), lte(bibleVerses.verse, content.endVerse ?? content.verse),
  )).orderBy(asc(bibleVerses.verse));
  const expected = (content.endVerse ?? content.verse) - content.verse + 1;
  if (verses.length !== expected || verses.some((v) => !v.text.trim())) {
    throw new Error("Este trecho não está disponível na versão escolhida. Selecione outra versão da Bíblia.");
  }
  const name = getBookById(content.book)?.name;
  if (!name) throw new Error("Livro bíblico inválido.");
  return {
    book: content.book, chapter: content.chapter, verse: content.verse, endVerse: content.endVerse,
    reference: `${name} ${content.chapter}:${content.verse}${content.endVerse && content.endVerse !== content.verse ? `–${content.endVerse}` : ""}`,
    versionCode, text: verses.map((v) => v.text).join(" "),
  };
}

// An excerpt must be explicitly dated and evening-labelled. Never guess a
// Spurgeon passage or manufacture/modify a Library chapter. Only public samples
// are reused here so the free devotional does not bypass Library entitlements.
export function extractSpurgeonEvening(title: string, text: string, date: string): string | null {
  const monthNames = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  const [, month, day] = date.split("-").map(Number);
  const dated = new RegExp(`(?:^|\\D)0?${day}\\s*(?:de\\s+)?${monthNames[month - 1]}(?:\\D|$)`, "i");
  if (!dated.test(title) || !/\bnoite\b/i.test(title) || !text.trim()) return null;
  return text.trim().split(/\s+/).slice(0, 180).join(" ");
}

async function spurgeonReading(date: string): Promise<DevotionalMoment["nightReading"]> {
  const chapters = await db.select({ title: libraryChapters.title, content: libraryChapters.content })
    .from(libraryChapters).innerJoin(libraryBooks, eq(libraryChapters.bookId, libraryBooks.id))
    .where(and(
      ilike(libraryBooks.title, "%noite%"), ilike(libraryBooks.author, "%spurgeon%"),
      eq(libraryBooks.publishStatus, "published"),
      or(eq(libraryChapters.isSample, true), lte(libraryChapters.orderNum, 2)),
      ilike(libraryChapters.title, "%noite%"),
    )).limit(50);
  for (const chapter of chapters) {
    const text = extractSpurgeonEvening(chapter.title, chapter.content, date);
    if (text) return { title: "Manhã e Noite — C. H. Spurgeon", text, source: "spurgeon" };
  }
  return null;
}

export async function getDevotionalMoment(date: string, routine: DevotionalRoutine, versionCode = "ACF"): Promise<DevotionalMoment> {
  const content = await devotionalContentFor(date, routine);
  const morning = routine === "manha" ? content : await devotionalContentFor(date, "manha");
  const verse = await devotionalPassage(content, versionCode);
  const [entry] = await db.select({
    strongNumber: strongEntries.strongNumber, lemma: strongEntries.lemma,
    transliteration: strongEntries.translit, alternative: strongEntries.xlit, meaning: strongEntries.portugueseDef,
  }).from(strongEntries).where(eq(strongEntries.strongNumber, content.strongNumber)).limit(1);
  const root = entry?.meaning ? {
    strongNumber: entry.strongNumber, lemma: entry.lemma,
    transliteration: entry.transliteration || entry.alternative || "",
    meaning: entry.meaning.slice(0, 220),
  } : null;
  const nightReading = routine === "noite"
    ? await spurgeonReading(date) ?? { title: "Um Salmo para descansar", text: verse.text, reference: verse.reference, source: "salmo" as const }
    : null;
  return { date, routine, title: content.title, reflection: content.reflection,
    action: content.action, morningAction: morning.action, prayer: content.prayer, question: content.question,
    source: content.source, verse, root, nightReading };
}

const emptyJournal = (date: string, routine: DevotionalRoutine): DevotionalJournalInput => ({
  date, routine, answer: "", gratitude: "", surrender: "", forgiveness: "", actionDone: null,
});
const journalWhere = (userId: string, date: string, routine: DevotionalRoutine) => and(
  eq(devotionalJournal.userId, userId), eq(devotionalJournal.localDate, date), eq(devotionalJournal.routine, routine),
);
export async function readDevotionalJournal(userId: string, date: string, routine: DevotionalRoutine) {
  const [row] = await db.select().from(devotionalJournal).where(journalWhere(userId, date, routine)).limit(1);
  return { ...emptyJournal(date, routine), ...row?.entries, completed: row?.completed ?? false };
}
export async function saveDevotionalJournal(userId: string, entries: DevotionalJournalInput) {
  await db.insert(devotionalJournal).values({ userId, localDate: entries.date, routine: entries.routine, entries })
    .onConflictDoUpdate({ target: [devotionalJournal.userId, devotionalJournal.localDate, devotionalJournal.routine],
      set: { entries, updatedAt: new Date() } });
  return readDevotionalJournal(userId, entries.date, entries.routine);
}
export async function completeDevotionalMoment(userId: string, date: string, routine: DevotionalRoutine) {
  if (date !== melDate(new Date())) throw new Error("Só é possível concluir a rotina da data atual de São Paulo.");
  // Fail before writing to Mel if the additive journal migration is pending.
  await readDevotionalJournal(userId, date, routine);
  // The established Mel recorder uses a PostgreSQL advisory transaction lock
  // and checks the date before insertion: morning+evening and retries count once.
  await recordMelActivity(userId, "mel_devotional");
  await db.insert(devotionalJournal).values({ userId, localDate: date, routine, entries: emptyJournal(date, routine), completed: true })
    .onConflictDoUpdate({ target: [devotionalJournal.userId, devotionalJournal.localDate, devotionalJournal.routine],
      set: { completed: true, updatedAt: new Date() } });
  return { completed: true, status: await getMelStatus(userId) };
}

export async function devotionalPrayerRequest(userId: string, date: string, routine: DevotionalRoutine) {
  const content = await devotionalContentFor(date, routine);
  // Own list selected/created from session identity; no caller-supplied list ID.
  return db.transaction(async (tx) => {
    const [existingList] = await tx.select().from(prayerLists).where(and(eq(prayerLists.userId, userId), eq(prayerLists.title, "Meu Momento com Deus"))).limit(1);
    const list = existingList ?? (await tx.insert(prayerLists).values({ userId, title: "Meu Momento com Deus", listType: "personal" }).returning())[0];
    const [request] = await tx.insert(prayerRequests).values({
      userId, listId: list.id, title: `${routine === "manha" ? "Bom Dia" : "Boa Noite"} com Deus — ${content.title}`,
      description: content.prayer, category: "general",
    }).returning();
    return { listId: list.id, requestId: request.id };
  });
}