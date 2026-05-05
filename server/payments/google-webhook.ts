/**
 * Google Play Real-time Developer Notifications (RTDN) webhook handler.
 *
 * Google Play publishes subscription lifecycle events to a Cloud Pub/Sub topic
 * that we configure with a push subscription pointing at this endpoint. Each
 * push delivers a JSON body { message: { data: <base64 JSON>, ... }, subscription }.
 * The decoded data has notificationType (1..13), purchaseToken, subscriptionId.
 *
 * Pub/Sub push subscriptions can be configured to attach a Google-signed OIDC
 * token in the Authorization header. We verify it against Google's JWKS when
 * GOOGLE_PUBSUB_AUDIENCE is configured.
 *
 * Docs: https://developer.android.com/google/play/billing/rtdn-reference
 */

import type { Request, Response } from 'express';
import { jwtVerify, createRemoteJWKSet } from 'jose';
import { eq, and } from 'drizzle-orm';
import { db } from '../db';
import { subscriptions, paymentReceipts, users } from '@shared/schema';
import { GOOGLE_PRODUCT_MAP, verifyGoogleSubscription } from './google';

const GOOGLE_NOTIFICATION_TYPE = {
  RECOVERED: 1,
  RENEWED: 2,
  CANCELED: 3,
  PURCHASED: 4,
  ON_HOLD: 5,
  IN_GRACE_PERIOD: 6,
  RESTARTED: 7,
  PRICE_CHANGE_CONFIRMED: 8,
  DEFERRED: 9,
  PAUSED: 10,
  PAUSE_SCHEDULE_CHANGED: 11,
  REVOKED: 12,
  EXPIRED: 13,
} as const;

const GOOGLE_JWKS = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));

async function verifyPubsubOIDC(
  authHeader: string | undefined,
  expectedAudience: string,
): Promise<boolean> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
  const token = authHeader.slice('Bearer '.length).trim();
  try {
    await jwtVerify(token, GOOGLE_JWKS, {
      issuer: ['https://accounts.google.com', 'accounts.google.com'],
      audience: expectedAudience,
    });
    return true;
  } catch (e) {
    console.warn('[Google Webhook] OIDC verification failed:', (e as Error).message);
    return false;
  }
}

interface PubsubPushBody {
  message?: {
    data?: string;
    messageId?: string;
    publishTime?: string;
    attributes?: Record<string, string>;
  };
  subscription?: string;
}

interface RTDNNotification {
  version: string;
  packageName: string;
  eventTimeMillis: string;
  subscriptionNotification?: {
    version: string;
    notificationType: number;
    purchaseToken: string;
    subscriptionId: string;
  };
  oneTimeProductNotification?: {
    version: string;
    notificationType: number;
    purchaseToken: string;
    sku: string;
  };
  testNotification?: { version: string };
}

export async function handleGoogleRTDN(req: Request, res: Response) {
  // Always 2xx fast so Pub/Sub stops redelivering; do work after.
  res.status(200).json({ received: true });

  try {
    const expectedAudience = process.env.GOOGLE_PUBSUB_AUDIENCE;
    if (expectedAudience) {
      const ok = await verifyPubsubOIDC(req.headers.authorization, expectedAudience);
      if (!ok) {
        console.warn('[Google Webhook] Rejected unverified Pub/Sub push');
        return;
      }
    } else if (process.env.NODE_ENV === 'production') {
      // Fail closed in production: without OIDC verification anyone could POST here
      // and trigger upstream calls / DB writes for known orderIds.
      console.error('[Google Webhook] GOOGLE_PUBSUB_AUDIENCE not configured in production; rejecting unauthenticated push');
      return;
    }

    const body = (req.body || {}) as PubsubPushBody;
    if (!body.message?.data) {
      console.warn('[Google Webhook] Missing message.data');
      return;
    }

    const decoded = Buffer.from(body.message.data, 'base64').toString('utf8');
    const notification = JSON.parse(decoded) as RTDNNotification;

    if (notification.testNotification) {
      console.log('[Google Webhook] Test notification received (handshake)');
      return;
    }

    if (notification.subscriptionNotification) {
      await handleSubscriptionNotification(notification.subscriptionNotification);
      return;
    }

    if (notification.oneTimeProductNotification) {
      console.log(
        '[Google Webhook] One-time product notification (no-op):',
        notification.oneTimeProductNotification,
      );
      return;
    }

    console.log('[Google Webhook] Notification with no handled section');
  } catch (err) {
    console.error('[Google Webhook] Error processing notification:', err);
  }
}

