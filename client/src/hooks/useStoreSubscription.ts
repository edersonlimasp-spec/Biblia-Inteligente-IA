import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getApiUrl, getAuthHeaders } from "@/lib/queryClient";
import { isNative, platform } from "@/lib/capacitor";
import { getAnnualTrialInfo, type StoreTrialInfo } from "@/lib/inAppPurchases";

export type StoreSubscription = {
  planType: string;
  source: "apple" | "google";
  endDate: string | null;
  inTrial: boolean;
  autoRenew: boolean;
  purchaseToken: string | null;
};

export type StoreSubscriptionState = {
  loading: boolean;
  hasPremium: boolean;
  hasGold: boolean;
  hasLifetime: boolean;
  storeSubscription: StoreSubscription | null;
  /** Pode receber o convite: elegível no servidor E a loja oferece o teste. */
  canStartTrial: boolean;
  trial: StoreTrialInfo;
  refresh: () => void;
};

/** Valores de exibição quando a loja ainda não respondeu (catálogo atual). */
export const FALLBACK_PRICES = {
  annual: "R$ 129,90",
  annualPerMonth: "R$ 10,83",
  monthly: "R$ 19,90",
  lifetime: "R$ 49,90",
};

const EMPTY_TRIAL: StoreTrialInfo = { available: false, days: 0, annualPrice: null, monthlyPrice: null };

/**
 * Estado da assinatura da loja (App Store / Google Play) + teste grátis.
 * Só faz sentido nos apps nativos; na web devolve tudo vazio.
 */
export function useStoreSubscription(): StoreSubscriptionState {
  const { user } = useAuth();
  const [version, setVersion] = useState(0);
  const [state, setState] = useState<Omit<StoreSubscriptionState, "refresh">>({
    loading: true,
    hasPremium: false,
    hasGold: false,
    hasLifetime: false,
    storeSubscription: null,
    canStartTrial: false,
    trial: EMPTY_TRIAL,
  });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!user) {
        setState((s) => ({ ...s, loading: false, storeSubscription: null, canStartTrial: false }));
        return;
      }
      try {
        const headers: Record<string, string> = { ...getAuthHeaders() };
        if (platform === "android" || platform === "ios") headers["x-client-platform"] = platform;
        const [statusRes, trial] = await Promise.all([
          fetch(getApiUrl("/api/user/subscription-status"), { headers, credentials: "include" }),
          isNative ? getAnnualTrialInfo() : Promise.resolve(EMPTY_TRIAL),
        ]);
        const data = statusRes.ok ? await statusRes.json() : {};
        if (cancelled) return;
        setState({
          loading: false,
          hasPremium: !!data.hasPremium,
          hasGold: !!data.hasGold,
          hasLifetime: !!data.hasLifetime,
          storeSubscription: data.storeSubscription ?? null,
          canStartTrial: !!data.storeTrialEligible && trial.available,
          trial,
        });
      } catch {
        if (!cancelled) setState((s) => ({ ...s, loading: false }));
      }
    }
    load();
    return () => { cancelled = true; };
  }, [user, version]);

  const refresh = useCallback(() => setVersion((v) => v + 1), []);
  return { ...state, refresh };
}

export function formatDateBR(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "long" });
}

/** "R$ 129,90" → "R$ 10,83" (equivalente mensal, só como informação secundária). */
export function perMonthFrom(annualPrice: string | null | undefined): string {
  if (!annualPrice) return FALLBACK_PRICES.annualPerMonth;
  const numeric = Number(annualPrice.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", "."));
  if (!Number.isFinite(numeric) || numeric <= 0) return FALLBACK_PRICES.annualPerMonth;
  const prefix = annualPrice.match(/^[^\d]*/)?.[0]?.trim() || "R$";
  return `${prefix} ${(numeric / 12).toFixed(2).replace(".", ",")}`;
}
