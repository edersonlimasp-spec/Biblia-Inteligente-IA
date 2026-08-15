import { getDeviceId } from '@/hooks/use-device-id';
import { getApiUrl } from '@/lib/queryClient';
import { Capacitor } from '@capacitor/core';

// Get auth token to include in tracking requests for user identification
function getAuthToken(): string | null {
  try {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('authToken');
  } catch {
    return null;
  }
}

// Snapshot da plataforma — anexado a TODO evento para diagnóstico.
// Antes só sabíamos plataforma quando o backend recebia /api/guest/register.
// Com isso o Android passa a aparecer em app_events também.
function getPlatformContext() {
  try {
    if (typeof window === 'undefined') return { platform: 'ssr' };
    const platform = Capacitor.getPlatform();
    return {
      platform,
      isNative: Capacitor.isNativePlatform(),
      ua: navigator.userAgent?.slice(0, 200),
      lang: navigator.language,
    };
  } catch {
    return { platform: 'unknown' };
  }
}

export async function trackEvent(eventType: string, eventData?: any) {
  try {
    if (typeof window === 'undefined') return;

    const deviceId = getDeviceId();
    const token = getAuthToken();

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // SEMPRE inclui platform/isNative no payload — assim qualquer evento
    // (APP_OPEN, PURCHASE_STEP, etc.) pode ser filtrado por plataforma no banco.
    const enrichedData = { ...getPlatformContext(), ...(eventData || {}) };

    await fetch(getApiUrl('/api/events/track'), {
      method: 'POST',
      headers,
      body: JSON.stringify({
        deviceId,
        eventType,
        eventData: enrichedData,
      }),
    }).catch(() => {});
  } catch {}
}

export async function createSession() {
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  await trackEvent('SESSION_CREATE', { sessionId });
  return sessionId;
}

export async function trackAIQuestion(mode: string) {
  await trackEvent('AI_QUESTION', { mode });
}

export async function trackSubscriptionPageVisit() {
  await trackEvent('SUBSCRIPTION_PAGE_VISIT');
}

export async function trackSubscriptionAbandonment() {
  await trackEvent('SUBSCRIPTION_ABANDONED');
}

export async function trackAppOpen() {
  await trackEvent('APP_OPEN');
}

export async function trackPageView(page: string, extraData?: Record<string, any>) {
  await trackEvent('PAGE_VIEW', { page, ...extraData });
}

export async function trackStrongLookup(strongNumber: string, source?: string) {
  await trackEvent('STRONG_LOOKUP', { strongNumber, source });
}

export async function trackSubscriptionActivated(planType: string, source?: string) {
  await trackEvent('SUBSCRIPTION_ACTIVATED', { planType, source });
}

// ── Telemetria de tentativas de compra ──────────────────────────────────
// Capturamos cada etapa do funil para descobrir EXATAMENTE onde os usuários
// travam (zero compradores em 50 instalações no Google Play).
// Steps: BUTTON_CLICK → LOGIN_GATE → ROUTE_NATIVE/ROUTE_MP →
//        STORE_INIT_OK/STORE_INIT_FAIL → PRODUCT_FOUND/PRODUCT_NOT_FOUND →
//        OFFER_NOT_FOUND → ORDER_DISPATCHED → ORDER_ERROR/USER_CANCELLED →
//        APPROVED_RECEIVED → VERIFY_OK/VERIFY_FAIL → TIMEOUT → UNEXPECTED_ERROR
export type PurchaseStep =
  | 'BUTTON_CLICK'
  | 'LOGIN_GATE'
  | 'ROUTE_NATIVE'
  | 'ROUTE_MP'
  | 'STORE_INIT_OK'
  | 'STORE_INIT_FAIL'
  | 'PRODUCT_FOUND'
  | 'PRODUCT_NOT_FOUND'
  | 'OFFER_NOT_FOUND'
  | 'ORDER_DISPATCHED'
  | 'ORDER_ERROR'
  | 'STORE_ERROR'
  | 'USER_CANCELLED'
  | 'APPROVED_RECEIVED'
  | 'VERIFY_OK'
  | 'VERIFY_FAIL'
  | 'TIMEOUT'
  | 'UNEXPECTED_ERROR';

// Whitelist de campos permitidos no payload — evita vazamento acidental
// de tokens/receipts/PII em chamadas futuras de trackPurchaseStep.
const PURCHASE_ALLOWED_FIELDS = new Set([
  'planType', 'planName', 'productId', 'paymentMethod', 'isLoggedIn', 'isNative',
  'productTitle', 'productPrice', 'errorCode', 'errorMessage',
]);

export async function trackPurchaseStep(
  step: PurchaseStep,
  details: {
    planType?: string;
    planName?: string;
    productId?: string;
    paymentMethod?: 'apple' | 'google' | 'mercadopago' | string;
    isLoggedIn?: boolean;
    isNative?: boolean;
    productTitle?: string;
    productPrice?: string | number;
    errorCode?: string | number;
    errorMessage?: string;
    [k: string]: any;
  } = {}
) {
  const clean: Record<string, any> = { step };
  for (const k of Object.keys(details)) {
    if (!PURCHASE_ALLOWED_FIELDS.has(k)) continue;
    let v = (details as any)[k];
    if (typeof v === 'string' && v.length > 300) v = v.slice(0, 300);
    clean[k] = v;
  }
  await trackEvent('PURCHASE_STEP', clean);
}
