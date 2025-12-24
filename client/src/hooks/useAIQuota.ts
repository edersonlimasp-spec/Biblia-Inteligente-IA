import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { 
  getGuestQuestionsUsed, 
  incrementGuestQuestionsUsed,
  markGuestQuotaMigrated,
  wasGuestQuotaMigrated,
  GUEST_LIMIT,
  USER_LIMIT,
  type QuotaInfo
} from "@/lib/quotaService";

interface BackendQuotaResponse {
  used: number;
  limit: number;
  remaining: number;
  hasUnlimitedAccess: boolean;
}

export function useAIQuota() {
  const { user } = useAuth();
  const isLoggedIn = !!user;
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  
  const [guestUsed, setGuestUsed] = useState(() => getGuestQuestionsUsed());
  
  const { data: subscriptionData } = useQuery<{
    hasPremium: boolean;
    hasGold: boolean;
    trialActive: boolean;
  }>({
    queryKey: ['/api/user/subscription-status'],
    enabled: isLoggedIn,
  });
  
  const { data: backendQuota, refetch: refetchQuota } = useQuery<BackendQuotaResponse>({
    queryKey: ['/api/ai/quota'],
    enabled: isLoggedIn,
  });
  
  const migrateGuestQuotaMutation = useMutation({
    mutationFn: async (guestQuestionsUsed: number) => {
      const res = await apiRequest('POST', '/api/ai/migrate-guest-quota', { guestQuestionsUsed });
      return res.json();
    },
    onSuccess: () => {
      markGuestQuotaMigrated();
      queryClient.invalidateQueries({ queryKey: ['/api/ai/quota'] });
    },
  });
  
  useEffect(() => {
    if (isLoggedIn && !wasGuestQuotaMigrated() && guestUsed > 0) {
      migrateGuestQuotaMutation.mutate(guestUsed);
    }
  }, [isLoggedIn, guestUsed]);
  
  const hasSubscription = subscriptionData?.hasPremium || subscriptionData?.hasGold || false;
  const hasTrial = subscriptionData?.trialActive || false;
  const hasUnlimitedAccess = isAdmin || hasSubscription || hasTrial || (backendQuota?.hasUnlimitedAccess ?? false);
  
  const getQuotaInfo = useCallback((): QuotaInfo => {
    if (hasUnlimitedAccess) {
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
    
    const userUsed = backendQuota?.used ?? 0;
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
  }, [isLoggedIn, guestUsed, backendQuota, hasUnlimitedAccess]);
  
  const consumeQuestion = useCallback(() => {
    if (hasUnlimitedAccess) return;
    
    if (!isLoggedIn) {
      const newCount = incrementGuestQuestionsUsed();
      setGuestUsed(newCount);
    } else {
      refetchQuota();
    }
  }, [isLoggedIn, hasUnlimitedAccess, refetchQuota]);
  
  const refreshQuota = useCallback(() => {
    if (!isLoggedIn) {
      setGuestUsed(getGuestQuestionsUsed());
    } else {
      refetchQuota();
    }
  }, [isLoggedIn, refetchQuota]);
  
  const quotaInfo = getQuotaInfo();
  
  return {
    quotaInfo,
    consumeQuestion,
    refreshQuota,
    isLoading: isLoggedIn && !backendQuota && !hasUnlimitedAccess,
  };
}
