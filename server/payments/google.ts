/**
 * Google Play Billing Server-Side Verification
 * Handles purchase validation and subscription status for Android in-app purchases
 */

import { db } from '../db';
import { subscriptions, paymentReceipts, users } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

// Product ID to plan mapping
export const GOOGLE_PRODUCT_MAP: Record<string, { planType: string; durationDays: number | null; amount: string; isSubscription: boolean }> = {
  'gold_monthly':   { planType: 'gold',          durationDays: 30,   amount: '9.90',   isSubscription: true  },
  'gold_annual':    { planType: 'gold_anual',     durationDays: 365,  amount: '79.90',  isSubscription: true  },
  'premium_monthly':{ planType: 'premium',        durationDays: 30,   amount: '19.90',  isSubscription: true  },
  'premium_annual': { planType: 'premium_anual',  durationDays: 365,  amount: '129.90', isSubscription: true  },
  'strong_lifetime':{ planType: 'strong_lifetime',durationDays: null, amount: '49.90',  isSubscription: false },
};

interface GooglePurchaseVerification {
  purchaseTimeMillis: string;
  purchaseState: number; // 0: Purchased, 1: Canceled, 2: Pending
  consumptionState?: number;
  developerPayload?: string;
  orderId: string;
  purchaseType?: number;
  acknowledgementState: number; // 0: Yet to be acknowledged, 1: Acknowledged
  purchaseToken: string;
  productId: string;
  quantity?: number;
  obfuscatedExternalAccountId?: string;
  obfuscatedExternalProfileId?: string;
  regionCode?: string;
}

interface GoogleSubscriptionVerification {
  startTimeMillis: string;
  expiryTimeMillis: string;
  autoRenewing: boolean;
  priceCurrencyCode: string;
  priceAmountMicros: string;
  countryCode: string;
  developerPayload?: string;
  paymentState?: number;
  cancelReason?: number;
  userCancellationTimeMillis?: string;
  orderId: string;
  linkedPurchaseToken?: string;
  purchaseType?: number;
  acknowledgementState: number;
}

// Google purchase states
const GOOGLE_PURCHASE_STATE = {
  PURCHASED: 0,
  CANCELED: 1,
  PENDING: 2,
};

/**
 * Get Google Play Developer API access token
 * Uses service account credentials
 *
 * @param scope - OAuth scope. Defaults to androidpublisher (IAP/subscriptions).
 *                Use 'https://www.googleapis.com/auth/playdeveloperreporting'
 *                for the Play Developer Reporting API (installs/uninstalls).
 */
export async function getGoogleAccessToken(
  scope: string = 'https://www.googleapis.com/auth/androidpublisher'
): Promise<string | null> {
  const serviceAccountKey = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_KEY;
  
  if (!serviceAccountKey) {
    console.log('[Google IAP] Warning: GOOGLE_PLAY_SERVICE_ACCOUNT_KEY not set');
    return null;
  }

  try {
    // Parse service account JSON
    const serviceAccount = JSON.parse(serviceAccountKey);
    
    // Create JWT for Google OAuth
    const now = Math.floor(Date.now() / 1000);
    const header = { alg: 'RS256', typ: 'JWT' };
    const payload = {
      iss: serviceAccount.client_email,
      scope,
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    };

    // Note: In production, use a proper JWT library like 'jose' or 'jsonwebtoken'
    // For now, we'll use a simplified approach that works with Node.js crypto
    const crypto = await import('crypto');
    
    const base64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
    const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signatureInput = `${base64Header}.${base64Payload}`;
    
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(signatureInput);
    const signature = sign.sign(serviceAccount.private_key, 'base64url');
    
    const jwt = `${signatureInput}.${signature}`;

    // Exchange JWT for access token
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }),
    });

    const data = await response.json() as { access_token?: string; error?: string };
    
    if (data.error) {
      console.error('[Google IAP] OAuth error:', data.error);
      return null;
    }

    return data.access_token || null;

  } catch (error) {
    console.error('[Google IAP] Error getting access token:', error);
    return null;
  }
}

/**
 * Verify Google Play purchase (one-time)
 */
