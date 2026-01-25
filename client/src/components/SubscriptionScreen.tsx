import { useState, useEffect } from "react";
import { Check, Crown, Sparkles, Lock, ArrowLeft, Loader2, Tag, X } from "lucide-react";
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
  
  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<CouponData | null>(null);
  const [couponPlanId, setCouponPlanId] = useState<string | null>(null);

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

  // Validate coupon function
  const validateCoupon = async (planId: string) => {
    if (!couponCode.trim() || !user) return;
    
    setIsValidatingCoupon(true);
    try {
      const response = await apiRequest('POST', '/api/coupons/validate', {
        code: couponCode.trim(),
        planId: getPlanIdForBackend(planId),
      });
      const data: CouponData = await response.json();
      
      if (data.valid) {
        setAppliedCoupon(data);
        setCouponPlanId(planId);
        toast({
          title: t("subscription.coupon.applied") || "Cupom aplicado!",
          description: data.discountDisplay || `Desconto de R$${((data.discountAmount || 0) / 100).toFixed(2)}`,
        });
      } else {
        setAppliedCoupon(null);
        setCouponPlanId(null);
        toast({
          title: t("subscription.coupon.invalid") || "Cupom inválido",
          description: data.reason || "Cupom não encontrado",
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Erro ao validar cupom:', error);
      setAppliedCoupon(null);
      setCouponPlanId(null);
      toast({
        title: t("common.error"),
        description: error.message || "Erro ao validar cupom",
        variant: 'destructive',
      });
    } finally {
      setIsValidatingCoupon(false);
    }
  };
  
  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponPlanId(null);
    setCouponCode("");
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
    
    try {
      // Include coupon code if applied for this plan
      const payload: { plan: string; couponCode?: string } = { 
        plan: getPlanIdForBackend(planId) 
      };
      
      if (appliedCoupon && appliedCoupon.valid && couponPlanId === planId) {
        payload.couponCode = couponCode.trim();
      }
      
      const response = await apiRequest('POST', '/api/mp/create-checkout', payload);
      const data = await response.json();
      
      if (data.init_point) {
        console.log('[MP] Redirecionando para checkout:', data.init_point);
        
        // Detecta se está em iframe (preview do Replit ou webview)
        const isInIframe = window.self !== window.top;
        
        if (isInIframe) {
          // Se em iframe, abre em nova aba para evitar problemas de CORS/CSP
          const newWindow = window.open(data.init_point, '_blank');
          if (!newWindow) {
            toast({
              title: t("subscription.openPayment"),
              description: t("subscription.openPaymentDesc"),
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
              {t("subscription.trialBadge").replace("{days}", String(trialDaysRemaining))}
            </Badge>
          )}
          <h1 className="text-3xl md:text-4xl font-bold text-primary mb-3">
            {t("subscription.choosePlan")}
          </h1>
          <p className="text-muted-foreground text-lg">
            {t("subscription.unlockPotential")}
          </p>
        </div>

        {/* Coupon Input */}
        {user && (
          <Card className="mb-8 bg-accent/20 border-dashed">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Tag className="h-4 w-4 text-primary" />
                  <span>{t("subscription.coupon.label") || "Cupom de desconto"}</span>
                </div>
                <div className="flex flex-1 gap-2 w-full sm:w-auto">
                  <Input
                    placeholder={t("subscription.coupon.placeholder") || "Digite seu cupom"}
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="flex-1 uppercase"
                    disabled={appliedCoupon?.valid}
                    data-testid="input-coupon-code"
                  />
                  {appliedCoupon?.valid ? (
                    <Button 
                      variant="outline" 
                      onClick={removeCoupon}
                      data-testid="button-remove-coupon"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      onClick={() => couponPlanId ? validateCoupon(couponPlanId) : toast({
                        title: t("subscription.coupon.selectPlan") || "Selecione um plano",
                        description: t("subscription.coupon.selectPlanDesc") || "Primeiro escolha um plano para aplicar o cupom",
                        variant: 'destructive',
                      })}
                      disabled={!couponCode.trim() || isValidatingCoupon}
                      data-testid="button-apply-coupon"
                    >
                      {isValidatingCoupon ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        t("subscription.coupon.apply") || "Aplicar"
                      )}
                    </Button>
                  )}
                </div>
              </div>
              {appliedCoupon?.valid && (
                <div className="mt-3 p-2 bg-green-500/10 border border-green-500/30 rounded-md">
                  <p className="text-sm text-green-600 dark:text-green-400 font-medium flex items-center gap-2">
                    <Check className="h-4 w-4" />
                    {appliedCoupon.discountDisplay} - {t("subscription.coupon.appliedTo") || "Aplicado ao plano selecionado"}
                  </p>
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                {t("subscription.coupon.info") || "Clique em um plano e depois aplique o cupom para ver o desconto"}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const hasCouponForThisPlan = appliedCoupon?.valid && couponPlanId === plan.id;
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
                } ${hasCouponForThisPlan ? "ring-2 ring-green-500/50" : ""}`}
                data-testid={`card-plan-${plan.id}`}
                onClick={() => {
                  if (!plan.isFree && couponCode.trim() && !appliedCoupon?.valid) {
                    setCouponPlanId(plan.id);
                    validateCoupon(plan.id);
                  }
                }}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge variant="default" className="shadow-md">
                      {plan.badge}
                    </Badge>
                  </div>
                )}
                {hasCouponForThisPlan && (
                  <div className="absolute -top-3 right-2">
                    <Badge variant="secondary" className="bg-green-500 text-white shadow-md">
                      <Tag className="h-3 w-3 mr-1" />
                      {appliedCoupon.discountDisplay}
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
                    {discountedPrice ? (
                      <>
                        <span className="text-lg line-through text-muted-foreground">
                          {plan.price}
                        </span>
                        <span className="text-3xl font-bold text-green-600 dark:text-green-400 ml-2">
                          {discountedPrice}
                        </span>
                      </>
                    ) : (
                      <span className="text-3xl font-bold text-primary">
                        {plan.price}
                      </span>
                    )}
                    <span className="text-sm text-muted-foreground block mt-1">
                      {plan.period}
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.filter(f => f && f.trim() !== '').map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
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
                      variant={plan.highlight ? "default" : "outline"}
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlanSelect(plan.id, plan.name);
                      }}
                      disabled={isPurchasing === plan.id}
                      data-testid={`button-subscribe-${plan.id}`}
                    >
                      {isPurchasing === plan.id ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          {t("subscription.processing")}
                        </>
                      ) : plan.highlight ? t("subscription.subscribeNow") : t("subscription.choosePlanButton")}
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
