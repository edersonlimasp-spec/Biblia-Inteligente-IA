/**
 * In-App Purchase API Routes
 * Handles verification and processing of Apple StoreKit and Google Play Billing purchases
 */

import { Router, Request, Response, NextFunction } from 'express';
import { processApplePurchase, restoreApplePurchases, APPLE_PRODUCT_MAP } from './apple';
import { processGooglePurchase, restoreGooglePurchases, GOOGLE_PRODUCT_MAP } from './google';
import { db } from '../db';
import { subscriptions } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

const router = Router();

// Extend Express Request type to include user
interface AuthenticatedRequest extends Request {
  user?: { id: string; email?: string; role?: string };
}

// Middleware to require authentication
function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

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
      { planType: 'gold', price: '9.90', currency: 'BRL', durationDays: 30 },
      { planType: 'premium', price: '19.90', currency: 'BRL', durationDays: 30 },
      { planType: 'strong_lifetime', price: '49.90', currency: 'BRL', durationDays: null, isLifetime: true },
    ],
  });
});

/**
 * POST /api/iap/verify/apple
 * Verify and process an Apple StoreKit purchase
 */
router.post('/verify/apple', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { receiptData, productId, transactionId, originalTransactionId } = req.body;
    const userId = req.user!.id;

    if (!receiptData || !productId || !transactionId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log('[IAP API] Apple verification request:', { userId, productId, transactionId });

    const result = await processApplePurchase(
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
router.post('/verify/google', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { productId, purchaseToken, orderId } = req.body;
    const userId = req.user!.id;

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
router.post('/restore/apple', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { receiptData } = req.body;
    const userId = req.user!.id;

    if (!receiptData) {
      return res.status(400).json({ error: 'Receipt data required' });
    }

    console.log('[IAP API] Apple restore request for user:', userId);

    const result = await restoreApplePurchases(userId, receiptData);

    return res.json({
      success: result.success,
      restored: result.restored,
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
router.post('/restore/google', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { purchases } = req.body;
    const userId = req.user!.id;

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
 * GET /api/iap/status
 * Get current subscription status for the authenticated user (includes native purchases)
 */
router.get('/status', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;

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
