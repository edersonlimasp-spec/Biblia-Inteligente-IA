/**
 * In-App Purchases Library
 * Handles iOS (StoreKit) and Android (Google Play Billing) purchases
 * Falls back to Mercado Pago for web
 */

import { isNative, platform, isIOS, isAndroid } from './capacitor';
import { apiRequest, getApiUrl } from './queryClient';
import { trackPurchaseStep } from './tracking';

// Product IDs by platform
export const PRODUCT_IDS = {
  ios: {
    gold_monthly:    'com.bibliainteligente.gold.monthly',
    gold_annual:     'com.bibliainteligente.gold.yearly',
    premium_monthly: 'com.bibliainteligente.premium.monthly',
    premium_annual:  'com.bibliainteligente.premium.yearly',
    strong_lifetime: 'com.bibliainteligente.strong.lifetime',
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

// ── In-App Purchases via cordova-plugin-purchase (CdvPurchase v13) ────────
// O plugin expõe o objeto global window.CdvPurchase quando rodando dentro
// do Capacitor (Android E iOS, após cap sync + pod install). Toda a
// integração fica isolada neste módulo para não quebrar a build web.
let _cdvStoreReady: Promise<any> | null = null;

// Aguardar o objeto window.CdvPurchase aparecer (até 30s). Em alguns
// dispositivos Android mais lentos o bridge Capacitor/Cordova demora mais.
// Timeout aumentado de 10s → 30s para cobrir dispositivos de entrada.
async function _waitForCdvPurchase(timeoutMs = 30_000): Promise<any | null> {
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
        console.error('[IAP] Timeout esperando CdvPurchase ficar disponível — plugin pode não estar compilado nesta build');
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

// Resolve uma transação pendente quando a store emite um erro ASSÍNCRONO
// (depois de store.order(), via store.error()). Sem isto, a compra ficava
// pendurada até o timeout de 120s — um revisor da Apple veria a compra
// "travada", o que motiva rejeição 2.1. Tenta rotear pelo productId do erro;
// se não houver e existir exatamente uma compra em andamento, resolve essa.
function _routePendingByError(err: any): PendingTx | null {
  const errProductId = err?.productId || err?.product?.id || null;
  if (errProductId) {
    const idx = _pendingPurchases.findIndex(p => p.productId === errProductId);
    if (idx !== -1) return _pendingPurchases.splice(idx, 1)[0];
    return null;
  }
  // Erro genérico sem productId: só resolvemos se houver UMA compra em curso,
  // para não associar o erro à transação errada.
  if (_pendingPurchases.length === 1) {
    return _pendingPurchases.splice(0, 1)[0];
  }
  return null;
}

// ───────────────────────────────────────────────────────────────────────────
// Inicialização unificada do CdvPurchase store (Android Google Play OU iOS App Store).
// O cordova-plugin-purchase v13 é multi-plataforma — registramos os produtos
// da plataforma corrente e o listener .approved() roteia pra Google ou Apple.
// ───────────────────────────────────────────────────────────────────────────
async function _initCdvStore(): Promise<any | null> {
  if (!isNative) return null;
  if (!isAndroid && !isIOS) return null;

  // BUGFIX: Se a store já foi inicializada, retornar imediatamente sem
  // chamar _waitForCdvPurchase novamente (que causava timeout de 30s desnecessário
  // em cada chamada subsequente, mesmo quando o plugin já estava disponível).
  if (_cdvStoreReady) return _cdvStoreReady;

  const cdv = await _waitForCdvPurchase();
  if (!cdv) return null;

  const { store, ProductType, Platform } = cdv;
  const targetPlatform = isIOS ? Platform.APPLE_APPSTORE : Platform.GOOGLE_PLAY;

  if (!_cdvStoreReady) {
    _cdvStoreReady = (async () => {
      // IDs DEVEM bater exatamente com os cadastrados no Console.
      const ids = isIOS ? PRODUCT_IDS.ios : PRODUCT_IDS.android;

      store.register([
        { id: ids.gold_monthly,    type: ProductType.PAID_SUBSCRIPTION, platform: targetPlatform },
        { id: ids.gold_annual,     type: ProductType.PAID_SUBSCRIPTION, platform: targetPlatform },
        { id: ids.premium_monthly, type: ProductType.PAID_SUBSCRIPTION, platform: targetPlatform },
        { id: ids.premium_annual,  type: ProductType.PAID_SUBSCRIPTION, platform: targetPlatform },
        { id: ids.strong_lifetime, type: ProductType.NON_CONSUMABLE,    platform: targetPlatform },
      ]);

      if (!_listenersRegistered) {
        _listenersRegistered = true;

        store.error((err: any) => {
          console.error('[IAP][CdvPurchase] error:', err?.code, err?.message || err);

          // Resolve compras pendentes em vez de deixá-las penduradas até o
          // timeout de 120s. Erros assíncronos da StoreKit/Billing chegam aqui.
          const code = err?.code;
          const isUserCancel = code === 6500 || code === 2 || code === 'USER_CANCELLED';
          const pending = _routePendingByError(err);
          if (pending) {
            if (isUserCancel) {
              trackPurchaseStep('USER_CANCELLED', { productId: pending.productId, errorCode: code });
              pending.resolve({ success: false, error: 'Compra cancelada' });
            } else {
              trackPurchaseStep('STORE_ERROR', {
                productId: pending.productId,
                errorCode: code,
                errorMessage: err?.message || String(err),
              });
              pending.resolve({
                success: false,
                error: 'Não foi possível concluir a compra. Tente novamente em instantes.',
              });
            }
          }
        });

        store.when()
          .approved(async (transaction: any) => {
            const pending = _routeApprovedTransaction(transaction);
            const productId =
              transaction?.products?.[0]?.id ||
              transaction?.productId ||
              pending?.productId ||
              '';

            const txPlatform = transaction?.platform || targetPlatform;

            // Marco crítico do funil: loja aprovou ANTES da verificação backend.
            // Separa "nunca aprovou" de "aprovou mas verify falhou".
            trackPurchaseStep('APPROVED_RECEIVED', {
              productId,
              paymentMethod: txPlatform === Platform.APPLE_APPSTORE ? 'apple' : 'google',
            });

            try {
              if (txPlatform === Platform.APPLE_APPSTORE) {
                // ─── Apple StoreKit ─────────────────────────────────────
                const transactionId =
                  transaction?.transactionId ||
                  transaction?.nativePurchase?.transactionId ||
                  '';
                const originalTransactionId =
                  transaction?.nativePurchase?.originalTransactionIdentifier ||
                  transaction?.nativePurchase?.originalTransactionId ||
                  transactionId;
                const receiptData =
                  transaction?.nativePurchase?.appStoreReceipt ||
                  transaction?.transactionReceipt ||
                  (store as any)?.localReceipts?.[0]?.nativePurchase?.appStoreReceipt ||
                  (store as any)?.localReceipts?.[0]?.transactions?.[0]?.nativePurchase?.appStoreReceipt ||
                  '';

                if (!receiptData || !transactionId || !productId) {
                  console.error('[IAP][Apple] Transação aprovada sem dados completos', {
                    hasReceipt: !!receiptData, transactionId, productId,
                  });
                  pending?.resolve({ success: false, error: 'Recibo Apple inválido (dados ausentes)' });
                  return;
                }

                const result = await verifyApplePurchase({
                  productId, transactionId, originalTransactionId, receiptData,
                });

                if (result.success) {
                  try { await transaction.finish(); } catch (e) {
                    console.warn('[IAP][Apple] Falha ao finalizar transação (ignorável):', e);
                  }
                }
                pending?.resolve(result);

              } else {
                // ─── Google Play Billing ────────────────────────────────
                const purchaseToken =
                  transaction?.purchaseToken ||
                  transaction?.nativePurchase?.purchaseToken ||
                  '';
                const orderId =
                  transaction?.transactionId ||
                  transaction?.nativePurchase?.orderId ||
                  '';

                if (!purchaseToken || !orderId || !productId) {
                  console.error('[IAP][Google] Transação aprovada sem dados completos', transaction);
                  pending?.resolve({ success: false, error: 'Transação inválida (token ausente)' });
                  return;
                }

                const result = await verifyGooglePurchase({ productId, purchaseToken, orderId });

                if (result.success) {
                  try { await transaction.finish(); } catch (e) {
                    console.warn('[IAP][Google] Falha ao finalizar transação (ignorável):', e);
                  }
                }
                pending?.resolve(result);
              }
            } catch (e: any) {
              console.error('[IAP] Erro processando transação aprovada:', e);
              pending?.resolve({ success: false, error: e?.message || String(e) });
            }
          });
      }

      await store.initialize([targetPlatform]);
      await store.update();
      console.log(`[IAP] CdvPurchase store inicializada (${isIOS ? 'Apple App Store' : 'Google Play'})`);
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

async function getGooglePlayStore(): Promise<any | null> {
  if (!isAndroid || !isNative) return null;
  return _initCdvStore();
}

async function getAppleStore(): Promise<any | null> {
  if (!isIOS || !isNative) return null;
  return _initCdvStore();
}

/**
 * Aguarda o StoreKit carregar os metadados do produto.
 *
 * Em aparelhos/revisores com conexão lenta, store.update() pode concluir antes
 * de o produto ficar disponível em store.get(). Também informamos a plataforma
 * explicitamente para evitar ambiguidades entre produtos Apple e Google com IDs
 * semelhantes.
 */
async function waitForAppleProduct(
  store: any,
  productId: string,
  timeoutMs = 15_000,
): Promise<any | undefined> {
  const applePlatform = (window as any).CdvPurchase?.Platform?.APPLE_APPSTORE;
  const getProduct = () => store.get(productId, applePlatform);

  let product = getProduct();
  if (product) return product;

  try {
    await store.update();
  } catch (error) {
    console.warn('[IAP][Apple] store.update() falhou ao carregar produtos:', error);
  }

  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    product = getProduct();
    if (product) return product;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  return undefined;
}

/**
 * Pré-inicializa a store IAP logo no boot do app (Android e iOS).
 * Chamado no mount do componente raiz para garantir que o CdvPurchase
 * já esteja pronto quando o usuário tentar comprar, evitando o timeout
 * de espera que ocorria somente na hora da compra.
 */
export async function initializeIAP(): Promise<void> {
  if (!isNative) return;
  if (!isAndroid && !isIOS) return;
  try {
    console.log(`[IAP] Pré-inicializando store (${isIOS ? 'Apple' : 'Google'})...`);
    const store = await _initCdvStore();
    if (store) {
      console.log('[IAP] Store pré-inicializada com sucesso');
    } else {
      console.warn('[IAP] Store indisponível durante pré-inicialização (será tentado novamente na compra)');
    }
  } catch (e) {
    console.warn('[IAP] Erro na pré-inicialização (não crítico):', e);
  }
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
export type PurchasablePlanType = 'gold' | 'gold_anual' | 'premium' | 'premium_anual' | 'strong_lifetime';

export async function purchaseProduct(planType: PurchasablePlanType): Promise<PurchaseResult> {
  const paymentMethod = getPaymentMethod();
  const productId = getProductId(planType);

  console.log('[IAP] ▶ Purchase started:', { planType, paymentMethod, platform, isIOS, isAndroid });
  trackPurchaseStep(paymentMethod === 'mercadopago' ? 'ROUTE_MP' : 'ROUTE_NATIVE', {
    planType, productId, paymentMethod, isNative,
  });

  // ── HARD GUARD iOS (App Store guideline 3.1.1) ──────────────────────
  // No iOS NUNCA caímos em Mercado Pago / checkout web — apenas Apple IAP.
  // Esta verificação é defesa em profundidade: além das condicionais de UI,
  // qualquer chamada acidental aqui é bloqueada antes de tocar a rede.
  if (isIOS) {
    if (paymentMethod !== 'apple') {
      console.error('[IAP] ✖ iOS BLOCK: tentativa de usar', paymentMethod, '— forçando Apple StoreKit');
    }
    return purchaseWithApple(planType);
  }

  if (paymentMethod === 'apple') {
    return purchaseWithApple(planType);
  }

  if (paymentMethod === 'google') {
    return purchaseWithGoogle(planType);
  }

  if (paymentMethod === 'mercadopago') {
    // Redirect to Mercado Pago checkout (somente Web — fora das lojas)
    return purchaseWithMercadoPago(planType);
  }

  return { success: false, error: 'Plataforma não suportada' };
}

/**
 * Purchase with Mercado Pago (Web)
 */
async function purchaseWithMercadoPago(planType: string): Promise<PurchaseResult> {
  // Defesa em profundidade — esta função NUNCA pode rodar no iOS.
  if (isIOS) {
    console.error('[IAP] ✖ purchaseWithMercadoPago bloqueado no iOS');
    return { success: false, error: 'Pagamento externo indisponível no iOS' };
  }
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
 * Purchase with Apple StoreKit (iOS) via cordova-plugin-purchase v13
 * Mesmo fluxo do Google: registra pendência → store.order(offer) → listener
 * .approved() global resolve a Promise com o resultado da verificação backend.
 */
async function purchaseWithApple(planType: string): Promise<PurchaseResult> {
  const productId = getProductId(planType as any);
  console.log('[IAP][Apple] ▶ Iniciando compra StoreKit', { planType, productId });

  try {
    const store = await getAppleStore();

    if (!store) {
      console.error('[IAP][Apple] ✖ StoreKit indisponível — CdvPurchase não inicializou');
      trackPurchaseStep('STORE_INIT_FAIL', { planType, productId, paymentMethod: 'apple' });
      return {
        success: false,
        error: 'Não foi possível conectar à App Store neste momento. Verifique sua conexão e tente novamente em instantes.',
      };
    }
    trackPurchaseStep('STORE_INIT_OK', { planType, productId, paymentMethod: 'apple' });

    console.log('[IAP][Apple] ✓ Store inicializada — buscando produto', productId);
    const product = await waitForAppleProduct(store, productId);
    if (!product) {
      const loadedProductIds = Array.isArray(store.products)
        ? store.products.map((item: any) => item?.id).filter(Boolean)
        : [];
      console.error('[IAP][Apple] ✖ Produto não encontrado no store:', {
        requestedProductId: productId,
        loadedProductIds,
      });
      trackPurchaseStep('PRODUCT_NOT_FOUND', {
        planType,
        productId,
        paymentMethod: 'apple',
        loadedProductIds,
      });
      return {
        success: false,
        error: 'Este produto ainda não está disponível para compra na App Store. Tente novamente mais tarde.',
      };
    }
    trackPurchaseStep('PRODUCT_FOUND', {
      planType, productId, paymentMethod: 'apple',
      productTitle: product.title, productPrice: product.pricing?.price,
    });

    console.log('[IAP][Apple] ✓ Produto encontrado:', { productId, title: product.title, price: product.pricing?.price });
    const offer = product.getOffer();
    if (!offer) {
      console.error('[IAP][Apple] ✖ Oferta indisponível para o produto', productId);
      trackPurchaseStep('OFFER_NOT_FOUND', { planType, productId, paymentMethod: 'apple' });
      return { success: false, error: 'Oferta indisponível para este plano. Tente novamente em instantes.' };
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

    // Timeout defensivo de 2 minutos.
    const timeoutId = setTimeout(() => {
      const idx = _pendingPurchases.indexOf(pendingEntry);
      if (idx !== -1) _pendingPurchases.splice(idx, 1);
      trackPurchaseStep('TIMEOUT', { planType, productId, paymentMethod: 'apple' });
      resolvePending({ success: false, error: 'Tempo esgotado aguardando aprovação da compra' });
    }, 120_000);

    // Disparar checkout do StoreKit. Apple não retorna IError direto pro order(),
    // mas pode lançar exceção (ex.: IAP desabilitado nas Settings).
    const orderResult: any = await store.order(offer);
    if (orderResult && (orderResult.code !== undefined || orderResult.isError)) {
      clearTimeout(timeoutId);
      const idx = _pendingPurchases.indexOf(pendingEntry);
      if (idx !== -1) _pendingPurchases.splice(idx, 1);

      const code = orderResult.code;
      if (code === 6500 || code === 2 || code === 'USER_CANCELLED') {
        trackPurchaseStep('USER_CANCELLED', { planType, productId, paymentMethod: 'apple', errorCode: code });
        return { success: false, error: 'Compra cancelada' };
      }
      console.error('[IAP][Apple] store.order() retornou erro:', orderResult);
      trackPurchaseStep('ORDER_ERROR', {
        planType, productId, paymentMethod: 'apple',
        errorCode: code, errorMessage: orderResult.message,
      });
      return {
        success: false,
        error: orderResult.message || `Erro ao iniciar compra (código ${code ?? 'desconhecido'})`,
      };
    }
    trackPurchaseStep('ORDER_DISPATCHED', { planType, productId, paymentMethod: 'apple' });

    console.log('[IAP][Apple] ⏳ Aguardando aprovação do usuário e verificação backend…');
    const result = await verificationPromise;
    clearTimeout(timeoutId);
    if (result.success) {
      console.log('[IAP][Apple] ✓ Compra aprovada e verificada com sucesso');
      trackPurchaseStep('VERIFY_OK', { planType, productId, paymentMethod: 'apple' });
    } else {
      console.warn('[IAP][Apple] ⚠ Compra falhou:', result.error);
      trackPurchaseStep('VERIFY_FAIL', { planType, productId, paymentMethod: 'apple', errorMessage: result.error });
    }
    return result;

  } catch (error: any) {
    if (error?.code === 'USER_CANCELLED' || error?.code === 6500 || error?.code === 2) {
      console.log('[IAP][Apple] ℹ Usuário cancelou a compra');
      trackPurchaseStep('USER_CANCELLED', { planType, productId, paymentMethod: 'apple', errorCode: error.code });
      return { success: false, error: 'Compra cancelada' };
    }
    console.error('[IAP][Apple] ✖ Erro inesperado:', error);
    trackPurchaseStep('UNEXPECTED_ERROR', {
      planType, productId, paymentMethod: 'apple',
      errorCode: error?.code, errorMessage: error?.message || String(error),
    });
    return { success: false, error: error?.message || 'Erro ao processar a compra. Tente novamente.' };
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
      console.error('[IAP] Google Play Billing indisponível — CdvPurchase não inicializou');
      trackPurchaseStep('STORE_INIT_FAIL', { planType, productId, paymentMethod: 'google' });
      return {
        success: false,
        error: 'Loja do Google Play não disponível. Feche completamente o app, reabra e tente novamente. Se persistir, reinstale pelo Google Play.',
      };
    }
    trackPurchaseStep('STORE_INIT_OK', { planType, productId, paymentMethod: 'google' });

    const product = store.get(productId);
    if (!product) {
      console.error('[IAP] Produto não encontrado no store:', productId);
      trackPurchaseStep('PRODUCT_NOT_FOUND', { planType, productId, paymentMethod: 'google' });
      return {
        success: false,
        error: `Produto não disponível (${productId}). Verifique a configuração no Google Play Console.`,
      };
    }
    trackPurchaseStep('PRODUCT_FOUND', {
      planType, productId, paymentMethod: 'google',
      productTitle: product.title, productPrice: product.pricing?.price,
    });

    const offer = product.getOffer();
    if (!offer) {
      trackPurchaseStep('OFFER_NOT_FOUND', { planType, productId, paymentMethod: 'google' });
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
      trackPurchaseStep('TIMEOUT', { planType, productId, paymentMethod: 'google' });
      resolvePending({ success: false, error: 'Tempo esgotado aguardando aprovação da compra' });
    }, 120_000);

    // Disparar o checkout do Google Play. order() retorna IError em caso de
    // falha imediata (rede, billing indisponível, usuário cancelou no diálogo).
    const orderResult: any = await store.order(offer);
    if (orderResult && (orderResult.code !== undefined || orderResult.isError)) {
      clearTimeout(timeoutId);
      const idx = _pendingPurchases.indexOf(pendingEntry);
      if (idx !== -1) _pendingPurchases.splice(idx, 1);

      const code = orderResult.code;
      if (code === 6500 || code === 'USER_CANCELLED') {
        trackPurchaseStep('USER_CANCELLED', { planType, productId, paymentMethod: 'google', errorCode: code });
        return { success: false, error: 'Compra cancelada' };
      }
      console.error('[IAP] store.order() retornou erro:', orderResult);
      trackPurchaseStep('ORDER_ERROR', {
        planType, productId, paymentMethod: 'google',
        errorCode: code, errorMessage: orderResult.message,
      });
      return {
        success: false,
        error: orderResult.message || `Erro ao iniciar compra (código ${code ?? 'desconhecido'})`,
      };
    }
    trackPurchaseStep('ORDER_DISPATCHED', { planType, productId, paymentMethod: 'google' });

    const result = await verificationPromise;
    clearTimeout(timeoutId);
    if (result.success) {
      trackPurchaseStep('VERIFY_OK', { planType, productId, paymentMethod: 'google' });
    } else {
      trackPurchaseStep('VERIFY_FAIL', { planType, productId, paymentMethod: 'google', errorMessage: result.error });
    }
    return result;
  } catch (error: any) {
    if (error?.code === 'USER_CANCELLED' || error?.code === 6500) {
      trackPurchaseStep('USER_CANCELLED', { planType, productId, paymentMethod: 'google', errorCode: error.code });
      return { success: false, error: 'Compra cancelada' };
    }
    console.error('[IAP] Google purchase error:', error);
    trackPurchaseStep('UNEXPECTED_ERROR', {
      planType, productId, paymentMethod: 'google',
      errorCode: error?.code, errorMessage: error?.message || String(error),
    });
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
      const store = await getAppleStore();
      if (!store) {
        return { success: false, restored: 0, error: 'Apple StoreKit indisponível nesta versão' };
      }

      // Disparar restore nativo — o StoreKit recupera transações pagas e
      // dispara .approved() para cada uma (que automaticamente verifica
      // com o backend via listener global).
      try {
        await store.restorePurchases();
      } catch (e) {
        console.warn('[IAP][Apple] restorePurchases nativo lançou erro:', e);
      }

      // Aguardar um instante para o iOS popular localReceipts após o restore.
      await new Promise((r) => setTimeout(r, 1500));

      // Pegar o appStoreReceipt unificado (1 receipt cobre todas as compras
      // do bundleId no device) e enviar pro backend, que valida e cria/atualiza
      // todas as subscriptions encontradas.
      const receipts = (store as any).localReceipts || [];
      let appStoreReceipt = '';
      for (const r of receipts) {
        const candidate =
          (r as any)?.nativePurchase?.appStoreReceipt ||
          (r as any)?.transactions?.[0]?.nativePurchase?.appStoreReceipt ||
          '';
        if (candidate) { appStoreReceipt = candidate; break; }
      }

      if (!appStoreReceipt) {
        // Sem recibo = nada pra restaurar (usuário nunca comprou neste Apple ID).
        return { success: true, restored: 0 };
      }

      const response = await apiRequest('POST', '/api/iap/restore/apple', {
        receiptData: appStoreReceipt,
      });
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
