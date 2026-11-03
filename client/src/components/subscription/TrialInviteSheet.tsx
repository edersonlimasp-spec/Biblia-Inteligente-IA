import { useState } from "react";
import { useLocation } from "wouter";
import { BellRing, BookOpenText, CalendarCheck, Crown, GraduationCap, Infinity as InfinityIcon, Loader2, MessagesSquare, Sparkles } from "lucide-react";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { isIOS } from "@/lib/capacitor";
import { purchaseProduct, type StoreTrialInfo } from "@/lib/inAppPurchases";
import { trackPurchaseStep } from "@/lib/tracking";
import { FALLBACK_PRICES, perMonthFrom } from "@/hooks/useStoreSubscription";

const BENEFITS = [
  { icon: InfinityIcon, text: "Strong ilimitado em hebraico e grego" },
  { icon: MessagesSquare, text: "Assistente de estudo com contexto histórico e cultural" },
  { icon: GraduationCap, text: "Todos os cursos e modos de estudo liberados" },
  { icon: BookOpenText, text: "Exegese, preparação de sermões e mapas completos" },
];

function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", "");
}

interface TrialInviteSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trial: StoreTrialInfo;
  onStarted?: () => void;
  onDecline?: () => void;
}

/**
 * Convite opcional para 7 dias de Premium. Transparente por regra: o valor
 * cobrado (anual) é o preço mais visível; o equivalente mensal é secundário;
 * a data da cobrança e como cancelar ficam explícitos antes do botão.
 */
export function TrialInviteSheet({ open, onOpenChange, trial, onStarted, onDecline }: TrialInviteSheetProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [starting, setStarting] = useState(false);
  const days = trial.days || 7;
  const annualPrice = trial.annualPrice || FALLBACK_PRICES.annual;
  const storeName = isIOS ? "App Store" : "Google Play";
  const reminderDay = Math.max(1, days - 2);

  const start = async () => {
    setStarting(true);
    trackPurchaseStep("BUTTON_CLICK", { planType: "premium_anual", planName: "Teste grátis 7 dias", source: "trial_invite" });
    try {
      const result = await purchaseProduct("premium_anual");
      if (result.success) {
        toast({ title: "Seu teste Premium começou!", description: `Aproveite os ${days} dias. Avisaremos antes de qualquer cobrança.` });
        onOpenChange(false);
        onStarted?.();
        setTimeout(() => window.location.reload(), 1500);
      } else if (result.error && result.error !== "Compra cancelada") {
        toast({ title: "Não foi possível iniciar o teste", description: result.error, variant: "destructive" });
      }
    } finally {
      setStarting(false);
    }
  };

  const decline = () => {
    onOpenChange(false);
    onDecline?.();
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[94dvh] bg-background" data-testid="sheet-trial-invite">
        <div className="mx-auto w-full max-w-md overflow-y-auto px-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] pt-3">
          {/* Cabeçalho */}
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-3">
              <div className="absolute inset-0 rounded-full bg-[#BFA87A]/30 blur-xl" aria-hidden="true" />
              <div className="relative flex h-14 w-14 items-center justify-center rounded-full border border-[#BFA87A]/50 bg-card shadow-sm">
                <Crown className="h-7 w-7 text-[#BFA87A]" />
              </div>
            </div>
            <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
              <Sparkles className="h-3 w-3" /> Convite especial
            </span>
            <DrawerTitle className="font-serif text-[26px] font-medium leading-tight">
              Experimente o Premium grátis por {days} dias
            </DrawerTitle>
            <DrawerDescription className="mt-2 text-sm text-muted-foreground">
              Aprofunde seus estudos com todos os recursos. Se não gostar, cancele antes do fim e não paga nada.
            </DrawerDescription>
          </div>

          {/* Benefícios */}
          <ul className="mt-5 space-y-2.5">
            {BENEFITS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3 text-sm">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Icon className="h-3.5 w-3.5 text-primary" />
                </span>
                <span className="leading-snug">{text}</span>
              </li>
            ))}
          </ul>

          {/* Linha do tempo — como e quando a cobrança acontece */}
          <div className="mt-5 rounded-2xl border bg-card p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Como funciona</p>
            <ol className="relative space-y-3.5 border-l border-dashed border-border pl-5">
              <li className="relative">
                <span className="absolute -left-[27px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary ring-4 ring-card" />
                <p className="text-sm font-semibold">Hoje · acesso Premium completo</p>
                <p className="text-xs text-muted-foreground">Nenhuma cobrança agora.</p>
              </li>
              <li className="relative">
                <span className="absolute -left-[27px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#BFA87A] ring-4 ring-card">
                  <BellRing className="h-2.5 w-2.5 text-white" />
                </span>
                <p className="text-sm font-semibold">Dia {reminderDay} · {addDays(reminderDay)}</p>
                <p className="text-xs text-muted-foreground">Avisamos que o teste está acabando.</p>
              </li>
              <li className="relative">
                <span className="absolute -left-[27px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-foreground/70 ring-4 ring-card">
                  <CalendarCheck className="h-2.5 w-2.5 text-background" />
                </span>
                <p className="text-sm font-semibold">Dia {days} · {addDays(days)}</p>
                <p className="text-xs text-muted-foreground">Começa a assinatura anual, se você não cancelar.</p>
              </li>
            </ol>
          </div>

          {/* Preço — o valor cobrado é o destaque */}
          <div className="mt-4 text-center" data-testid="text-trial-price">
            <p className="text-sm text-muted-foreground">Depois do teste</p>
            <p className="font-serif text-2xl font-semibold text-foreground">{annualPrice} por ano</p>
            <p className="text-xs text-muted-foreground">equivale a {perMonthFrom(trial.annualPrice)}/mês · cobrado uma vez por ano</p>
          </div>

          <Button
            size="lg"
            className="mt-4 h-12 w-full rounded-xl text-base font-semibold shadow-md"
            onClick={start}
            disabled={starting}
            data-testid="button-start-trial"
          >
            {starting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Crown className="mr-2 h-5 w-5" />}
            {starting ? "Abrindo a loja…" : `Começar ${days} dias grátis`}
          </Button>
          <Button
            variant="ghost"
            className="mt-1 h-11 w-full text-sm text-muted-foreground"
            onClick={decline}
            disabled={starting}
            data-testid="button-decline-trial"
          >
            Agora não, continuar no gratuito
          </Button>

          <p className="mt-2 text-center text-[11px] leading-relaxed text-muted-foreground">
            O teste é para novos assinantes. Você confirma na {storeName} e pode cancelar a qualquer momento
            em Ajustes › Assinaturas, até 24 horas antes do fim do teste, sem cobrança. Depois, a assinatura de {annualPrice}/ano
            renova automaticamente até ser cancelada.{" "}
            <button type="button" className="underline underline-offset-2" onClick={() => setLocation("/termos")}>Termos de Uso</button>
            {" · "}
            <button type="button" className="underline underline-offset-2" onClick={() => setLocation("/privacidade")}>Privacidade</button>
          </p>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