export async function verifyGooglePurchase(
  productId: string,
  purchaseToken: string
): Promise<GooglePurchaseVerification | null> {
  const packageName = 'com.bibliainteligente.app';
  const accessToken = await getGoogleAccessToken();
  
  if (!accessToken) {
    console.log('[Google IAP] No access token, skipping verification (test mode)');
    return null;
  }

  try {
    const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/purchases/products/${productId}/tokens/${purchaseToken}`;
    
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      console.error('[Google IAP] Verification failed:', response.status);
      return null;
    }

    return await response.json();

  } catch (error) {
    console.error('[Google IAP] Error verifying purchase:', error);
    return null;
  }
}

/**
 * Verify Google Play subscription
 */
export async function verifyGoogleSubscription(
  subscriptionId: string,
  purchaseToken: string
): Promise<GoogleSubscriptionVerification | null> {
  const packageName = 'com.bibliainteligente.app';
  const accessToken = await getGoogleAccessToken();
  
  if (!accessToken) {
    console.log('[Google IAP] No access token, skipping verification (test mode)');
    return null;
  }

  try {
    const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/purchases/subscriptions/${subscriptionId}/tokens/${purchaseToken}`;
    
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      console.error('[Google IAP] Subscription verification failed:', response.status);
      return null;
    }

    return await response.json();

  } catch (error) {
    console.error('[Google IAP] Error verifying subscription:', error);
    return null;
  }
}

/**
 * Acknowledge Google Play purchase (required for all purchases)
 */
