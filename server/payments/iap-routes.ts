/**
 * In-App Purchase API Routes
 * Handles verification and processing of Apple StoreKit and Google Play Billing purchases
 */

import { Router, Request, Response, NextFunction } from 'express';
import { processApplePurchase, processAppleStoreKit2Purchase, restoreApplePurchases, restoreAppleStoreKit2Purchase, APPLE_PRODUCT_MAP } from './apple';
import { processGooglePurchase, restoreGooglePurchases, GOOGLE_PRODUCT_MAP } from './google';
import { db } from '../db';
import { subscriptions } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { ensureAuthenticated, type AuthRequest } from '../auth';

const router = Router();

/**
 * GET /api/iap/products
 * Returns available products for the platform
 */
router.get('/products', (req: Request, res: Response) => {
  const platform = req.query.platform as string || 'web';
  
  if (platform === 'ios') {
    const products = Object.entries(APPLE_PRODUCT_MAP).map(([id, info]) => ({
      productId: id,
      planType: info.planType,
      price: info.amount,
      currency: 'BRL',
      durationDays: info.durationDays,
      isLifetime: !info.durationDays,
    }));
    return res.json({ platform: 'ios', products });
  }
  
  if (platform === 'android') {
    const products = Object.entries(GOOGLE_PRODUCT_MAP).map(([id, info]) => ({
      productId: id,
      planType: info.planType,
      price: info.amount,
      currency: 'BRL',
      durationDays: info.durationDays,
      isLifetime: !info.durationDays,
      isSubscription: info.isSubscription,
    }));
    return res.json({ platform: 'android', products });
  }
  
  // Web - return Mercado Pago products (existing flow)
  return res.json({
    platform: 'web',
    products: [
      { planType: 'gold',            price: '9.90',   currency: 'BRL', durationDays: 30,  isSubscription: true  },
      { planType: 'gold_anual',      price: '79.90',  currency: 'BRL', durationDays: 365, isSubscription: true  },
      { planType: 'premium',         price: '19.90',  currency: 'BRL', durationDays: 30,  isSubscription: true  },
      { planType: 'premium_anual',   price: '129.90', currency: 'BRL', durationDays: 365, isSubscription: true  },
      { planType: 'strong_lifetime', price: '49.90',  currency: 'BRL', durationDays: null, isLifetime: true, isSubscription: false },
    ],
  });
});

/**
 * POST /api/iap/verify/apple
 * Verify and process an Apple StoreKit purchase
 */
