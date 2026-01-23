const GUEST_QUOTA_KEY = "ai_guest_questions_used";
const GUEST_QUOTA_MIGRATED_KEY = "ai_guest_quota_migrated_to_user";
const GUEST_STRONG_KEY = "strong_guest_lookups";

// ========================================
// PLANO GRATUITO - LIMITES ESTRITOS
// ========================================
// IA Professor: 3 perguntas NO TOTAL (1 sem login + 2 com login)
export const GUEST_AI_LIMIT = 1;  // Visitante: 1 pergunta sem login
export const USER_AI_LIMIT = 2;   // Logado gratuito: 2 perguntas com login

// Strong: 2 visitante / 4 logado (não renovável)
export const GUEST_STRONG_LIMIT = 2;  // Visitante: 2 consultas
export const USER_STRONG_LIMIT = 4;   // Logado gratuito: 4 consultas

// Assinantes têm acesso ilimitado
export const PREMIUM_AI_LIMIT = 999999;
export const GOLD_AI_LIMIT = 999999;

export interface QuotaInfo {
  used: number;
  limit: number;
  remaining: number;
  isGuest: boolean;
  requiresLogin: boolean;
  requiresSubscription: boolean;
  hasUnlimitedAccess: boolean;
}

export interface StrongQuotaInfo {
  used: number;
  limit: number;
  remaining: number;
  isGuest: boolean;
  requiresSubscription: boolean;
}

export function getGuestQuestionsUsed(): number {
  try {
    const stored = localStorage.getItem(GUEST_QUOTA_KEY);
    return stored ? parseInt(stored, 10) : 0;
  } catch {
    return 0;
  }
}

export function setGuestQuestionsUsed(count: number): void {
  try {
    localStorage.setItem(GUEST_QUOTA_KEY, count.toString());
  } catch {
    console.warn("Failed to save guest quota to localStorage");
  }
}

export function incrementGuestQuestionsUsed(): number {
  const current = getGuestQuestionsUsed();
  const newCount = current + 1;
  setGuestQuestionsUsed(newCount);
  return newCount;
}

export function markGuestQuotaMigrated(): void {
  try {
    localStorage.setItem(GUEST_QUOTA_MIGRATED_KEY, "true");
  } catch {
    console.warn("Failed to mark guest quota as migrated");
  }
}

export function wasGuestQuotaMigrated(): boolean {
  try {
    return localStorage.getItem(GUEST_QUOTA_MIGRATED_KEY) === "true";
  } catch {
    return false;
  }
}

export function clearGuestQuota(): void {
  try {
    localStorage.removeItem(GUEST_QUOTA_KEY);
    localStorage.removeItem(GUEST_QUOTA_MIGRATED_KEY);
  } catch {
    console.warn("Failed to clear guest quota");
  }
}

// ========================================
// FUNÇÕES DE QUOTA PARA STRONG
// ========================================
export function getGuestStrongUsed(): number {
  try {
    const stored = localStorage.getItem(GUEST_STRONG_KEY);
    return stored ? parseInt(stored, 10) : 0;
  } catch {
    return 0;
  }
}

export function setGuestStrongUsed(count: number): void {
  try {
    localStorage.setItem(GUEST_STRONG_KEY, count.toString());
  } catch {
    console.warn("Failed to save guest Strong quota to localStorage");
  }
}

export function incrementGuestStrongUsed(): number {
  const current = getGuestStrongUsed();
  const newCount = current + 1;
  setGuestStrongUsed(newCount);
  return newCount;
}

export function calculateStrongQuotaInfo(params: {
  isLoggedIn: boolean;
  guestUsed: number;
  userUsed: number;
  hasSubscription: boolean;
  isAdmin: boolean;
}): StrongQuotaInfo {
  const { isLoggedIn, guestUsed, userUsed, hasSubscription, isAdmin } = params;
  
  // Admin e assinantes têm acesso ilimitado
  if (isAdmin || hasSubscription) {
    return {
      used: 0,
      limit: Infinity,
      remaining: Infinity,
      isGuest: !isLoggedIn,
      requiresSubscription: false,
    };
  }
  
  // Plano gratuito: 2 visitante / 4 logado
  const limit = isLoggedIn ? USER_STRONG_LIMIT : GUEST_STRONG_LIMIT;
  const used = isLoggedIn ? userUsed : guestUsed;
  const remaining = Math.max(0, limit - used);
  
  return {
    used,
    limit,
    remaining,
    isGuest: !isLoggedIn,
    requiresSubscription: remaining === 0,
  };
}

// ========================================
// FUNÇÕES DE QUOTA PARA IA PROFESSOR
// ========================================
export function calculateQuotaInfo(params: {
  isLoggedIn: boolean;
  guestUsed: number;
  userUsed: number;
  hasSubscription: boolean;
  isAdmin: boolean;
  subscriptionPlan?: string;
}): QuotaInfo {
  const { isLoggedIn, guestUsed, userUsed, hasSubscription, isAdmin, subscriptionPlan } = params;
  
  // Admin tem acesso ilimitado
  if (isAdmin) {
    return {
      used: 0,
      limit: Infinity,
      remaining: Infinity,
      isGuest: false,
      requiresLogin: false,
      requiresSubscription: false,
      hasUnlimitedAccess: true,
    };
  }
  
  // Assinantes têm acesso ilimitado
  if (hasSubscription) {
    const limit = subscriptionPlan === 'premium' ? PREMIUM_AI_LIMIT : GOLD_AI_LIMIT;
    return {
      used: 0,
      limit,
      remaining: limit,
      isGuest: false,
      requiresLogin: false,
      requiresSubscription: false,
      hasUnlimitedAccess: true,
    };
  }
  
  // PLANO GRATUITO: 3 perguntas NO TOTAL (1 sem login + 2 com login)
  const limit = isLoggedIn ? USER_AI_LIMIT : GUEST_AI_LIMIT;
  const used = isLoggedIn ? userUsed : guestUsed;
  const remaining = Math.max(0, limit - used);
  
  return {
    used,
    limit,
    remaining,
    isGuest: !isLoggedIn,
    requiresLogin: false,
    requiresSubscription: remaining === 0,
    hasUnlimitedAccess: false,
  };
}
