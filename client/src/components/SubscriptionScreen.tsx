import { useState, useEffect, useRef } from "react";
import { Check, Crown, Sparkles, Lock, ArrowLeft, Loader2, Tag, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import appLogo from "@assets/logo/logo.png";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { AuthModal } from "./AuthModal";
import { useToast } from "@/hooks/use-toast";
import { getDeviceId } from "@/hooks/use-device-id";
import { UserButton } from "@/components/UserButton";
import { apiRequest } from "@/lib/queryClient";
import { trackSubscriptionPageVisit } from "@/lib/tracking";
import { isAndroid, platform } from "@/lib/capacitor";
import { purchaseProduct } from "@/lib/inAppPurchases";

interface CouponData {
  valid: boolean;
  reason?: string;
  couponId?: string;
  discountType?: string;
  discountValue?: number;
  discountAmount?: number;
  amountBefore?: number;
  finalAmount?: number;
  discountDisplay?: string;
}

interface SubscriptionScreenProps {
  onBack?: () => void;
}

export function SubscriptionScreen({ onBack }: SubscriptionScreenProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [trialDaysRemaining, setTrialDaysRemaining] = useState<number | null>(null);
  const [isPurchasing, setIsPurchasing] = useState<string | null>(null);
  
  // Selected plan for purchase (separado da seleção para auth modal)
  const [selectedPlanForPurchase, setSelectedPlanForPurchase] = useState<string | null>(null);
  
  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<CouponData | null>(null);
  
  // Ref para scroll automático ao resumo do pedido
  const orderSummaryRef = useRef<HTMLDivElement>(null);
  
  // Detected when the user has an active Mercado Pago (web) subscription but is
  // using the Play Store app — we show them an informational banner.
  const [hasWebOnlySubscription, setHasWebOnlySubscription] = useState(false);

  useEffect(() => {
    trackSubscriptionPageVisit();
  }, []);

  useEffect(() => {
    async function fetchTrialInfo() {
      try {
        if (user) {
          const subHeaders: Record<string, string> = {};
          if (platform === 'android' || platform === 'ios') {
            subHeaders['x-client-platform'] = platform;
          }
          const authToken = localStorage.getItem('authToken');
          if (authToken) subHeaders['Authorization'] = `Bearer ${authToken}`;
          const res = await fetch('/api/user/subscription-status', { headers: subHeaders });
          if (res.ok) {
            const data = await res.json();
            if (data.trialActive && data.trialDaysRemaining) {
              setTrialDaysRemaining(data.trialDaysRemaining);
            }
            if (data.hasWebOnlySubscription) {
              setHasWebOnlySubscription(true);
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

  // Validate coupon function - usa selectedPlanForPurchase
  const validateCoupon = async () => {
    if (!couponCode.trim() || !user || !selectedPlanForPurchase) return;
    
    setIsValidatingCoupon(true);
    try {
      const response = await apiRequest('POST', '/api/coupons/validate', {
        code: couponCode.trim(),
        planId: getPlanIdForBackend(selectedPlanForPurchase),
      });
      const data: CouponData = await response.json();
      
      if (data.valid) {
        setAppliedCoupon(data);
        toast({
          title: t("subscription.coupon.applied") || "Cupom aplicado!",
          description: data.discountDisplay || `Desconto de R$${((data.discountAmount || 0) / 100).toFixed(2)}`,
          duration: 1500,
        });
      } else {
        setAppliedCoupon(null);
        toast({
          title: t("subscription.coupon.invalid") || "Cupom inválido",
          description: data.reason || "Cupom não encontrado",
          variant: 'destructive',
          duration: 1500,
        });
      }
    } catch (error: any) {
      console.error('Erro ao validar cupom:', error);
      setAppliedCoupon(null);
      toast({
        title: t("common.error"),
        description: error.message || "Erro ao validar cupom",
        variant: 'destructive',
        duration: 1500,
      });
    } finally {
      setIsValidatingCoupon(false);
    }
  };
  
  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
  };
  
  // Selecionar plano para compra (NÃO vai para pagamento ainda)
  const handleSelectPlanForPurchase = (planId: string, planName: string) => {
    if (!user) {
      setSelectedPlan(planName);
      setShowAuthModal(true);
      return;
    }
    
    if (planId === "free") return;
    
    // Se já tinha um plano selecionado diferente, limpa o cupom
    if (selectedPlanForPurchase && selectedPlanForPurchase !== planId) {
      setAppliedCoupon(null);
    }
    
    setSelectedPlanForPurchase(planId);
    
    // Scroll automático para o resumo do pedido após um pequeno delay
    setTimeout(() => {
      orderSummaryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  // Plan ID mapping is now handled via plan.id in the plans array

  const handlePlanSelect = async (planId: string, planName: string) => {
    if (!user) {
      setSelectedPlan(planName);
      setShowAuthModal(true);
      return;
    }
    
    if (!planId || planId === "free") {
      toast({
        title: t("common.error"),
        description: t("subscription.invalidPlan"),
        variant: 'destructive',
      });
      return;
    }
    
    setIsPurchasing(planId);

    // ── Google Play Billing (Android nativo) ──────────────────────────
    if (isAndroid) {
      try {
        const planTypeMap: Record<string, 'gold' | 'gold_anual' | 'premium' | 'premium_anual' | 'strong_lifetime'> = {
          gold:          'gold',
          gold_anual:    'gold_anual',
          premium:       'premium',
          premium_anual: 'premium_anual',
          vitalicio:     'strong_lifetime',
        };
        const mappedPlan = planTypeMap[planId] || (planId as any);
        const result = await purchaseProduct(mappedPlan);
        if (result.success) {
          toast({ title: 'Assinatura ativada!', description: `Plano ${planName} ativo com sucesso.` });
        } else if (result.error && result.error !== 'Compra cancelada') {
          toast({ title: t("common.error"), description: result.error, variant: 'destructive' });
        }
      } catch (error: any) {
        toast({ title: t("common.error"), description: error.message || t("subscription.processingError"), variant: 'destructive' });
      } finally {
        setIsPurchasing(null);
      }
      return;
    }

    // ── Mercado Pago (Web / fora do Google Play) ──────────────────────
    try {
      const payload: { plan: string; couponCode?: string } = { 
        plan: getPlanIdForBackend(planId) 
      };
      
      if (appliedCoupon?.valid && selectedPlanForPurchase === planId && couponCode.trim()) {
        payload.couponCode = couponCode.trim();
      }
      
      const response = await apiRequest('POST', '/api/mp/create-checkout', payload);
      const data = await response.json();
      
      if (data.init_point) {
        console.log('[MP] Redirecionando para checkout:', data.init_point);
        
        const isInIframe = window.self !== window.top;
        
        if (isInIframe) {
          const newWindow = window.open(data.init_point, '_blank');
          if (!newWindow) {
            toast({
              title: t("subscription.openPayment"),
              description: t("subscription.openPaymentDesc"),
            });
            window.top?.location.assign(data.init_point);
          }
        } else {
          window.location.assign(data.init_point);
        }
      } else {
        throw new Error('Erro ao criar checkout');
      }
    } catch (error: any) {
      console.error('Erro ao processar pagamento:', error);
      toast({
        title: t("common.error"),
        description: error.message || t("subscription.processingError"),
        variant: 'destructive',
      });
      setIsPurchasing(null);
    }
  };

  const getPlanIdForBackend = (planId: string): string => {
    const mapping: Record<string, string> = {
      'vitalicio': 'vitalicio',
      'gold': 'gold',
      'premium': 'premium',
    };
    return mapping[planId] || planId;
  };

  const handleAuthSuccess = () => {
    if (selectedPlan) {
      toast({
        title: t("subscription.accountCreated"),
        description: `${t("subscription.nowCanSubscribe")} ${selectedPlan}.`,
      });
    }
  };
  type PlanInfo = {
    id: string;
    name: string;
    price: string;
    priceValue: number; // valor em centavos
    period: string;
    icon: typeof Lock | typeof Crown | typeof Sparkles;
    features: string[];
    highlight: boolean;
    badge?: string;
    isFree?: boolean;
  };
  
  const plans: PlanInfo[] = [
    {
      id: "free",
      name: t("subscription.plans.free.name"),
      price: t("subscription.plans.free.price"),
      priceValue: 0,
      period: t("subscription.plans.free.period"),
      icon: Lock,
      features: [
        t("subscription.plans.free.feature1"),
        t("subscription.plans.free.feature2"),
        t("subscription.plans.free.feature3"),
        t("subscription.plans.free.feature4"),
        t("subscription.plans.free.feature5"),
        t("subscription.plans.free.feature6"),
      ],
      highlight: false,
      isFree: true,
    },
    {
      id: "vitalicio",
      name: t("subscription.plans.lifetime.name"),
      price: t("subscription.plans.lifetime.price"),
      priceValue: 4990, // R$ 49,90
      period: t("subscription.plans.lifetime.period"),
      icon: Crown,
      features: [
        t("subscription.plans.lifetime.feature1"),
        t("subscription.plans.lifetime.feature2"),
        t("subscription.plans.lifetime.feature3"),
        t("subscription.plans.lifetime.feature4"),
        t("subscription.plans.lifetime.feature5"),
        t("subscription.plans.lifetime.feature6"),
      ],
      highlight: false,
    },
    {
      id: "gold",
      name: t("subscription.plans.gold.name"),
      price: t("subscription.plans.gold.price"),
      priceValue: 990, // R$ 9,90
      period: t("subscription.plans.gold.period"),
      icon: Sparkles,
      features: [
        t("subscription.plans.gold.feature1"),
        t("subscription.plans.gold.feature2"),
        t("subscription.plans.gold.feature3"),
        t("subscription.plans.gold.feature4"),
        t("subscription.plans.gold.feature5"),
        t("subscription.plans.gold.feature6"),
        t("subscription.plans.gold.feature7"),
      ],
      highlight: false,
    },
    {
      id: "gold_anual",
      name: t("subscription.plans.gold_anual.name"),
      price: t("subscription.plans.gold_anual.price"),
      priceValue: 7990, // R$ 79,90
      period: t("subscription.plans.gold_anual.period"),
      icon: Sparkles,
      features: [
        t("subscription.plans.gold_anual.feature1"),
        t("subscription.plans.gold_anual.feature2"),
        t("subscription.plans.gold_anual.feature3"),
        t("subscription.plans.gold_anual.feature4"),
        t("subscription.plans.gold_anual.feature5"),
        t("subscription.plans.gold_anual.feature6"),
        t("subscription.plans.gold_anual.feature7"),
      ],
      highlight: false,
      badge: t("subscription.plans.gold_anual.savings"),
    },
    {
      id: "premium",
      name: t("subscription.plans.premium.name"),
      price: t("subscription.plans.premium.price"),
      priceValue: 1990, // R$ 19,90
      period: t("subscription.plans.premium.period"),
      icon: Sparkles,
      features: [
        t("subscription.plans.premium.feature1"),
        t("subscription.plans.premium.feature2"),
        t("subscription.plans.premium.feature3"),
        t("subscription.plans.premium.feature4"),
        t("subscription.plans.premium.feature5"),
        t("subscription.plans.premium.feature6"),
        t("subscription.plans.premium.feature7"),
        t("subscription.plans.premium.feature8"),
      ],
      highlight: false,
    },
    {
      id: "premium_anual",
      name: t("subscription.plans.premium_anual.name"),
      price: t("subscription.plans.premium_anual.price"),
      priceValue: 12990, // R$ 129,90
      period: t("subscription.plans.premium_anual.period"),
      icon: Sparkles,
      features: [
        t("subscription.plans.premium_anual.feature1"),
        t("subscription.plans.premium_anual.feature2"),
        t("subscription.plans.premium_anual.feature3"),
        t("subscription.plans.premium_anual.feature4"),
        t("subscription.plans.premium_anual.feature5"),
        t("subscription.plans.premium_anual.feature6"),
        t("subscription.plans.premium_anual.feature7"),
        t("subscription.plans.premium_anual.feature8"),
      ],
      highlight: true,
      badge: t("subscription.plans.premium_anual.savings"),
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
            <h1 className="text-xl font-bold">{t("subscription.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("subscription.subtitle")}</p>
          </div>
          <UserButton />
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-4 md:p-8">
        {/* Header - Compacto */}
        <div className="text-center mb-6">
          {/* Logo */}
          <div className="flex justify-center mb-3">
            <img 
              src={appLogo} 
              alt="Bíblia Inteligente" 
              className="h-14 w-14 md:h-16 md:w-16"
              data-testid="img-subscription-logo"
            />
          </div>
          
          {trialDaysRemaining !== null && trialDaysRemaining > 0 && (
            <Badge variant="secondary" className="mb-2">
              <Lock className="h-3 w-3 mr-1" />
              {t("subscription.trialBadge").replace("{days}", String(trialDaysRemaining))}
            </Badge>
          )}
          <h1 className="text-2xl md:text-3xl font-bold text-primary mb-1">
            {t("subscription.choosePlan")}
          </h1>
          <p className="text-muted-foreground text-sm">
            {t("subscription.unlockPotential")}
          </p>
        </div>

        {/* Web-only subscription warning — shown when user has a Mercado Pago subscription
            but is accessing the app via Google Play / App Store. Google Play Policy requires
            separate billing: web purchases do not unlock content inside the store app. */}
        {isAndroid && hasWebOnlySubscription && (
          <Card className="mb-6 border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/30">
            <CardContent className="pt-4 pb-4">
              <div className="flex gap-3 items-start">
                <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">
                    Assinatura Web detectada
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-0.5">
                    Você tem uma assinatura ativa pelo site (Mercado Pago). Para usar os recursos premium neste aplicativo, é necessário assinar pelo Google Play Billing abaixo.
                  </p>
                  <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-1">
                    Isso é exigido pela política do Google Play para compras de conteúdo digital em aplicativos.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const hasCouponForThisPlan = appliedCoupon?.valid && selectedPlanForPurchase === plan.id;
            const discountedPrice = hasCouponForThisPlan && appliedCoupon?.finalAmount 
              ? `R$${(appliedCoupon.finalAmount / 100).toFixed(2).replace('.', ',')}`
              : null;
            
            return (
              <Card
                key={plan.id}
                className={`relative ${
                  plan.highlight
                    ? "border-primary shadow-lg ring-2 ring-primary/20"
                    : ""
                } ${hasCouponForThisPlan ? "ring-2 ring-green-500/50" : ""} ${selectedPlanForPurchase === plan.id ? "ring-2 ring-primary" : ""} cursor-pointer hover-elevate`}
                data-testid={`card-plan-${plan.id}`}
                onClick={() => {
                  if (!plan.isFree) {
                    handleSelectPlanForPurchase(plan.id, plan.name);
                  }
                }}
              >
                {plan.badge && (
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                    <Badge variant="default" className="shadow-md text-xs">
                      {plan.badge}
                    </Badge>
                  </div>
                )}
                {hasCouponForThisPlan && (
                  <div className="absolute -top-2 right-2">
                    <Badge variant="secondary" className="bg-green-500 text-white shadow-md text-xs">
                      <Tag className="h-3 w-3 mr-1" />
                      {appliedCoupon.discountDisplay}
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-2 pt-5 px-4">
                  <div className="flex justify-center mb-2">
                    <div className="p-2.5 bg-primary/10 rounded-full">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  <CardDescription className="mt-1">
                    {discountedPrice ? (
                      <>
                        <span className="text-sm line-through text-muted-foreground">
                          {plan.price}
                        </span>
                        <span className="text-2xl font-bold text-green-600 dark:text-green-400 ml-2">
                          {discountedPrice}
                        </span>
                      </>
                    ) : (
                      <span className="text-2xl font-bold text-primary">
                        {plan.price}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground block mt-1">
                      {plan.period}
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <ul className="space-y-2 mb-4 text-sm">
                    {plan.features.filter(f => f && f.trim() !== '').map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  {plan.isFree ? (
                    <div className="text-center text-sm text-muted-foreground py-2">
                      {t("subscription.currentForVisitors")}
                    </div>
                  ) : (
                    <Button
                      className="w-full"
                      variant={selectedPlanForPurchase === plan.id ? "default" : "outline"}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectPlanForPurchase(plan.id, plan.name);
                      }}
                      data-testid={`button-select-${plan.id}`}
                    >
                      {selectedPlanForPurchase === plan.id ? (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Selecionado
                        </>
                      ) : (
                        t("subscription.choosePlanButton") || "Escolher"
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Coupon + Order Summary - Aparece quando um plano é selecionado */}
        {user && selectedPlanForPurchase && (
          <div ref={orderSummaryRef} className="mb-8 space-y-2">
            {/* Cupom — visível apenas na web (fora do Google Play) */}
            {!isAndroid && (
              <>
                <div className="border border-dashed border-muted-foreground/30 rounded-md p-2.5 flex items-center gap-2">
                  <Tag className="h-4 w-4 text-muted-foreground shrink-0" />
                  <Input
                    placeholder="INSIRA O CUPOM"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="flex-1 uppercase h-8 text-sm"
                    disabled={appliedCoupon?.valid}
                    data-testid="input-coupon-code"
                  />
                  {appliedCoupon?.valid ? (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={removeCoupon}
                      data-testid="button-remove-coupon"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => validateCoupon()}
                      disabled={!couponCode.trim() || isValidatingCoupon}
                      data-testid="button-apply-coupon"
                    >
                      {isValidatingCoupon ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        t("subscription.coupon.apply") || "Aplicar"
                      )}
                    </Button>
                  )}
                </div>
                {appliedCoupon?.valid && (
                  <div className="px-2 py-1.5 bg-green-500/10 border border-green-500/30 rounded-md">
                    <p className="text-xs text-green-600 dark:text-green-400 font-medium flex items-center gap-1.5">
                      <Check className="h-3 w-3" />
                      {appliedCoupon.discountDisplay}
                    </p>
                  </div>
                )}
              </>
            )}

          <Card className="border-primary shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Crown className="h-5 w-5 text-primary" />
                Resumo do Pedido
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(() => {
                const selectedPlanData = plans.find(p => p.id === selectedPlanForPurchase);
                if (!selectedPlanData) return null;
                
                const originalPrice = selectedPlanData.priceValue || 0;
                const hasCoupon = appliedCoupon?.valid;
                const finalPrice = hasCoupon && appliedCoupon?.finalAmount 
                  ? appliedCoupon.finalAmount 
                  : originalPrice;
                const discountAmount = hasCoupon && appliedCoupon?.discountAmount 
                  ? appliedCoupon.discountAmount 
                  : 0;
                
                return (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Plano:</span>
                      <span className="font-semibold">{selectedPlanData.name}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Valor original:</span>
                      <span className={hasCoupon ? "line-through text-muted-foreground" : "font-semibold"}>
                        R$ {(originalPrice / 100).toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                    
                    {hasCoupon && (
                      <>
                        <div className="flex justify-between items-center text-green-600 dark:text-green-400">
                          <span className="flex items-center gap-1">
                            <Tag className="h-4 w-4" />
                            Desconto ({appliedCoupon.discountDisplay}):
                          </span>
                          <span>- R$ {(discountAmount / 100).toFixed(2).replace('.', ',')}</span>
                        </div>
                        <hr className="border-dashed" />
                        <div className="flex justify-between items-center text-lg font-bold">
                          <span>Total:</span>
                          <span className="text-green-600 dark:text-green-400">
                            R$ {(finalPrice / 100).toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                      </>
                    )}
                    
                    {!hasCoupon && (
                      <div className="flex justify-between items-center text-lg font-bold">
                        <span>Total:</span>
                        <span className="text-primary">
                          R$ {(finalPrice / 100).toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                    )}
                    
                    <Button
                      className="w-full mt-4"
                      size="lg"
                      onClick={() => handlePlanSelect(selectedPlanForPurchase, selectedPlanData.name)}
                      disabled={isPurchasing === selectedPlanForPurchase || isValidatingCoupon || (!isAndroid && couponCode.trim() !== '' && !appliedCoupon?.valid)}
                      data-testid="button-finalize-purchase"
                    >
                      {isPurchasing === selectedPlanForPurchase ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Processando...
                        </>
                      ) : isAndroid ? (
                        <>
                          <Crown className="h-4 w-4 mr-2" />
                          Comprar no Google Play
                        </>
                      ) : (
                        <>
                          <Lock className="h-4 w-4 mr-2" />
                          Finalizar Compra
                        </>
                      )}
                    </Button>
                    
                    <p className="text-xs text-center text-muted-foreground">
                      {isAndroid
                        ? "Compra processada com segurança pelo Google Play"
                        : "Você será redirecionado para o Mercado Pago para concluir o pagamento"
                      }
                    </p>
                  </>
                );
              })()}
            </CardContent>
          </Card>
          </div>
        )}

        {/* Trial Info */}
        <Card className="bg-accent/30">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Lock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">{t("subscription.trialInfoTitle")}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("subscription.trialInfoDesc")}
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
        title={t("subscription.authModalTitle")}
        description={selectedPlan ? t("subscription.authModalDesc").replace("{plan}", selectedPlan) : undefined}
      />
    </div>
  );
}
