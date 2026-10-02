import { createHash, timingSafeEqual } from "node:crypto";
import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getMessaging, type Message } from "firebase-admin/messaging";
import { and, eq, inArray, sql } from "drizzle-orm";
import type { MelPreferences, MelStatus } from "@shared/mel";
import {
  pushNotificationClaims,
  pushTokens,
} from "@shared/schema";
import { isPushBibleBookId, isPushTrackLevel, type PushDestination } from "@shared/push";
import { db } from "../db";
import { storage } from "../storage";
import { getBookById } from "../bible-data/books";
import { getMelPreferences, getMelStatus } from "./mel";
import { MEL_TIME_ZONE, melDate } from "./mel-calendar";
import { devotionalRoutineAt, type DevotionalMoment } from "@shared/devotional";
import { getDevotionalMoment } from "./devotional-moments";
import { userBiblePreferences } from "@shared/schema";

type PushPlatform = "android" | "ios";
type PushPayload = {
  title: string;
  body: string;
  destination: PushDestination;
};
type FirebasePushMessage = {
  token: string;
  payload: PushPayload;
  userId: string;
};

const PUSH_APP_NAME = "mel-native-push";
const PUSH_CHANNEL_ID = "mel-reminders";
const BATCH_SIZE = 500;
const sentClaimWarnings = new Set<string>();
let firebaseApp: App | null = null;
let firebaseConfigured = false;
let firebaseConfigurationChecked = false;

function warnOnce(category: string, message: string): void {
  if (sentClaimWarnings.has(category)) return;
  sentClaimWarnings.add(category);
  console.warn(message);
}

function getFirebaseApp(): App | null {
  if (firebaseConfigurationChecked) return firebaseApp;
  firebaseConfigurationChecked = true;

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) {
    warnOnce("missing-secret", "[Push] FIREBASE_SERVICE_ACCOUNT ausente; notificações push desativadas.");
    return null;
  }

  try {
    const serviceAccount: unknown = JSON.parse(raw);
    if (!serviceAccount || typeof serviceAccount !== "object") throw new Error("invalid");
    const account = serviceAccount as Record<string, unknown>;
    if (
      typeof account.project_id !== "string" || !account.project_id.trim() ||
      typeof account.client_email !== "string" || !account.client_email.trim() ||
      typeof account.private_key !== "string" || !account.private_key.includes("PRIVATE KEY")
    ) throw new Error("invalid");

    firebaseApp = getApps().find((app) => app.name === PUSH_APP_NAME) ?? initializeApp({
      credential: cert({
        projectId: account.project_id,
        clientEmail: account.client_email,
        privateKey: account.private_key.replace(/\\n/g, "\n"),
      }),
      projectId: account.project_id,
    }, PUSH_APP_NAME);
    firebaseConfigured = true;
    return firebaseApp;
  } catch {
    warnOnce("invalid-secret", "[Push] FIREBASE_SERVICE_ACCOUNT inválido; notificações push desativadas.");
    return null;
  }
}

export function isPushConfigured(): boolean {
  return !!getFirebaseApp() && firebaseConfigured;
}

export function isMissingPushSchemaError(error: unknown): boolean {
  const seen = new Set<unknown>();
  let current: unknown = error;
  while (current && typeof current === "object" && !seen.has(current)) {
    seen.add(current);
    const candidate = current as { code?: unknown; cause?: unknown };
    if (candidate.code === "42P01" || candidate.code === "42703") return true;
    current = candidate.cause;
  }
  return false;
}

export function reportPushStorageError(error: unknown, action: string): void {
  if (isMissingPushSchemaError(error)) {
    warnOnce("missing-schema", "[Push] Banco sem as tabelas push; aplique a migração 0003 para ativar notificações.");
  } else {
    warnOnce("storage-error", `[Push] ${action} indisponível; notificações não foram processadas.`);
  }
}

function firebaseErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== "object") return undefined;
  const code = (error as { code?: unknown }).code;
  return typeof code === "string" && /^messaging\/[a-z-]+$/.test(code) ? code : undefined;
}

