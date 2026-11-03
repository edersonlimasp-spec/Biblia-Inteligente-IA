/**
 * Teste grátis de 7 dias do Premium Anual (oferta introdutória das lojas).
 *
 * Nov/2026: a degustação automática deixou de existir. O usuário entra no
 * plano gratuito e, se quiser, aceita o convite para testar o Premium por 7
 * dias. O teste é uma oferta introdutória configurada na App Store e no
 * Google Play no produto Premium Anual: a loja não cobra nada nos 7 dias e,
 * se o usuário não cancelar, a assinatura anual começa automaticamente.
 *
 * Não há coluna nova no banco: um teste é reconhecido pela própria forma da
 * assinatura gravada a partir da loja — Premium Anual cujo período atual dura
 * no máximo 10 dias (o anual pago dura ~365). Quando a loja renova, o endDate
 * avança um ano e a assinatura deixa de ser "teste" sozinha.
 */
import { and, eq, inArray, desc } from "drizzle-orm";
import { db } from "../db";
import { subscriptions } from "@shared/schema";

export const STORE_SOURCES = ["apple", "google"] as const;
export const STORE_TRIAL_MAX_DAYS = 10;
const DAY_MS = 86_400_000;

const ACTIVE_STATUSES = new Set([
  "active", "Active", "ACTIVE",
  "approved", "Approved", "APPROVED",
  "authorized", "Authorized", "AUTHORIZED",
]);

type SubscriptionShape = {
  planType: string;
  source: string;
  status: string;
  startDate: Date | string;
  endDate: Date | string | null;
  autoRenewStatus?: string | null;
  cancellationAt?: Date | string | null;
};

type ReceiptShape = {
  subscriptionId?: string | null;
  paymentProvider: string;
  planType: string;
  grossAmount: number;
  isTest?: boolean | null;
  financiallyExcluded?: boolean | null;
  status: string;
};

export function isStoreSource(source: string | null | undefined): boolean {
  return source === "apple" || source === "google";
}

/** Período atual é um teste grátis da loja (Premium Anual com ≤ 10 dias). */
export function isStoreTrialSubscription(s: SubscriptionShape): boolean {
  if (s.planType !== "premium_anual" || !isStoreSource(s.source) || !s.endDate) return false;
  const start = new Date(s.startDate).getTime();
  const end = new Date(s.endDate).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end)) return false;
  return end - start <= STORE_TRIAL_MAX_DAYS * DAY_MS;
}

export function isActiveSubscription(s: SubscriptionShape, now = new Date()): boolean {
  if (!ACTIVE_STATUSES.has(s.status)) return false;
  if (s.planType === "strong_lifetime") return true;
  return !!s.endDate && new Date(s.endDate) >= now;
}

/** Renovação automática ligada (a loja vai cobrar no fim do período). */
export function willAutoRenew(s: SubscriptionShape): boolean {
  return s.autoRenewStatus !== "disabled" && !s.cancellationAt;
}

export type StoreTrialStats = {
  /** Em teste agora. */
  active: number;
  /** Em teste, mas já desligaram a renovação (não vão virar anual). */
  canceling: number;
  /** Testes iniciados desde o lançamento. */
  started: number;
  /** Testes que viraram assinatura anual paga. */
  converted: number;
  /** Conversão teste → anual (%) entre os testes que já terminaram. */
  conversionRate: number;
};

/**
 * Estatísticas do teste grátis. Usa os recibos das lojas: o início do teste
 * gera um recibo de R$ 0 (Apple informa preço 0; no Google, paymentState=2),
 * e a conversão gera um recibo pago na mesma assinatura.
 */
export function computeStoreTrialStats(
  subs: Array<SubscriptionShape & { id: string }>,
  receipts: ReceiptShape[],
  now = new Date(),
): StoreTrialStats {
  const activeTrials = subs.filter((s) => isActiveSubscription(s, now) && isStoreTrialSubscription(s));
  const valid = receipts.filter((r) =>
    !r.isTest && !r.financiallyExcluded && r.planType === "premium_anual" &&
    isStoreSource(r.paymentProvider) && String(r.status).toLowerCase() === "approved" && r.subscriptionId,
  );
  const trialSubIds = new Set(valid.filter((r) => r.grossAmount === 0).map((r) => r.subscriptionId as string));
  const paidSubIds = new Set(valid.filter((r) => r.grossAmount > 0).map((r) => r.subscriptionId as string));
  for (const s of activeTrials) trialSubIds.add(s.id);

  let converted = 0;
  for (const id of Array.from(trialSubIds)) if (paidSubIds.has(id)) converted++;
  const activeIds = new Set(activeTrials.map((s) => s.id));
  const finished = Array.from(trialSubIds).filter((id) => !activeIds.has(id)).length;

  return {
    active: activeTrials.length,
    canceling: activeTrials.filter((s) => !willAutoRenew(s)).length,
    started: trialSubIds.size,
    converted,
    conversionRate: finished > 0 ? Math.round((converted / finished) * 1000) / 10 : 0,
  };
}

export type StoreSubscriptionSummary = {
  planType: string;
  source: "apple" | "google";
  endDate: string | null;
  inTrial: boolean;
  autoRenew: boolean;
  /** Só Google: necessário para trocar de anual para mensal sem cobrança dupla. */
  purchaseToken: string | null;
};

/** Assinatura recorrente ativa do usuário vinda da loja informada. */
export async function getStoreSubscriptionSummary(
  userId: string,
  source: "apple" | "google",
): Promise<StoreSubscriptionSummary | null> {
  const rows = await db.select().from(subscriptions)
    .where(and(
      eq(subscriptions.userId, userId),
      eq(subscriptions.source, source),
      inArray(subscriptions.planType, ["premium", "premium_anual", "gold", "gold_anual"]),
    ))
    .orderBy(desc(subscriptions.endDate))
    .limit(5);
  const now = new Date();
  const active = rows.find((s) => isActiveSubscription(s, now));
  if (!active) return null;
  return {
    planType: active.planType,
    source,
    endDate: active.endDate ? new Date(active.endDate).toISOString() : null,
    inTrial: isStoreTrialSubscription(active),
    autoRenew: willAutoRenew(active),
    purchaseToken: source === "google" ? active.storePurchaseToken || null : null,
  };
}

/**
 * Pode receber o convite de teste: nunca teve assinatura recorrente pelas
 * lojas. A loja tem a palavra final (Apple ID / conta Google), mas isso evita
 * convidar quem já assinou antes.
 */
export async function isStoreTrialEligible(userId: string): Promise<boolean> {
  const rows = await db.select({ id: subscriptions.id }).from(subscriptions)
    .where(and(
      eq(subscriptions.userId, userId),
      inArray(subscriptions.source, [...STORE_SOURCES]),
      inArray(subscriptions.planType, ["premium", "premium_anual", "gold", "gold_anual"]),
    ))
    .limit(1);
  return rows.length === 0;
}
