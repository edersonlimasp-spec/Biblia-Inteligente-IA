import { and, eq } from 'drizzle-orm';
import { db } from '../db';
import { paymentReceipts, users } from '@shared/schema';
import { APPLE_PRODUCT_MAP } from './apple-products';

type DbExecutor = typeof db | any;

export type AppleFinancialTransaction = {
  transactionId: string;
  originalTransactionId: string;
  productId: string;
  purchaseDate: Date;
  originalPurchaseDate?: Date | null;
  priceMilliunits?: number | null;
  currency?: string | null;
  environment?: string | null;
  transactionReason?: string | null;
};

export type AppleReceiptResult = {
  created: boolean;
  receiptId?: string;
  grossAmount: number;
  feeAmount: number;
  netAmount: number;
  feeRateBps: number;
  isTest: boolean;
};

function configuredPercent(name: string, fallback: number): number {
  const parsed = Number(process.env[name]);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) return fallback;
  return parsed;
}

export function getAppleCommissionRateBps(
  purchaseDate: Date,
  originalPurchaseDate?: Date | null,
): number {
  const firstYearPercent = configuredPercent('APPLE_COMMISSION_FIRST_YEAR_PERCENT', 30);
  const afterYearPercent = configuredPercent('APPLE_COMMISSION_AFTER_YEAR_PERCENT', 15);
  const origin = originalPurchaseDate && !Number.isNaN(originalPurchaseDate.getTime())
    ? originalPurchaseDate
    : purchaseDate;
  const subscriberAgeMs = Math.max(0, purchaseDate.getTime() - origin.getTime());
  const percent = subscriberAgeMs >= 365 * 86_400_000 ? afterYearPercent : firstYearPercent;
  return Math.round(percent * 100);
}

export function applePriceToCents(
  productId: string,
  priceMilliunits?: number | null,
): { cents: number; source: 'apple' | 'catalog' } {
  if (Number.isFinite(priceMilliunits) && Number(priceMilliunits) >= 0) {
    // App Store Server API prices are expressed in milliunits. One currency
    // cent equals 10 milliunits for standard two-decimal currencies.
    return { cents: Math.round(Number(priceMilliunits) / 10), source: 'apple' };
  }
  const product = APPLE_PRODUCT_MAP[productId];
  if (!product) throw new Error(`Unknown Apple product: ${productId}`);
  return { cents: Math.round(Number(product.amount) * 100), source: 'catalog' };
}

export function isAppleSandbox(environment?: string | null): boolean {
  return String(environment || '').toLowerCase() !== 'production';
}

export function isFinanciallyCountableSubscription(subscription: {
  source?: string | null;
  storeEnvironment?: string | null;
  storeCurrency?: string | null;
}): boolean {
  return subscription.source !== 'apple' || (
    subscription.storeEnvironment === 'Production' &&
    subscription.storeCurrency?.toUpperCase() === 'BRL'
  );
}