router.post('/verify/apple', ensureAuthenticated, async (req: AuthRequest, res: Response) => {
  try {
    const { receiptData, signedTransaction, productId, transactionId, originalTransactionId } = req.body;
    const userId = req.userId!;

    if ((!receiptData && !signedTransaction) || !productId || !transactionId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    if (receiptData && signedTransaction) {
      return res.status(400).json({ error: 'Provide either receiptData or signedTransaction, not both' });
    }

    console.log('[IAP API] Apple verification request:', { userId, productId, transactionId });

    const result = signedTransaction
      ? (!originalTransactionId
        ? { success: false, error: 'originalTransactionId is required for signedTransaction' }
        : await processAppleStoreKit2Purchase(userId, {
          signedTransaction,
          productId,
          transactionId,
          originalTransactionId,
        }))
      : await processApplePurchase(
        userId,
        receiptData,
        productId,
        transactionId,
        originalTransactionId || transactionId
      );

    if (result.success) {
      return res.json({
        success: true,
        subscription: {
          id: result.subscription.id,
          planType: result.subscription.planType,
          status: result.subscription.status,
          endDate: result.subscription.endDate,
        },
      });
    } else {
      return res.status(400).json({ error: result.error });
    }

  } catch (error) {
    console.error('[IAP API] Apple verification error:', error);
    return res.status(500).json({ error: 'Verification failed' });
  }
});

/**
 * POST /api/iap/verify/google
 * Verify and process a Google Play Billing purchase
 */
router.post('/verify/google', ensureAuthenticated, async (req: AuthRequest, res: Response) => {
  try {
    const { productId, purchaseToken, orderId } = req.body;
    const userId = req.userId!;

    if (!productId || !purchaseToken || !orderId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log('[IAP API] Google verification request:', { userId, productId, orderId });

    const result = await processGooglePurchase(userId, productId, purchaseToken, orderId);

    if (result.success) {
      return res.json({
        success: true,
        subscription: {
          id: result.subscription.id,
          planType: result.subscription.planType,
          status: result.subscription.status,
          endDate: result.subscription.endDate,
        },
      });
    } else {
      return res.status(400).json({ error: result.error });
    }

  } catch (error) {
    console.error('[IAP API] Google verification error:', error);
    return res.status(500).json({ error: 'Verification failed' });
  }
});

/**
 * POST /api/iap/restore/apple
 * Restore Apple purchases for the authenticated user
 */
router.post('/restore/apple', ensureAuthenticated, async (req: AuthRequest, res: Response) => {
  try {
    const { receiptData, signedTransaction } = req.body;
    const userId = req.userId!;

    if ((!receiptData && !signedTransaction) || (receiptData && signedTransaction)) {
      return res.status(400).json({ error: 'Provide exactly one of receiptData or signedTransaction' });
    }

    console.log('[IAP API] Apple restore request for user:', userId);

    const result = signedTransaction
      ? await restoreAppleStoreKit2Purchase(userId, signedTransaction)
      : await restoreApplePurchases(userId, receiptData);

    return res.json({
      success: result.success,
      restored: signedTransaction ? (result.success ? 1 : 0) : (result as { restored: number }).restored,
      error: result.error,
    });

  } catch (error) {
    console.error('[IAP API] Apple restore error:', error);
    return res.status(500).json({ error: 'Restore failed' });
  }
});

/**
 * POST /api/iap/restore/google
 * Restore Google Play purchases for the authenticated user
 */
router.post('/restore/google', ensureAuthenticated, async (req: AuthRequest, res: Response) => {
  try {
    const { purchases } = req.body;
    const userId = req.userId!;

    if (!purchases || !Array.isArray(purchases)) {
      return res.status(400).json({ error: 'Purchases array required' });
    }

    console.log('[IAP API] Google restore request for user:', userId, 'count:', purchases.length);

    const result = await restoreGooglePurchases(userId, purchases);

    return res.json({
      success: result.success,
      restored: result.restored,
      error: result.error,
    });

  } catch (error) {
    console.error('[IAP API] Google restore error:', error);
    return res.status(500).json({ error: 'Restore failed' });
  }
});

/**
 * POST /api/iap/rtdn/google
 * Google Play Real-Time Developer Notifications (Pub/Sub push).
 *
 * Segurança: o payload NUNCA é confiado — ele só aponta qual purchaseToken
 * verificar; toda atualização passa por re-verificação na Play Developer API.
 * Opcionalmente, defina GOOGLE_RTDN_TOKEN e configure o push endpoint como
 * .../api/iap/rtdn/google?token=<valor> para rejeitar chamadas de terceiros.
 * Respondemos 200 mesmo em casos ignoráveis para o Pub/Sub não reenviar.
 */
const rtdnRate = { windowStart: 0, count: 0 };

router.post('/rtdn/google', async (req: Request, res: Response) => {
  try {
    // Rate limit simples em memória: RTDN legítimo é de baixa frequência.
    const nowMs = Date.now();
    if (nowMs - rtdnRate.windowStart > 60_000) {
      rtdnRate.windowStart = nowMs;
      rtdnRate.count = 0;
    }
    if (++rtdnRate.count > 120) {
      return res.status(429).json({ error: 'Too many requests' });
    }

    const expectedToken = process.env.GOOGLE_RTDN_TOKEN;
    if (!expectedToken) {
      if (process.env.NODE_ENV === 'production') {
        // Sem segredo configurado, o endpoint ficaria aberto a abuso em produção.
        console.error('[Google RTDN] GOOGLE_RTDN_TOKEN não configurado — endpoint desabilitado');
        return res.status(503).json({ error: 'RTDN not configured' });
      }
    } else if (req.query.token !== expectedToken) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const encoded = req.body?.message?.data;
    if (!encoded || typeof encoded !== 'string') {
      return res.status(200).json({ ok: true, ignored: 'no message data' });
    }

    let notification: any;
    try {
      notification = JSON.parse(Buffer.from(encoded, 'base64').toString('utf8'));
    } catch {
      return res.status(200).json({ ok: true, ignored: 'invalid payload' });
    }

    const purchaseToken: string | undefined =
      notification?.subscriptionNotification?.purchaseToken ||
      notification?.voidedPurchaseNotification?.purchaseToken;

    if (!purchaseToken) {
      // testNotification e outros tipos sem token são apenas confirmados
      return res.status(200).json({ ok: true, ignored: 'no purchase token' });
    }

    const { syncGoogleSubscriptionByToken } = await import('./google');
    const outcome = await syncGoogleSubscriptionByToken(purchaseToken);
    console.log('[Google RTDN] notificationType:',
      notification?.subscriptionNotification?.notificationType, '→', outcome);

    if (outcome === 'failed') {
      // Falha transitória (rede/Google API): não confirmar para o Pub/Sub
      // reentregar com backoff.
      return res.status(503).json({ ok: false, outcome });
    }
    return res.status(200).json({ ok: true, outcome });
  } catch (error) {
    console.error('[Google RTDN] Error handling notification:', error);
    // Erro inesperado também é retryável
    return res.status(503).json({ ok: false });
  }
});

/**
 * GET /api/iap/status
 * Get current subscription status for the authenticated user (includes native purchases)
 */
router.get('/status', ensureAuthenticated, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    const userSubscriptions = await db.select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId));

    // Find active subscription (prioritize lifetime, then latest)
    const activeSubscription = userSubscriptions
      .filter(s => s.status === 'active')
      .sort((a, b) => {
        if (a.planType === 'strong_lifetime') return -1;
        if (b.planType === 'strong_lifetime') return 1;
        return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
      })[0];

    return res.json({
      hasActiveSubscription: !!activeSubscription,
      subscription: activeSubscription ? {
        id: activeSubscription.id,
        planType: activeSubscription.planType,
        status: activeSubscription.status,
        source: activeSubscription.source,
        startDate: activeSubscription.startDate,
        endDate: activeSubscription.endDate,
        isLifetime: activeSubscription.planType === 'strong_lifetime',
      } : null,
      allSubscriptions: userSubscriptions.map(s => ({
        id: s.id,
        planType: s.planType,
        status: s.status,
        source: s.source,
        startDate: s.startDate,
        endDate: s.endDate,
      })),
    });

  } catch (error) {
    console.error('[IAP API] Status error:', error);
    return res.status(500).json({ error: 'Failed to get status' });
  }
});

export default router;
