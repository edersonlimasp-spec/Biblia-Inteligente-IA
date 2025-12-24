import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

interface SubscriptionStatus {
  hasPremium: boolean;
  hasGold: boolean;
  hasLifetime: boolean;
  trialActive: boolean;
}

interface UsageLimits {
  recordingsLimit: number;
  agendaLimit: number;
  subscriptionType: 'free' | 'gold' | 'premium';
  isLoading: boolean;
}

const LIMITS = {
  free: { recordings: 3, agenda: 3 },
  gold: { recordings: 30, agenda: 30 },
  premium: { recordings: 100, agenda: 100 },
};

export function useUsageLimits(): UsageLimits {
  const { user } = useAuth();

  const { data: subscriptionData, isLoading } = useQuery<SubscriptionStatus>({
    queryKey: ['/api/user/subscription-status'],
    enabled: !!user,
    staleTime: 60000,
  });

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  
  let subscriptionType: 'free' | 'gold' | 'premium' = 'free';
  
  if (isAdmin || subscriptionData?.hasPremium) {
    subscriptionType = 'premium';
  } else if (subscriptionData?.hasGold || subscriptionData?.hasLifetime) {
    subscriptionType = 'gold';
  }

  const finalLimits = isLoading 
    ? LIMITS.premium 
    : LIMITS[subscriptionType];

  return {
    recordingsLimit: finalLimits.recordings,
    agendaLimit: finalLimits.agenda,
    subscriptionType,
    isLoading,
  };
}

export function getRecordingsLimitMessage(subscriptionType: 'free' | 'gold' | 'premium'): string {
  switch (subscriptionType) {
    case 'free':
      return 'Você atingiu o limite de 3 gravações do plano gratuito. Assine Gold para até 30 gravações ou Premium para 100!';
    case 'gold':
      return 'Você atingiu o limite de 30 gravações do plano Gold. Assine Premium para até 100 gravações!';
    case 'premium':
      return 'Você atingiu o limite de 100 gravações.';
    default:
      return 'Limite de gravações atingido.';
  }
}

export function getAgendaLimitMessage(subscriptionType: 'free' | 'gold' | 'premium'): string {
  switch (subscriptionType) {
    case 'free':
      return 'Você atingiu o limite de 3 eventos do plano gratuito. Assine Gold para até 30 eventos ou Premium para 100!';
    case 'gold':
      return 'Você atingiu o limite de 30 eventos do plano Gold. Assine Premium para até 100 eventos!';
    case 'premium':
      return 'Você atingiu o limite de 100 eventos.';
    default:
      return 'Limite de eventos atingido.';
  }
}
