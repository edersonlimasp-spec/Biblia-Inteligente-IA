import { z } from "zod";

export const pushBibleBookIds = [
  "gen", "exo", "lev", "num", "deu", "jos", "jdg", "rut", "1sa", "2sa", "1ki", "2ki", "1ch", "2ch",
  "ezr", "neh", "est", "job", "psa", "pro", "ecc", "sng", "isa", "jer", "lam", "ezk", "dan", "hos",
  "jol", "amo", "oba", "jon", "mic", "nam", "hab", "zep", "hag", "zec", "mal", "mat", "mrk", "luk",
  "jhn", "act", "rom", "1co", "2co", "gal", "eph", "php", "col", "1th", "2th", "1ti", "2ti", "tit",
  "phm", "heb", "jas", "1pe", "2pe", "1jn", "2jn", "3jn", "jud", "rev",
] as const;

export const pushTrackLevels = ["iniciante", "moderado", "avancado"] as const;
export type PushTrackLevel = typeof pushTrackLevels[number];

export function isPushBibleBookId(book: string): book is typeof pushBibleBookIds[number] {
  return (pushBibleBookIds as readonly string[]).includes(book);
}

export function isPushTrackLevel(trackLevel: string): trackLevel is PushTrackLevel {
  return (pushTrackLevels as readonly string[]).includes(trackLevel);
}

function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

const bibleDestinationSchema = z.object({
  kind: z.literal("bible"),
  book: z.enum(pushBibleBookIds),
  chapter: z.number().int().positive().max(200),
  verse: z.number().int().positive().max(200),
  versionCode: z.string().regex(/^[A-Za-z0-9_-]{1,24}$/),
}).strict();

const devotionalDestinationSchema = z.object({
  kind: z.literal("devotional"),
  devotionalDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
}).strict().refine((value) => isCalendarDate(value.devotionalDate));

const lessonDestinationSchema = z.object({
  kind: z.literal("lesson"),
  lessonId: z.string().min(1).max(128),
  moduleId: z.string().min(1).max(128),
  trackLevel: z.enum(pushTrackLevels),
}).strict();

/** Safe in-app destinations only. Push data must never be an arbitrary URL. */
export const pushDestinationSchema = z.union([
  bibleDestinationSchema,
  devotionalDestinationSchema,
  lessonDestinationSchema,
]);

export type PushDestination = z.infer<typeof pushDestinationSchema>;