export function isInvalidFcmTokenError(error: unknown): boolean {
  const code = firebaseErrorCode(error);
  return code === "messaging/registration-token-not-registered" ||
    code === "messaging/invalid-registration-token";
}

function makeMessage(input: FirebasePushMessage): Message {
  return {
    token: input.token,
    notification: { title: input.payload.title, body: input.payload.body },
    data: {
      destination: JSON.stringify(input.payload.destination),
      userId: input.userId,
    },
    android: {
      priority: "high",
      notification: {
        channelId: PUSH_CHANNEL_ID,
        sound: "default",
      },
    },
    apns: {
      payload: { aps: { sound: "default" } },
    },
  };
}

async function removeInvalidTokens(tokens: string[]): Promise<void> {
  if (tokens.length === 0) return;
  await db.delete(pushTokens).where(inArray(pushTokens.token, tokens));
}

export async function sendPushMessages(messages: FirebasePushMessage[]): Promise<{
  configured: boolean;
  sent: number;
  failed: number;
  invalidTokensRemoved: number;
}> {
  const app = getFirebaseApp();
  if (!app || messages.length === 0) {
    return { configured: !!app, sent: 0, failed: 0, invalidTokensRemoved: 0 };
  }

  let sent = 0;
  let failed = 0;
  const invalidTokens: string[] = [];
  const successfulTokens = new Set<string>();
  const messaging = getMessaging(app);
  for (let offset = 0; offset < messages.length; offset += BATCH_SIZE) {
    const chunk = messages.slice(offset, offset + BATCH_SIZE);
    try {
      const response = await messaging.sendEach(chunk.map(makeMessage));
      response.responses.forEach((result, index) => {
        if (result.success) {
          sent++;
          successfulTokens.add(chunk[index].token);
        }
        else {
          failed++;
          if (isInvalidFcmTokenError(result.error)) invalidTokens.push(chunk[index].token);
        }
      });
    } catch {
      warnOnce("send-error", "[Push] O Firebase não concluiu o envio; a falha foi registrada sem dados sensíveis.");
      failed += messages.length - sent - failed;
      break;
    }
  }

  try {
    await removeInvalidTokens(invalidTokens);
    const activeTokens = Array.from(successfulTokens);
    if (activeTokens.length > 0) {
      await db.update(pushTokens)
        .set({ lastUsedAt: new Date() })
        .where(inArray(pushTokens.token, activeTokens));
    }
  } catch (error) {
    reportPushStorageError(error, "A atualização dos dispositivos");
  }
  return { configured: true, sent, failed, invalidTokensRemoved: invalidTokens.length };
}

function timeInSaoPaulo(now: Date): { date: string; minuteOfDay: number } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: MEL_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "0";
  return {
    date: melDate(now),
    minuteOfDay: Number(get("hour")) * 60 + Number(get("minute")),
  };
}

export function getMelReminderMinute(preferences: Pick<MelPreferences, "reminderPeriod" | "reminderTime">): number | null {
  if (preferences.reminderPeriod === "morning") return 7 * 60;
  if (preferences.reminderPeriod === "afternoon") return 14 * 60;
  if (preferences.reminderPeriod === "evening") return 19 * 60;
  if (preferences.reminderPeriod === "exact" && preferences.reminderTime) {
    const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(preferences.reminderTime);
    return match ? Number(match[1]) * 60 + Number(match[2]) : null;
  }
  return null;
}

/** Quarter-hour catch-up window; e.g. a 07:00 reminder remains due through 07:14. */
export function isMelReminderDue(
  preferences: Pick<MelPreferences, "reminderPeriod" | "reminderTime">,
  now: Date,
): boolean {
  const desiredMinute = getMelReminderMinute(preferences);
  if (desiredMinute === null) return false;
  const currentMinute = timeInSaoPaulo(now).minuteOfDay;
  return currentMinute >= desiredMinute && currentMinute < desiredMinute + 15;
}