export async function acknowledgeGooglePurchase(
  productId: string,
  purchaseToken: string,
  isSubscription: boolean
): Promise<boolean> {
  const packageName = 'com.bibliainteligente.app';
  const accessToken = await getGoogleAccessToken();
  
  if (!accessToken) {
    console.log('[Google IAP] No access token, skipping acknowledgement');
    return false;
  }

  try {
    const type = isSubscription ? 'subscriptions' : 'products';
    const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/purchases/${type}/${productId}/tokens/${purchaseToken}:acknowledge`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });

    return response.ok;

  } catch (error) {
    console.error('[Google IAP] Error acknowledging purchase:', error);
    return false;
  }
}

/**
 * Process verified Google Play purchase and activate subscription
 */
export async function processGooglePurchase(
  userId: string,
  productId: string,
  purchaseToken: string,
  orderId: string
): Promise<{ success: boolean; error?: string; subscription?: any }> {
  console.log('[Google IAP] Processing purchase:', { userId, productId, orderId });

  try {
    // Get product mapping
    const productInfo = GOOGLE_PRODUCT_MAP[productId];
    if (!productInfo) {
      return { success: false, error: `Unknown product: ${productId}` };
    }

    // Check if Google credentials are configured
    const hasGoogleCredentials = !!process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_KEY;
    
    // In production, require Google credentials for verification
    if (!hasGoogleCredentials && process.env.NODE_ENV === 'production') {
      console.error('[Google IAP] SECURITY: Google credentials not configured in production');
      return { success: false, error: 'Payment verification not available' };
    }

    // Verify with Google
    let verification: any;
    let expiresDate: Date | null = null;
    let purchaseDate: Date;

    if (productInfo.isSubscription) {
      verification = await verifyGoogleSubscription(productId, purchaseToken);
      if (!verification && hasGoogleCredentials) {
        console.error('[Google IAP] Subscription verification failed');
        return { success: false, error: 'Failed to verify subscription with Google' };
      }
      if (verification) {
        purchaseDate = new Date(parseInt(verification.startTimeMillis));
        expiresDate = new Date(parseInt(verification.expiryTimeMillis));
      } else if (!hasGoogleCredentials && process.env.NODE_ENV !== 'production') {
        // Test mode only in development
        console.log('[Google IAP] DEV TEST MODE: Simulating purchase');
        purchaseDate = new Date();
        expiresDate = new Date(purchaseDate.getTime() + productInfo.durationDays! * 24 * 60 * 60 * 1000);
      } else {
        return { success: false, error: 'Verification failed' };
      }
    } else {
      verification = await verifyGooglePurchase(productId, purchaseToken);
      if (!verification && hasGoogleCredentials) {
        console.error('[Google IAP] Purchase verification failed');
        return { success: false, error: 'Failed to verify purchase with Google' };
      }
      if (verification) {
        purchaseDate = new Date(parseInt(verification.purchaseTimeMillis));
        if (verification.purchaseState !== GOOGLE_PURCHASE_STATE.PURCHASED) {
          return { success: false, error: `Purchase not completed: state ${verification.purchaseState}` };
        }
      } else if (!hasGoogleCredentials && process.env.NODE_ENV !== 'production') {
        // Test mode only in development
        console.log('[Google IAP] DEV TEST MODE: Simulating purchase');
        purchaseDate = new Date();
      } else {
        return { success: false, error: 'Verification failed' };
      }
    }

    // Check for existing subscription with same order
    const existingByOrder = await db.select()
      .from(subscriptions)
      .where(and(
        eq(subscriptions.storeTransactionId, orderId),
        eq(subscriptions.source, 'google')
      ))
      .limit(1);

    // Calculate end date for non-lifetime products
    let endDate: Date | null = null;
    if (productInfo.durationDays) {
      endDate = expiresDate || new Date(purchaseDate.getTime() + productInfo.durationDays * 24 * 60 * 60 * 1000);
    }

    // Determine status
    const now = new Date();
    const status = (!endDate || endDate > now) ? 'active' : 'expired';

    if (existingByOrder.length > 0) {
      // Update existing subscription
      const existing = existingByOrder[0];
      await db.update(subscriptions)
        .set({
          endDate,
          status,
          lastVerifiedAt: now,
          nextRenewalCheck: endDate ? new Date(endDate.getTime() - 24 * 60 * 60 * 1000) : null,
        })
        .where(eq(subscriptions.id, existing.id));

      // Acknowledge purchase
      if (verification) {
        await acknowledgeGooglePurchase(productId, purchaseToken, productInfo.isSubscription);
      }

      console.log('[Google IAP] Updated existing subscription:', existing.id);
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
        source: 'google',
        storeTransactionId: orderId,
        originalTransactionId: orderId,
        storeProductId: productId,
        lastVerifiedAt: now,
        nextRenewalCheck: endDate ? new Date(endDate.getTime() - 24 * 60 * 60 * 1000) : null,
      })
      .returning();

    // Acknowledge purchase
    if (verification) {
      await acknowledgeGooglePurchase(productId, purchaseToken, productInfo.isSubscription);
    }

    // Create payment receipt
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    await db.insert(paymentReceipts).values({
      externalPaymentId: orderId,
      paymentProvider: 'google',
      paymentType: productInfo.isSubscription ? 'subscription' : 'payment',
      userId,
      userEmail: user[0]?.email || null,
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
      isValidated: !!verification,
      validatedAt: verification ? now : null,
      subscriptionId: newSubscription.id,
      activatedAt: now,
      paymentDate: purchaseDate,
    });

    console.log('[Google IAP] Created new subscription:', newSubscription.id);
    return { success: true, subscription: newSubscription };

  } catch (error) {
    console.error('[Google IAP] Error processing purchase:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Restore Google Play purchases for a user
 */
export async function restoreGooglePurchases(
  userId: string,
  purchases: Array<{ productId: string; purchaseToken: string; orderId: string }>
): Promise<{ success: boolean; restored: number; error?: string }> {
  console.log('[Google IAP] Restoring purchases for user:', userId, 'count:', purchases.length);

  let restored = 0;

  for (const purchase of purchases) {
    const productInfo = GOOGLE_PRODUCT_MAP[purchase.productId];
    if (!productInfo) continue;

    // Check if already exists
    const existing = await db.select()
      .from(subscriptions)
      .where(and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.storeTransactionId, purchase.orderId),
        eq(subscriptions.source, 'google')
      ))
      .limit(1);

    if (existing.length > 0) continue;

    // Process this purchase
    const result = await processGooglePurchase(
      userId,
      purchase.productId,
      purchase.purchaseToken,
      purchase.orderId
    );

    if (result.success) restored++;
  }

  return { success: true, restored };
}
