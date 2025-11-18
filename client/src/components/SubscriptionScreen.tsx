import { Check, Crown, Sparkles, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SubscriptionScreenProps {
  onBack?: () => void;
}

export function SubscriptionScreen({ onBack }: SubscriptionScreenProps) {
  const plans = [
    {
      name: "Strong Vitalício",
      price: "R$ 189,90",
      period: "pagamento único",
      icon: Crown,
      features: [
        "Dicionário Strong completo",
        "Acesso a textos em Hebraico",
        "Acesso a textos em Grego",
        "Morfologia detalhada",
        "Acesso vitalício",
        "Sem mensalidades",
      ],
      highlight: true,
      badge: "Melhor Valor",
    },
    {
      name: "IA Essencial",
      price: "R$ 19,90",
      period: "por mês",
      icon: Sparkles,
      features: [
        "Explicações básicas de IA",
        "Contexto cultural simples",
        "Perguntas ilimitadas",
        "Respostas rápidas",
        "Histórico de conversas",
      ],
      highlight: false,
    },
    {
      name: "IA Premium",
      price: "R$ 49,90",
      period: "por mês",
      icon: Sparkles,
      features: [
        "Tudo do Essencial, mais:",
        "Exegese profunda",
        "Comparação teológica",
        "Estudos completos",
        "Modo pregador",
        "Modo professor",
        "Análise avançada",
      ],
      highlight: false,
      badge: "Popular",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">
            <Lock className="h-3 w-3 mr-1" />
            Trial de 30 dias: 15 dias restantes
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-primary mb-3">
            Escolha seu Plano
          </h1>
          <p className="text-muted-foreground text-lg">
            Desbloqueie todo o potencial dos estudos bíblicos
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
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
                  <Button
                    className="w-full"
                    variant={plan.highlight ? "default" : "outline"}
                    data-testid={`button-subscribe-${plan.name.toLowerCase().replace(/\s/g, "-")}`}
                  >
                    {plan.highlight ? "Assinar Agora" : "Escolher Plano"}
                  </Button>
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
                  Novos usuários têm acesso gratuito ao dicionário Strong, textos em Hebraico e Grego por 30 dias.
                  Após o período, o acesso será bloqueado automaticamente. Assine um plano para continuar aproveitando.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
