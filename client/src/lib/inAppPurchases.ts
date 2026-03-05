/**
 * In-App Purchases Library
 * Handles iOS (StoreKit) and Android (Google Play Billing) purchases
 * Falls back to Mercado Pago for web
 */

import { isNative, platform, isIOS, isAndroid } from './capacitor';
import { apiRequest } from './queryClient';

// Product IDs by platform
export const PRODUCT_IDS = {
  ios: {
    gold_monthly:    'com.bibliainteligente.gold_monthly',
    gold_annual:     'com.bibliainteligente.gold_annual',
    premium_monthly: 'com.bibliainteligente.premium_monthly',
    premium_annual:  'com.bibliainteligente.premium_annual',
    strong_lifetime: 'com.bibliainteligente.strong_lifetime',
  },
  android: {
    gold_monthly:    'gold_monthly',
    gold_annual:     'gold_annual',
    premium_monthly: 'premium_monthly',
    premium_annual:  'premium_annual',
    strong_lifetime: 'strong_lifetime',
  },
  web: {
    gold_monthly:    'gold',
    gold_annual:     'gold_anual',
    premium_monthly: 'premium',
    premium_annual:  'premium_anual',
    strong_lifetime: 'vitalicio',
  },
};

// Plan display info
export const PLAN_INFO = {
  gold: {
    name: 'Gold Mensal',
    price: 'R$ 9,90/mês',
    features: ['Acesso ao Dicionário Strong', 'IA Essencial (30 perguntas/dia)'],
  },
  gold_anual: {
    name: 'Gold Anual',
    price: 'R$ 79,90/ano',
    features: ['Acesso ao Dicionário Strong', 'IA Essencial (30 perguntas/dia)', 'Economize 33%'],
  },
  premium: {
    name: 'Premium Mensal',
    price: 'R$ 19,90/mês',
    features: ['Tudo do Gold', 'IA Premium (100 perguntas/dia)', 'Exegese avançada'],
  },
  premium_anual: {
    name: 'Premium Anual',
    price: 'R$ 129,90/ano',
    features: ['Tudo do Gold', 'IA Premium (100 perguntas/dia)', 'Exegese avançada', 'Economize 46%'],
  },
  strong_lifetime: {
    name: 'Strong Vitalício',
    price: 'R$ 49,90 único',
    features: ['Acesso permanente ao Dicionário Strong', 'Sem mensalidade'],
  },
};

interface IAPProduct {
  productId: string;
  planType: string;
  price: string;
  localizedPrice?: string;
  currency: string;
  title?: string;
  description?: string;
}

interface PurchaseResult {
  success: boolean;
  error?: string;
  subscription?: {
    id: string;
    planType: string;
    status: string;
    endDate?: string | null;
  };
}

// Cache for IAP plugin instance
let iapPluginPromise: Promise<any> | null = null;

/**
 * Dynamically import the Capacitor IAP plugin
 * Only loads on native platforms
 */
async function getIAPPlugin(): Promise<any> {
  if (!isNative) return null;
  
  if (!iapPluginPromise) {
    iapPluginPromise = (async () => {
      try {
        // Try to import capacitor-purchases plugin (RevenueCat)
        // @ts-ignore - may not be installed
        const module = await import('@revenuecat/purchases-capacitor');
        return module.Purchases;
      } catch {
        console.log('[IAP] RevenueCat plugin not available');
        return null;
      }
    })();
  }
  
  return iapPluginPromise;
}

/**
 * Check if in-app purchases are available on this platform
 */
export function isPurchaseAvailable(): boolean {
  return true; // Web always available via Mercado Pago, native uses IAP
}

/**
 * Get the payment method for current platform
 */
export function getPaymentMethod(): 'apple' | 'google' | 'mercadopago' {
  if (isIOS) return 'apple';
  if (isAndroid) return 'google';
  return 'mercadopago';
}

/**
 * Get product ID for current platform
 */
export function getProductId(planType: 'gold' | 'gold_anual' | 'premium' | 'premium_anual' | 'strong_lifetime'): string {
  const platformKey = platform === 'ios' ? 'ios' :
                      platform === 'android' ? 'android' : 'web';
  const ids = PRODUCT_IDS[platformKey];
  
  const mapping: Record<string, keyof typeof PRODUCT_IDS.android> = {
    gold:            'gold_monthly',
    gold_anual:      'gold_annual',
    premium:         'premium_monthly',
    premium_anual:   'premium_annual',
    strong_lifetime: 'strong_lifetime',
  };
  
  return ids[mapping[planType]] || planType;
}