export function shouldSkipCompletedMelReminder(status: Pick<MelStatus, "completedToday">): boolean {
  return status.completedToday;
}

export function buildDevotionalReminder(moment: Pick<DevotionalMoment, "date" | "routine" | "title" | "verse">): PushPayload {
  const preview = moment.verse.text.length > 160 ? `${moment.verse.text.slice(0, 157)}…` : moment.verse.text;
  return {
    title: moment.routine === "manha" ? "Bom Dia com Deus" : "Boa Noite com Deus",
    body: `${moment.title} · ${moment.verse.reference}: ${preview}`,
    destination: { kind: "devotional", devotionalDate: moment.date },
  };
}

export function buildMelReminder(status: Pick<MelStatus, "position" | "streak" | "lastActivityDate" | "today">): PushPayload {
  const position = status.position;
  if (position?.kind === "bible" && isPushBibleBookId(position.book)) {
    const book = getBookById(position.book);
    return {
      title: "Vamos continuar juntas? 💛",
      body: `Você parou em ${book?.name ?? "sua leitura"} ${position.chapter}. Quando puder, seguimos.`,
      destination: {
        kind: "bible",
        book: position.book,
        chapter: position.chapter,
        verse: position.verse,
        versionCode: position.versionCode,
      },
    };
  }
  if (position?.kind === "lesson" && isPushTrackLevel(position.trackLevel)) {
    return {
      title: "A Mel está com você 💛",
      body: "Sua aula está te esperando. Vamos retomar no seu tempo?",
      destination: {
        kind: "lesson",
        lessonId: position.lessonId,
        moduleId: position.moduleId,
        trackLevel: position.trackLevel,
      },
    };
  }
  if (position?.kind === "devotional") {
    return {
      title: "A Mel está com você 💛",
      body: "Seu devocional continua te esperando. Vamos juntas?",
      destination: { kind: "devotional", devotionalDate: position.devotionalDate },
    };
  }
  const streakAtRisk = status.streak > 0 && status.lastActivityDate !== status.today;
  return {
    title: streakAtRisk ? "A Mel está com você 💛" : "Um carinho da Mel 💛",
    body: streakAtRisk
      ? `Sua caminhada de ${status.streak} dia${status.streak === 1 ? "" : "s"} merece carinho. Vamos retomar?`
      : "A Mel separou o Salmo de hoje pra você. Vamos ler juntas?",
    destination: { kind: "devotional", devotionalDate: status.today },
  };
}

export async function claimMelReminderForDay(userId: string, localDate: string): Promise<boolean> {
  const claimed = await db.insert(pushNotificationClaims)
    .values({ userId, localDate })
    .onConflictDoNothing({
      target: [pushNotificationClaims.userId, pushNotificationClaims.localDate],
    })
    .returning({ userId: pushNotificationClaims.userId });
  return claimed.length > 0;
}

export async function runMelPushReminders(now = new Date()): Promise<{
  configured: boolean;
  considered: number;
  sent: number;
  skippedCompleted: number;
  claimed: number;
}> {
  if (!isPushConfigured()) return { configured: false, considered: 0, sent: 0, skippedCompleted: 0, claimed: 0 };

  const { date } = timeInSaoPaulo(now);
  try {
    const registrations = await db.selectDistinct({ userId: pushTokens.userId }).from(pushTokens);
    const ready: string[] = [];
    for (const registration of registrations) {
      const preferences = await getMelPreferences(registration.userId);
      if (isMelReminderDue(preferences, now)) ready.push(registration.userId);
    }

    let sent = 0;
    let skippedCompleted = 0;
    let claimedCount = 0;
    for (let offset = 0; offset < ready.length; offset += 20) {
      const group = ready.slice(offset, offset + 20);
      await Promise.all(group.map(async (userId) => {
        try {
          const status = await getMelStatus(userId, now);
          if (shouldSkipCompletedMelReminder(status)) {
            skippedCompleted++;
            return;
          }
          const [biblePreference] = await db.select({ version: userBiblePreferences.lastViewedVersionCode })
            .from(userBiblePreferences).where(eq(userBiblePreferences.userId, userId)).limit(1);
          const moment = await getDevotionalMoment(date, devotionalRoutineAt(now), biblePreference?.version ?? "ACF");
          const payload = buildDevotionalReminder(moment);
          // Never reserve a day's claim while Firebase is unavailable.
          if (!(await claimMelReminderForDay(userId, date))) return;
          claimedCount++;
          const tokens = await db.select({ token: pushTokens.token }).from(pushTokens)
            .where(eq(pushTokens.userId, userId));
          if (tokens.length === 0) return;
          const result = await sendPushMessages(tokens.map(({ token }) => ({ token, userId, payload })));
          sent += result.sent;
        } catch (error) {
          reportPushStorageError(error, "O lembrete da Mel");
        }
      }));
    }
    return {
      configured: true,
      considered: registrations.length,
      sent,
      skippedCompleted,
      claimed: claimedCount,
    };
  } catch (error) {
    reportPushStorageError(error, "O agendador de lembretes");
    return { configured: true, considered: 0, sent: 0, skippedCompleted: 0, claimed: 0 };
  }
}

