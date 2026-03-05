/**
 * Apple StoreKit Server-Side Verification
 * Handles receipt validation and subscription status for iOS in-app purchases
 */

import { db } from '../db';
import { subscriptions, paymentReceipts, users } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

// Apple verification endpoints
const APPLE_PRODUCTION_URL = 'https://buy.itunes.apple.com/verifyReceipt';
const APPLE_SANDBOX_URL = 'https://sandbox.itunes.apple.com/verifyReceipt';

// Product ID to plan mapping
export const APPLE_PRODUCT_MAP: Record<string, { planType: string; durationDays: number | null; amount: string }> = {
  'com.bibliainteligente.gold_monthly':   { planType: 'gold',          durationDays: 30,   amount: '9.90'   },
  'com.bibliainteligente.gold_annual':    { planType: 'gold_anual',    durationDays: 365,  amount: '79.90'  },
  'com.bibliainteligente.premium_monthly':{ planType: 'premium',       durationDays: 30,   amount: '19.90'  },
  'com.bibliainteligente.premium_annual': { planType: 'premium_anual', durationDays: 365,  amount: '129.90' },
  'com.bibliainteligente.strong_lifetime':{ planType: 'strong_lifetime',durationDays: null, amount: '49.90'  },
};

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

    // Find the matching transaction
    const transactions = verification.latest_receipt_info || verification.receipt?.in_app || [];
    const transaction = transactions.find(t => t.transaction_id === transactionId);

    if (!transaction) {
      return { success: false, error: 'Transaction not found in receipt' };
    }

    // Get product mapping
    const productInfo = APPLE_PRODUCT_MAP[productId];
    if (!productInfo) {
      return { success: false, error: `Unknown product: ${productId}` };
    }

    // Check for existing subscription with same original transaction
    const existingByTransaction = await db.select()
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
      await db.update(subscriptions)
        .set({
          storeTransactionId: transactionId,
          endDate,
          status,
          lastVerifiedAt: now,
          nextRenewalCheck: endDate ? new Date(endDate.getTime() - 24 * 60 * 60 * 1000) : null,
        })
        .where(eq(subscriptions.id, existing.id));

      console.log('[Apple IAP] Updated existing subscription:', existing.id);
      return { success: true, subscription: { ...existing, endDate, status } };
    }

    // Create new subscription
    const [newSubscription] = await db.insert(subscriptions)
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
        lastVerifiedAt: now,
        nextRenewalCheck: endDate ? new Date(endDate.getTime() - 24 * 60 * 60 * 1000) : null,
      })
      .returning();

    // Create payment receipt
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    await db.insert(paymentReceipts).values({
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
    });

    console.log('[Apple IAP] Created new subscription:', newSubscription.id);
    return { success: true, subscription: newSubscription };

  } catch (error) {
    console.error('[Apple IAP] Error processing purchase:', error);
    return { success: false, error: String(error) };
  }
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

      // Check if already restored
      const existing = await db.select()
        .from(subscriptions)
        .where(and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.originalTransactionId, transaction.original_transaction_id),
          eq(subscriptions.source, 'apple')
        ))
        .limit(1);

      if (existing.length > 0) continue;

      // Process this purchase
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
