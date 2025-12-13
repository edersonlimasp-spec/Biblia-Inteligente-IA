import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
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

const AI_MODES = [
  {
    id: "professor",
    name: "Modo Professor",
    description: "Explicações didáticas e claras sobre passagens bíblicas",
    icon: GraduationCap,
    color: "from-blue-500 to-blue-700",
    iconBg: "bg-blue-500",
    premium: false,
    prompt: "Você é um professor de teologia. Explique de forma didática e clara:",
  },
  {
    id: "pregador",
    name: "Modo Pregador",
    description: "Mensagens inspiradoras e edificantes para pregação",
    icon: Church,
    color: "from-purple-500 to-purple-700",
    iconBg: "bg-purple-500",
    premium: true,
    prompt: "Você é um pregador experiente. Crie uma mensagem inspiradora sobre:",
  },
  {
    id: "exegese",
    name: "Exegese Profunda",
    description: "Análise textual detalhada do original hebraico/grego",
    icon: Microscope,
    color: "from-emerald-500 to-emerald-700",
    iconBg: "bg-emerald-500",
    premium: true,
    prompt: "Você é um exegeta bíblico. Faça uma análise profunda do texto original:",
  },
  {
    id: "teologica",
    name: "Comparação Teológica",
    description: "Compare diferentes perspectivas denominacionais",
    icon: Scale,
    color: "from-amber-500 to-amber-700",
    iconBg: "bg-amber-500",
    premium: true,
    prompt: "Compare as interpretações teológicas de diferentes denominações sobre:",
  },
];

export function AIModesScreen({ onBack, onNavigateToSubscriptions }: AIModesScreenProps) {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const deviceId = getDeviceId();
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState("");
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(false);

  const { data: subStatus } = useQuery<{ hasPremium: boolean; hasGold: boolean }>({
    queryKey: ['/api/user/subscription-status'],
    enabled: !!user,
  });

  const hasPremium = isAdmin || subStatus?.hasPremium || subStatus?.hasGold || false;

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
      setResponse(data.response || data.answer || "Resposta recebida.");
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível obter resposta da IA",
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
    if (mode?.premium && !hasPremium) {
      toast({
        title: "Modo Premium",
        description: "Este modo requer uma assinatura Premium ou Gold",
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
      if (mode?.premium) {
        queryClient.invalidateQueries({ queryKey: ['/api/user/subscription-status'] });
        toast({
          title: "Login realizado!",
          description: "Verifique sua assinatura para acessar modos premium.",
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
            <h1 className="text-xl font-bold">Modos IA Premium</h1>
            <p className="text-sm text-muted-foreground">4 modos especializados de estudo</p>
          </div>
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
                const isLocked = mode.premium && !hasPremium;
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
                              {mode.premium && (
                                <Badge className="bg-white/20 text-white border-0 text-xs">
                                  {isLocked ? <Lock className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
                                </Badge>
                              )}
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
                      Trocar modo
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Sua Pergunta</CardTitle>
                  <CardDescription>
                    Digite sua dúvida ou o texto que deseja analisar
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="Ex: Explique João 3:16..."
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
                        Processando...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Enviar Pergunta
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
                        Resposta da IA
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
                    <h3 className="font-semibold">Desbloqueie todos os modos</h3>
                    <p className="text-sm text-muted-foreground">
                      Assine Premium ou Gold para acesso completo
                    </p>
                  </div>
                  <Button onClick={onNavigateToSubscriptions} data-testid="button-upgrade">
                    Assinar
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
        featureName="os Modos IA Premium"
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}
