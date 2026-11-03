import { useState } from "react";
import { ArrowRightLeft, CalendarDays, HeartHandshake, Loader2, ExternalLink } from "lucide-react";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { isIOS, isAndroid } from "@/lib/capacitor";
import { openStoreSubscriptionManagement, purchaseProduct } from "@/lib/inAppPurchases";
import { trackPurchaseStep } from "@/lib/tracking";
import { FALLBACK_PRICES, formatDateBR, type StoreSubscription } from "@/hooks/useStoreSubscription";

interface ManageSubscriptionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscription: StoreSubscription;
  monthlyPrice?: string | null;
  annualPrice?: string | null;
  onChanged?: () => void;
}

/**
 * Antes de cancelar o Premium Anual, oferece continuar no Premium Mensal.
 * A troca vale a partir da próxima renovação (fim do teste ou do ano pago):
 * o usuário não perde os dias que já tem e não paga em dobro.
 */
export function ManageSubscriptionSheet({ open, onOpenChange, subscription, monthlyPrice, annualPrice, onChanged }: ManageSubscriptionSheetProps) {
  const { toast } = useToast();
  const [switching, setSwitching] = useState(false);
  const monthly = monthlyPrice || FALLBACK_PRICES.monthly;
  const annual = annualPrice || FALLBACK_PRICES.annual;
  const isAnnual = subscription.planType === "premium_anual";
  const until = formatDateBR(subscription.endDate);
  const storeName = subscription.source === "apple" ? "App Store" : "Google Play";

  const switchToMonthly = async () => {
    trackPurchaseStep("BUTTON_CLICK", { planType: "premium", planName: "Premium Mensal (retenção)", source: "cancel_flow" });
    if (isIOS) {
      // Mesmo grupo de assinaturas: a Apple faz a troca na tela dela. Com Premium
      // Mensal e Anual no MESMO nível do grupo, a troca vale na próxima renovação.
      toast({ title: "Escolha “Premium Mensal”", description: "Na tela da App Store, toque em Premium Mensal. A Apple mostra a data e o valor antes de você confirmar." });
      await openStoreSubscriptionManagement();
      onOpenChange(false);
      return;
    }
    if (isAndroid) {
      setSwitching(true);
      try {
        const result = await purchaseProduct("premium", { replacePurchaseToken: subscription.purchaseToken });
        if (result.success) {
          toast({ title: "Pronto! Você passa para o mensal", description: `Seu acesso continua${until ? ` até ${until}` : ""} e depois a cobrança será de ${monthly}/mês.` });
          onOpenChange(false);
          onChanged?.();
        } else if (result.error && result.error !== "Compra cancelada") {
          toast({ title: "Não foi possível trocar agora", description: result.error, variant: "destructive" });
        }
      } finally {
        setSwitching(false);
      }
    }
  };

  const goCancel = async () => {
    trackPurchaseStep("BUTTON_CLICK", { planType: subscription.planType, planName: "Abrir cancelamento na loja", source: "cancel_flow" });
    await openStoreSubscriptionManagement();
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[92dvh] bg-background" data-testid="sheet-manage-subscription">
        <div className="mx-auto w-full max-w-md overflow-y-auto px-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] pt-3">
          <div className="flex flex-col items-center text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <HeartHandshake className="h-6 w-6 text-primary" />
            </div>
            <DrawerTitle className="font-serif text-2xl font-medium leading-tight">
              {isAnnual ? "Antes de cancelar…" : "Gerenciar assinatura"}
            </DrawerTitle>
            <DrawerDescription className="mt-2 text-sm text-muted-foreground">
              {subscription.inTrial
                ? `Seu teste vai até ${until}. ${subscription.autoRenew ? `Depois começa a assinatura anual de ${annual}.` : "A renovação já está desligada: nada será cobrado."}`
                : `Seu Premium está ativo${until ? ` até ${until}` : ""}.`}
            </DrawerDescription>
          </div>

          {isAnnual && (
            <div className="mt-5 rounded-2xl border-2 border-primary/30 bg-card p-4 shadow-sm" data-testid="card-retention-monthly">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <ArrowRightLeft className="h-4 w-4 text-primary" />
                </span>
                <div className="min-w-0">
                  <p className="font-semibold">Prefere pagar mês a mês?</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    Continue com tudo do Premium no plano mensal, sem compromisso de um ano.
                  </p>
                  <p className="mt-2 font-serif text-xl font-semibold">{monthly} <span className="font-sans text-sm font-normal text-muted-foreground">por mês</span></p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {isIOS
                      ? "A App Store mostra a data e o valor da troca antes de você confirmar"
                      : `Vale a partir ${until ? `de ${until}` : "da próxima renovação"} · cancele quando quiser`}
                  </p>
                </div>
              </div>
              <Button className="mt-4 h-11 w-full rounded-xl font-semibold" onClick={switchToMonthly} disabled={switching} data-testid="button-switch-monthly">
                {switching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRightLeft className="mr-2 h-4 w-4" />}
                {switching ? "Abrindo a loja…" : "Mudar para o mensal"}
              </Button>
            </div>
          )}

          <Button variant="outline" className="mt-3 h-11 w-full rounded-xl" onClick={goCancel} data-testid="button-open-store-cancel">
            <ExternalLink className="mr-2 h-4 w-4" />
            {isAnnual ? "Continuar para cancelar" : "Abrir assinaturas da loja"}
          </Button>
          <p className="mt-3 text-center text-[11px] leading-relaxed text-muted-foreground">
            O cancelamento é feito na {storeName}, em Assinaturas. Ao cancelar, você mantém o acesso até o fim do período atual
            {subscription.inTrial ? " e não é cobrado." : "."}
          </p>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
