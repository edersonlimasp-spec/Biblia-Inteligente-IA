import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { getDeviceId } from "@/hooks/use-device-id";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { LoginPromptModal } from "@/components/LoginPromptModal";
import { UserButton } from "@/components/UserButton";
import { 
  ArrowLeft, 
  GraduationCap, 
  Church, 
  Microscope, 
  Scale,
  Send,
  Loader2,
  Lock,
  Sparkles,
  LogIn
} from "lucide-react";
import { motion } from "framer-motion";

interface AIModesScreenProps {
  onBack: () => void;
  onNavigateToSubscriptions: () => void;
}

export function AIModesScreen({ onBack, onNavigateToSubscriptions }: AIModesScreenProps) {
  const { user, isAdmin } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  
  const getAIModes = () => [
    {
      id: "professor",
      name: t("aiModes.professor.name"),
      description: t("aiModes.professor.desc"),
      icon: GraduationCap,
      color: "from-blue-500 to-blue-700",
      iconBg: "bg-blue-500",
      requiredPlan: "gold",
      prompt: "Você é um professor de teologia. Explique de forma didática e clara:",
    },
    {
      id: "pregador",
      name: t("aiModes.pregador.name"),
      description: t("aiModes.pregador.desc"),
      icon: Church,
      color: "from-purple-500 to-purple-700",
      iconBg: "bg-purple-500",
      requiredPlan: "gold",
      prompt: "Você é um pregador experiente. Crie uma mensagem inspiradora sobre:",
    },
    {
      id: "exegese",
      name: t("aiModes.exegese.name"),
      description: t("aiModes.exegese.desc"),
      icon: Microscope,
      color: "from-emerald-500 to-emerald-700",
      iconBg: "bg-emerald-500",
      requiredPlan: "premium",
      prompt: "Você é um exegeta bíblico. Faça uma análise profunda do texto original:",
    },
    {
      id: "teologica",
      name: t("aiModes.teologica.name"),
      description: t("aiModes.teologica.desc"),
      icon: Scale,
      color: "from-amber-500 to-amber-700",
      iconBg: "bg-amber-500",
      requiredPlan: "premium",
      prompt: "Compare as interpretações teológicas de diferentes denominações sobre:",
    },
  ];
  
  const AI_MODES = getAIModes();
  const deviceId = getDeviceId();
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState("");
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(false);

  const { data: subStatus } = useQuery<{ hasPremium: boolean; hasGold: boolean; hasLifetime: boolean; trialActive: boolean }>({
    queryKey: ['/api/user/subscription-status'],
    enabled: !!user,
  });

  const { data: guestTrialInfo } = useQuery<{ active: boolean; daysRemaining: number }>({
    queryKey: ['/api/guest/trial', deviceId],
    enabled: !user && !!deviceId,
  });

  const hasPremium = isAdmin || subStatus?.hasPremium || false;
  const hasGold = subStatus?.hasGold || subStatus?.hasLifetime || subStatus?.trialActive || false;
  const hasGuestTrial = !user && (guestTrialInfo?.active || false);
  
  const canAccessMode = (mode: typeof AI_MODES[0]): boolean => {
    if (isAdmin) return true;
    if (mode.requiredPlan === "gold") {
      return hasPremium || hasGold || hasGuestTrial;
    }
    if (mode.requiredPlan === "premium") {
      return hasPremium;
    }
    return true;
  };

  const askMutation = useMutation({
    mutationFn: async ({ mode, text }: { mode: string; text: string }) => {
      const modeConfig = AI_MODES.find(m => m.id === mode);
      const res = await apiRequest("POST", "/api/ai/ask", {
        question: `${modeConfig?.prompt} ${text}`,
        mode: mode,
        deviceId,
      });
      return res.json();
    },
    onSuccess: (data) => {
      setResponse(data.response || data.answer || t("aiModes.responseReceived"));
    },
    onError: (error: any) => {
      toast({
        title: t("common.error"),
        description: error.message || t("aiModes.errorGettingResponse"),
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!question.trim() || !selectedMode) return;
    
    if (!user) {
      setPendingSubmit(true);
      setShowLoginPrompt(true);
      return;
    }
    
    const mode = AI_MODES.find(m => m.id === selectedMode);
    if (mode && !canAccessMode(mode)) {
      toast({
        title: mode.requiredPlan === "premium" ? t("aiModes.modePremium") : t("aiModes.modeGoldPlus"),
        description: mode.requiredPlan === "premium" 
          ? t("aiModes.requiresPremium") 
          : t("aiModes.requiresGoldOrPremium"),
      });
      return;
    }
    
    setResponse("");
    askMutation.mutate({ mode: selectedMode, text: question });
  };
  
  const handleAuthSuccess = () => {
    setShowLoginPrompt(false);
    if (pendingSubmit && question.trim() && selectedMode) {
      setPendingSubmit(false);
      const mode = AI_MODES.find(m => m.id === selectedMode);
      if (mode && !canAccessMode(mode)) {
        queryClient.invalidateQueries({ queryKey: ['/api/user/subscription-status'] });
        toast({
          title: t("aiModes.loginSuccess"),
          description: t("aiModes.checkSubscription"),
        });
      } else {
        setResponse("");
        askMutation.mutate({ mode: selectedMode, text: question });
      }
    }
  };

  const selectedModeData = AI_MODES.find(m => m.id === selectedMode);

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
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
          {!selectedMode ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              {AI_MODES.map((mode, index) => {
                const isLocked = !canAccessMode(mode);
                const planLabel = mode.requiredPlan === "premium" ? "Premium" : "Gold+";
                return (
                  <motion.div
                    key={mode.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card 
                      className={`cursor-pointer overflow-visible hover-elevate active-elevate-2 ${isLocked ? "opacity-75" : ""}`}
                      onClick={() => !isLocked && setSelectedMode(mode.id)}
                      data-testid={`mode-${mode.id}`}
                    >
                      <CardContent className={`p-5 bg-gradient-to-br ${mode.color} rounded-lg`}>
                        <div className="flex items-start gap-4">
                          <div className={`w-12 h-12 rounded-xl ${mode.iconBg} flex items-center justify-center shadow-lg`}>
                            <mode.icon className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-bold text-white">{mode.name}</h3>
                              <Badge className="bg-white/20 text-white border-0 text-xs">
                                {isLocked ? <Lock className="w-3 h-3 mr-1" /> : <Sparkles className="w-3 h-3 mr-1" />}
                                {planLabel}
                              </Badge>
                            </div>
                            <p className="text-sm text-white/80">{mode.description}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <Card className={`bg-gradient-to-br ${selectedModeData?.color}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${selectedModeData?.iconBg} flex items-center justify-center`}>
                      {selectedModeData && <selectedModeData.icon className="w-5 h-5 text-white" />}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-white">{selectedModeData?.name}</h3>
                      <p className="text-xs text-white/80">{selectedModeData?.description}</p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-white hover:bg-white/20"
                      onClick={() => {
                        setSelectedMode(null);
                        setResponse("");
                        setQuestion("");
                      }}
                    >
                      {t("aiModes.changeMode")}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{t("aiModes.yourQuestion")}</CardTitle>
                  <CardDescription>
                    {t("aiModes.questionDesc")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder={t("aiModes.questionPlaceholder")}
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    rows={4}
                    className="resize-none"
                    data-testid="input-question"
                  />
                  <Button 
                    className="w-full" 
                    onClick={handleSubmit}
                    disabled={!question.trim() || askMutation.isPending}
                    data-testid="button-submit"
                  >
                    {askMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {t("aiModes.processing")}
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        {t("aiModes.sendQuestion")}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {response && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-primary" />
                        {t("aiModes.aiResponse")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                        {response}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </motion.div>
          )}

          {!hasPremium && (
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{t("aiModes.unlockAllModes")}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t("aiModes.subscribePremiumOrGold")}
                    </p>
                  </div>
                  <Button onClick={onNavigateToSubscriptions} data-testid="button-upgrade">
                    {t("subscription.subscribe")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>
      
      <LoginPromptModal
        open={showLoginPrompt}
        onOpenChange={setShowLoginPrompt}
        featureName={t("aiModes.featureName")}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}
