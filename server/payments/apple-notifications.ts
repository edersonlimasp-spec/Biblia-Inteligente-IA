import crypto from 'crypto';
import {
  AppStoreServerAPIClient,
  Environment,
  GetTransactionHistoryVersion,
  SignedDataVerifier,
  type JWSRenewalInfoDecodedPayload,
  type JWSTransactionDecodedPayload,
  type ResponseBodyV2DecodedPayload,
} from '@apple/app-store-server-library';
import { and, desc, eq, gte, inArray, isNotNull, isNull, lt, lte, or, sql } from 'drizzle-orm';
import { db } from '../db';
import {
  appleNotificationEvents,
  paymentReceipts,
  subscriptions,
} from '@shared/schema';
import { APPLE_PRODUCT_MAP } from './apple-products';
import {
  createAppleFinancialReceipt,
  isAppleSandbox,
  type AppleFinancialTransaction,
} from './apple-finance';

// Apple Root CA - G3. SignedDataVerifier validates the complete x5c chain from
// each JWS against this trusted root and performs online revocation checks.
const APPLE_ROOT_CA_G3_DER = Buffer.from(
  'MIICQzCCAcmgAwIBAgIILcX8iNLFS5UwCgYIKoZIzj0EAwMwZzEbMBkGA1UEAwwSQXBwbGUgUm9vdCBDQSAtIEczMSYwJAYDVQQLDB1BcHBsZSBDZXJ0aWZpY2F0aW9uIEF1dGhvcml0eTETMBEGA1UECgwKQXBwbGUgSW5jLjELMAkGA1UEBhMCVVMwHhcNMTQwNDMwMTgxOTA2WhcNMzkwNDMwMTgxOTA2WjBnMRswGQYDVQQDDBJBcHBsZSBSb290IENBIC0gRzMxJjAkBgNVBAsMHUFwcGxlIENlcnRpZmljYXRpb24gQXV0aG9yaXR5MRMwEQYDVQQKDApBcHBsZSBJbmMuMQswCQYDVQQGEwJVUzB2MBAGByqGSM49AgEGBSuBBAAiA2IABJjpLz1AcqTtkyJygRMc3RCV8cWjTnHcFBbZDuWmBSp3ZHtfTjjTuxxEtX/1H7YyYl3J6YRbTzBPEVoA/VhYDKX1DyxNB0cTddqXl5dvMVztK517IDvYuVTZXpmkOlEKMaNCMEAwHQYDVR0OBBYEFLuw3qFYM4iapIqZ3r6966/ayySrMA8GA1UdEwEB/wQFMAMBAf8wDgYDVR0PAQH/BAQDAgEGMAoGCCqGSM49BAMDA2gAMGUCMQCD6cHEFl4aXTQY2e3v9GwOAEZLuN+yRhHFD/3meoyhpmvOwgPUnPWTxnS4at+qIxUCMG1mihDK1A3UT82NQz60imOlM27jbdoXt2QfyFMm+YhidDkLF1vLUagM6BgD56KyKA==',
  'base64',
);

export type VerifiedAppleNotification = {
  notification: ResponseBodyV2DecodedPayload;
  transaction: JWSTransactionDecodedPayload | null;
  renewal: JWSRenewalInfoDecodedPayload | null;
  environment: Environment;
  notificationUuid: string;
  decodedPayload: Record<string, unknown>;
};

const CHARGE_NOTIFICATION_TYPES = new Set([
  'SUBSCRIBED',
  'DID_RENEW',
  'OFFER_REDEEMED',
  'ONE_TIME_CHARGE',
]);

const ACTIONABLE_NOTIFICATION_TYPES = new Set([
  'SUBSCRIBED',
  'DID_RENEW',
  'OFFER_REDEEMED',
  'ONE_TIME_CHARGE',
  'DID_CHANGE_RENEWAL_PREF',
  'DID_CHANGE_RENEWAL_STATUS',
  'DID_FAIL_TO_RENEW',
  'EXPIRED',
  'GRACE_PERIOD_EXPIRED',
  'REFUND',
  'REVOKE',
  'RENEWAL_EXTENDED',
  'REFUND_REVERSED',
]);
const MAX_NOTIFICATION_ATTEMPTS = 12;

function bundleId(): string {
  return process.env.APPLE_BUNDLE_ID || 'com.bibliainteligente.ios';
}

function appAppleId(): number {
  const value = Number(process.env.APPLE_APP_ID);
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error('APPLE_APP_ID must be configured with the numeric App Store app ID');
  }
  return value;
}

function verifierFor(environment: Environment): SignedDataVerifier {
  return new SignedDataVerifier(
    [APPLE_ROOT_CA_G3_DER],
    true,
    environment,
    bundleId(),
    environment === Environment.PRODUCTION ? appAppleId() : undefined,
  );
}

