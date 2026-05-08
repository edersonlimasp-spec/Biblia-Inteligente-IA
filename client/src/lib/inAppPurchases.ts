/**
 * In-App Purchases Library
 * Handles iOS (StoreKit) and Android (Google Play Billing) purchases
 * Falls back to Mercado Pago for web
 */

import { isNative, platform, isIOS, isAndroid } from './capacitor';
import { apiRequest, getApiUrl } from './queryClient';

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
    // IDs exatos cadastrados no Google Play Console (não podem ser renomeados)
    gold_monthly:    'biblia_gold_mensal',
    gold_annual:     'biblia_gold_anual',
    premium_monthly: 'biblia_premium_mensal',
    premium_annual:  'premium_anual',
    strong_lifetime: 'biblia_strong_vitalicio',
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

/**
 * Returns null — purchases are handled via our custom backend API (no RevenueCat dependency).
 * The purchase flow calls /api/iap/verify/google or /api/iap/verify/apple directly.
 */
async function getIAPPlugin(): Promise<null> {
  return null;
}

// ── Google Play Billing via cordova-plugin-purchase (CdvPurchase v13) ─────
// O plugin expõe o objeto global window.CdvPurchase quando rodando no
// Android dentro do Capacitor (após cap sync). Toda a integração fica isolada
// neste módulo para não quebrar a build web.
let _cdvStoreReady: Promise<any> | null = null;

// Aguardar o objeto window.CdvPurchase aparecer (até 10s). Em algumas
// builds Capacitor o bridge pode demorar um pouco mais que `deviceready`.
async function _waitForCdvPurchase(timeoutMs = 10_000): Promise<any | null> {
  const w = window as any;
  if (w.CdvPurchase?.store) return w.CdvPurchase;

  return new Promise((resolve) => {
    const start = Date.now();
    const onReady = () => {
      if (w.CdvPurchase?.store) {
        document.removeEventListener('deviceready', onReady);
        resolve(w.CdvPurchase);
      }
    };
    document.addEventListener('deviceready', onReady, { once: false });

    const interval = setInterval(() => {
      if (w.CdvPurchase?.store) {
        clearInterval(interval);
        document.removeEventListener('deviceready', onReady);
        resolve(w.CdvPurchase);
      } else if (Date.now() - start > timeoutMs) {
        clearInterval(interval);
        document.removeEventListener('deviceready', onReady);
        console.error('[IAP] Timeout esperando CdvPurchase ficar disponível');
        resolve(null);
      }
    }, 200);
  });
}

// Fila de transações aguardando aprovação. A chave principal é a tupla
// (productId, transactionId/orderId) — assim listeners globais podem
// rotear corretamente cada transação para a Promise certa.
type PendingTx = {
  productId: string;
  resolve: (r: PurchaseResult) => void;
  createdAt: number;
};
const _pendingPurchases: PendingTx[] = [];
let _listenersRegistered = false;

function _routeApprovedTransaction(transaction: any): PendingTx | null {
  const txProductId =
    transaction?.products?.[0]?.id ||
    transaction?.productId ||
    null;
  if (!txProductId) return null;
  // Pega o pedido pendente mais antigo desse produto
  const idx = _pendingPurchases.findIndex(p => p.productId === txProductId);
  if (idx === -1) return null;
  return _pendingPurchases.splice(idx, 1)[0];
}

