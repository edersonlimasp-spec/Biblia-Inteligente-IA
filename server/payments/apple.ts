/**
 * Apple StoreKit Server-Side Verification
 * Handles receipt validation and subscription status for iOS in-app purchases
 */

import { db } from '../db';
import { subscriptions, paymentReceipts, users } from '@shared/schema';
import { eq, and, or, lte, isNotNull, sql } from 'drizzle-orm';
import { Environment, SignedDataVerifier } from '@apple/app-store-server-library';

// Apple Root CA - G3, downloaded from Apple's Certificate Authority page.
// Keeping the DER bytes in source means the production bundle does not depend
// on a working-directory-relative certificate file.
const APPLE_ROOT_CA_G3_DER = Buffer.from(
  'MIICQzCCAcmgAwIBAgIILcX8iNLFS5UwCgYIKoZIzj0EAwMwZzEbMBkGA1UEAwwSQXBwbGUgUm9vdCBDQSAtIEczMSYwJAYDVQQLDB1BcHBsZSBDZXJ0aWZpY2F0aW9uIEF1dGhvcml0eTETMBEGA1UECgwKQXBwbGUgSW5jLjELMAkGA1UEBhMCVVMwHhcNMTQwNDMwMTgxOTA2WhcNMzkwNDMwMTgxOTA2WjBnMRswGQYDVQQDDBJBcHBsZSBSb290IENBIC0gRzMxJjAkBgNVBAsMHUFwcGxlIENlcnRpZmljYXRpb24gQXV0aG9yaXR5MRMwEQYDVQQKDApBcHBsZSBJbmMuMQswCQYDVQQGEwJVUzB2MBAGByqGSM49AgEGBSuBBAAiA2IABJjpLz1AcqTtkyJygRMc3RCV8cWjTnHcFBbZDuWmBSp3ZHtfTjjTuxxEtX/1H7YyYl3J6YRbTzBPEVoA/VhYDKX1DyxNB0cTddqXl5dvMVztK517IDvYuVTZXpmkOlEKMaNCMEAwHQYDVR0OBBYEFLuw3qFYM4iapIqZ3r6966/ayySrMA8GA1UdEwEB/wQFMAMBAf8wDgYDVR0PAQH/BAQDAgEGMAoGCCqGSM49BAMDA2gAMGUCMQCD6cHEFl4aXTQY2e3v9GwOAEZLuN+yRhHFD/3meoyhpmvOwgPUnPWTxnS4at+qIxUCMG1mihDK1A3UT82NQz60imOlM27jbdoXt2QfyFMm+YhidDkLF1vLUagM6BgD56KyKA==',
  'base64'
);

// Apple verification endpoints
const APPLE_PRODUCTION_URL = 'https://buy.itunes.apple.com/verifyReceipt';
const APPLE_SANDBOX_URL = 'https://sandbox.itunes.apple.com/verifyReceipt';

// Product ID to plan mapping
export const APPLE_PRODUCT_MAP: Record<string, { planType: string; durationDays: number | null; amount: string }> = {
  'com.bibliainteligente.gold.monthly':   { planType: 'gold',          durationDays: 30,   amount: '9.90'   },
  'com.bibliainteligente.gold.yearly':    { planType: 'gold_anual',    durationDays: 365,  amount: '79.90'  },
  'com.bibliainteligente.premium.monthly':{ planType: 'premium',       durationDays: 30,   amount: '19.90'  },
  'com.bibliainteligente.premium.yearly': { planType: 'premium_anual', durationDays: 365,  amount: '129.90' },
  'com.bibliainteligente.strong.lifetime':{ planType: 'strong_lifetime',durationDays: null, amount: '49.90'  },
};

export function isAppleTransactionCancelled(transaction: {
  cancellation_date?: string;
  cancellation_date_ms?: string;
}): boolean {
  return Boolean(transaction.cancellation_date_ms || transaction.cancellation_date);
}

