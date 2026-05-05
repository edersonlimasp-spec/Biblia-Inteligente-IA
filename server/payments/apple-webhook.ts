/**
 * App Store Server Notifications V2 webhook handler.
 *
 * Apple posts a JSON body { signedPayload: <JWS> } to a configured HTTPS URL
 * for each subscription lifecycle event (purchase, renewal, expiration,
 * refund, etc.). The JWS is signed with a certificate chain rooted at
 * Apple Root CA - G3. We verify chain integrity, pin the root, then verify
 * the JWS signature with the leaf certificate's public key.
 *
 * Docs: https://developer.apple.com/documentation/appstoreservernotifications
 */

import type { Request, Response } from 'express';
import { compactVerify, importX509, decodeProtectedHeader } from 'jose';
import { X509Certificate } from 'crypto';
import { eq, and } from 'drizzle-orm';
import { db } from '../db';
import { subscriptions, paymentReceipts, users } from '@shared/schema';
import { APPLE_PRODUCT_MAP } from './apple';

// Apple Root CA - G3 SHA-256 fingerprint (no colons, uppercase).
// https://www.apple.com/certificateauthority/
const APPLE_ROOT_CA_G3_FP = 'B0B1730ECBC7FF4505142C49F1295E6EDA6BCAED7E2C68C5BE91B5A11001F024';

interface NotificationPayload {
  notificationType: string;
  subtype?: string;
  notificationUUID: string;
  data: {
    appAppleId?: number;
    bundleId: string;
    bundleVersion?: string;
    environment: 'Sandbox' | 'Production';
    signedTransactionInfo?: string;
    signedRenewalInfo?: string;
  };
  version: string;
  signedDate: number;
}

interface TransactionInfo {
  transactionId: string;
  originalTransactionId: string;
  productId: string;
  type: string;
  bundleId: string;
  purchaseDate: number;
  originalPurchaseDate: number;
  expiresDate?: number;
  inAppOwnershipType: string;
  signedDate: number;
  environment: string;
  revocationDate?: number;
  revocationReason?: number;
}

function pemFromBase64(b64: string): string {
  const wrapped = b64.match(/.{1,64}/g)?.join('\n') ?? b64;
  return `-----BEGIN CERTIFICATE-----\n${wrapped}\n-----END CERTIFICATE-----`;
}

async function verifyAppleJWS<T>(token: string): Promise<T> {
  const header = decodeProtectedHeader(token);
  const x5c = header.x5c as string[] | undefined;
  if (!x5c || x5c.length < 2) {
    throw new Error('Missing or incomplete x5c chain');
  }

  const certs = x5c.map(c => new X509Certificate(Buffer.from(c, 'base64')));

  // Validity window
  const now = new Date();
  for (const cert of certs) {
    if (now < new Date(cert.validFrom) || now > new Date(cert.validTo)) {
      throw new Error('Certificate outside validity window');
    }
  }

  // Chain integrity: each cert signed by the next
  for (let i = 0; i < certs.length - 1; i++) {
    if (!certs[i].verify(certs[i + 1].publicKey)) {
      throw new Error(`Chain integrity broken between cert ${i} and ${i + 1}`);
    }
  }

  // Root pinning
  const rootFp = certs[certs.length - 1].fingerprint256.replace(/:/g, '').toUpperCase();
  if (rootFp !== APPLE_ROOT_CA_G3_FP) {
    throw new Error(`Untrusted root CA fingerprint: ${rootFp}`);
  }

  // Verify JWS using the leaf cert public key
  const leafPem = pemFromBase64(x5c[0]);
  const publicKey = await importX509(leafPem, header.alg as string);
  const { payload } = await compactVerify(token, publicKey);
  return JSON.parse(new TextDecoder().decode(payload)) as T;
}

export async function handleAppleNotification(req: Request, res: Response) {
  // Apple expects a fast 2xx, otherwise it retries. Always ack first, do work after.
  res.status(200).json({ received: true });

  try {
    const { signedPayload } = (req.body || {}) as { signedPayload?: string };
    if (!signedPayload || typeof signedPayload !== 'string') {
      console.warn('[Apple Webhook] Missing or invalid signedPayload');
      return;
    }

    const notification = await verifyAppleJWS<NotificationPayload>(signedPayload);
    console.log(
      `[Apple Webhook] ${notification.notificationType}/${notification.subtype || '-'} ` +
      `(${notification.notificationUUID})`,
    );

    // Optional bundleId pinning
    const expectedBundle = process.env.APPLE_BUNDLE_ID;
    if (expectedBundle && notification.data.bundleId !== expectedBundle) {
      console.warn(`[Apple Webhook] Unexpected bundleId ${notification.data.bundleId}`);
      return;
    }

    if (notification.notificationType === 'TEST') return;

    if (!notification.data.signedTransactionInfo) {
      console.log('[Apple Webhook] No signedTransactionInfo, ignoring');
      return;
    }

    const tx = await verifyAppleJWS<TransactionInfo>(notification.data.signedTransactionInfo);
    await processNotification(notification, tx);
  } catch (err) {
    console.error('[Apple Webhook] Error processing notification:', err);
  }
}

