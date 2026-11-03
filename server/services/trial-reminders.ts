/**
 * Lembrete honesto do fim do teste grátis (≈ dia 5 de 7).
 *
 * Avisa por push quem está no teste do Premium Anual com renovação ligada,
 * dizendo quando e quanto será cobrado e como trocar para o mensal ou
 * cancelar. Um aviso por assinatura (claim durável em push_notification_claims).
 */
import { and, eq, gte, inArray, lte } from "drizzle-orm";
import { db } from "../db";
import { pushNotificationClaims, subscriptions } from "@shared/schema";
import { isStoreTrialSubscription, willAutoRenew } from "../payments/store-trial";
import { getUserPushMessages, isPushConfigured, sendPushMessages } from "./push";

const HOUR_MS = 3_600_000;
const ANNUAL_PRICE_LABEL = "R$ 129,90";

function formatDateBR(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit" }).format(date);
}

async function claimTrialReminder(userId: string, subscriptionId: string): Promise<boolean> {
  const claimed = await db.insert(pushNotificationClaims)
    .values({ userId, localDate: `trial-end:${subscriptionId}` })
    .onConflictDoNothing({ target: [pushNotificationClaims.userId, pushNotificationClaims.localDate] })
    .returning({ userId: pushNotificationClaims.userId });
  return claimed.length > 0;
}

export async function runTrialEndingReminders(now = new Date()): Promise<{ checked: number; sent: number }> {
  if (!isPushConfigured()) return { checked: 0, sent: 0 };
  // Janela: termina entre 24h e 60h a partir de agora (≈ dia 5 do teste).
  const from = new Date(now.getTime() + 24 * HOUR_MS);
  const to = new Date(now.getTime() + 60 * HOUR_MS);
  const rows = await db.select().from(subscriptions).where(and(
    eq(subscriptions.planType, "premium_anual"),
    inArray(subscriptions.source, ["apple", "google"]),
    gte(subscriptions.endDate, from),
    lte(subscriptions.endDate, to),
  ));

  let sent = 0;
  const candidates = rows.filter((s) =>
    String(s.status).toLowerCase() === "active" && isStoreTrialSubscription(s) && willAutoRenew(s),
  );
  for (const sub of candidates) {
    try {
      if (!await claimTrialReminder(sub.userId, sub.id)) continue;
      const endDate = new Date(sub.endDate as Date);
      const store = sub.source === "apple" ? "App Store" : "Google Play";
      const messages = await getUserPushMessages(sub.userId, {
        title: "Seu teste Premium termina em 2 dias",
        body: `Em ${formatDateBR(endDate)} começa a assinatura anual de ${ANNUAL_PRICE_LABEL}. Prefere o mensal ou cancelar? Toque aqui ou vá em Assinaturas na ${store}.`,
        destination: { kind: "subscriptions" },
      });
      if (messages.length === 0) continue;
      const result = await sendPushMessages(messages);
      sent += result.sent;
    } catch (error) {
      console.warn("[Trial reminder] falha ao avisar assinatura", sub.id, error);
    }
  }
  return { checked: candidates.length, sent };
}