async function getGooglePlayStore(): Promise<any | null> {
  if (!isAndroid || !isNative) return null;

  const cdv = await _waitForCdvPurchase();
  if (!cdv) return null;

  const { store, ProductType, Platform } = cdv;

  if (!_cdvStoreReady) {
    _cdvStoreReady = (async () => {
      // Registrar produtos antes de initialize.
      // IDs DEVEM bater exatamente com os cadastrados no Play Console.
      store.register([
        { id: 'biblia_gold_mensal',     type: ProductType.PAID_SUBSCRIPTION, platform: Platform.GOOGLE_PLAY },
        { id: 'biblia_gold_anual',      type: ProductType.PAID_SUBSCRIPTION, platform: Platform.GOOGLE_PLAY },
        { id: 'biblia_premium_mensal',  type: ProductType.PAID_SUBSCRIPTION, platform: Platform.GOOGLE_PLAY },
        { id: 'premium_anual',          type: ProductType.PAID_SUBSCRIPTION, platform: Platform.GOOGLE_PLAY },
        { id: 'biblia_strong_vitalicio',type: ProductType.NON_CONSUMABLE,    platform: Platform.GOOGLE_PLAY },
      ]);

      if (!_listenersRegistered) {
        _listenersRegistered = true;

        // Listener global de erros para diagnóstico — e para resolver
        // pedidos pendentes quando o erro vem do checkout.
        store.error((err: any) => {
          console.error('[IAP][CdvPurchase] error:', err?.code, err?.message || err);
        });

        store.when()
          .approved(async (transaction: any) => {
            const pending = _routeApprovedTransaction(transaction);

            const purchaseToken =
              transaction?.purchaseToken ||
              transaction?.nativePurchase?.purchaseToken ||
              '';
            const orderId =
              transaction?.transactionId ||
              transaction?.nativePurchase?.orderId ||
              '';
            const productId =
              transaction?.products?.[0]?.id ||
              transaction?.productId ||
              pending?.productId ||
              '';

            if (!purchaseToken || !orderId || !productId) {
              console.error('[IAP] Transação aprovada sem dados completos', transaction);
              pending?.resolve({ success: false, error: 'Transação inválida (token ausente)' });
              return;
            }

            try {
              const result = await verifyGooglePurchase({
                productId,
                purchaseToken,
                orderId,
              });

              if (result.success) {
                try {
                  await transaction.finish();
                } catch (e) {
                  console.warn('[IAP] Falha ao finalizar transação no plugin (ignorável):', e);
                }
              }

              // Se houver consumidor pendente, resolve. Caso contrário, foi
              // uma transação espontânea (restore/renovação) — só verificamos.
              pending?.resolve(result);
            } catch (e: any) {
              console.error('[IAP] Erro processando transação aprovada:', e);
              pending?.resolve({ success: false, error: e?.message || String(e) });
            }
          });
      }

      await store.initialize([Platform.GOOGLE_PLAY]);
      await store.update();
      console.log('[IAP] CdvPurchase store inicializada com sucesso');
      return store;
    })().catch(e => {
      console.error('[IAP] Falha ao inicializar CdvPurchase store:', e);
      _cdvStoreReady = null;
      _listenersRegistered = false;
      throw e;
    });
  }

  return _cdvStoreReady;
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
    const response = await fetch(getApiUrl(`/api/iap/products?platform=${platform}`));
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

    // Backend retorna `init_point` (snake_case do Mercado Pago).
    const checkoutUrl = data.init_point || data.initPoint || data.checkoutUrl;

    if (checkoutUrl) {
      // Em Capacitor (nativo), abrir no navegador externo do sistema, evitando
      // problemas de CSP/redirect dentro da WebView.
      if (isNative && typeof window !== 'undefined') {
        window.open(checkoutUrl, '_system');
      } else {
        window.location.href = checkoutUrl;
      }
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
      // iOS: NUNCA podemos usar Mercado Pago como fallback (compliance Apple).
      // Falhamos com mensagem clara até StoreKit ser integrado.
      console.error('[IAP] Apple StoreKit plugin não instalado nesta build');
      return {
        success: false,
        error: 'Compras dentro do app estarão disponíveis em breve. Atualize o aplicativo na App Store quando uma nova versão estiver disponível.',
      };
    }
    
    // Real purchase flow with plugin
    const purchaseResult = await (plugin as any).purchase({ productId });
    
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
    const store = await getGooglePlayStore();

    if (!store) {
      // Plugin nativo não está disponível nesta build (ex.: APK antigo, ou
      // rodando no navegador). Não há fallback para Mercado Pago no Android
      // dentro do app — política do Google Play exige IAP para conteúdo digital.
      console.error('[IAP] Google Play Billing indisponível nesta build');
      return {
        success: false,
        error: 'Compras dentro do app indisponíveis nesta versão. Atualize o app pelo Google Play.',
      };
    }

    const product = store.get(productId);
    if (!product) {
      console.error('[IAP] Produto não encontrado no store:', productId);
      return {
        success: false,
        error: `Produto não disponível (${productId}). Verifique a configuração no Google Play Console.`,
      };
    }

    const offer = product.getOffer();
    if (!offer) {
      return { success: false, error: 'Oferta indisponível para este produto' };
    }

    // Registra a transação pendente ANTES de chamar order(), para que o
    // listener .approved() global consiga rotear corretamente.
    let resolvePending!: (r: PurchaseResult) => void;
    const verificationPromise = new Promise<PurchaseResult>((resolve) => {
      resolvePending = resolve;
    });
    const pendingEntry: PendingTx = {
      productId,
      resolve: resolvePending,
      createdAt: Date.now(),
    };
    _pendingPurchases.push(pendingEntry);

    // Timeout defensivo de 2 minutos — também limpa a fila.
    const timeoutId = setTimeout(() => {
      const idx = _pendingPurchases.indexOf(pendingEntry);
      if (idx !== -1) _pendingPurchases.splice(idx, 1);
      resolvePending({ success: false, error: 'Tempo esgotado aguardando aprovação da compra' });
    }, 120_000);

    // Disparar o checkout do Google Play. order() retorna IError em caso de
    // falha imediata (rede, billing indisponível, usuário cancelou no diálogo).
    const orderResult: any = await store.order(offer);
    if (orderResult && (orderResult.code !== undefined || orderResult.isError)) {
      clearTimeout(timeoutId);
      const idx = _pendingPurchases.indexOf(pendingEntry);
      if (idx !== -1) _pendingPurchases.splice(idx, 1);

      // Códigos comuns: 6500 = cancelado pelo usuário; outros = erro real.
      const code = orderResult.code;
      if (code === 6500 || code === 'USER_CANCELLED') {
        return { success: false, error: 'Compra cancelada' };
      }
      console.error('[IAP] store.order() retornou erro:', orderResult);
      return {
        success: false,
        error: orderResult.message || `Erro ao iniciar compra (código ${code ?? 'desconhecido'})`,
      };
    }

    const result = await verificationPromise;
    clearTimeout(timeoutId);
    return result;
  } catch (error: any) {
    if (error?.code === 'USER_CANCELLED' || error?.code === 6500) {
      return { success: false, error: 'Compra cancelada' };
    }
    console.error('[IAP] Google purchase error:', error);
    return { success: false, error: error?.message || String(error) };
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
      const response = await fetch(getApiUrl('/api/iap/status'));
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
    if (paymentMethod === 'google') {
      const store = await getGooglePlayStore();
      if (!store) {
        return { success: false, restored: 0, error: 'Google Play Billing indisponível' };
      }

      // Disparar restore nativo
      try {
        await store.restorePurchases();
      } catch (e) {
        console.warn('[IAP] restorePurchases nativo lançou erro:', e);
      }

      // Coletar transações conhecidas e enviar ao backend
      const purchases: Array<{ productId: string; purchaseToken: string; orderId: string }> = [];
      const localReceipts = store.localReceipts || [];
      for (const receipt of localReceipts) {
        for (const tx of receipt.transactions || []) {
          const purchaseToken =
            tx.purchaseToken || tx.nativePurchase?.purchaseToken || '';
          const orderId = tx.transactionId || tx.nativePurchase?.orderId || '';
          const productId = tx.products?.[0]?.id || tx.productId || '';
          if (purchaseToken && orderId && productId) {
            purchases.push({ productId, purchaseToken, orderId });
          }
        }
      }

      if (purchases.length === 0) {
        return { success: true, restored: 0 };
      }

      const response = await apiRequest('POST', '/api/iap/restore/google', { purchases });
      return await response.json();
    }

    if (paymentMethod === 'apple') {
      // Apple StoreKit ainda não integrado nesta build.
      return { success: true, restored: 0 };
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
    const response = await fetch(getApiUrl('/api/iap/status'));
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