/**
 * Get available products for current platform
 */
export async function getProducts(): Promise<IAPProduct[]> {
  try {
    const response = await fetch(`/api/iap/products?platform=${platform}`);
    const data = await response.json();
    return data.products || [];
  } catch (error) {
    console.error('[IAP] Error fetching products:', error);
    // Return default products
    return Object.entries(PLAN_INFO).map(([key, info]) => ({
      productId: getProductId(key as any),
      planType: key,
      price: info.price,
      currency: 'BRL',
    }));
  }
}

/**
 * Purchase a subscription or one-time product
 */
export async function purchaseProduct(planType: 'gold' | 'premium' | 'strong_lifetime'): Promise<PurchaseResult> {
  const paymentMethod = getPaymentMethod();
  
  console.log('[IAP] Starting purchase:', { planType, paymentMethod });
  
  if (paymentMethod === 'mercadopago') {
    // Redirect to Mercado Pago checkout (existing flow)
    return purchaseWithMercadoPago(planType);
  }
  
  if (paymentMethod === 'apple') {
    return purchaseWithApple(planType);
  }
  
  if (paymentMethod === 'google') {
    return purchaseWithGoogle(planType);
  }
  
  return { success: false, error: 'Plataforma não suportada' };
}

/**
 * Purchase with Mercado Pago (Web)
 */
