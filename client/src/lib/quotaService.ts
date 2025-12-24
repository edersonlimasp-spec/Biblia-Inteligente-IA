const GUEST_QUOTA_KEY = "ai_guest_questions_used";
const GUEST_QUOTA_MIGRATED_KEY = "ai_guest_quota_migrated_to_user";

export const GUEST_LIMIT = 2;
export const USER_LIMIT = 5;

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
}): QuotaInfo {
  const { isLoggedIn, guestUsed, userUsed, hasSubscription, hasTrial, isAdmin } = params;
  
  if (isAdmin || hasSubscription || hasTrial) {
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
  
  if (!isLoggedIn) {
    const remaining = Math.max(0, GUEST_LIMIT - guestUsed);
    return {
      used: guestUsed,
      limit: GUEST_LIMIT,
      remaining,
      isGuest: true,
      requiresLogin: remaining === 0,
      requiresSubscription: false,
      hasUnlimitedAccess: false,
    };
  }
  
  const remaining = Math.max(0, USER_LIMIT - userUsed);
  return {
    used: userUsed,
    limit: USER_LIMIT,
    remaining,
    isGuest: false,
    requiresLogin: false,
    requiresSubscription: remaining === 0,
    hasUnlimitedAccess: false,
  };
}
