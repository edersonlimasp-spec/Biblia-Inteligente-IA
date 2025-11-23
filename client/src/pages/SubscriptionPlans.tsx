import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';
import { revenueCat, type Offering } from '@/lib/revenueCat';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { trackSubscriptionPageVisit } from '@/lib/tracking';

interface SubscriptionPlansProps {
  onSubscriptionChange?: () => void;
}

export function SubscriptionPlans({ onSubscriptionChange }: SubscriptionPlansProps) {
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    trackSubscriptionPageVisit().catch(() => {});
    loadOfferings();
  }, []);

  const loadOfferings = async () => {
    try {
      await revenueCat.initialize();
      const offers = await revenueCat.getOfferings();
      setOfferings(offers);
    } catch (error) {
      console.error('Failed to load offerings:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os planos',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchase = async (productId: string) => {
    setIsPurchasing(productId);
    try {
      const success = await revenueCat.purchase(productId);
      if (success) {
        toast({
          title: 'Sucesso',
          description: 'Compra realizada com sucesso!',
        });
        onSubscriptionChange?.();
      }
    } catch (error) {
      console.error('Purchase failed:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao processar a compra',
        variant: 'destructive',
      });
    } finally {
      setIsPurchasing(null);
    }
  };

  const handleRestorePurchases = async () => {
    try {
      await revenueCat.restorePurchases();
      toast({
        title: 'Sucesso',
        description: 'Compras restauradas',
      });
      onSubscriptionChange?.();
    } catch (error) {
      console.error('Restore failed:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao restaurar compras',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p>Carregando planos...</p>
      </div>
    );
  }

  const plans = [
    {
      id: 'gold_monthly',
      name: 'Gold',
      price: 'R$ 19,90',
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
      price: 'R$ 29,90',
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
      price: 'R$ 189,90',
      period: 'uma única vez',
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
              <p className="font-semibold mb-2">Há período de teste?</p>
              <p className="text-sm text-muted-foreground">
                Sim! Novos usuários ganham 30 dias de teste com acesso completo.
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
