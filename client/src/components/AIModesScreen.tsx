import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
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
  Crown,
  LucideIcon,
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

interface AIMode {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  from: string;
  to: string;
  requiredPlan: "gold" | "premium";
  badge: string;
  subtext?: string;
}

export function AIModesScreen({ onBack, onNavigateToSubscriptions }: AIModesScreenProps) {
  const { user, isAdmin } = useAuth();
  const { t } = useLanguage();
  const [selectedMode, setSelectedMode] = useState<string | null>(null);

  const { data: subStatus } = useQuery<{
    hasPremium: boolean; hasGold: boolean; hasLifetime: boolean; trialActive: boolean;
  }>({
    queryKey: ["/api/user/subscription-status"],
    enabled: !!user,
  });

  const hasPremium = isAdmin || subStatus?.hasPremium || subStatus?.hasLifetime || false;
  const hasGold = subStatus?.hasGold || subStatus?.hasLifetime || subStatus?.trialActive || false;

  const AI_MODES: AIMode[] = [
    {
      id: "professor",
      name: t("aiModes.professor.name"),
      description: t("aiModes.professor.desc"),
      icon: GraduationCap,
      from: "#3E5F8A", to: "#2A4466",
      requiredPlan: "gold",
      badge: "Gold+",
    },
    {
      id: "pregador",
      name: t("aiModes.pregador.name"),
      description: t("aiModes.pregador.desc"),
      icon: Church,
      from: "#75356A", to: "#5A2551",
      requiredPlan: "gold",
      badge: "Gold+",
    },
    {
      id: "exegese",
      name: t("aiModes.exegese.name"),
      description: t("aiModes.exegese.desc"),
      icon: Microscope,
      from: "#4A4285", to: "#362F66",
      requiredPlan: "premium",
      badge: "Premium",
      subtext: "Análise de hebraico/grego com referências acadêmicas",
    },
    {
      id: "teologica",
      name: t("aiModes.teologica.name"),
      description: t("aiModes.teologica.desc"),
      icon: Scale,
      from: "#2C6076", to: "#1B4557",
      requiredPlan: "premium",
      badge: "Premium",
      subtext: "Compare perspectivas de diferentes tradições cristãs",
    },
  ];

  const canAccessMode = (mode: AIMode): boolean => {
    if (isAdmin) return true;
    if (mode.requiredPlan === "gold") return hasPremium || hasGold;
    if (mode.requiredPlan === "premium") return hasPremium;
    return true;
  };

  const handleModeSelect = (modeId: string) => {
    const mode = AI_MODES.find((m) => m.id === modeId);
    if (!mode) return;
    if (mode.requiredPlan === "premium") { setSelectedMode(modeId); return; }
    if (canAccessMode(mode)) { setSelectedMode(modeId); }
    else { onNavigateToSubscriptions(); }
  };

  if (selectedMode === "professor") return <ProfessorChat onBack={() => setSelectedMode(null)} />;
  if (selectedMode === "pregador") return <PregadorChat onBack={() => setSelectedMode(null)} />;
  if (selectedMode === "exegese") return <ExegeseChat onBack={() => setSelectedMode(null)} onNavigateToSubscriptions={onNavigateToSubscriptions} />;
  if (selectedMode === "teologica") return <ComparacaoChat onBack={() => setSelectedMode(null)} onNavigateToSubscriptions={onNavigateToSubscriptions} />;

  return (
    <div className="min-h-screen bg-background">
      {/* cabeçalho com cor do módulo Modos IA */}
      <header
        className="sticky top-0 z-50"
        style={{
          background: "linear-gradient(158deg, #75356A, #5A2551)",
          paddingTop: "env(safe-area-inset-top, 0px)",
        }}
      >
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            data-testid="button-back"
            style={{ color: "rgba(255,255,255,0.85)" }}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-base font-serif font-semibold" style={{ color: "#F2F6FA" }}>
              {t("aiModes.title")}
            </h1>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.70)" }}>
              {t("aiModes.subtitle")}
            </p>
          </div>
          <UserButton onNavigateToSubscriptions={onNavigateToSubscriptions} showSubscriptionOption />
        </div>
      </header>

      <ScrollArea className="h-[calc(100vh-65px)]">
        <div className="max-w-3xl mx-auto px-4 py-5 space-y-3">
          {AI_MODES.map((mode, index) => {
            const isLocked = !canAccessMode(mode);
            const isPremium = mode.requiredPlan === "premium";
            const Icon = mode.icon;

            return (
              <motion.button
                key={mode.id}
                type="button"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                onClick={() => handleModeSelect(mode.id)}
                data-testid={`mode-${mode.id}`}
                className="w-full text-left cursor-pointer overflow-hidden"
                style={{
                  borderRadius: "11px",
                  background: `linear-gradient(158deg, ${mode.from}, ${mode.to})`,
                  boxShadow:
                    "inset 0 1px 0 rgba(255,255,255,0.13), inset 0 0 0 1px rgba(255,255,255,0.05)",
                  opacity: isLocked && !isPremium ? 0.80 : 1,
                }}
              >
                <div className="p-5 flex items-start gap-4">
                  {/* ícone */}
                  <div
                    className="flex items-center justify-center flex-shrink-0"
                    style={{
                      width: 50, height: 50, borderRadius: 10,
                      background: "rgba(255,255,255,0.18)",
                    }}
                  >
                    <Icon className="w-6 h-6" style={{ color: "#fff" }} />
                  </div>

                  {/* texto */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-bold text-base" style={{ color: "#fff" }}>
                        {mode.name}
                      </h3>
                      <Badge
                        className="text-xs border-0 px-2 py-0.5"
                        style={{ background: "rgba(255,255,255,0.20)", color: "rgba(255,255,255,0.95)" }}
                      >
                        {isLocked ? <Lock className="w-3 h-3 mr-1" /> : isPremium ? <Crown className="w-3 h-3 mr-1" /> : <Sparkles className="w-3 h-3 mr-1" />}
                        {mode.badge}
                      </Badge>
                    </div>
                    <p className="text-sm" style={{ color: "rgba(255,255,255,0.88)" }}>
                      {mode.description}
                    </p>

                    {isPremium && mode.subtext && (
                      <div
                        className="mt-3 pt-3 flex items-center gap-1"
                        style={{ borderTop: "1px solid rgba(255,255,255,0.20)" }}
                      >
                        <Sparkles className="w-3 h-3 flex-shrink-0" style={{ color: "rgba(255,255,255,0.80)" }} />
                        <p className="text-xs" style={{ color: "rgba(255,255,255,0.80)" }}>
                          {mode.subtext}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.button>
            );
          })}

          {/* banner upgrade */}
          {!hasPremium && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="rounded-xl p-4"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center justify-center flex-shrink-0"
                  style={{ width: 44, height: 44, borderRadius: 8, background: "linear-gradient(158deg, #75356A, #5A2551)" }}
                >
                  <Crown className="w-5 h-5" style={{ color: "#fff" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-foreground">
                    {t("aiModes.unlockAllModes")}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {t("aiModes.subscribePremiumOrGold")}
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={onNavigateToSubscriptions}
                  data-testid="button-upgrade"
                  style={{ background: "#75356A", color: "#F2F6FA" }}
                >
                  {t("subscription.subscribe")}
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
