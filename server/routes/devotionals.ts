import type { Express, Response } from "express";
import { z } from "zod";
import { and, asc, eq, gte, lte } from "drizzle-orm";
import { devotionalContentSchema, devotionalDateSchema, devotionalJournalSchema, devotionalRoutineAt, devotionalRoutines } from "@shared/devotional";
import { dailyDevotionals } from "@shared/schema";
import { ensureAdmin, ensureAuthenticated, type AuthRequest } from "../auth";
import { db } from "../db";
import { addCalendarDays, melDate } from "../services/mel-calendar";
import { completeDevotionalMoment, devotionalPrayerRequest, getDevotionalMoment,
  isMissingDevotionalSchema, readDevotionalJournal, saveDevotionalJournal } from "../services/devotional-moments";
import { generateDevotionalDrafts, validateDevotionalApproval } from "../services/devotional-editorial";

const selectionSchema = z.object({ date: devotionalDateSchema, routine: z.enum(devotionalRoutines) }).strict();
export const devotionalSelectionSchema = selectionSchema;
export const devotionalPrivateBodySchema = devotionalJournalSchema;

function storageError(res: Response, error: unknown) {
  return res.status(503).json({ error: isMissingDevotionalSchema(error)
    ? "O diário ainda não está disponível. A migração dos devocionais precisa ser aplicada."
    : "Não foi possível concluir esta operação. Tente novamente." });
}
function parseSelection(query: unknown) {
  const parsed = selectionSchema.safeParse(query);
  if (!parsed.success) return null;
  const date = parsed.data.date;
  if (date > melDate(new Date())) return null;
  return parsed.data;
}
export function registerDevotionalRoutes(app: Express) {
  app.get("/api/devotionals/today", async (req, res) => {
    const schema = selectionSchema.extend({ version: z.string().regex(/^[A-Za-z0-9_-]{1,24}$/).default("ACF") });
    const parsed = schema.safeParse({ date: melDate(new Date()), routine: devotionalRoutineAt(), ...req.query });
    if (!parsed.success || parsed.data.date > melDate(new Date())) return res.status(400).json({ error: "Data, rotina ou versão inválida." });
    try { return res.json(await getDevotionalMoment(parsed.data.date, parsed.data.routine, parsed.data.version)); }
    catch (error) { return res.status(503).json({ error: error instanceof Error && error.message.includes("versão")
      ? error.message : "Não foi possível carregar o devocional. Tente novamente." }); }
  });
  app.get("/api/devotionals/journal", ensureAuthenticated, async (req: AuthRequest, res) => {
    const parsed = parseSelection(req.query);
    if (!parsed) return res.status(400).json({ error: "Data ou rotina inválida." });
    res.setHeader("Cache-Control", "private, no-store");
    try { return res.json(await readDevotionalJournal(req.userId!, parsed.date, parsed.routine)); }
    catch (error) { return storageError(res, error); }
  });
  app.put("/api/devotionals/journal", ensureAuthenticated, async (req: AuthRequest, res) => {
    const parsed = devotionalJournalSchema.safeParse(req.body);
    if (!parsed.success || parsed.data.date > melDate(new Date())) return res.status(400).json({ error: "Resposta, data ou rotina inválida." });
    res.setHeader("Cache-Control", "private, no-store");
    try { return res.json(await saveDevotionalJournal(req.userId!, parsed.data)); }
    catch (error) { return storageError(res, error); }
  });
  app.post("/api/devotionals/complete", ensureAuthenticated, async (req: AuthRequest, res) => {
    const parsed = selectionSchema.safeParse(req.body);
    if (!parsed.success || parsed.data.date !== melDate(new Date())) return res.status(400).json({ error: "A conclusão deve ser da data atual de São Paulo." });
    try { return res.json(await completeDevotionalMoment(req.userId!, parsed.data.date, parsed.data.routine)); }
    catch (error) { return storageError(res, error); }
  });
  app.post("/api/devotionals/prayer", ensureAuthenticated, async (req: AuthRequest, res) => {
    const parsed = parseSelection(req.body);
    if (!parsed) return res.status(400).json({ error: "Data ou rotina inválida." });
    try { return res.json(await devotionalPrayerRequest(req.userId!, parsed.date, parsed.routine)); }
    catch (error) { return storageError(res, error); }
  });
  app.get("/api/admin/devotionals", ensureAdmin, async (req: AuthRequest, res) => {
    const parsed = z.object({ from: devotionalDateSchema.default(melDate(new Date())) }).strict().safeParse(req.query);
    if (!parsed.success) return res.status(400).json({ error: "Data inválida." });
    try {
      const rows = await db.select().from(dailyDevotionals).where(and(gte(dailyDevotionals.localDate, parsed.data.from),
        lte(dailyDevotionals.localDate, addCalendarDays(parsed.data.from, 29)))).orderBy(asc(dailyDevotionals.localDate), asc(dailyDevotionals.routine));
      return res.json(rows.map((row) => ({ ...row.content, date: row.localDate, routine: row.routine, status: row.status, id: row.id })));
    } catch (error) { return storageError(res, error); }
  });
  // Also permits writing a date manually, without requiring AI availability.
  app.post("/api/admin/devotionals", ensureAdmin, async (req: AuthRequest, res) => {
    const parsed = devotionalContentSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Confira os campos do devocional." });
    try {
      if (parsed.data.status === "aprovado") await validateDevotionalApproval(parsed.data);
      const [row] = await db.insert(dailyDevotionals).values({ localDate: parsed.data.date, routine: parsed.data.routine,
        status: parsed.data.status, content: parsed.data }).onConflictDoNothing().returning();
      if (!row) return res.status(409).json({ error: "Já existe um devocional nessa data e rotina." });
      return res.status(201).json({ ...row.content, id: row.id });
    } catch (error) {
      if (error instanceof Error && !isMissingDevotionalSchema(error)) return res.status(400).json({ error: "Não foi possível salvar. Confira o trecho, a Palavra Raiz e o tamanho da reflexão." });
      return storageError(res, error);
    }
  });
  app.put("/api/admin/devotionals/:id", ensureAdmin, async (req: AuthRequest, res) => {
    const parsed = devotionalContentSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Confira os campos do devocional." });
    try {
      if (parsed.data.status === "aprovado") await validateDevotionalApproval(parsed.data);
      const [row] = await db.update(dailyDevotionals).set({ localDate: parsed.data.date, routine: parsed.data.routine,
        status: parsed.data.status, content: parsed.data, updatedAt: new Date() }).where(eq(dailyDevotionals.id, req.params.id)).returning();
      if (!row) return res.status(404).json({ error: "Devocional não encontrado." });
      return res.json({ ...row.content, id: row.id });
    } catch (error) {
      if (error instanceof Error && !isMissingDevotionalSchema(error)) return res.status(400).json({ error: "Não foi possível aprovar ou salvar. Verifique a referência bíblica, o Strong, a data e o tamanho da reflexão." });
      return storageError(res, error);
    }
  });
  app.post("/api/admin/devotionals/generate", ensureAdmin, async (req: AuthRequest, res) => {
    const parsed = z.object({ startDate: devotionalDateSchema, days: z.number().int().min(1).max(30).default(30) }).strict().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Informe a data inicial e até 30 dias." });
    try { return res.json(await generateDevotionalDrafts(parsed.data.startDate, parsed.data.days)); }
    catch (error) { return storageError(res, error); }
  });
}