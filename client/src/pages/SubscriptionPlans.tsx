import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, ArrowLeft } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { trackSubscriptionPageVisit } from '@/lib/tracking';

interface SubscriptionPlansProps {
  onSubscriptionChange?: () => void;
}

export function SubscriptionPlans({ onSubscriptionChange }: SubscriptionPlansProps) {
  const [isPurchasing, setIsPurchasing] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    trackSubscriptionPageVisit().catch(() => {});
  }, []);

  const handlePurchase = async (planId: string) => {
    setIsPurchasing(planId);
    try {
      // Map plan IDs to backend plan names
      const planMap: Record<string, string> = {
        'gold_monthly': 'gold',
        'premium_monthly': 'premium',
        'strong_lifetime': 'vitalicio',
      };
      
      const plan = planMap[planId] || planId;
      
      // Call Mercado Pago checkout endpoint
      const response = await apiRequest('POST', '/api/mp/create-checkout', { plan });
      
      const data = await response.json();
      
      if (data.init_point) {
        console.log('[MP] Redirecionando para checkout:', data.init_point);
        
        // Detecta se está em iframe (preview do Replit ou webview)
        const isInIframe = window.self !== window.top;
        
        if (isInIframe) {
          // Se em iframe, abre em nova aba para evitar problemas de CORS/CSP
          const newWindow = window.open(data.init_point, '_blank');
          if (!newWindow) {
            // Popup bloqueado - tenta top-level
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
      console.error('Purchase failed:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Falha ao processar a compra',
        variant: 'destructive',
      });
      setIsPurchasing(null);
    }
  };

  const handleRestorePurchases = async () => {
    toast({
      title: 'Info',
      description: 'Se você já fez uma compra, seu plano será ativado automaticamente após confirmação do pagamento.',
    });
    onSubscriptionChange?.();
  };

  const plans = [
    {
      id: 'gold_monthly',
      name: 'Gold',
      price: 'R$ 9,90',
      period: '/mês',
      description: 'Perfeito para iniciantes',
      features: [
        '✓ IA Professor (Essencial)',
        '✓ Strong + Hebraico/Grego',
        '✓ Marcadores e Anotações',
        '✓ Offline (PWA)',
      ],
      highlighted: false,
    },
    {
      id: 'premium_monthly',
      name: 'Premium',
      price: 'R$ 19,90',
      period: '/mês',
      description: 'Para estudos profundos',
      features: [
        '✓ IA Professor (Premium - Exegese)',
        '✓ Strong + Hebraico/Grego',
        '✓ Marcadores e Anotações',
        '✓ Offline (PWA)',
        '✓ Prioridade no suporte',
      ],
      highlighted: true,
    },
    {
      id: 'strong_lifetime',
      name: 'Strong Vitalício',
      price: 'R$ 49,90',
      period: ' único',
      description: 'Acesso permanente',
      features: [
        '✓ Strong + Hebraico/Grego (Permanente)',
        '✓ Marcadores e Anotações',
        '✓ Offline (PWA)',
        '✗ IA Professor não incluída',
      ],
      highlighted: false,
    },
  ];

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.history.back()}
            data-testid="button-back-subscription"
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-primary mb-4">Desbloqueie Todo o Poder</h1>
          <p className="text-lg text-muted-foreground">
            Escolha o plano perfeito para seus estudos bíblicos
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`relative flex flex-col p-6 transition-all ${
                plan.highlighted
                  ? 'ring-2 ring-primary scale-105 shadow-lg'
                  : 'hover:shadow-md'
              }`}
              data-testid={`card-plan-${plan.id}`}
            >
              {plan.highlighted && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  Mais Popular
                </Badge>
              )}

              <div className="mb-4">
                <h2 className="text-2xl font-bold text-primary">{plan.name}</h2>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground text-sm">{plan.period}</span>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="text-sm text-foreground flex items-start">
                    <Check className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => handlePurchase(plan.id)}
                disabled={isPurchasing === plan.id}
                variant={plan.highlighted ? 'default' : 'outline'}
                className="w-full"
                data-testid={`button-purchase-${plan.id}`}
              >
                {isPurchasing === plan.id ? 'Processando...' : 'Selecionar'}
              </Button>
            </Card>
          ))}
        </div>

        {/* Restore Purchases */}
        <div className="text-center">
          <Button
            variant="ghost"
            onClick={handleRestorePurchases}
            data-testid="button-restore-purchases"
          >
            Restaurar Compras Anteriores
          </Button>
        </div>

        {/* FAQ */}
        <div className="mt-12 max-w-2xl mx-auto">
          <h3 className="text-xl font-bold mb-4 text-primary">Perguntas Frequentes</h3>
          <div className="space-y-4">
            <div>
              <p className="font-semibold mb-2">Posso cancelar a qualquer momento?</p>
              <p className="text-sm text-muted-foreground">
                Sim! Você pode cancelar sua assinatura a qualquer momento nas configurações do seu dispositivo.
              </p>
            </div>
            <div>
              <p className="font-semibold mb-2">É gratuito?</p>
              <p className="text-sm text-muted-foreground">
                Sim! Todos os visitantes têm acesso gratuito ao Strong e IA Essencial desde o início.
              </p>
            </div>
            <div>
              <p className="font-semibold mb-2">Qual a diferença entre os planos?</p>
              <p className="text-sm text-muted-foreground">
                Gold oferece IA essencial, Premium oferece IA com exegese profunda, e Strong Vitalício libera o dicionário para sempre.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