async function processNotification(notification: NotificationPayload, tx: TransactionInfo) {
  const { notificationType, subtype } = notification;
  const productInfo = APPLE_PRODUCT_MAP[tx.productId];
  if (!productInfo) {
    console.warn(`[Apple Webhook] Unknown productId ${tx.productId}`);
    return;
  }

  // We can only act on subscriptions that are already linked to a user.
  // The first /api/iap/verify call from the device binds userId; webhooks
  // for un-bound subscriptions are ignored (will be picked up on next verify).
  const existing = await db.select()
    .from(subscriptions)
    .where(and(
      eq(subscriptions.originalTransactionId, tx.originalTransactionId),
      eq(subscriptions.source, 'apple'),
    ))
    .limit(1);

  if (existing.length === 0) {
    console.log(
      `[Apple Webhook] No subscription bound for originalTransactionId=${tx.originalTransactionId}; ` +
      `will be reconciled on next verify call.`,
    );
    return;
  }

  const sub = existing[0];
  const now = new Date();
  const purchaseDate = new Date(tx.purchaseDate);
  const expiresDate = tx.expiresDate ? new Date(tx.expiresDate) : null;

  switch (notificationType) {
    case 'SUBSCRIBED':
    case 'DID_RENEW':
    case 'OFFER_REDEEMED': {
      await db.update(subscriptions)
        .set({
          storeTransactionId: tx.transactionId,
          endDate: expiresDate,
          status: 'active',
          lastVerifiedAt: now,
          nextRenewalCheck: expiresDate
            ? new Date(expiresDate.getTime() - 24 * 60 * 60 * 1000)
            : null,
        })
        .where(eq(subscriptions.id, sub.id));

      await appendReceiptIfMissing(sub.id, sub.userId, productInfo, tx, notification, purchaseDate);
      break;
    }

    case 'EXPIRED':
    case 'GRACE_PERIOD_EXPIRED': {
      await db.update(subscriptions)
        .set({ status: 'expired', lastVerifiedAt: now })
        .where(eq(subscriptions.id, sub.id));
      console.log(`[Apple Webhook] Marked ${sub.id} expired (${notificationType}/${subtype || '-'})`);
      break;
    }

    case 'REVOKE': {
      await db.update(subscriptions)
        .set({ status: 'revoked', lastVerifiedAt: now })
        .where(eq(subscriptions.id, sub.id));
      console.log(`[Apple Webhook] Marked ${sub.id} revoked`);
      break;
    }

    case 'REFUND': {
      await db.update(subscriptions)
        .set({ status: 'refunded', lastVerifiedAt: now })
        .where(eq(subscriptions.id, sub.id));
      const receipt = await db.select()
        .from(paymentReceipts)
        .where(eq(paymentReceipts.externalPaymentId, tx.transactionId))
        .limit(1);
      if (receipt.length > 0) {
        await db.update(paymentReceipts)
          .set({ status: 'refunded', processedAt: now })
          .where(eq(paymentReceipts.id, receipt[0].id));
      }
      console.log(`[Apple Webhook] Marked ${sub.id} refunded (tx ${tx.transactionId})`);
      break;
    }

    case 'DID_FAIL_TO_RENEW':
    case 'DID_CHANGE_RENEWAL_STATUS':
    case 'DID_CHANGE_RENEWAL_PREF':
    case 'PRICE_INCREASE':
    case 'REFUND_DECLINED':
    case 'REFUND_REVERSED':
      console.log(`[Apple Webhook] Acknowledged ${notificationType}/${subtype || '-'} for ${sub.id}`);
      break;

    default:
      console.log(`[Apple Webhook] Unhandled notificationType: ${notificationType}`);
  }
}

async function appendReceiptIfMissing(
  subscriptionId: string,
  userId: string | null,
  productInfo: typeof APPLE_PRODUCT_MAP[string],
  tx: TransactionInfo,
  notification: NotificationPayload,
  purchaseDate: Date,
) {
  if (!userId) {
    console.warn(`[Apple Webhook] Subscription ${subscriptionId} has no userId; cannot append receipt`);
    return;
  }
  const u = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const now = new Date();
  // Atomic upsert: relies on the unique index on (paymentProvider, externalPaymentId)
  // to keep concurrent deliveries from inserting duplicate receipts.
  const inserted = await db.insert(paymentReceipts).values({
    externalPaymentId: tx.transactionId,
    paymentProvider: 'apple',
    paymentType: productInfo.durationDays ? 'subscription' : 'payment',
    userId,
    userEmail: u[0]?.email || null,
    planType: productInfo.planType,
    subscriptionDays: productInfo.durationDays,
    isLifetime: !productInfo.durationDays,
    grossAmount: Math.round(parseFloat(productInfo.amount) * 100),
    feeAmount: 0,
    taxAmount: 0,
    netAmount: Math.round(parseFloat(productInfo.amount) * 100),
    status: 'approved',
    origin: 'webhook',
    providerRawData: { notification, tx } as any,
    isValidated: true,
    validatedAt: now,
    subscriptionId,
    activatedAt: now,
    paymentDate: purchaseDate,
  })
  .onConflictDoNothing({ target: [paymentReceipts.paymentProvider, paymentReceipts.externalPaymentId] })
  .returning({ id: paymentReceipts.id });

  if (inserted.length > 0) {
    console.log(`[Apple Webhook] Appended receipt for sub ${subscriptionId} (tx ${tx.transactionId})`);
  } else {
    console.log(`[Apple Webhook] Receipt already existed for tx ${tx.transactionId} (idempotent skip)`);
  }
}
