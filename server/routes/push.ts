import type { Express, Response } from "express";
import { z } from "zod";
import {
  isPushBibleBookId,
  isPushTrackLevel,
  pushDestinationSchema,
  type PushDestination,
} from "@shared/push";
import { ensureAdmin, ensureAuthenticated, type AuthRequest } from "../auth";
import {
  buildMelReminder,
  getCampaignPushMessages,
  getPushPlatformStats,
  getUserPushMessages,
  isMissingPushSchemaError,
  isPushConfigured,
  registerPushToken,
  removePushToken,
  reportPushStorageError,
  runMelPushReminders,
  schedulerSecretIsValid,
  sendPushMessages,
} from "../services/push";
import { getMelStatus } from "../services/mel";
import type { MelStatus } from "@shared/mel";

const registerTokenSchema = z.object({
  token: z.string().trim().min(1).max(4096),
  platform: z.enum(["android", "ios"]),
}).strict();

const removeTokenSchema = z.object({
  token: z.string().trim().min(1).max(4096),
}).strict();

const campaignSchema = z.object({
  title: z.string().trim().min(1).max(100),
  body: z.string().trim().min(1).max(500),
  destination: pushDestinationSchema,
  audience: z.enum(["all", "free", "paid"]),
  confirmed: z.literal(true),
}).strict();

function destinationFromStatus(status: MelStatus): PushDestination {
  if (status.position?.kind === "bible" && isPushBibleBookId(status.position.book)) {
    return {
      kind: "bible",
      book: status.position.book,
      chapter: status.position.chapter,
      verse: status.position.verse,
      versionCode: status.position.versionCode,
    };
  }
  if (status.position?.kind === "lesson" && isPushTrackLevel(status.position.trackLevel)) {
    return {
      kind: "lesson",
      lessonId: status.position.lessonId,
      moduleId: status.position.moduleId,
      trackLevel: status.position.trackLevel,
    };
  }
  return {
    kind: "devotional",
    devotionalDate: status.position?.kind === "devotional" ? status.position.devotionalDate : status.today,
  };
}

function routeError(res: Response, error: unknown, message: string): void {
  const missingSchema = isMissingPushSchemaError(error);
  reportPushStorageError(error, "As tabelas push");
  if (missingSchema) {
    res.status(503).json({ error: "Notificações push ainda não estão disponíveis. Aplique a migração do servidor." });
    return;
  }
  // Do not expose tokens, service-account data or Firebase/SQL driver errors.
  res.status(503).json({ error: message });
}

export function registerPushRoutes(app: Express): void {
  app.post("/api/push/tokens", ensureAuthenticated, async (req: AuthRequest, res: Response) => {
    const parsed = registerTokenSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Token de dispositivo inválido." });
    try {
      await registerPushToken(req.userId!, parsed.data.token, parsed.data.platform);
      return res.json({ success: true });
    } catch (error) {
      routeError(res, error, "Não foi possível registrar este dispositivo.");
    }
  });

  app.delete("/api/push/tokens", ensureAuthenticated, async (req: AuthRequest, res: Response) => {
    const parsed = removeTokenSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Token de dispositivo inválido." });
    try {
      // Account ownership is always derived from the trusted middleware.
      await removePushToken(req.userId!, parsed.data.token);
      return res.json({ success: true });
    } catch (error) {
      routeError(res, error, "Não foi possível remover este dispositivo.");
    }
  });

  app.get("/api/admin/push/stats", ensureAdmin, async (_req: AuthRequest, res: Response) => {
    res.json(await getPushPlatformStats());
  });

  app.post("/api/admin/push/test", ensureAdmin, async (req: AuthRequest, res: Response) => {
    if (!isPushConfigured()) {
      return res.status(503).json({ error: "O envio push não está configurado." });
    }
    try {
      const status = await getMelStatus(req.userId!);
      const reminder = buildMelReminder(status);
      const payload = {
        title: "Notificação de teste da Mel",
        body: reminder.body,
        destination: destinationFromStatus(status),
      };
      const messages = await getUserPushMessages(req.userId!, payload);
      if (messages.length === 0) return res.status(404).json({ error: "Este administrador não tem dispositivos registrados." });
      const result = await sendPushMessages(messages);
      return res.json({
        success: result.sent > 0,
        sent: result.sent,
        failed: result.failed,
        skipped: 0,
        message: result.sent > 0 ? "Notificação de teste enviada." : "Não foi possível entregar a notificação.",
      });
    } catch (error) {
      routeError(res, error, "Não foi possível enviar a notificação de teste.");
    }
  });

  app.post("/api/admin/push/campaign", ensureAdmin, async (req: AuthRequest, res: Response) => {
    const parsed = campaignSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Campanha inválida ou envio não confirmado." });
    if (!isPushConfigured()) {
      return res.status(503).json({ error: "O envio push não está configurado." });
    }
    try {
      const { title, body, audience, destination } = parsed.data;
      const messages = await getCampaignPushMessages(audience, { title, body, destination });
      const result = await sendPushMessages(messages);
      return res.json({
        success: result.failed === 0,
        audience,
        recipients: messages.length,
        sent: result.sent,
        failed: result.failed,
        skipped: 0,
        invalidTokensRemoved: result.invalidTokensRemoved,
        message: `${result.sent} notificação(ões) enviada(s).`,
      });
    } catch (error) {
      routeError(res, error, "Não foi possível enviar a campanha.");
    }
  });

  // External scheduled deployments can call this endpoint with a dedicated,
  // rotated secret. A per-user database claim still prevents duplicate sends.
  app.post("/api/push/reminders/run", async (req, res) => {
    const header = req.header("authorization");
    const supplied = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
    if (!schedulerSecretIsValid(supplied)) {
      return res.status(process.env.PUSH_SCHEDULER_SECRET ? 401 : 503).json({ error: "Agendador push indisponível." });
    }
    try {
      return res.json(await runMelPushReminders());
    } catch {
      return res.status(503).json({ error: "O agendador push não pôde ser executado." });
    }
  });
}
