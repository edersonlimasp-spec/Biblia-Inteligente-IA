import type { Express, Response } from "express";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { ensureAuthenticated, type AuthRequest } from "../auth";
import { db } from "../db";
import { bibleVerses, bibleVersions, melProfiles } from "@shared/schema";
import { getBookById } from "../bible-data/books";
import { storage } from "../storage";
import {
  getMelPreferences,
  getMelStatus,
  isCanonicalMelDevotionalDate,
  recordMelActivity,
  saveMelLessonPosition,
  saveMelPosition,
  saveMelPreferences,
} from "../services/mel";
import type { MelPosition } from "@shared/mel";

const biblePositionSchema = z.object({
  kind: z.literal("bible"),
  book: z.string().min(1).max(8),
  chapter: z.number().int().positive(),
  verse: z.number().int().positive(),
  versionCode: z.string().min(1).max(20),
}).strict();
const lessonPositionSchema = z.object({
  kind: z.literal("lesson"),
  lessonId: z.string().min(1).max(100),
  videoSeconds: z.number().int().nonnegative().optional(),
}).strict();
const devotionalPositionSchema = z.object({
  kind: z.literal("devotional"),
  devotionalDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
}).strict();
const positionSchema = z.discriminatedUnion("kind", [
  biblePositionSchema, lessonPositionSchema, devotionalPositionSchema,
]);
const preferencesSchema = z.object({
  reminderPeriod: z.enum(["morning", "afternoon", "evening", "exact"]),
  reminderTime: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/).nullable(),
  dailyGoalMinutes: z.union([z.literal(5), z.literal(10), z.literal(15)]),
}).strict();
const activitySchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("bible"),
    book: z.string().min(1).max(8),
    chapter: z.number().int().positive(),
  }).strict(),
  z.object({
    kind: z.literal("devotional"),
    devotionalDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  }).strict(),
]);

function parseBody<T>(schema: z.ZodType<T>, body: unknown): T | null {
  const result = schema.safeParse(body);
  return result.success ? result.data : null;
}

export function registerMelRoutes(app: Express): void {
  app.get("/api/mel", ensureAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      res.json(await getMelStatus(req.userId!));
    } catch (error) {
      console.error("[Mel] Status error:", error);
      res.status(500).json({ error: "Erro ao buscar status Mel" });
    }
  });

  app.post("/api/mel/position", ensureAuthenticated, async (req: AuthRequest, res: Response) => {
    const body = parseBody(positionSchema, req.body);
    if (!body) return res.status(400).json({ error: "Posição Mel inválida" });
    try {
      let position: MelPosition;
      if (body.kind === "lesson") {
        position = await saveMelLessonPosition(req.userId!, body.lessonId, body.videoSeconds);
      } else if (body.kind === "devotional") {
        if (!(await isCanonicalMelDevotionalDate(body.devotionalDate))) {
          return res.status(400).json({ error: "Data do devocional inválida ou passagem canônica indisponível" });
        }
        position = await saveMelPosition(req.userId!, body);
      } else {
        const book = getBookById(body.book);
        if (!book || body.chapter > book.chapters) {
          return res.status(400).json({ error: "Livro ou capítulo inválido" });
        }
        const [version] = await db.select({ code: bibleVersions.code }).from(bibleVersions)
          .where(and(eq(bibleVersions.code, body.versionCode), eq(bibleVersions.isActive, true))).limit(1);
        if (!version) return res.status(400).json({ error: "Versão bíblica inválida" });
        const [verse] = await db.select({ verse: bibleVerses.verse }).from(bibleVerses).where(and(
          eq(bibleVerses.book, body.book),
          eq(bibleVerses.chapter, body.chapter),
          eq(bibleVerses.verse, body.verse),
          eq(bibleVerses.versionCode, body.versionCode),
        )).limit(1);
        if (!verse) return res.status(400).json({ error: "Versículo não encontrado" });
        position = await saveMelPosition(req.userId!, body);
      }
      const [profile] = await db.select({ updatedAt: melProfiles.updatedAt }).from(melProfiles)
        .where(eq(melProfiles.userId, req.userId!)).limit(1);
      res.json({ position, updatedAt: profile?.updatedAt ?? new Date() });
    } catch (error) {
      console.error("[Mel] Position error:", error);
      const message = error instanceof Error ? error.message : "";
      if (message.includes("inaccessible")) return res.status(403).json({ error: "Acesso à posição negado" });
      res.status(500).json({ error: "Erro ao salvar posição Mel" });
    }
  });

  app.post("/api/mel/activity", ensureAuthenticated, async (req: AuthRequest, res: Response) => {
    const body = parseBody(activitySchema, req.body);
    if (!body) return res.status(400).json({ error: "Atividade Mel inválida" });
    try {
      if (body.kind === "devotional") {
        if (!(await isCanonicalMelDevotionalDate(body.devotionalDate, true))) {
          return res.status(400).json({ error: "Somente o devocional canônico de hoje pode ser registrado" });
        }
        await recordMelActivity(req.userId!, "mel_devotional");
        await saveMelPosition(req.userId!, { kind: "devotional", devotionalDate: body.devotionalDate });
        return res.json({ success: true });
      }

      const book = getBookById(body.book);
      if (!book || body.chapter > book.chapters) {
        return res.status(400).json({ error: "Livro ou capítulo inválido" });
      }
      const [verse] = await db.select({ verse: bibleVerses.verse }).from(bibleVerses).where(and(
        eq(bibleVerses.book, body.book),
        eq(bibleVerses.chapter, body.chapter),
      )).limit(1);
      if (!verse) return res.status(400).json({ error: "Capítulo não encontrado" });

      await storage.trackChapterRead(req.userId!, undefined, body.book, body.chapter);
      await recordMelActivity(req.userId!, "mel_bible_chapter");
      res.json({ success: true });
    } catch (error) {
      console.error("[Mel] Activity error:", error);
      res.status(500).json({ error: "Erro ao registrar atividade Mel" });
    }
  });

  app.get("/api/mel/preferences", ensureAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      res.json(await getMelPreferences(req.userId!));
    } catch (error) {
      console.error("[Mel] Preferences error:", error);
      res.status(500).json({ error: "Erro ao buscar preferências Mel" });
    }
  });

  app.put("/api/mel/preferences", ensureAuthenticated, async (req: AuthRequest, res: Response) => {
    const preferences = parseBody(preferencesSchema, req.body);
    if (!preferences ||
      (preferences.reminderPeriod === "exact" && preferences.reminderTime === null) ||
      (preferences.reminderPeriod !== "exact" && preferences.reminderTime !== null)) {
      return res.status(400).json({ error: "Preferências Mel inválidas" });
    }
    try {
      res.json(await saveMelPreferences(req.userId!, preferences));
    } catch (error) {
      console.error("[Mel] Save preferences error:", error);
      res.status(500).json({ error: "Erro ao salvar preferências Mel" });
    }
  });
}