export function appleVerifiedProductPatch(productId: string, transactionId: string) {
  const productInfo = APPLE_PRODUCT_MAP[productId];
  if (!productInfo) throw new Error(`Unknown product: ${productId}`);
  return {
    storeTransactionId: transactionId,
    storeProductId: productId,
    planType: productInfo.planType,
    amount: productInfo.amount,
  };
}

type StoreKit2PurchaseRequest = {
  signedTransaction: string;
  productId: string;
  transactionId: string;
  originalTransactionId: string;
};

function explicitStoreKitEnvironment(): Environment | undefined {
  const configured = process.env.APPLE_STOREKIT_ENVIRONMENT?.toLowerCase();
  if (!configured) return undefined;
  return configured === 'sandbox' ? Environment.SANDBOX : Environment.PRODUCTION;
}

/**
 * Verifies a StoreKit 2 signed transaction using Apple's certificate chain.
 * The verifier performs signature, chain, OCSP/CRL revocation, expiry, bundle,
 * environment, and (in production) Apple application-id validation.
 */
export async function verifyAppleStoreKit2Transaction(signedTransaction: string) {
  const bundleId = process.env.APPLE_BUNDLE_ID || 'com.bibliainteligente.ios';
  const appAppleIdRaw = process.env.APPLE_APP_ID;
  const appAppleId = appAppleIdRaw ? Number(appAppleIdRaw) : undefined;
  const explicitEnvironment = explicitStoreKitEnvironment();
  const environments = explicitEnvironment
    ? [explicitEnvironment]
    : process.env.NODE_ENV === 'production'
      ? [Environment.PRODUCTION, Environment.SANDBOX]
      : [Environment.SANDBOX, Environment.PRODUCTION];

  let lastError: unknown;
  for (const environment of environments) {
    try {
      if (environment === Environment.PRODUCTION && (!Number.isSafeInteger(appAppleId) || appAppleId! <= 0)) {
        throw new Error('APPLE_APP_ID must be a positive numeric App Store Connect app ID in production');
      }
      const verifier = new SignedDataVerifier(
        [APPLE_ROOT_CA_G3_DER],
        true,
        environment,
        bundleId,
        environment === Environment.PRODUCTION ? appAppleId : undefined,
      );
      return await verifier.verifyAndDecodeTransaction(signedTransaction);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

/**
 * Persist a verified StoreKit 2 purchase.  The two unique indexes introduced
 * in migrations/0001 make retries safe even when two requests arrive together.
 * No signed JWS is persisted or logged.
 */
export async function processAppleStoreKit2Purchase(
  userId: string,
  request: StoreKit2PurchaseRequest,
  previouslyVerified?: Awaited<ReturnType<typeof verifyAppleStoreKit2Transaction>>,
): Promise<{ success: boolean; error?: string; subscription?: any }> {
  const productInfo = APPLE_PRODUCT_MAP[request.productId];
  if (!productInfo) return { success: false, error: `Unknown product: ${request.productId}` };

  let transaction: Awaited<ReturnType<typeof verifyAppleStoreKit2Transaction>>;
  try {
    transaction = previouslyVerified || await verifyAppleStoreKit2Transaction(request.signedTransaction);
  } catch (error) {
    // Deliberately do not include signed transaction data or verifier internals.
    console.warn('[Apple IAP] StoreKit 2 transaction verification rejected');
    return { success: false, error: 'Apple signed transaction verification failed' };
  }

  if (
    transaction.productId !== request.productId ||
    transaction.transactionId !== request.transactionId ||
    transaction.originalTransactionId !== request.originalTransactionId
  ) {
    return { success: false, error: 'Signed transaction does not match requested identifiers' };
  }
  if (transaction.revocationDate || !transaction.purchaseDate) {
    return { success: false, error: 'Transaction is revoked or incomplete' };
  }

  const purchaseDate = new Date(transaction.purchaseDate);
  const expiresDate = transaction.expiresDate ? new Date(transaction.expiresDate) : null;
  if (Number.isNaN(purchaseDate.getTime()) || (expiresDate && Number.isNaN(expiresDate.getTime()))) {
    return { success: false, error: 'Transaction contains invalid dates' };
  }
  const now = new Date();
  const endDate = productInfo.durationDays
    ? expiresDate || new Date(purchaseDate.getTime() + productInfo.durationDays * 86_400_000)
    : null;
  // StoreKit 2 subscriptions carry the Apple-authoritative expiration. Do not
  // record a payment or grant entitlement from a stale subscription JWS.
  if (productInfo.durationDays && (!expiresDate || expiresDate <= now)) {
    return { success: false, error: 'Transaction subscription has expired' };
  }
  const status = !endDate || endDate > now ? 'active' : 'expired';

  try {
    return await db.transaction(async (tx) => {
      // Transaction-scoped locks serialize ownership claims across all server
      // instances even when a managed schema deployment has not added the
      // defense-in-depth unique indexes yet. Sort to avoid lock-order deadlocks.
      for (const lockId of [request.originalTransactionId, request.transactionId].sort()) {
        await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${lockId}, 0))`);
      }
      const [claimedReceipt] = await tx.select({ userId: paymentReceipts.userId })
        .from(paymentReceipts)
        .where(and(
          eq(paymentReceipts.paymentProvider, 'apple'),
          eq(paymentReceipts.externalPaymentId, request.transactionId),
        ))
        .limit(1);
      if (claimedReceipt && claimedReceipt.userId !== userId) {
        return { success: false, error: 'Transaction already linked to another account' };
      }
      // First claim the subscription family. The unique index serializes
      // concurrent first claims; a replay by the same user is allowed.
      await tx.insert(subscriptions).values({
        userId,
        planType: productInfo.planType,
        status,
        startDate: purchaseDate,
        endDate,
        amount: productInfo.amount,
        source: 'apple',
        storeTransactionId: request.transactionId,
        originalTransactionId: request.originalTransactionId,
        storeProductId: request.productId,
        lastVerifiedAt: now,
        nextRenewalCheck: endDate ? new Date(endDate.getTime() - 86_400_000) : null,
      }).onConflictDoNothing();

      const [subscription] = await tx.select().from(subscriptions).where(and(
        eq(subscriptions.source, 'apple'),
        eq(subscriptions.originalTransactionId, request.originalTransactionId),
      )).limit(1);
      if (!subscription) throw new Error('Could not persist Apple subscription');
      if (subscription.userId !== userId) {
        return { success: false, error: 'Purchase already linked to another account' };
      }

      // An older delivery is valid evidence of ownership, but it must never
      // roll a newer renewal back or reactivate a status from stale data.
      const existingEnd = subscription.endDate ? new Date(subscription.endDate) : null;
      const advancesEntitlement = !existingEnd || (!!endDate && endDate > existingEnd);
      const effectiveEndDate = advancesEntitlement ? endDate : existingEnd;
      const effectiveStatus = advancesEntitlement ? status : subscription.status;
      if (advancesEntitlement) {
        // Keep the most recently verified renewal data current. We
        // intentionally do not write the JWS to providerRawData or token fields.
        await tx.update(subscriptions).set({
          ...appleVerifiedProductPatch(request.productId, request.transactionId),
          endDate,
          status,
          lastVerifiedAt: now,
          nextRenewalCheck: endDate ? new Date(endDate.getTime() - 86_400_000) : null,
        }).where(eq(subscriptions.id, subscription.id));
      }

      const [user] = await tx.select({ email: users.email }).from(users)
        .where(eq(users.id, userId)).limit(1);
      await tx.insert(paymentReceipts).values({
        externalPaymentId: request.transactionId,
        paymentProvider: 'apple',
        paymentType: productInfo.durationDays ? 'subscription' : 'payment',
        userId,
        userEmail: user?.email || null,
        planType: productInfo.planType,
        subscriptionDays: productInfo.durationDays,
        isLifetime: !productInfo.durationDays,
        grossAmount: Math.round(parseFloat(productInfo.amount) * 100),
        feeAmount: 0,
        taxAmount: 0,
        netAmount: Math.round(parseFloat(productInfo.amount) * 100),
        status: 'approved',
        origin: 'api',
        providerRawData: {
          source: 'storekit2',
          environment: transaction.environment,
          verifiedAt: now.toISOString(),
        },
        isValidated: true,
        validatedAt: now,
        subscriptionId: subscription.id,
        activatedAt: now,
        paymentDate: purchaseDate,
      }).onConflictDoNothing();

      const [receipt] = await tx.select().from(paymentReceipts)
        .where(and(eq(paymentReceipts.paymentProvider, 'apple'), eq(paymentReceipts.externalPaymentId, request.transactionId)))
        .limit(1);
      if (!receipt || receipt.userId !== userId) {
        return { success: false, error: 'Transaction already linked to another account' };
      }
      return { success: true, subscription: { ...subscription, endDate: effectiveEndDate, status: effectiveStatus } };
    });
  } catch (error) {
    console.error('[Apple IAP] StoreKit 2 persistence failed');
    return { success: false, error: 'Could not process Apple purchase' };
  }
}

/** Restore one StoreKit 2 transaction without trusting client-supplied IDs. */
export async function restoreAppleStoreKit2Purchase(
  userId: string,
  signedTransaction: string,
): Promise<{ success: boolean; error?: string; subscription?: any }> {
  let transaction: Awaited<ReturnType<typeof verifyAppleStoreKit2Transaction>>;
  try {
    transaction = await verifyAppleStoreKit2Transaction(signedTransaction);
  } catch {
    console.warn('[Apple IAP] StoreKit 2 restore verification rejected');
    return { success: false, error: 'Apple signed transaction verification failed' };
  }
  if (!transaction.productId || !transaction.transactionId || !transaction.originalTransactionId) {
    return { success: false, error: 'Signed transaction is missing identifiers' };
  }
  // The purchase method repeats the same payload checks and uses the shared
  // transactional/idempotent persistence path, without re-verifying the JWS.
  return processAppleStoreKit2Purchase(userId, {
    signedTransaction,
    productId: transaction.productId,
    transactionId: transaction.transactionId,
    originalTransactionId: transaction.originalTransactionId,
  }, transaction);
}

interface AppleReceiptResponse {
  status: number;
  receipt?: {
    bundle_id: string;
    in_app: Array<{
      product_id: string;
      transaction_id: string;
      original_transaction_id: string;
      purchase_date_ms: string;
      expires_date_ms?: string;
      cancellation_date?: string;
      cancellation_date_ms?: string;
      is_trial_period?: string;
      is_in_intro_offer_period?: string;
    }>;
  };
  latest_receipt_info?: Array<{
    product_id: string;
    transaction_id: string;
    original_transaction_id: string;
    purchase_date_ms: string;
    expires_date_ms?: string;
    cancellation_date?: string;
    cancellation_date_ms?: string;
    is_trial_period?: string;
    is_in_intro_offer_period?: string;
  }>;
  pending_renewal_info?: Array<{
    product_id: string;
    auto_renew_status: string;
    expiration_intent?: string;
  }>;
  environment?: string;
}

// Apple status codes
const APPLE_STATUS = {
  VALID: 0,
  SANDBOX_RECEIPT_IN_PRODUCTION: 21007,
  PRODUCTION_RECEIPT_IN_SANDBOX: 21008,
};

/**
 * Verify Apple receipt with Apple servers
 */
export async function verifyAppleReceipt(
  receiptData: string,
  useSandbox = false
): Promise<AppleReceiptResponse> {
  const sharedSecret = process.env.APPLE_SHARED_SECRET;
  
  if (!sharedSecret) {
    console.log('[Apple IAP] Warning: APPLE_SHARED_SECRET not set, using test mode');
  }

  const url = useSandbox ? APPLE_SANDBOX_URL : APPLE_PRODUCTION_URL;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      'receipt-data': receiptData,
      'password': sharedSecret || '',
      'exclude-old-transactions': true,
    }),
  });

  const data: AppleReceiptResponse = await response.json();

  // If production returns sandbox receipt, retry with sandbox
  if (data.status === APPLE_STATUS.SANDBOX_RECEIPT_IN_PRODUCTION && !useSandbox) {
    console.log('[Apple IAP] Retrying with sandbox endpoint');
    return verifyAppleReceipt(receiptData, true);
  }

  return data;
}

/**
 * Process verified Apple purchase and activate subscription
 */
export async function processApplePurchase(
  userId: string,
  receiptData: string,
  productId: string,
  transactionId: string,
  originalTransactionId: string
): Promise<{ success: boolean; error?: string; subscription?: any }> {
  console.log('[Apple IAP] Processing purchase:', { userId, productId, transactionId });

  try {
    // Check if Apple credentials are configured
    const hasAppleCredentials = !!process.env.APPLE_SHARED_SECRET;
    
    // In production, require Apple credentials for verification
    if (!hasAppleCredentials && process.env.NODE_ENV === 'production') {
      console.error('[Apple IAP] SECURITY: Apple shared secret not configured in production');
      return { success: false, error: 'Payment verification not available' };
    }

    // In development without credentials, allow test mode
    if (!hasAppleCredentials && process.env.NODE_ENV !== 'production') {
      console.log('[Apple IAP] DEV TEST MODE: Simulating Apple verification');
      // Continue with test flow - verification will work but with sandbox fallback
    }

    // Verify receipt with Apple
    const verification = await verifyAppleReceipt(receiptData);
    
    if (verification.status !== APPLE_STATUS.VALID) {
      console.error('[Apple IAP] Verification failed, status:', verification.status);
      return { success: false, error: `Apple verification failed: ${verification.status}` };
    }

    // SECURITY: bind receipt to our app — reject receipts from other apps
    const expectedBundleId = process.env.APPLE_BUNDLE_ID || 'com.bibliainteligente.ios';
    const receiptBundleId = verification.receipt?.bundle_id;
    if (receiptBundleId && receiptBundleId !== expectedBundleId) {
      console.error('[Apple IAP] SECURITY: bundle_id mismatch', { receiptBundleId, expectedBundleId });
      return { success: false, error: 'Receipt does not belong to this app' };
    }

    // Find the matching transaction
    const transactions = verification.latest_receipt_info || verification.receipt?.in_app || [];
    const transaction = transactions.find(t => t.transaction_id === transactionId);

    if (!transaction) {
      return { success: false, error: 'Transaction not found in receipt' };
    }

    // SECURITY: enforce product_id match — prevent plan escalation
    // (e.g. paying for monthly while claiming yearly/lifetime in request body)
    if (transaction.product_id !== productId) {
      console.error('[Apple IAP] SECURITY: product_id mismatch', {
        receiptProductId: transaction.product_id,
        requestProductId: productId,
      });
      return { success: false, error: 'Product mismatch between receipt and request' };
    }

    // SECURITY: enforce original_transaction_id match — prevent transaction binding tampering
    if (transaction.original_transaction_id !== originalTransactionId) {
      console.error('[Apple IAP] SECURITY: original_transaction_id mismatch', {
        receiptOriginalTxId: transaction.original_transaction_id,
        requestOriginalTxId: originalTransactionId,
      });
      return { success: false, error: 'Original transaction mismatch' };
    }

    // Apple marks refunded/revoked StoreKit 1 purchases with a cancellation
    // date. A cryptographically valid receipt is not sufficient to grant a
    // cancelled transaction.
    if (isAppleTransactionCancelled(transaction)) {
      return { success: false, error: 'Apple transaction was cancelled or refunded' };
    }

    // Get product mapping
    const productInfo = APPLE_PRODUCT_MAP[productId];
    if (!productInfo) {
      return { success: false, error: `Unknown product: ${productId}` };
    }

    return await db.transaction(async (tx) => {
    for (const lockId of [originalTransactionId, transactionId].sort()) {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${lockId}, 0))`);
    }

    // Check for existing subscription with same original transaction
    const existingByTransaction = await tx.select()
      .from(subscriptions)
      .where(and(
        eq(subscriptions.originalTransactionId, originalTransactionId),
        eq(subscriptions.source, 'apple')
      ))
      .limit(1);

    const purchaseDate = new Date(parseInt(transaction.purchase_date_ms));
    const expiresDate = transaction.expires_date_ms 
      ? new Date(parseInt(transaction.expires_date_ms))
      : null;

    // Calculate end date for non-lifetime products
    let endDate: Date | null = null;
    if (productInfo.durationDays) {
      endDate = expiresDate || new Date(purchaseDate.getTime() + productInfo.durationDays * 24 * 60 * 60 * 1000);
    }

    // Determine status
    const now = new Date();
    const status = (!endDate || endDate > now) ? 'active' : 'expired';

    if (existingByTransaction.length > 0) {
      // Update existing subscription (renewal)
      const existing = existingByTransaction[0];

      // SECURITY: uma assinatura já vinculada a outra conta não pode ser
      // atualizada/reivindicada por outro usuário (ex.: aparelho compartilhado).
      if (existing.userId !== userId) {
        console.error('[Apple IAP] SECURITY: purchase already linked to another account', { originalTransactionId });
        return { success: false, error: 'Purchase already linked to another account' };
      }
      const existingReceipt = await tx.select()
        .from(paymentReceipts)
        .where(and(
          eq(paymentReceipts.paymentProvider, 'apple'),
          eq(paymentReceipts.externalPaymentId, transactionId),
        ))
        .limit(1);
      if (existingReceipt[0] && existingReceipt[0].userId !== userId) {
        return { success: false, error: 'Transaction already linked to another account' };
      }
      const existingEnd = existing.endDate ? new Date(existing.endDate) : null;
      const advancesEntitlement = !existingEnd || (!!endDate && endDate > existingEnd);
      if (advancesEntitlement) {
        await tx.update(subscriptions)
          .set({
            ...appleVerifiedProductPatch(productId, transactionId),
            endDate,
            status,
            storePurchaseToken: receiptData,
            lastVerifiedAt: now,
            nextRenewalCheck: endDate ? new Date(endDate.getTime() - 24 * 60 * 60 * 1000) : null,
          })
          .where(eq(subscriptions.id, existing.id));
      }

      // Also append a payment receipt row per renewal so analytics
      // (renewal/churn over time) can see each paid period. Apple issues a
      // new transactionId per renewal while keeping originalTransactionId
      // stable — use transactionId as the immutable per-cycle key.
      if (existingReceipt.length === 0) {
        const renewalUser = await tx.select().from(users).where(eq(users.id, userId)).limit(1);
        await tx.insert(paymentReceipts).values({
          externalPaymentId: transactionId,
          paymentProvider: 'apple',
          paymentType: productInfo.durationDays ? 'subscription' : 'payment',
          userId,
          userEmail: renewalUser[0]?.email || null,
          planType: productInfo.planType,
          subscriptionDays: productInfo.durationDays,
          isLifetime: !productInfo.durationDays,
          grossAmount: Math.round(parseFloat(productInfo.amount) * 100),
          feeAmount: 0,
          taxAmount: 0,
          netAmount: Math.round(parseFloat(productInfo.amount) * 100),
          status: 'approved',
          origin: 'api',
          providerRawData: verification as any,
          isValidated: true,
          validatedAt: now,
          subscriptionId: existing.id,
          activatedAt: now,
          paymentDate: purchaseDate,
        }).onConflictDoNothing();
        console.log('[Apple IAP] Appended renewal receipt for sub:', existing.id);
      }

      console.log('[Apple IAP] Updated existing subscription:', existing.id);
      return {
        success: true,
        subscription: {
          ...existing,
          endDate: advancesEntitlement ? endDate : existingEnd,
          status: advancesEntitlement ? status : existing.status,
        },
      };
    }

    // A transaction ID is an immutable Apple purchase event. Reject a claim
    // that was already recorded for another account before creating a second
    // subscription family (the unique receipt index closes the race at write).
    const existingReceiptByTransaction = await tx.select()
      .from(paymentReceipts)
      .where(and(
        eq(paymentReceipts.paymentProvider, 'apple'),
        eq(paymentReceipts.externalPaymentId, transactionId),
      ))
      .limit(1);
    if (existingReceiptByTransaction[0] && existingReceiptByTransaction[0].userId !== userId) {
      return { success: false, error: 'Transaction already linked to another account' };
    }

    // Create new subscription
    const [newSubscription] = await tx.insert(subscriptions)
      .values({
        userId,
        planType: productInfo.planType,
        status,
        startDate: purchaseDate,
        endDate,
        amount: productInfo.amount,
        source: 'apple',
        storeTransactionId: transactionId,
        originalTransactionId,
        storeProductId: productId,
        storePurchaseToken: receiptData,
        lastVerifiedAt: now,
        nextRenewalCheck: endDate ? new Date(endDate.getTime() - 24 * 60 * 60 * 1000) : null,
      })
      .onConflictDoNothing()
      .returning();

    // With the advisory lock held, a conflict indicates a pre-existing row
    // that should have been visible above, rather than a concurrent race.
    if (!newSubscription) {
      throw new Error('Apple subscription ownership conflict');
    }

    // Create payment receipt
    const user = await tx.select().from(users).where(eq(users.id, userId)).limit(1);
    await tx.insert(paymentReceipts).values({
      externalPaymentId: transactionId,
      paymentProvider: 'apple',
      paymentType: productInfo.durationDays ? 'subscription' : 'payment',
      userId,
      userEmail: user[0]?.email || null,
      planType: productInfo.planType,
      subscriptionDays: productInfo.durationDays,
      isLifetime: !productInfo.durationDays,
      grossAmount: Math.round(parseFloat(productInfo.amount) * 100),
      feeAmount: 0, // Apple doesn't provide fee breakdown
      taxAmount: 0,
      netAmount: Math.round(parseFloat(productInfo.amount) * 100),
      status: 'approved',
      origin: 'api',
      providerRawData: verification as any,
      isValidated: true,
      validatedAt: now,
      subscriptionId: newSubscription.id,
      activatedAt: now,
      paymentDate: purchaseDate,
    }).onConflictDoNothing();

    console.log('[Apple IAP] Created new subscription:', newSubscription.id);
    return { success: true, subscription: newSubscription };
    });

  } catch (error) {
    console.error('[Apple IAP] Error processing purchase:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Re-verify Apple subscriptions close to (or past) their stored expiry using
 * the persisted receipt, extending endDate when Apple has auto-renewed them.
 * Mirrors refreshGoogleSubscriptions — without it, renewals never reach the
 * database unless the device happens to report the new transaction.
 */
export async function refreshAppleSubscriptions(): Promise<{ checked: number; renewed: number; expired: number; failed: number }> {
  const summary = { checked: 0, renewed: 0, expired: 0, failed: 0 };

  if (!process.env.APPLE_SHARED_SECRET) {
    return summary; // sem credencial não há verificação confiável (dev/test)
  }

  const windowEnd = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const candidates = await db.select()
    .from(subscriptions)
    .where(and(
      eq(subscriptions.source, 'apple'),
      isNotNull(subscriptions.endDate),
      isNotNull(subscriptions.storePurchaseToken),
      lte(subscriptions.endDate, windowEnd),
      or(
        sql`LOWER(${subscriptions.status}) = 'active'`,
        // renovação pode ter ocorrido depois do último ciclo do expirador
        sql`LOWER(${subscriptions.status}) = 'expired'`
      )
    ));

  for (const subscription of candidates) {
    const receiptData = subscription.storePurchaseToken;
    const productInfo = subscription.storeProductId ? APPLE_PRODUCT_MAP[subscription.storeProductId] : undefined;
    if (!receiptData || !productInfo?.durationDays) continue; // vitalícios fora

    summary.checked++;
    try {
      const verification = await verifyAppleReceipt(receiptData);
      if (verification.status !== APPLE_STATUS.VALID) {
        console.warn('[Apple IAP] Renewal check: verification status', verification.status, 'for subscription', subscription.id);
        // 21005 = servidor da Apple indisponível (transitório) → falha real;
        // demais códigos indicam recibo inválido — deixa expirar naturalmente.
        if (verification.status === 21005) summary.failed++;
        continue;
      }

      const transactions = verification.latest_receipt_info || verification.receipt?.in_app || [];
      const related = transactions.filter(t =>
        t.original_transaction_id === subscription.originalTransactionId && t.expires_date_ms
      );
      if (related.length === 0) continue;

      const latest = related.reduce((a, b) =>
        parseInt(a.expires_date_ms!) >= parseInt(b.expires_date_ms!) ? a : b
      );
      const latestProductInfo = APPLE_PRODUCT_MAP[latest.product_id];
      if (!latestProductInfo?.durationDays) continue;
      const newEndDate = new Date(parseInt(latest.expires_date_ms!));
      const isActive = newEndDate > new Date();
      const advancesEntitlement =
        !subscription.endDate ||
        newEndDate > new Date(subscription.endDate);

      if (advancesEntitlement) {
        // Compare again in SQL so an older sweep cannot overwrite a renewal
        // that another worker advanced after this candidate was selected.
        await db.update(subscriptions)
          .set({
            ...appleVerifiedProductPatch(latest.product_id, latest.transaction_id),
            endDate: newEndDate,
            status: isActive ? 'active' : 'expired',
            lastVerifiedAt: new Date(),
            nextRenewalCheck: new Date(newEndDate.getTime() - 24 * 60 * 60 * 1000),
          })
          .where(and(
            eq(subscriptions.id, subscription.id),
            sql`(${subscriptions.endDate} IS NULL OR ${subscriptions.endDate} < ${newEndDate})`,
          ));
      }

      if (isActive && advancesEntitlement) {
        summary.renewed++;
        console.log(`[Apple IAP] Renewal detected: subscription ${subscription.id} extended to ${newEndDate.toISOString()}`);
      } else if (!isActive && advancesEntitlement) {
        summary.expired++;
      }
    } catch (error) {
      summary.failed++;
      console.error('[Apple IAP] Renewal check failed for subscription', subscription.id, error);
    }
  }

  if (summary.checked > 0) {
    console.log(`[Apple IAP] Renewal sweep: checked=${summary.checked} renewed=${summary.renewed} expired=${summary.expired} failed=${summary.failed}`);
  }
  return summary;
}

/**
 * Restore Apple purchases for a user
 */
export async function restoreApplePurchases(
  userId: string,
  receiptData: string
): Promise<{ success: boolean; restored: number; error?: string }> {
  console.log('[Apple IAP] Restoring purchases for user:', userId);

  try {
    const verification = await verifyAppleReceipt(receiptData);
    
    if (verification.status !== APPLE_STATUS.VALID) {
      return { success: false, restored: 0, error: `Verification failed: ${verification.status}` };
    }

    const transactions = verification.latest_receipt_info || verification.receipt?.in_app || [];
    let restored = 0;

    for (const transaction of transactions) {
      const productInfo = APPLE_PRODUCT_MAP[transaction.product_id];
      if (!productInfo) continue;

      // Reprocessa mesmo quando a assinatura já existe: processApplePurchase
      // atualiza a linha existente por originalTransactionId, estendendo o
      // endDate quando o recibo contém uma renovação mais recente. Antes,
      // linhas existentes eram puladas e o restore não refletia renovações.
      const result = await processApplePurchase(
        userId,
        receiptData,
        transaction.product_id,
        transaction.transaction_id,
        transaction.original_transaction_id
      );

      if (result.success) restored++;
    }

    return { success: true, restored };

  } catch (error) {
    console.error('[Apple IAP] Error restoring purchases:', error);
    return { success: false, restored: 0, error: String(error) };
  }
}