export async function getPushPlatformStats(): Promise<{ android: number; ios: number; total: number; configured: boolean }> {
  try {
    const counts = await db.select({ platform: pushTokens.platform, count: sql<number>`count(*)::int` })
      .from(pushTokens)
      .groupBy(pushTokens.platform);
    const android = Number(counts.find((row) => row.platform === "android")?.count ?? 0);
    const ios = Number(counts.find((row) => row.platform === "ios")?.count ?? 0);
    return { android, ios, total: android + ios, configured: isPushConfigured() };
  } catch (error) {
    reportPushStorageError(error, "As estatísticas push");
    return { android: 0, ios: 0, total: 0, configured: false };
  }
}

export async function registerPushToken(userId: string, token: string, platform: PushPlatform): Promise<void> {
  await db.insert(pushTokens).values({ userId, token, platform, lastUsedAt: new Date() })
    .onConflictDoUpdate({
      target: pushTokens.token,
      set: { userId, platform, lastUsedAt: new Date() },
    });
}

export async function removePushToken(userId: string, token: string): Promise<void> {
  await db.delete(pushTokens).where(and(eq(pushTokens.userId, userId), eq(pushTokens.token, token)));
}

export async function getUserPushMessages(userId: string, payload: PushPayload): Promise<FirebasePushMessage[]> {
  const registrations = await db.select({ token: pushTokens.token }).from(pushTokens)
    .where(eq(pushTokens.userId, userId));
  return registrations.map(({ token }) => ({ token, userId, payload }));
}

export async function getCampaignPushMessages(audience: "all" | "free" | "paid", payload: PushPayload): Promise<FirebasePushMessage[]> {
  const registrations = await db.select({ token: pushTokens.token, userId: pushTokens.userId }).from(pushTokens);
  const messages: FirebasePushMessage[] = [];
  const paidByUser = new Map<string, boolean>();
  for (const registration of registrations) {
    if (audience !== "all") {
      let paid = paidByUser.get(registration.userId);
      if (paid === undefined) {
        const [premium, gold, lifetime] = await Promise.all([
          storage.hasActiveSubscription(registration.userId, "premium"),
          storage.hasActiveSubscription(registration.userId, "gold"),
          storage.hasActiveSubscription(registration.userId, "strong_lifetime"),
        ]);
        paid = premium || gold || lifetime;
        paidByUser.set(registration.userId, paid);
      }
      if ((audience === "paid") !== paid) continue;
    }
    messages.push({ token: registration.token, userId: registration.userId, payload });
  }
  return messages;
}

export function schedulerSecretIsValid(supplied: string | undefined, expected = process.env.PUSH_SCHEDULER_SECRET): boolean {
  if (!supplied || !expected) return false;
  const suppliedHash = createHash("sha256").update(supplied).digest();
  const expectedHash = createHash("sha256").update(expected).digest();
  return timingSafeEqual(suppliedHash, expectedHash);
}