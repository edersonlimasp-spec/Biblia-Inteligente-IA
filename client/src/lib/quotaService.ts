const GUEST_QUOTA_KEY = "ai_guest_questions_used";
const GUEST_QUOTA_MIGRATED_KEY = "ai_guest_quota_migrated_to_user";

export const GUEST_LIMIT = 30;  // Limite diário para acesso gratuito
export const USER_LIMIT = 30;   // Limite diário para acesso gratuito
export const PREMIUM_LIMIT = 100; // Limite diário para Premium
export const GOLD_LIMIT = 30;   // Limite diário para Gold

export interface QuotaInfo {
  used: number;
  limit: number;
  remaining: number;
  isGuest: boolean;
  requiresLogin: boolean;
  requiresSubscription: boolean;
  hasUnlimitedAccess: boolean;
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

export function calculateQuotaInfo(params: {
  isLoggedIn: boolean;
  guestUsed: number;
  userUsed: number;
  hasSubscription: boolean;
  hasTrial: boolean;
  isAdmin: boolean;
  subscriptionPlan?: string;
}): QuotaInfo {
  const { isLoggedIn, guestUsed, userUsed, isAdmin, subscriptionPlan } = params;
  
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
  
  // Determinar limite baseado no plano
  let limit = USER_LIMIT; // 30 perguntas/dia para acesso gratuito
  if (subscriptionPlan === 'premium') {
    limit = PREMIUM_LIMIT; // 100 perguntas/dia
  } else if (subscriptionPlan === 'gold') {
    limit = GOLD_LIMIT; // 30 perguntas/dia
  }
  
  const used = isLoggedIn ? userUsed : guestUsed;
  const remaining = Math.max(0, limit - used);
  
  // Acesso gratuito universal - todos têm acesso ao Strong e IA Essencial
  return {
    used,
    limit,
    remaining,
    isGuest: !isLoggedIn,
    requiresLogin: false,
    requiresSubscription: false,
    hasUnlimitedAccess: false,
  };
}
