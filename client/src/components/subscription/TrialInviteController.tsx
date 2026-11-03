import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { isNative } from "@/lib/capacitor";
import { useStoreSubscription } from "@/hooks/useStoreSubscription";
import { TrialInviteSheet } from "./TrialInviteSheet";

const seenKey = (userId: string) => `trial-invite:v1:${userId}`;

function wasSeen(userId: string): boolean {
  try {
    return localStorage.getItem(seenKey(userId)) === "1";
  } catch {
    return true; // sem armazenamento: não insistir
  }
}

function markSeen(userId: string) {
  try {
    localStorage.setItem(seenKey(userId), "1");
  } catch {
    // ignore
  }
}

/**
 * Mostra UMA vez, depois do login, o convite opcional de 7 dias de Premium —
 * só nos apps das lojas, só para quem nunca assinou e só quando a loja
 * realmente oferece o teste. Recusar não muda nada: o usuário segue no gratuito.
 */
export function TrialInviteController({ active }: { active: boolean }) {
  const { user } = useAuth();
  const { canStartTrial, trial, loading } = useStoreSubscription();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isNative || !active || !user || loading || !canStartTrial || wasSeen(user.id)) return;
    const timer = window.setTimeout(() => setOpen(true), 1200);
    return () => window.clearTimeout(timer);
  }, [active, user, loading, canStartTrial]);

  if (!user || !canStartTrial) return null;

  return (
    <TrialInviteSheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) markSeen(user.id);
      }}
      trial={trial}
      onStarted={() => markSeen(user.id)}
    />
  );
}
