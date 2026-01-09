import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserButton } from "@/components/UserButton";
import { 
  ArrowLeft, 
  GraduationCap, 
  Church, 
  Microscope, 
  Scale,
  Lock,
  Sparkles,
  Crown
} from "lucide-react";
import { motion } from "framer-motion";

import { ProfessorChat } from "./ai-modes/ProfessorChat";
import { PregadorChat } from "./ai-modes/PregadorChat";
import { ExegeseChat } from "./ai-modes/ExegeseChat";
import { ComparacaoChat } from "./ai-modes/ComparacaoChat";

interface AIModesScreenProps {
  onBack: () => void;
  onNavigateToSubscriptions: () => void;
}

export function AIModesScreen({ onBack, onNavigateToSubscriptions }: AIModesScreenProps) {
  const { user, isAdmin } = useAuth();
  const { t } = useLanguage();
  const [selectedMode, setSelectedMode] = useState<string | null>(null);

  const { data: subStatus } = useQuery<{ hasPremium: boolean; hasGold: boolean; hasLifetime: boolean; trialActive: boolean }>({
    queryKey: ['/api/user/subscription-status'],
    enabled: !!user,
  });

  const hasPremium = isAdmin || subStatus?.hasPremium || subStatus?.hasLifetime || false;
  const hasGold = subStatus?.hasGold || subStatus?.hasLifetime || subStatus?.trialActive || false;

  const AI_MODES = [
    {
      id: "professor",
      name: t("aiModes.professor.name"),
      description: t("aiModes.professor.desc"),
      icon: GraduationCap,
      gradient: "from-blue-500 to-blue-700",
      requiredPlan: "gold",
      badge: "Gold+",
      badgeColor: "bg-amber-500",
    },
    {
      id: "pregador",
      name: t("aiModes.pregador.name"),
      description: t("aiModes.pregador.desc"),
      icon: Church,
      gradient: "from-purple-500 to-purple-700",
      requiredPlan: "gold",
      badge: "Gold+",
      badgeColor: "bg-amber-500",
    },
    {
      id: "exegese",
      name: t("aiModes.exegese.name"),
      description: t("aiModes.exegese.desc"),
      icon: Microscope,
      gradient: "from-emerald-500 to-teal-600",
      requiredPlan: "premium",
      badge: "Premium",
      badgeColor: "bg-gradient-to-r from-amber-400 to-orange-500",
    },
    {
      id: "teologica",
      name: t("aiModes.teologica.name"),
      description: t("aiModes.teologica.desc"),
      icon: Scale,
      gradient: "from-amber-500 to-orange-600",
      requiredPlan: "premium",
      badge: "Premium",
      badgeColor: "bg-gradient-to-r from-amber-400 to-orange-500",
    },
  ];

  const canAccessMode = (mode: typeof AI_MODES[0]): boolean => {
    if (isAdmin) return true;
    if (mode.requiredPlan === "gold") {
      return hasPremium || hasGold;
    }
    if (mode.requiredPlan === "premium") {
      return hasPremium;
    }
    return true;
  };

  const handleModeSelect = (modeId: string) => {
    const mode = AI_MODES.find(m => m.id === modeId);
    if (!mode) return;
    
    // Premium modes show their own lock screens, so always allow navigation
    if (mode.requiredPlan === "premium") {
      setSelectedMode(modeId);
      return;
    }
    
    // Gold modes require access check
    if (canAccessMode(mode)) {
      setSelectedMode(modeId);
    } else {
      onNavigateToSubscriptions();
    }
  };

  // Render specific chat screen based on selected mode
  if (selectedMode === "professor") {
    return <ProfessorChat onBack={() => setSelectedMode(null)} />;
  }
  if (selectedMode === "pregador") {
    return <PregadorChat onBack={() => setSelectedMode(null)} />;
  }
  if (selectedMode === "exegese") {
    return <ExegeseChat onBack={() => setSelectedMode(null)} onNavigateToSubscriptions={onNavigateToSubscriptions} />;
  }
  if (selectedMode === "teologica") {
    return <ComparacaoChat onBack={() => setSelectedMode(null)} onNavigateToSubscriptions={onNavigateToSubscriptions} />;
  }

  // Mode selection screen
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} data-testid="button-back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">{t("aiModes.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("aiModes.subtitle")}</p>
          </div>
          <UserButton onNavigateToSubscriptions={onNavigateToSubscriptions} showSubscriptionOption />
        </div>
      </header>

      <ScrollArea className="h-[calc(100vh-65px)]">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
          {AI_MODES.map((mode, index) => {
            const isLocked = !canAccessMode(mode);
            const isPremiumMode = mode.requiredPlan === "premium";
            
            return (
              <motion.div
                key={mode.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card 
                  className={`overflow-hidden cursor-pointer hover-elevate active-elevate-2 ${isLocked && !isPremiumMode ? "opacity-75" : ""} ${isPremiumMode ? "ring-1 ring-amber-300/50" : ""}`}
                  onClick={() => handleModeSelect(mode.id)}
                  data-testid={`mode-${mode.id}`}
                >
                  <CardContent className={`p-0`}>
                    <div className={`p-5 bg-gradient-to-br ${mode.gradient} rounded-lg`}>
                      <div className="flex items-start gap-4">
                        <div className={`w-14 h-14 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center shadow-lg ${isPremiumMode ? "ring-2 ring-white/40" : ""}`}>
                          <mode.icon className="w-7 h-7 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-white text-lg">{mode.name}</h3>
                            <Badge className={`${mode.badgeColor} text-white border-0 text-xs`}>
                              {isLocked ? <Lock className="w-3 h-3 mr-1" /> : isPremiumMode ? <Crown className="w-3 h-3 mr-1" /> : <Sparkles className="w-3 h-3 mr-1" />}
                              {mode.badge}
                            </Badge>
                          </div>
                          <p className="text-sm text-white/90">{mode.description}</p>
                          
                          {isPremiumMode && (
                            <div className="mt-3 pt-3 border-t border-white/20">
                              <p className="text-xs text-white/80 flex items-center gap-1">
                                <Sparkles className="w-3 h-3" />
                                {mode.id === "exegese" 
                                  ? "Análise de hebraico/grego com referências acadêmicas"
                                  : "Compare perspectivas de diferentes tradições cristãs"
                                }
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}

          {!hasPremium && (
            <Card className="border-primary/30 bg-primary/5 mt-6">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                    <Crown className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{t("aiModes.unlockAllModes")}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t("aiModes.subscribePremiumOrGold")}
                    </p>
                  </div>
                  <Button onClick={onNavigateToSubscriptions} className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600" data-testid="button-upgrade">
                    {t("subscription.subscribe")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
