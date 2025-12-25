import { useState, useEffect } from "react";
import { Check, Crown, Sparkles, Lock, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import appLogo from "@assets/logo/logo.png";
import { useAuth } from "@/contexts/AuthContext";
import { AuthModal } from "./AuthModal";
import { useToast } from "@/hooks/use-toast";
import { getDeviceId } from "@/hooks/use-device-id";
import { UserButton } from "@/components/UserButton";
import { apiRequest } from "@/lib/queryClient";
import { trackSubscriptionPageVisit } from "@/lib/tracking";

interface SubscriptionScreenProps {
  onBack?: () => void;
}

export function SubscriptionScreen({ onBack }: SubscriptionScreenProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [trialDaysRemaining, setTrialDaysRemaining] = useState<number | null>(null);
  const [isPurchasing, setIsPurchasing] = useState<string | null>(null);

  useEffect(() => {
    trackSubscriptionPageVisit();
  }, []);

  useEffect(() => {
    async function fetchTrialInfo() {
      try {
        if (user) {
          const res = await fetch('/api/user/subscription-status');
          if (res.ok) {
            const data = await res.json();
            if (data.trialActive && data.trialDaysRemaining) {
              setTrialDaysRemaining(data.trialDaysRemaining);
            }
          }
        } else {
          const deviceId = getDeviceId();
          const res = await fetch(`/api/guest/trial/${deviceId}`);
          if (res.ok) {
            const data = await res.json();
            if (data.active) {
              setTrialDaysRemaining(data.daysRemaining);
            }
          }
        }
      } catch (error) {
        console.error('Erro ao buscar trial:', error);
      }
    }
    fetchTrialInfo();
  }, [user]);

  // Map plan names to backend plan IDs
  const planNameToId: Record<string, string> = {
    'Strong Vitalício': 'vitalicio',
    'Plano Gold': 'gold',
    'Plano Premium': 'premium',
  };

  const handlePlanSelect = async (planName: string) => {
    if (!user) {
      setSelectedPlan(planName);
      setShowAuthModal(true);
      return;
    }
    
    const planId = planNameToId[planName];
    if (!planId) {
      toast({
        title: 'Erro',
        description: 'Plano inválido',
        variant: 'destructive',
      });
      return;
    }
    
    setIsPurchasing(planName);
    
    try {
      const response = await apiRequest('POST', '/api/mp/create-checkout', { plan: planId });
      const data = await response.json();
      
      if (data.init_point) {
        console.log('[MP] Redirecionando para checkout:', data.init_point);
        
        // Detecta se está em iframe (preview do Replit ou webview)
        const isInIframe = window.self !== window.top;
        
        if (isInIframe) {
          // Se em iframe, abre em nova aba para evitar problemas de CORS/CSP
          const newWindow = window.open(data.init_point, '_blank');
          if (!newWindow) {
            // Popup bloqueado - mostra mensagem
            toast({
              title: 'Abrir Pagamento',
              description: 'Clique no link para abrir o checkout do Mercado Pago em nova aba.',
            });
            // Fallback: tenta top-level
            window.top?.location.assign(data.init_point);
          }
        } else {
          // Navegação top-level normal
          window.location.assign(data.init_point);
        }
      } else {
        throw new Error('Erro ao criar checkout');
      }
    } catch (error: any) {
      console.error('Erro ao processar pagamento:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Falha ao processar o pagamento',
        variant: 'destructive',
      });
      setIsPurchasing(null);
    }
  };

  const handleAuthSuccess = () => {
    if (selectedPlan) {
      toast({
        title: "Conta criada!",
        description: `Agora você pode assinar o ${selectedPlan}.`,
      });
    }
  };
  type PlanInfo = {
    name: string;
    price: string;
    period: string;
    icon: typeof Lock | typeof Crown | typeof Sparkles;
    features: string[];
    highlight: boolean;
    badge?: string;
    isFree?: boolean;
  };
  
  const plans: PlanInfo[] = [
    {
      name: "Gratuito",
      price: "R$ 0",
      period: "para sempre",
      icon: Lock,
      features: [
        "2 palavras Strong (visitante)",
        "4 palavras Strong (com login)",
        "3 gravações de sermão",
        "3 eventos na agenda",
        "5 perguntas à IA (total)",
        "Leitura bíblica ilimitada",
        "Sem acesso aos cursos",
      ],
      highlight: false,
      isFree: true,
    },
    {
      name: "Strong Vitalício",
      price: "R$ 49,90",
      period: "pagamento único",
      icon: Crown,
      features: [
        "Dicionário Strong ilimitado",
        "Acesso a textos em Hebraico",
        "Acesso a textos em Grego",
        "Morfologia detalhada",
        "Acesso vitalício",
        "Sem mensalidades",
        "Sem acesso à IA Professor",
        "Sem acesso aos cursos",
      ],
      highlight: false,
    },
    {
      name: "Plano Gold",
      price: "R$ 9,90",
      period: "por mês",
      icon: Sparkles,
      features: [
        "20 palavras Strong por dia",
        "30 perguntas IA por dia",
        "30 gravações de sermão",
        "30 eventos na agenda",
        "IA Professor (modo Essencial)",
        "Histórico de conversas",
        "Sem acesso aos cursos",
      ],
      highlight: false,
    },
    {
      name: "Plano Premium",
      price: "R$ 19,90",
      period: "por mês",
      icon: Sparkles,
      features: [
        "Strong ilimitado",
        "100 perguntas IA por dia",
        "100 gravações de sermão",
        "100 eventos na agenda",
        "IA Professor (modo Premium)",
        "Exegese profunda",
        "Modo pregador/professor",
        "Cursos Premium exclusivos",
      ],
      highlight: true,
      badge: "Recomendado",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 dark:from-primary/20 dark:via-background dark:to-primary/20">
      {/* Header com botão voltar */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} data-testid="button-back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Assinaturas</h1>
            <p className="text-sm text-muted-foreground">Escolha seu plano</p>
          </div>
          <UserButton />
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="text-center mb-12">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <img 
              src={appLogo} 
              alt="Bíblia Inteligente" 
              className="h-20 w-20 md:h-24 md:w-24"
              data-testid="img-subscription-logo"
            />
          </div>
          
          {trialDaysRemaining !== null && trialDaysRemaining > 0 && (
            <Badge variant="secondary" className="mb-4">
              <Lock className="h-3 w-3 mr-1" />
              Trial de 30 dias: {trialDaysRemaining} dias restantes
            </Badge>
          )}
          <h1 className="text-3xl md:text-4xl font-bold text-primary mb-3">
            Escolha seu Plano
          </h1>
          <p className="text-muted-foreground text-lg">
            Desbloqueie todo o potencial dos estudos bíblicos
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <Card
                key={plan.name}
                className={`relative ${
                  plan.highlight
                    ? "border-primary shadow-lg ring-2 ring-primary/20"
                    : ""
                }`}
                data-testid={`card-plan-${plan.name.toLowerCase().replace(/\s/g, "-")}`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge variant="default" className="shadow-md">
                      {plan.badge}
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-3">
                    <div className="p-3 bg-primary/10 rounded-full">
                      <Icon className="h-8 w-8 text-primary" />
                    </div>
                  </div>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription className="mt-2">
                    <span className="text-3xl font-bold text-primary">
                      {plan.price}
                    </span>
                    <span className="text-sm text-muted-foreground block mt-1">
                      {plan.period}
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  {plan.isFree ? (
                    <div className="text-center text-sm text-muted-foreground py-2">
                      Plano atual para visitantes
                    </div>
                  ) : (
                    <Button
                      className="w-full"
                      variant={plan.highlight ? "default" : "outline"}
                      onClick={() => handlePlanSelect(plan.name)}
                      disabled={isPurchasing === plan.name}
                      data-testid={`button-subscribe-${plan.name.toLowerCase().replace(/\s/g, "-")}`}
                    >
                      {isPurchasing === plan.name ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Processando...
                        </>
                      ) : plan.highlight ? "Assinar Agora" : "Escolher Plano"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Trial Info */}
        <Card className="bg-accent/30">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Lock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Sobre o Trial de 30 Dias</h3>
                <p className="text-sm text-muted-foreground">
                  Novos usuários têm acesso completo gratuito por 30 dias: Strong, Hebraico, Grego e IA Professor (modo Essencial, 30 perguntas/dia).
                  Após o período, esses recursos serão bloqueados. Assine um plano para continuar aproveitando.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <AuthModal
        open={showAuthModal}
        onOpenChange={setShowAuthModal}
        onAuthSuccess={handleAuthSuccess}
        title="Criar conta para assinar"
        description={selectedPlan ? `Para assinar o ${selectedPlan}, você precisa criar uma conta ou fazer login.` : undefined}
      />
    </div>
  );
}
