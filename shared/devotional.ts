import { z } from "zod";

export const devotionalRoutines = ["manha", "noite"] as const;
export type DevotionalRoutine = typeof devotionalRoutines[number];
export const devotionalDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((s) => {
  const d = new Date(`${s}T00:00:00Z`);
  return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === s;
});
export function devotionalRoutineAt(now = new Date()): DevotionalRoutine {
  const hour = Number(new Intl.DateTimeFormat("en-GB", { timeZone: "America/Sao_Paulo", hour: "2-digit", hourCycle: "h23" }).format(now));
  return hour >= 4 && hour < 18 ? "manha" : "noite";
}
export const devotionalContentSchema = z.object({
  date: devotionalDateSchema,
  routine: z.enum(devotionalRoutines),
  title: z.string().trim().min(3).max(120),
  book: z.string().regex(/^[a-z0-9]{3}$/),
  chapter: z.number().int().positive().max(150),
  verse: z.number().int().positive().max(176),
  endVerse: z.number().int().positive().max(176).nullable().default(null),
  verseText: z.string().trim().min(1).max(10000).optional(),
  verseVersion: z.string().regex(/^[A-Za-z0-9_-]{1,24}$/).optional(),
  reflection: z.string().trim().min(80).max(8000),
  strongNumber: z.string().regex(/^[HG]\d{1,5}$/),
  action: z.string().trim().min(5).max(1000),
  prayer: z.string().trim().min(5).max(3000),
  question: z.string().trim().min(5).max(1000),
  status: z.enum(["rascunho", "aprovado"]).default("rascunho"),
}).strict().refine((v) => !v.endVerse || v.endVerse >= v.verse, { message: "O trecho precisa terminar depois do versículo inicial." });
export type DevotionalContent = z.infer<typeof devotionalContentSchema>;
export type DevotionalMoment = {
  date: string; routine: DevotionalRoutine; title: string; reflection: string;
  action: string; morningAction: string; prayer: string; question: string;
  source: "aprovado" | "reserva";
  verse: { book: string; chapter: number; verse: number; endVerse: number | null; reference: string; versionCode: string; text: string };
  root: { strongNumber: string; lemma: string; transliteration: string; meaning: string } | null;
  nightReading: { title: string; text: string; source: "spurgeon" | "salmo"; reference?: string } | null;
};
export const devotionalJournalSchema = z.object({
  date: devotionalDateSchema, routine: z.enum(devotionalRoutines),
  answer: z.string().max(5000).default(""),
  gratitude: z.string().max(1000).default(""),
  surrender: z.string().max(1000).default(""),
  forgiveness: z.string().max(1000).default(""),
  actionDone: z.boolean().nullable().default(null),
}).strict();
export type DevotionalJournalInput = z.infer<typeof devotionalJournalSchema>;
export type DevotionalJournal = DevotionalJournalInput & { completed: boolean };