export async function createAppleFinancialReceipt(args: {
  executor?: DbExecutor;
  userId: string;
  userEmail?: string | null;
  subscriptionId: string;
  transaction: AppleFinancialTransaction;
  origin: 'api' | 'webhook' | 'backfill' | 'reconciliation';
  isRenewal?: boolean;
  status?: 'approved' | 'refunded' | 'refund_reversed';
  externalPaymentId?: string;
  originalExternalPaymentId?: string | null;
  notificationUuid?: string | null;
  grossAmountOverride?: number;
  metadata?: Record<string, unknown>;
}): Promise<AppleReceiptResult> {
  const executor = args.executor || db;
  const externalPaymentId = args.externalPaymentId || args.transaction.transactionId;
  const product = APPLE_PRODUCT_MAP[args.transaction.productId];
  if (!product) throw new Error(`Unknown Apple product: ${args.transaction.productId}`);

  const catalogPrice = applePriceToCents(
    args.transaction.productId,
    args.transaction.priceMilliunits,
  );
  const grossAmount = args.grossAmountOverride ?? catalogPrice.cents;
  const feeRateBps = getAppleCommissionRateBps(
    args.transaction.purchaseDate,
    args.transaction.originalPurchaseDate,
  );
  const feeAmount = Math.round(grossAmount * feeRateBps / 10_000);
  const netAmount = grossAmount - feeAmount;
  const isTest = isAppleSandbox(args.transaction.environment);
  const confirmedCurrency = args.transaction.currency?.trim();
  const currency = (confirmedCurrency || 'BRL').toUpperCase();
  const financiallyExcluded = isTest || !confirmedCurrency || currency !== 'BRL';
  const financialExclusionReason = isTest
    ? 'apple_sandbox'
    : !confirmedCurrency
      ? 'unconfirmed_currency'
    : currency !== 'BRL'
      ? `unsupported_currency_${currency}`
      : null;
  // Only Apple-provided lifecycle metadata is authoritative. A different
  // transaction ID can also represent an upgrade/downgrade in the same family.
  const isRenewal = args.isRenewal ?? args.transaction.transactionReason === 'RENEWAL';
  const receiptMetadata = {
    source: args.origin,
    environment: args.transaction.environment || 'unknown',
    originalTransactionId: args.transaction.originalTransactionId,
    transactionReason: args.transaction.transactionReason || null,
    notificationUuid: args.notificationUuid || null,
    grossAmountSource: args.grossAmountOverride === undefined ? catalogPrice.source : 'referenced_transaction',
    commissionEstimated: true,
    ...(args.metadata || {}),
  };
  const [existing] = await executor.select({
    id: paymentReceipts.id,
    userId: paymentReceipts.userId,
  }).from(paymentReceipts).where(and(
    eq(paymentReceipts.paymentProvider, 'apple'),
    eq(paymentReceipts.externalPaymentId, externalPaymentId),
  )).limit(1);

  if (existing) {
    if (existing.userId && existing.userId !== args.userId) {
      throw new Error('Apple transaction already linked to another account');
    }
    // Backfill and reconciliation must enrich legacy rows rather than silently
    // skipping them just because the transaction ID already exists.
    await executor.update(paymentReceipts).set({
      paymentType: product.durationDays ? 'subscription' : 'payment',
      planType: product.planType,
      subscriptionDays: product.durationDays,
      isLifetime: !product.durationDays,
      grossAmount,
      feeAmount,
      taxAmount: 0,
      netAmount,
      currency,
      feeRateBps,
      netAmountEstimated: true,
      isRenewal,
      isTest,
      financiallyExcluded,
      financialExclusionReason,
      originalExternalPaymentId: args.originalExternalPaymentId || null,
      status: args.status || 'approved',
      providerRawData: receiptMetadata,
      isValidated: true,
      validatedAt: new Date(),
      subscriptionId: args.subscriptionId,
      paymentDate: args.transaction.purchaseDate,
      processedAt: new Date(),
    }).where(eq(paymentReceipts.id, existing.id));
    return {
      created: false,
      receiptId: existing.id,
      grossAmount,
      feeAmount,
      netAmount,
      feeRateBps,
      isTest,
    };
  }

  let userEmail = args.userEmail;
  if (userEmail === undefined) {
    const [user] = await executor.select({ email: users.email })
      .from(users)
      .where(eq(users.id, args.userId))
      .limit(1);
    userEmail = user?.email || null;
  }

  const [created] = await executor.insert(paymentReceipts).values({
    externalPaymentId,
    paymentProvider: 'apple',
    paymentType: product.durationDays ? 'subscription' : 'payment',
    userId: args.userId,
    userEmail,
    planType: product.planType,
    subscriptionDays: product.durationDays,
    isLifetime: !product.durationDays,
    grossAmount,
    feeAmount,
    taxAmount: 0,
    netAmount,
    currency,
    feeRateBps,
    netAmountEstimated: true,
    isRenewal,
    isTest,
    financiallyExcluded,
    financialExclusionReason,
    originalExternalPaymentId: args.originalExternalPaymentId || null,
    status: args.status || 'approved',
    origin: args.origin,
    providerRawData: receiptMetadata,
    isValidated: true,
    validatedAt: new Date(),
    subscriptionId: args.subscriptionId,
    activatedAt: args.status === 'refunded' ? null : new Date(),
    paymentDate: args.transaction.purchaseDate,
    processedAt: new Date(),
  }).onConflictDoNothing().returning({ id: paymentReceipts.id });

  if (!created) {
    const [raced] = await executor.select({ id: paymentReceipts.id })
      .from(paymentReceipts)
      .where(and(
        eq(paymentReceipts.paymentProvider, 'apple'),
        eq(paymentReceipts.externalPaymentId, externalPaymentId),
      ))
      .limit(1);
    return {
      created: false,
      receiptId: raced?.id,
      grossAmount,
      feeAmount,
      netAmount,
      feeRateBps,
      isTest,
    };
  }

  return {
    created: true,
    receiptId: created.id,
    grossAmount,
    feeAmount,
    netAmount,
    feeRateBps,
    isTest,
  };
}