function safeDate(value?: number | null): Date | null {
  if (!Number.isFinite(value)) return null;
  const date = new Date(Number(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

function eventEnvironment(value?: string | null): Environment {
  if (value === Environment.PRODUCTION) return Environment.PRODUCTION;
  if (value === Environment.SANDBOX) return Environment.SANDBOX;
  throw new Error(`Unsupported Apple environment: ${String(value || 'missing')}`);
}

function sanitizeDecodedPayload(
  notification: ResponseBodyV2DecodedPayload,
  transaction: JWSTransactionDecodedPayload | null,
  renewal: JWSRenewalInfoDecodedPayload | null,
): Record<string, unknown> {
  const data = notification.data ? {
    ...notification.data,
    signedTransactionInfo: undefined,
    signedRenewalInfo: undefined,
  } : undefined;
  return JSON.parse(JSON.stringify({
    notification: { ...notification, data },
    transaction,
    renewal,
  }));
}

export async function verifyAppleServerNotification(
  signedPayload: string,
): Promise<VerifiedAppleNotification> {
  if (!signedPayload || typeof signedPayload !== 'string') {
    throw new Error('signedPayload is required');
  }

  let lastError: unknown;
  for (const environment of [Environment.PRODUCTION, Environment.SANDBOX]) {
    try {
      const verifier = verifierFor(environment);
      const notification = await verifier.verifyAndDecodeNotification(signedPayload);
      const verifiedEnvironment = eventEnvironment(notification.data?.environment);
      if (verifiedEnvironment !== environment) {
        throw new Error('Verified notification environment mismatch');
      }

      const transaction = notification.data?.signedTransactionInfo
        ? await verifier.verifyAndDecodeTransaction(notification.data.signedTransactionInfo)
        : null;
      const renewal = notification.data?.signedRenewalInfo
        ? await verifier.verifyAndDecodeRenewalInfo(notification.data.signedRenewalInfo)
        : null;

      if (transaction?.environment && transaction.environment !== environment) {
        throw new Error('Transaction environment mismatch');
      }
      if (renewal?.environment && renewal.environment !== environment) {
        throw new Error('Renewal environment mismatch');
      }

      const notificationUuid = notification.notificationUUID ||
        crypto.createHash('sha256').update(signedPayload).digest('hex');
      return {
        notification,
        transaction,
        renewal,
        environment,
        notificationUuid,
        decodedPayload: sanitizeDecodedPayload(notification, transaction, renewal),
      };
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Apple JWS verification failed');
}

export async function persistVerifiedAppleNotification(
  verified: VerifiedAppleNotification,
): Promise<{ id: string; duplicate: boolean }> {
  const now = new Date();
  const [created] = await db.insert(appleNotificationEvents).values({
    notificationUuid: verified.notificationUuid,
    notificationType: String(verified.notification.notificationType || 'UNKNOWN'),
    subtype: verified.notification.subtype ? String(verified.notification.subtype) : null,
    environment: verified.environment,
    isTest: isAppleSandbox(verified.environment),
    originalTransactionId:
      verified.transaction?.originalTransactionId ||
      verified.renewal?.originalTransactionId ||
      null,
    transactionId: verified.transaction?.transactionId || null,
    productId: verified.transaction?.productId || verified.renewal?.productId || null,
    purchaseDate: safeDate(verified.transaction?.purchaseDate),
    expiresDate: safeDate(verified.transaction?.expiresDate),
    decodedPayload: verified.decodedPayload,
    processingStatus: 'pending',
  }).onConflictDoNothing().returning({ id: appleNotificationEvents.id });

  if (created) return { id: created.id, duplicate: false };

  const [duplicate] = await db.update(appleNotificationEvents).set({
    duplicateCount: sql`${appleNotificationEvents.duplicateCount} + 1`,
    lastReceivedAt: now,
  }).where(eq(appleNotificationEvents.notificationUuid, verified.notificationUuid))
    .returning({ id: appleNotificationEvents.id });
  if (!duplicate) throw new Error('Could not resolve duplicate Apple notification');
  return { id: duplicate.id, duplicate: true };
}

function decodedParts(payload: unknown): {
  notification: ResponseBodyV2DecodedPayload;
  transaction: JWSTransactionDecodedPayload | null;
  renewal: JWSRenewalInfoDecodedPayload | null;
} {
  const decoded = payload as any;
  return {
    notification: decoded?.notification || {},
    transaction: decoded?.transaction || null,
    renewal: decoded?.renewal || null,
  };
}

function transactionForFinance(
  transaction: JWSTransactionDecodedPayload,
  environment: string,
): AppleFinancialTransaction | null {
  if (!transaction.transactionId || !transaction.originalTransactionId ||
      !transaction.productId || !transaction.purchaseDate) {
    return null;
  }
  return {
    transactionId: transaction.transactionId,
    originalTransactionId: transaction.originalTransactionId,
    productId: transaction.productId,
    purchaseDate: new Date(transaction.purchaseDate),
    originalPurchaseDate: safeDate(transaction.originalPurchaseDate),
    priceMilliunits: transaction.price,
    currency: transaction.currency,
    environment,
    transactionReason: transaction.transactionReason,
  };
}

function expirationReason(intent?: number | string): string | null {
  const reasons: Record<string, string> = {
    '1': 'customer_cancelled',
    '2': 'billing_error',
    '3': 'price_increase_not_accepted',
    '4': 'product_not_available',
    '5': 'other',
  };
  return intent === undefined ? null : reasons[String(intent)] || `apple_${String(intent)}`;
}

function nextRetryAt(attemptCount: number): Date {
  const minutes = Math.min(360, Math.max(1, 2 ** Math.min(8, attemptCount - 1)));
  return new Date(Date.now() + minutes * 60_000);
}

async function createRefundReceipt(
  tx: any,
  args: {
    subscription: typeof subscriptions.$inferSelect;
    transaction: JWSTransactionDecodedPayload;
    environment: string;
    notificationUuid: string;
    eventSignedAt?: Date | null;
  },
): Promise<boolean> {
  const financialTransaction = transactionForFinance(args.transaction, args.environment);
  if (!financialTransaction) return false;
  const [originalReceipt] = await tx.select({
    grossAmount: paymentReceipts.grossAmount,
    feeRateBps: paymentReceipts.feeRateBps,
  })
    .from(paymentReceipts)
    .where(and(
      eq(paymentReceipts.paymentProvider, 'apple'),
      eq(paymentReceipts.externalPaymentId, financialTransaction.transactionId),
    ))
    .limit(1);
  const product = APPLE_PRODUCT_MAP[financialTransaction.productId];
  const fallbackGross = product ? Math.round(Number(product.amount) * 100) : 0;
  // Apple reports this percentage in milliunits: 100% is 100_000.
  const refundRatio = Number.isFinite(args.transaction.revocationPercentage)
    ? Math.max(0, Math.min(1, Number(args.transaction.revocationPercentage) / 100_000))
    : 1;
  const positiveGross = originalReceipt?.grossAmount || fallbackGross;
  const refundDate = safeDate(args.transaction.revocationDate) || new Date();
  const reversalId = `refund:${financialTransaction.transactionId}`;
  const targetGross = -Math.round(Math.abs(positiveGross) * refundRatio);
  const [existingReversal] = await tx.select({
    id: paymentReceipts.id,
    grossAmount: paymentReceipts.grossAmount,
    feeRateBps: paymentReceipts.feeRateBps,
    status: paymentReceipts.status,
    providerRawData: paymentReceipts.providerRawData,
  }).from(paymentReceipts).where(and(
    eq(paymentReceipts.paymentProvider, 'apple'),
    eq(paymentReceipts.externalPaymentId, reversalId),
  )).limit(1);

  if (existingReversal) {
    const existingStateAtRaw = (existingReversal.providerRawData as any)?.refundStateSignedAt;
    const existingStateAt = existingStateAtRaw ? new Date(existingStateAtRaw) : null;
    const incomingStateAt = args.eventSignedAt || safeDate(args.transaction.signedDate);
    if (
      existingStateAt &&
      incomingStateAt &&
      !Number.isNaN(existingStateAt.getTime()) &&
      existingStateAt > incomingStateAt
    ) {
      return false;
    }
    if (existingReversal.status === 'refund_reversed' && !incomingStateAt) return false;
    // Notifications and history can report the same refund. Keep one
    // cumulative reversal row and only expand it when Apple reports a larger
    // partial refund, so delivery order cannot double-count revenue loss.
    if (targetGross >= existingReversal.grossAmount) return false;
    const rate = existingReversal.feeRateBps || originalReceipt?.feeRateBps || 0;
    const targetFee = Math.round(targetGross * rate / 10_000);
    await tx.update(paymentReceipts).set({
      grossAmount: targetGross,
      feeAmount: targetFee,
      netAmount: targetGross - targetFee,
      paymentDate: refundDate,
      processedAt: new Date(),
      providerRawData: {
        source: 'apple_refund_reconciliation',
        originalTransactionId: financialTransaction.originalTransactionId,
        notificationUuid: args.notificationUuid,
        revocationReason: args.transaction.revocationReason || null,
        revocationType: args.transaction.revocationType || null,
        revocationPercentage: args.transaction.revocationPercentage || null,
        refundState: 'refunded',
        refundStateSignedAt: incomingStateAt?.toISOString() || null,
        commissionEstimated: true,
      },
    }).where(eq(paymentReceipts.id, existingReversal.id));
    return true;
  }

  const result = await createAppleFinancialReceipt({
    executor: tx,
    userId: args.subscription.userId,
    subscriptionId: args.subscription.id,
    transaction: { ...financialTransaction, purchaseDate: refundDate },
    externalPaymentId: reversalId,
    originalExternalPaymentId: financialTransaction.transactionId,
    notificationUuid: args.notificationUuid,
    grossAmountOverride: targetGross,
    status: 'refunded',
    origin: 'webhook',
    isRenewal: financialTransaction.transactionId !== financialTransaction.originalTransactionId,
    metadata: {
      revocationReason: args.transaction.revocationReason || null,
      revocationType: args.transaction.revocationType || null,
      revocationPercentage: args.transaction.revocationPercentage || null,
      refundState: 'refunded',
      refundStateSignedAt: (args.eventSignedAt || safeDate(args.transaction.signedDate))?.toISOString() || null,
    },
  });
  return result.created;
}

async function reverseRefundReceipt(
  tx: any,
  args: {
    subscription: typeof subscriptions.$inferSelect;
    transaction: JWSTransactionDecodedPayload;
    environment: string;
    notificationUuid: string;
    eventSignedAt?: Date | null;
  },
): Promise<boolean> {
  const financialTransaction = transactionForFinance(args.transaction, args.environment);
  if (!financialTransaction) return false;
  const reversalId = `refund:${financialTransaction.transactionId}`;
  const [existing] = await tx.select({
    grossAmount: paymentReceipts.grossAmount,
    providerRawData: paymentReceipts.providerRawData,
  }).from(paymentReceipts).where(and(
    eq(paymentReceipts.paymentProvider, 'apple'),
    eq(paymentReceipts.externalPaymentId, reversalId),
  )).limit(1);
  const incomingStateAt = args.eventSignedAt || safeDate(args.transaction.signedDate);
  const existingStateAtRaw = (existing?.providerRawData as any)?.refundStateSignedAt;
  const existingStateAt = existingStateAtRaw ? new Date(existingStateAtRaw) : null;
  if (
    existingStateAt &&
    incomingStateAt &&
    !Number.isNaN(existingStateAt.getTime()) &&
    existingStateAt > incomingStateAt
  ) {
    return false;
  }

  const result = await createAppleFinancialReceipt({
    executor: tx,
    userId: args.subscription.userId,
    subscriptionId: args.subscription.id,
    transaction: financialTransaction,
    externalPaymentId: reversalId,
    originalExternalPaymentId: financialTransaction.transactionId,
    notificationUuid: args.notificationUuid,
    grossAmountOverride: 0,
    status: 'refund_reversed',
    origin: 'webhook',
    isRenewal: financialTransaction.transactionId !== financialTransaction.originalTransactionId,
    metadata: {
      refundState: 'reversed',
      refundStateSignedAt: incomingStateAt?.toISOString() || null,
    },
  });
  return result.created || Boolean(existing && existing.grossAmount !== 0);
}

export async function processAppleNotificationEvent(eventId: string): Promise<void> {
  const [event] = await db.select().from(appleNotificationEvents)
    .where(eq(appleNotificationEvents.id, eventId)).limit(1);
  if (!event || !['pending', 'failed', 'unmatched'].includes(event.processingStatus)) return;

  const { notification, transaction, renewal } = decodedParts(event.decodedPayload);
  const type = event.notificationType;
  const now = new Date();
  const leaseExpiredAt = new Date(now.getTime() - 5 * 60_000);
  const [claimed] = await db.update(appleNotificationEvents).set({
    processingStatus: 'processing',
    processingStartedAt: now,
    processingError: null,
    attemptCount: sql`${appleNotificationEvents.attemptCount} + 1`,
  }).where(and(
    eq(appleNotificationEvents.id, event.id),
    inArray(appleNotificationEvents.processingStatus, ['pending', 'failed', 'unmatched']),
    or(
      isNull(appleNotificationEvents.processingStartedAt),
      lt(appleNotificationEvents.processingStartedAt, leaseExpiredAt),
    ),
  )).returning({
    id: appleNotificationEvents.id,
    attemptCount: appleNotificationEvents.attemptCount,
  });
  if (!claimed) return;
  const attemptCount = claimed.attemptCount || event.attemptCount + 1 || 1;

  if (event.isTest || type === 'TEST') {
    await db.update(appleNotificationEvents).set({
      processingStatus: 'test_ignored',
      processedAt: now,
      processingError: null,
      processingStartedAt: null,
    }).where(eq(appleNotificationEvents.id, event.id));
    console.log('[Apple Notifications] sandbox/test event recorded', {
      notificationUuid: event.notificationUuid,
      type,
    });
    return;
  }

  if (!ACTIONABLE_NOTIFICATION_TYPES.has(type)) {
    await db.update(appleNotificationEvents).set({
      processingStatus: 'ignored',
      processedAt: now,
      processingError: null,
      processingStartedAt: null,
    }).where(eq(appleNotificationEvents.id, event.id));
    console.log('[Apple Notifications] unknown/non-actionable event recorded', {
      notificationUuid: event.notificationUuid,
      type,
    });
    return;
  }

  const originalTransactionId =
    transaction?.originalTransactionId || renewal?.originalTransactionId;
  if (!originalTransactionId) {
    const exhausted = attemptCount >= MAX_NOTIFICATION_ATTEMPTS;
    await db.update(appleNotificationEvents).set({
      processingStatus: exhausted ? 'dead_letter' : 'unmatched',
      processingError: 'Missing original transaction identifier',
      processedAt: exhausted ? now : null,
      processingStartedAt: null,
      nextAttemptAt: nextRetryAt(attemptCount),
    }).where(eq(appleNotificationEvents.id, event.id));
    return;
  }

  try {
    await db.transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${originalTransactionId}, 0))`);
      const [subscription] = await tx.select().from(subscriptions).where(and(
        eq(subscriptions.source, 'apple'),
        eq(subscriptions.originalTransactionId, originalTransactionId),
      )).limit(1);

      if (!subscription) {
        const exhausted = attemptCount >= MAX_NOTIFICATION_ATTEMPTS;
        await tx.update(appleNotificationEvents).set({
          processingStatus: exhausted ? 'dead_letter' : 'unmatched',
          processingError: 'No user/subscription linked to original transaction',
          processedAt: exhausted ? now : null,
          processingStartedAt: null,
          nextAttemptAt: nextRetryAt(attemptCount),
        }).where(eq(appleNotificationEvents.id, event.id));
        console.warn('[Apple Notifications] no user for original transaction', {
          notificationUuid: event.notificationUuid,
          type,
        });
        return;
      }

      const productId = transaction?.productId || renewal?.productId;
      const product = productId ? APPLE_PRODUCT_MAP[productId] : undefined;
      const expiresDate = safeDate(transaction?.expiresDate);
      const graceDate = safeDate(renewal?.gracePeriodExpiresDate);
      const autoRenewEnabled = renewal?.autoRenewStatus === 1;
      const sourceSignedAt = safeDate(notification.signedDate);
      const stateCanAdvance = !subscription.storeStateSignedAt ||
        !sourceSignedAt ||
        sourceSignedAt >= subscription.storeStateSignedAt;
      const transactionIsCurrentPeriod = !transaction ||
        transaction.transactionId === subscription.storeTransactionId ||
        !subscription.endDate ||
        !expiresDate ||
        expiresDate >= subscription.endDate;
      const patch: Record<string, unknown> = {
        storeEnvironment: event.environment,
        lastVerifiedAt: now,
      };
      if (stateCanAdvance) {
        if (sourceSignedAt) patch.storeStateSignedAt = sourceSignedAt;
        if (transactionIsCurrentPeriod && transaction?.transactionId) {
          patch.storeTransactionId = transaction.transactionId;
        }
        if (transactionIsCurrentPeriod && productId) patch.storeProductId = productId;
        if (transactionIsCurrentPeriod && transaction?.currency) patch.storeCurrency = transaction.currency;
        if (transactionIsCurrentPeriod && product) {
          patch.planType = product.planType;
          patch.amount = product.amount;
        }
      }
      if (stateCanAdvance && renewal?.autoRenewStatus !== undefined) {
        patch.autoRenewStatus = autoRenewEnabled ? 'enabled' : 'disabled';
      }
      if (stateCanAdvance && renewal?.autoRenewProductId) {
        patch.autoRenewProductId = renewal.autoRenewProductId;
      }

      if (stateCanAdvance) switch (type) {
        case 'SUBSCRIBED':
        case 'DID_RENEW':
        case 'OFFER_REDEEMED':
        case 'RENEWAL_EXTENDED':
        case 'REFUND_REVERSED':
          if (transactionIsCurrentPeriod) patch.status = 'active';
          if (expiresDate && (!subscription.endDate || expiresDate > subscription.endDate)) {
            patch.endDate = expiresDate;
            patch.nextRenewalCheck = new Date(expiresDate.getTime() - 86_400_000);
          }
          patch.billingRetryActive = false;
          patch.gracePeriodExpiresAt = null;
          patch.expirationReason = null;
          patch.churnRisk = false;
          break;
        case 'DID_FAIL_TO_RENEW': {
          if (!transactionIsCurrentPeriod) break;
          const inGrace = !!graceDate && graceDate > now;
          patch.status = inGrace ? 'active' : 'billing_retry';
          patch.billingRetryActive = true;
          patch.gracePeriodExpiresAt = graceDate;
          patch.churnRisk = true;
          if (inGrace) patch.endDate = graceDate;
          break;
        }
        case 'DID_CHANGE_RENEWAL_STATUS':
          if (!autoRenewEnabled) {
            patch.cancellationAt = safeDate(notification.signedDate) || now;
            patch.churnRisk = true;
          } else {
            patch.cancellationAt = null;
            patch.churnRisk = false;
          }
          break;
        case 'DID_CHANGE_RENEWAL_PREF':
          // productId describes the currently effective transaction; the next
          // product remains available in renewal.autoRenewProductId for audit.
          break;
        case 'EXPIRED':
        case 'GRACE_PERIOD_EXPIRED':
          // Ignore an out-of-order expiry for an older period.
          if (!expiresDate || !subscription.endDate || expiresDate >= subscription.endDate) {
            patch.status = 'expired';
            patch.endDate = expiresDate || now;
            patch.billingRetryActive = false;
            patch.gracePeriodExpiresAt = null;
            patch.expirationReason = expirationReason(renewal?.expirationIntent) || type.toLowerCase();
            patch.churnRisk = false;
          }
          break;
        case 'REFUND':
        case 'REVOKE':
          if (transactionIsCurrentPeriod) {
            patch.status = type === 'REFUND' ? 'refunded' : 'revoked';
            patch.endDate = safeDate(transaction?.revocationDate) || now;
            patch.billingRetryActive = false;
            patch.gracePeriodExpiresAt = null;
            patch.expirationReason = type.toLowerCase();
            patch.churnRisk = false;
          }
          break;
      }

      await tx.update(subscriptions).set(patch).where(eq(subscriptions.id, subscription.id));

      let receiptCreated = false;
      if (transaction && CHARGE_NOTIFICATION_TYPES.has(type)) {
        const financialTransaction = transactionForFinance(transaction, event.environment);
        if (financialTransaction) {
          const receipt = await createAppleFinancialReceipt({
            executor: tx,
            userId: subscription.userId,
            subscriptionId: subscription.id,
            transaction: financialTransaction,
            origin: 'webhook',
            notificationUuid: event.notificationUuid,
            metadata: { notificationType: type, subtype: event.subtype },
          });
          receiptCreated = receipt.created;
        }
      } else if (transaction && (type === 'REFUND' || type === 'REVOKE')) {
        receiptCreated = await createRefundReceipt(tx, {
          subscription,
          transaction,
          environment: event.environment,
          notificationUuid: event.notificationUuid,
          eventSignedAt: sourceSignedAt,
        });
      } else if (transaction && type === 'REFUND_REVERSED') {
        receiptCreated = await reverseRefundReceipt(tx, {
          subscription,
          transaction,
          environment: event.environment,
          notificationUuid: event.notificationUuid,
          eventSignedAt: sourceSignedAt,
        });
      }

      await tx.update(appleNotificationEvents).set({
        processingStatus: 'processed',
        processingError: null,
        processedAt: now,
        processingStartedAt: null,
        subscriptionId: subscription.id,
        userId: subscription.userId,
      }).where(eq(appleNotificationEvents.id, event.id));
      console.log('[Apple Notifications] event processed', {
        notificationUuid: event.notificationUuid,
        type,
        receiptCreated,
      });
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown processing error';
    const exhausted = attemptCount >= MAX_NOTIFICATION_ATTEMPTS;
    await db.update(appleNotificationEvents).set({
      processingStatus: exhausted ? 'dead_letter' : 'failed',
      processingError: message.slice(0, 500),
      processedAt: exhausted ? new Date() : null,
      processingStartedAt: null,
      nextAttemptAt: nextRetryAt(attemptCount),
    }).where(eq(appleNotificationEvents.id, event.id));
    console.error('[Apple Notifications] event processing failed', {
      notificationUuid: event.notificationUuid,
      type,
      error: message,
    });
    throw error;
  }
}

export async function processPendingAppleNotifications(limit = 50): Promise<number> {
  const now = new Date();
  const leaseExpiredAt = new Date(now.getTime() - 5 * 60_000);
  const pending = await db.select({ id: appleNotificationEvents.id })
    .from(appleNotificationEvents)
    .where(and(
      inArray(appleNotificationEvents.processingStatus, ['pending', 'failed', 'unmatched']),
      lte(appleNotificationEvents.nextAttemptAt, now),
      or(
        isNull(appleNotificationEvents.processingStartedAt),
        lt(appleNotificationEvents.processingStartedAt, leaseExpiredAt),
      ),
    ))
    .orderBy(appleNotificationEvents.receivedAt)
    .limit(limit);
  for (const event of pending) {
    try {
      await processAppleNotificationEvent(event.id);
    } catch {
      // Status and safe error metadata were persisted by the processor.
    }
  }
  return pending.length;
}

export async function requeueAppleNotificationsForTransaction(
  originalTransactionId: string,
): Promise<void> {
  const requeued = await db.update(appleNotificationEvents).set({
    processingStatus: 'pending',
    processingError: null,
    processingStartedAt: null,
    nextAttemptAt: new Date(),
  }).where(and(
    eq(appleNotificationEvents.originalTransactionId, originalTransactionId),
    inArray(appleNotificationEvents.processingStatus, ['failed', 'unmatched', 'dead_letter']),
  )).returning({ id: appleNotificationEvents.id });
  for (const event of requeued) {
    await processAppleNotificationEvent(event.id);
  }
}

export function hasAppleServerApiCredentials(): boolean {
  return Boolean(
    (process.env.APPLE_PRIVATE_KEY || process.env.APPLE_IAP_PRIVATE_KEY) &&
    (process.env.APPLE_KEY_ID || process.env.APPLE_IAP_KEY_ID) &&
    (process.env.APPLE_ISSUER_ID || process.env.APPLE_IAP_ISSUER_ID),
  );
}

function serverApiClient(environment: Environment): AppStoreServerAPIClient {
  const privateKey = (process.env.APPLE_PRIVATE_KEY || process.env.APPLE_IAP_PRIVATE_KEY)
    ?.replace(/\\n/g, '\n');
  const keyId = process.env.APPLE_KEY_ID || process.env.APPLE_IAP_KEY_ID;
  const issuerId = process.env.APPLE_ISSUER_ID || process.env.APPLE_IAP_ISSUER_ID;
  if (!privateKey || !keyId || !issuerId) {
    throw new Error('Apple App Store Server API credentials are not configured');
  }
  return new AppStoreServerAPIClient(
    privateKey,
    keyId,
    issuerId,
    bundleId(),
    environment,
  );
}

async function fetchTransactionHistory(
  transactionId: string,
  environment: Environment,
): Promise<JWSTransactionDecodedPayload[]> {
  const client = serverApiClient(environment);
  const verifier = verifierFor(environment);
  const decoded: JWSTransactionDecodedPayload[] = [];
  let revision: string | null = null;
  let hasMore = true;

  while (hasMore) {
    const response = await client.getTransactionHistory(
      transactionId,
      revision,
      { sort: 'ASCENDING' as any },
      GetTransactionHistoryVersion.V2,
    );
    for (const signedTransaction of response.signedTransactions || []) {
      decoded.push(await verifier.verifyAndDecodeTransaction(signedTransaction));
    }
    revision = response.revision || null;
    hasMore = Boolean(response.hasMore);
    if (hasMore && !revision) throw new Error('Apple history pagination missing revision');
  }
  return decoded;
}

async function historyWithEnvironmentFallback(
  transactionId: string,
  preferred?: string | null,
): Promise<{ environment: Environment; transactions: JWSTransactionDecodedPayload[] }> {
  const environments = preferred === Environment.SANDBOX
    ? [Environment.SANDBOX, Environment.PRODUCTION]
    : [Environment.PRODUCTION, Environment.SANDBOX];
  let lastError: unknown;
  for (const environment of environments) {
    try {
      return {
        environment,
        transactions: await fetchTransactionHistory(transactionId, environment),
      };
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Apple history lookup failed');
}

async function persistHistoryReceipts(
  subscription: typeof subscriptions.$inferSelect,
  environment: Environment,
  transactions: JWSTransactionDecodedPayload[],
  origin: 'backfill' | 'reconciliation',
): Promise<number> {
  let created = 0;
  for (const transaction of transactions) {
    const financialTransaction = transactionForFinance(transaction, environment);
    if (!financialTransaction || !APPLE_PRODUCT_MAP[financialTransaction.productId]) continue;
    const receipt = await createAppleFinancialReceipt({
      userId: subscription.userId,
      subscriptionId: subscription.id,
      transaction: financialTransaction,
      origin,
      metadata: { importedFrom: 'app_store_server_api' },
    });
    if (receipt.created) created++;

    if (transaction.revocationDate) {
      const refundCreated = await db.transaction(tx => createRefundReceipt(tx, {
        subscription,
        transaction,
        environment,
        notificationUuid: `history-${transaction.transactionId}`,
        eventSignedAt: safeDate(transaction.signedDate),
      }));
      if (refundCreated) created++;
    }
  }
  return created;
}

export async function backfillAppleTransactions(): Promise<{
  checked: number;
  receiptsCreated: number;
  errors: number;
}> {
  if (!hasAppleServerApiCredentials()) {
    throw new Error('Apple App Store Server API credentials are not configured');
  }
  const summary = { checked: 0, receiptsCreated: 0, errors: 0 };
  const appleSubscriptions = await db.select().from(subscriptions).where(and(
    eq(subscriptions.source, 'apple'),
    isNotNull(subscriptions.originalTransactionId),
  ));

  for (const subscription of appleSubscriptions) {
    summary.checked++;
    try {
      const history = await historyWithEnvironmentFallback(
        subscription.originalTransactionId!,
        subscription.storeEnvironment,
      );
      summary.receiptsCreated += await persistHistoryReceipts(
        subscription,
        history.environment,
        history.transactions,
        'backfill',
      );
    } catch (error) {
      summary.errors++;
      console.error('[Apple Backfill] subscription failed', {
        subscriptionId: subscription.id,
        error: error instanceof Error ? error.message : 'unknown',
      });
    }
  }
  console.log('[Apple Backfill] completed', summary);
  return summary;
}

export async function reconcileAppleSubscriptionsFromServerApi(): Promise<{
  checked: number;
  renewed: number;
  expired: number;
  failed: number;
  receiptsCreated: number;
}> {
  const summary = { checked: 0, renewed: 0, expired: 0, failed: 0, receiptsCreated: 0 };
  if (!hasAppleServerApiCredentials()) return summary;

  const recentlyExpired = new Date(Date.now() - 30 * 86_400_000);
  const candidates = await db.select().from(subscriptions).where(and(
    eq(subscriptions.source, 'apple'),
    isNotNull(subscriptions.originalTransactionId),
    or(
      inArray(subscriptions.status, ['active', 'billing_retry']),
      and(eq(subscriptions.status, 'expired'), gte(subscriptions.endDate, recentlyExpired)),
    ),
  ));

  for (const subscription of candidates) {
    summary.checked++;
    try {
      const history = await historyWithEnvironmentFallback(
        subscription.originalTransactionId!,
        subscription.storeEnvironment,
      );
      summary.receiptsCreated += await persistHistoryReceipts(
        subscription,
        history.environment,
        history.transactions,
        'reconciliation',
      );
      if (history.environment === Environment.SANDBOX && process.env.NODE_ENV === 'production') {
        await db.update(subscriptions).set({
          storeEnvironment: Environment.SANDBOX,
          status: 'test',
          lastVerifiedAt: new Date(),
          expirationReason: 'sandbox_not_entitled_in_production',
        }).where(eq(subscriptions.id, subscription.id));
        continue;
      }
      const related = history.transactions
        .filter(item => item.originalTransactionId === subscription.originalTransactionId)
        .sort((a, b) => Number(a.purchaseDate || 0) - Number(b.purchaseDate || 0));
      const latest = related.at(-1);
      if (!latest?.productId || !latest.transactionId) continue;
      const product = APPLE_PRODUCT_MAP[latest.productId];
      if (!product) continue;
      const expiresDate = safeDate(latest.expiresDate);
      const isRevoked = Boolean(latest.revocationDate);
      const isActive = !isRevoked && (!product.durationDays || (!!expiresDate && expiresDate > new Date()));
      const previousEnd = subscription.endDate;

      await db.update(subscriptions).set({
        planType: product.planType,
        amount: product.amount,
        storeProductId: latest.productId,
        storeCurrency: latest.currency || subscription.storeCurrency || 'BRL',
        storeTransactionId: latest.transactionId,
        storeEnvironment: history.environment,
        endDate: product.durationDays ? expiresDate : null,
        status: isRevoked ? 'revoked' : isActive ? 'active' : 'expired',
        lastVerifiedAt: new Date(),
        nextRenewalCheck: expiresDate ? new Date(expiresDate.getTime() - 86_400_000) : null,
        billingRetryActive: false,
        gracePeriodExpiresAt: null,
        churnRisk: false,
        expirationReason: isRevoked ? 'revoked' : isActive ? null : 'server_api_expired',
      }).where(eq(subscriptions.id, subscription.id));

      if (isActive && expiresDate && (!previousEnd || expiresDate > previousEnd)) summary.renewed++;
      if (!isActive && subscription.status !== 'expired') summary.expired++;
    } catch (error) {
      summary.failed++;
      console.error('[Apple Reconciliation] subscription failed', {
        subscriptionId: subscription.id,
        error: error instanceof Error ? error.message : 'unknown',
      });
    }
  }
  console.log('[Apple Reconciliation] completed', summary);
  return summary;
}

export async function listRecentAppleNotifications(limit = 50) {
  const safeLimit = Math.min(100, Math.max(1, limit));
  return db.select({
    id: appleNotificationEvents.id,
    notificationUuid: appleNotificationEvents.notificationUuid,
    notificationType: appleNotificationEvents.notificationType,
    subtype: appleNotificationEvents.subtype,
    environment: appleNotificationEvents.environment,
    isTest: appleNotificationEvents.isTest,
    originalTransactionId: appleNotificationEvents.originalTransactionId,
    transactionId: appleNotificationEvents.transactionId,
    productId: appleNotificationEvents.productId,
    processingStatus: appleNotificationEvents.processingStatus,
    processingError: appleNotificationEvents.processingError,
    attemptCount: appleNotificationEvents.attemptCount,
    nextAttemptAt: appleNotificationEvents.nextAttemptAt,
    duplicateCount: appleNotificationEvents.duplicateCount,
    receivedAt: appleNotificationEvents.receivedAt,
    processedAt: appleNotificationEvents.processedAt,
  }).from(appleNotificationEvents)
    .orderBy(desc(appleNotificationEvents.receivedAt))
    .limit(safeLimit);
}