async function handleSubscriptionNotification(
  n: NonNullable<RTDNNotification['subscriptionNotification']>,
) {
  const { notificationType, purchaseToken, subscriptionId } = n;
  console.log(
    `[Google Webhook] type=${notificationType} subscriptionId=${subscriptionId}`,
  );

  const verification = await verifyGoogleSubscription(subscriptionId, purchaseToken);
  if (!verification) {
    console.warn('[Google Webhook] Could not fetch subscription state from Google');
    return;
  }

  const productInfo = GOOGLE_PRODUCT_MAP[subscriptionId];
  if (!productInfo) {
    console.warn(`[Google Webhook] Unknown subscriptionId ${subscriptionId}`);
    return;
  }

  const orderId = verification.orderId;
  const expiresDate = new Date(parseInt(verification.expiryTimeMillis));
  const startDate = new Date(parseInt(verification.startTimeMillis));
  const now = new Date();

  // Try to locate the subscription by current orderId. Google issues a new orderId
  // per renewal cycle but chains them via linkedPurchaseToken. If we can't locate
  // a row, the device hasn't yet bound the subscription to a userId; we ignore
  // and let the next /api/iap/verify reconcile.
  const existing = await db.select()
    .from(subscriptions)
    .where(and(
      eq(subscriptions.storeTransactionId, orderId),
      eq(subscriptions.source, 'google'),
    ))
    .limit(1);

  if (existing.length === 0) {
    console.log(
      `[Google Webhook] No subscription bound for orderId=${orderId} ` +
      `(linkedPurchaseToken=${verification.linkedPurchaseToken || '-'}); ` +
      `will be reconciled on next verify call.`,
    );
    return;
  }

  const sub = existing[0];

  switch (notificationType) {
    case GOOGLE_NOTIFICATION_TYPE.PURCHASED:
    case GOOGLE_NOTIFICATION_TYPE.RENEWED:
    case GOOGLE_NOTIFICATION_TYPE.RECOVERED:
    case GOOGLE_NOTIFICATION_TYPE.RESTARTED: {
      await db.update(subscriptions)
        .set({
          endDate: expiresDate,
          status: 'active',
          storeTransactionId: orderId,
          lastVerifiedAt: now,
          nextRenewalCheck: new Date(expiresDate.getTime() - 24 * 60 * 60 * 1000),
        })
        .where(eq(subscriptions.id, sub.id));

      await appendReceiptIfMissing(sub.id, sub.userId, productInfo, orderId, n, verification, startDate);
      break;
    }

    case GOOGLE_NOTIFICATION_TYPE.CANCELED:
    case GOOGLE_NOTIFICATION_TYPE.PAUSED:
    case GOOGLE_NOTIFICATION_TYPE.IN_GRACE_PERIOD:
    case GOOGLE_NOTIFICATION_TYPE.ON_HOLD:
    case GOOGLE_NOTIFICATION_TYPE.PAUSE_SCHEDULE_CHANGED:
    case GOOGLE_NOTIFICATION_TYPE.PRICE_CHANGE_CONFIRMED:
    case GOOGLE_NOTIFICATION_TYPE.DEFERRED:
      // Sub remains active until expiry; refresh expiry/last-verified for safety.
      await db.update(subscriptions)
        .set({
          endDate: expiresDate,
          lastVerifiedAt: now,
        })
        .where(eq(subscriptions.id, sub.id));
      console.log(`[Google Webhook] State change ${notificationType} for ${sub.id}`);
      break;

    case GOOGLE_NOTIFICATION_TYPE.EXPIRED:
    case GOOGLE_NOTIFICATION_TYPE.REVOKED:
      await db.update(subscriptions)
        .set({ status: 'expired', lastVerifiedAt: now })
        .where(eq(subscriptions.id, sub.id));
      console.log(`[Google Webhook] Marked ${sub.id} expired (${notificationType})`);
      break;

    default:
      console.log(`[Google Webhook] Unhandled notification type ${notificationType}`);
  }
}

async function appendReceiptIfMissing(
  subscriptionId: string,
  userId: string | null,
  productInfo: typeof GOOGLE_PRODUCT_MAP[string],
  orderId: string,
  notification: NonNullable<RTDNNotification['subscriptionNotification']>,
  verification: { startTimeMillis: string; expiryTimeMillis: string; orderId: string },
  paymentDate: Date,
) {
  if (!userId) {
    console.warn(`[Google Webhook] Subscription ${subscriptionId} has no userId; cannot append receipt`);
    return;
  }
  const u = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const now = new Date();
  // Atomic upsert via the unique index on (paymentProvider, externalPaymentId).
  const inserted = await db.insert(paymentReceipts).values({
    externalPaymentId: orderId,
    paymentProvider: 'google',
    paymentType: 'subscription',
    userId,
    userEmail: u[0]?.email || null,
    planType: productInfo.planType,
    subscriptionDays: productInfo.durationDays,
    isLifetime: false,
    grossAmount: Math.round(parseFloat(productInfo.amount) * 100),
    feeAmount: 0,
    taxAmount: 0,
    netAmount: Math.round(parseFloat(productInfo.amount) * 100),
    status: 'approved',
    origin: 'webhook',
    providerRawData: { notification, verification } as any,
    isValidated: true,
    validatedAt: now,
    subscriptionId,
    activatedAt: now,
    paymentDate,
  })
  .onConflictDoNothing({ target: [paymentReceipts.paymentProvider, paymentReceipts.externalPaymentId] })
  .returning({ id: paymentReceipts.id });

  if (inserted.length > 0) {
    console.log(`[Google Webhook] Appended receipt for sub ${subscriptionId} (order ${orderId})`);
  } else {
    console.log(`[Google Webhook] Receipt already existed for order ${orderId} (idempotent skip)`);
  }
}
