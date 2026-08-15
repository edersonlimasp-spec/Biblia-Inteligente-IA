// ─── Utilitários compartilhados entre módulos de rotas ──────────────────────
// Plataforma, cache Strong's e Firebase Admin

import admin from "firebase-admin";

// ─── Platform-aware subscription helpers ────────────────────────────────────
// Google Play Policy: an app distributed via Google Play MUST use Google Play
// Billing for digital content. A Mercado Pago (web) subscription MUST NOT unlock
// features inside the Play Store app.

export type ClientPlatform = 'android' | 'ios' | 'web';

export function getClientPlatform(req: { headers: Record<string, string | string[] | undefined> }): ClientPlatform {
  const header = req.headers['x-client-platform'];
  const val = Array.isArray(header) ? header[0] : header;
  if (val === 'android') return 'android';
  if (val === 'ios') return 'ios';
  return 'web';
}

export function getPlatformAllowedSources(platform: ClientPlatform): string[] {
  if (platform === 'android') return ['google', 'admin'];
  if (platform === 'ios')     return ['apple', 'admin'];
  return ['web', 'mp_webhook', 'mercadopago', 'admin'];
}

// ─── In-memory LRU cache for Strong entries ──────────────────────────────────
interface StrongCacheEntry {
  data: any;
  timestamp: number;
}
export const strongCache = new Map<string, StrongCacheEntry>();
export const STRONG_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
export const STRONG_CACHE_MAX_SIZE = 2000;

export function getFromStrongCache(key: string): any | null {
  const entry = strongCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > STRONG_CACHE_TTL) {
    strongCache.delete(key);
    return null;
  }
  strongCache.delete(key);
  strongCache.set(key, entry);
  return entry.data;
}

export function setInStrongCache(key: string, data: any): void {
  if (strongCache.has(key)) strongCache.delete(key);
  while (strongCache.size >= STRONG_CACHE_MAX_SIZE) {
    const oldestKey = strongCache.keys().next().value;
    if (oldestKey) strongCache.delete(oldestKey);
    else break;
  }
  strongCache.set(key, { data, timestamp: Date.now() });
}

// ─── Firebase Admin SDK ──────────────────────────────────────────────────────
export let firebaseInitialized = false;

export function initFirebaseAdmin(): boolean {
  if (firebaseInitialized) return true;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!projectId) {
    console.log("⚠️ Firebase não configurado - login com Google desabilitado");
    return false;
  }
  try {
    admin.initializeApp({ projectId });
    firebaseInitialized = true;
    console.log("✅ Firebase Admin inicializado");
    return true;
  } catch (error) {
    console.error("❌ Erro ao inicializar Firebase Admin:", error);
    return false;
  }
}