async function purchaseWithMercadoPago(planType: string): Promise<PurchaseResult> {
  try {
    const response = await apiRequest('POST', '/api/mp/create-checkout', { plan: planType });
    const data = await response.json();
    
    if (data.initPoint || data.checkoutUrl) {
      // Redirect to Mercado Pago checkout
      window.location.href = data.initPoint || data.checkoutUrl;
      return { success: true };
    }
    
    return { success: false, error: data.error || 'Erro ao criar checkout' };
  } catch (error) {
    console.error('[IAP] Mercado Pago error:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Purchase with Apple StoreKit (iOS)
 */
async function purchaseWithApple(planType: string): Promise<PurchaseResult> {
  const productId = getProductId(planType as any);
  
  try {
    const plugin = await getIAPPlugin();
    
    if (!plugin) {
      // No IAP plugin - this should only happen in development
      // In production on iOS, the plugin would be available
      if (import.meta.env.PROD) {
        console.error('[IAP] Apple IAP plugin not available');
        return { success: false, error: 'Compras não disponíveis nesta versão' };
      }
      
      // Development mode - call backend which handles its own test mode
      console.log('[IAP] Dev mode: sending test purchase to backend');
      return await verifyApplePurchase({
        productId,
        transactionId: `dev_test_${Date.now()}`,
        originalTransactionId: `dev_test_orig_${Date.now()}`,
        receiptData: 'dev_test_receipt_data',
      });
    }
    
    // Real purchase flow with plugin
    const purchaseResult = await plugin.purchase({ productId });
    
    if (!purchaseResult.customerInfo?.entitlements?.active) {
      return { success: false, error: 'Compra não concluída' };
    }
    
    // Verify with backend
    return await verifyApplePurchase({
      productId,
      transactionId: purchaseResult.transaction?.transactionId,
      originalTransactionId: purchaseResult.transaction?.originalTransactionId,
      receiptData: purchaseResult.transaction?.receipt,
    });
    
  } catch (error: any) {
    if (error.code === 'USER_CANCELLED') {
      return { success: false, error: 'Compra cancelada' };
    }
    console.error('[IAP] Apple purchase error:', error);
    return { success: false, error: error.message || String(error) };
  }
}

/**
 * Purchase with Google Play Billing (Android)
 */
async function purchaseWithGoogle(planType: string): Promise<PurchaseResult> {
  const productId = getProductId(planType as any);
  
  try {
    const plugin = await getIAPPlugin();
    
    if (!plugin) {
      // No IAP plugin - this should only happen in development
      // In production on Android, the plugin would be available
      if (import.meta.env.PROD) {
        console.error('[IAP] Google IAP plugin not available');
        return { success: false, error: 'Compras não disponíveis nesta versão' };
      }
      
      // Development mode - call backend which handles its own test mode
      console.log('[IAP] Dev mode: sending test purchase to backend');
      return await verifyGooglePurchase({
        productId,
        purchaseToken: `dev_test_token_${Date.now()}`,
        orderId: `dev_test_order_${Date.now()}`,
      });
    }
    
    // Real purchase flow with plugin
    const purchaseResult = await plugin.purchase({ productId });
    
    if (!purchaseResult.customerInfo?.entitlements?.active) {
      return { success: false, error: 'Compra não concluída' };
    }
    
    // Verify with backend
    return await verifyGooglePurchase({
      productId,
      purchaseToken: purchaseResult.transaction?.purchaseToken,
      orderId: purchaseResult.transaction?.orderId,
    });
    
  } catch (error: any) {
    if (error.code === 'USER_CANCELLED') {
      return { success: false, error: 'Compra cancelada' };
    }
    console.error('[IAP] Google purchase error:', error);
    return { success: false, error: error.message || String(error) };
  }
}

/**
 * Verify Apple purchase with backend
 */
async function verifyApplePurchase(data: {
  productId: string;
  transactionId: string;
  originalTransactionId: string;
  receiptData: string;
}): Promise<PurchaseResult> {
  try {
    const response = await apiRequest('POST', '/api/iap/verify/apple', data);
    return await response.json();
  } catch (error) {
    console.error('[IAP] Apple verification error:', error);
    return { success: false, error: 'Erro ao verificar compra' };
  }
}

/**
 * Verify Google purchase with backend
 */
async function verifyGooglePurchase(data: {
  productId: string;
  purchaseToken: string;
  orderId: string;
}): Promise<PurchaseResult> {
  try {
    const response = await apiRequest('POST', '/api/iap/verify/google', data);
    return await response.json();
  } catch (error) {
    console.error('[IAP] Google verification error:', error);
    return { success: false, error: 'Erro ao verificar compra' };
  }
}

/**
 * Restore previous purchases
 */
export async function restorePurchases(): Promise<{ success: boolean; restored: number; error?: string }> {
  const paymentMethod = getPaymentMethod();
  
  console.log('[IAP] Restoring purchases for:', paymentMethod);
  
  if (paymentMethod === 'mercadopago') {
    // Web users - purchases are linked to account, just refresh status
    try {
      const response = await fetch('/api/iap/status');
      const data = await response.json();
      return { 
        success: true, 
        restored: data.allSubscriptions?.length || 0 
      };
    } catch (error) {
      return { success: false, restored: 0, error: String(error) };
    }
  }
  
  try {
    const plugin = await getIAPPlugin();
    
    if (!plugin) {
      // Test mode
      return { success: true, restored: 0 };
    }
    
    // Get all purchases from store
    const restoreInfo = await plugin.restorePurchases();
    
    if (paymentMethod === 'apple') {
      const response = await apiRequest('POST', '/api/iap/restore/apple', {
        receiptData: restoreInfo.receipt,
      });
      return await response.json();
    }
    
    if (paymentMethod === 'google') {
      const purchases = restoreInfo.purchases?.map((p: any) => ({
        productId: p.productId,
        purchaseToken: p.purchaseToken,
        orderId: p.orderId,
      })) || [];
      
      const response = await apiRequest('POST', '/api/iap/restore/google', { purchases });
      return await response.json();
    }
    
    return { success: false, restored: 0, error: 'Plataforma não suportada' };
    
  } catch (error) {
    console.error('[IAP] Restore error:', error);
    return { success: false, restored: 0, error: String(error) };
  }
}

/**
 * Get current subscription status
 */
export async function getSubscriptionStatus(): Promise<{
  hasActiveSubscription: boolean;
  subscription: any;
  allSubscriptions: any[];
}> {
  try {
    const response = await fetch('/api/iap/status');
    if (!response.ok) {
      throw new Error('Failed to get status');
    }
    return await response.json();
  } catch (error) {
    console.error('[IAP] Status error:', error);
    return {
      hasActiveSubscription: false,
      subscription: null,
      allSubscriptions: [],
    };
  }
}
