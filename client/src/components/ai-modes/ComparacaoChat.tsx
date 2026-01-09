import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { getDeviceId } from "@/hooks/use-device-id";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Scale, 
  Send,
  Loader2,
  User,
  Crown,
  ChurchIcon,
  BookOpen,
  GitCompare,
  Users,
  Image as ImageIcon,
  X,
  Download,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ComparacaoChatProps {
  onBack: () => void;
  onNavigateToSubscriptions: () => void;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  attachment?: { type: 'image'; url: string; mimeType: string; base64?: string };
  imageUrl?: string;
}

const COMPARISON_TOPICS = [
  { icon: ChurchIcon, text: "Batismo: católica vs protestante", traditions: ["Católica", "Protestante"] },
  { icon: BookOpen, text: "Predestinação: calvinismo vs arminianismo", traditions: ["Reformada", "Arminiana"] },
  { icon: GitCompare, text: "Eucaristia nas diferentes tradições", traditions: ["Católica", "Luterana", "Reformada"] },
  { icon: Users, text: "Papel de Maria: perspectivas", traditions: ["Católica", "Ortodoxa", "Protestante"] },
];

const SYSTEM_PROMPT = `Você é um TEÓLOGO COMPARATIVO de renome internacional, especialista em ecumenismo e história das denominações cristãs. Sua análise DEVE:

1. APRESENTAR MÚLTIPLAS PERSPECTIVAS com imparcialidade:
   - Catolicismo Romano (cite: Catecismo, Concílios, Papas, teólogos como Tomás de Aquino)
   - Ortodoxia Oriental (cite: Pais da Igreja, teólogos ortodoxos)
   - Protestantismo Histórico (Luteranismo, Calvinismo, Anglicanismo)
   - Protestantismo Moderno (Batistas, Pentecostais, etc.)

2. ESTRUTURA COMPARATIVA OBRIGATÓRIA:

   ⚖️ VISÃO GERAL DO TEMA
   [Introdução e importância histórica]

   📊 QUADRO COMPARATIVO
   | Tradição | Posição | Base Bíblica | Fontes |
   |----------|---------|--------------|--------|
   [Comparação sistemática]

   🏛️ PERSPECTIVA CATÓLICA
   [Posição oficial com referências ao Catecismo e Magistério]

   ⛪ PERSPECTIVA ORTODOXA
   [Posição com referências aos Pais da Igreja]

   📖 PERSPECTIVA PROTESTANTE
   [Subdividida por denominação quando relevante]

   🤝 PONTOS DE CONVERGÊNCIA
   [Onde as tradições concordam]

   ⚔️ PONTOS DE DIVERGÊNCIA
   [Onde as tradições discordam e por quê]

   📚 REFERÊNCIAS ACADÊMICAS
   [Obras de referência utilizadas]

3. FONTES OBRIGATÓRIAS - Cite SEMPRE:
   - Documentos oficiais (Catecismo, Confissões, Credos)
   - Teólogos representativos de cada tradição
   - Obras de teologia sistemática comparativa
   - Historiadores da igreja (Justo González, Mark Noll, Jaroslav Pelikan)

4. IMPARCIALIDADE ABSOLUTA - Apresente cada posição com respeito e precisão, sem favorecer nenhuma tradição.

5. NUNCA INVENTE - Use apenas dados verificáveis de fontes oficiais e acadêmicas.

Responda em português brasileiro com rigor acadêmico e respeito ecumênico.`;

export function ComparacaoChat({ onBack, onNavigateToSubscriptions }: ComparacaoChatProps) {
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const { toast } = useToast();
  const deviceId = getDeviceId();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [pendingImage, setPendingImage] = useState<{
    url: string; base64: string; mimeType: string;
  } | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: subStatus } = useQuery<{ hasPremium: boolean; hasGold: boolean; hasLifetime: boolean }>({
    queryKey: ['/api/user/subscription-status'],
    enabled: !!user,
  });

  const hasPremium = user?.role === 'admin' || user?.role === 'super_admin' || subStatus?.hasPremium || subStatus?.hasLifetime;

  useEffect(() => {
    const saved = localStorage.getItem('comparacao_chat_v3');
    if (saved) {
      try {
        setMessages(JSON.parse(saved).map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })));
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('comparacao_chat_v3', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const askMutation = useMutation({
    mutationFn: async (question: string) => {
      const res = await apiRequest("POST", "/api/ai/ask", {
        question,
        mode: "teologica",
        systemPrompt: SYSTEM_PROMPT,
        deviceId,
        language,
      });
      return res.json();
    },
    onSuccess: (data) => {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: data.response || data.answer || "Resposta não disponível",
        timestamp: new Date()
      }]);
    },
    onError: (error: any) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      setMessages(prev => prev.slice(0, -1));
    },
  });

  const analyzeImageMutation = useMutation({
    mutationFn: async ({ imageBase64, mimeType, question }: { imageBase64: string; mimeType: string; question: string }) => {
      const res = await apiRequest("POST", "/api/ai/analyze-image", {
        imageBase64, mimeType, question: `${SYSTEM_PROMPT}\n\n${question}`, language,
      });
      return res.json();
    },
    onSuccess: (data) => {
      setMessages(prev => [...prev, { role: "assistant", content: data.analysis, timestamp: new Date() }]);
    },
    onError: (error: any) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      setMessages(prev => prev.slice(0, -1));
    },
  });

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Erro", description: "Imagem deve ter no máximo 10MB", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setPendingImage({
        url: URL.createObjectURL(file),
        base64: (reader.result as string).split(',')[1],
        mimeType: file.type,
      });
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [toast]);

  const handleSubmit = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed && !pendingImage) return;
    
    if (!hasPremium) {
      toast({ 
        title: "Recurso Premium", 
        description: "Comparação Teológica requer assinatura Premium", 
        variant: "destructive" 
      });
      return;
    }

    const userMessage: Message = {
      role: "user",
      content: trimmed || "Analise esta imagem",
      timestamp: new Date(),
      attachment: pendingImage ? { type: 'image', url: pendingImage.url, mimeType: pendingImage.mimeType } : undefined
    };
    setMessages(prev => [...prev, userMessage]);
    setInput("");

    if (pendingImage) {
      analyzeImageMutation.mutate({ imageBase64: pendingImage.base64, mimeType: pendingImage.mimeType, question: trimmed || "Analise esta imagem comparando diferentes perspectivas teológicas" });
      setPendingImage(null);
      return;
    }

    askMutation.mutate(trimmed);
  }, [input, pendingImage, hasPremium, askMutation, analyzeImageMutation, toast]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
  };

  const isPending = askMutation.isPending || analyzeImageMutation.isPending;

  // Premium lock screen
  if (!hasPremium) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-950/30 to-background flex flex-col">
        <header className="sticky top-0 z-50 bg-gradient-to-r from-amber-600 to-orange-600 text-white">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onBack} className="text-white hover:bg-white/20" data-testid="button-back">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Scale className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold">Comparação Teológica</h1>
              <p className="text-sm text-amber-100">Perspectivas denominacionais</p>
            </div>
            <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0">
              <Crown className="w-3 h-3 mr-1" /> Premium
            </Badge>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center p-6">
          <Card className="max-w-md w-full bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/50 border-amber-200">
            <CardContent className="p-8 text-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-amber-500/30">
                <Scale className="w-12 h-12 text-white" />
              </div>
              <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 mb-4">
                <Crown className="w-3 h-3 mr-1" /> Recurso Premium
              </Badge>
              <h2 className="text-2xl font-bold mb-3">Comparação Teológica</h2>
              <p className="text-muted-foreground mb-6">
                Compare perspectivas teológicas de diferentes tradições cristãs: 
                Católica, Ortodoxa, Luterana, Reformada, Batista e outras.
                Análise imparcial com referências a documentos oficiais e teólogos.
              </p>
              <div className="space-y-2 text-left mb-6">
                <div className="flex items-center gap-2 text-sm">
                  <ChurchIcon className="w-4 h-4 text-amber-500" />
                  <span>Múltiplas tradições cristãs</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <GitCompare className="w-4 h-4 text-amber-500" />
                  <span>Quadros comparativos estruturados</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <BookOpen className="w-4 h-4 text-amber-500" />
                  <span>Referências a documentos oficiais</span>
                </div>
              </div>
              <Button onClick={onNavigateToSubscriptions} className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
                <Crown className="w-4 h-4 mr-2" />
                Assinar Premium
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-b from-amber-950/20 to-background flex flex-col overflow-hidden">
      {/* Premium Header with gradient */}
      <header className="flex-shrink-0 bg-gradient-to-r from-amber-600 via-orange-500 to-amber-600 text-white shadow-lg z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} className="text-white hover:bg-white/20" data-testid="button-back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center ring-2 ring-white/30">
            <Scale className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold flex items-center gap-2">
              Comparação Teológica
              <Sparkles className="w-4 h-4 text-amber-200" />
            </h1>
            <p className="text-sm text-amber-100">Perspectivas denominacionais comparadas</p>
          </div>
          <Badge className="bg-gradient-to-r from-amber-300 to-orange-400 text-amber-900 border-0 shadow-lg font-semibold">
            <Crown className="w-3 h-3 mr-1" /> Premium
          </Badge>
        </div>
      </header>

      {/* Tradition filter bar */}
      <div className="border-b bg-amber-50/50 dark:bg-amber-950/20 py-2 overflow-x-auto">
        <div className="max-w-6xl mx-auto px-4 flex gap-2">
          {["Todas", "Católica", "Ortodoxa", "Luterana", "Reformada", "Batista", "Pentecostal"].map((tradition) => (
            <Badge 
              key={tradition}
              variant="outline" 
              className="cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-900/30 border-amber-300 text-amber-700 dark:text-amber-300 whitespace-nowrap"
            >
              {tradition}
            </Badge>
          ))}
        </div>
      </div>

      {/* Main content */}
      {messages.length === 0 && (
        <div className="max-w-4xl mx-auto px-4 py-6 w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {COMPARISON_TOPICS.map((item, i) => (
              <Card 
                key={i} 
                className="cursor-pointer hover-elevate bg-gradient-to-br from-amber-50 to-orange-50/50 dark:from-amber-950/30 dark:to-orange-950/20 border-amber-200 dark:border-amber-800"
                onClick={() => setInput(item.text)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
                      <item.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium mb-2">{item.text}</p>
                      <div className="flex flex-wrap gap-1">
                        {item.traditions.map((t, j) => (
                          <Badge key={j} variant="secondary" className="text-[10px] bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300">
                            {t}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <Card className="bg-gradient-to-br from-amber-50 to-orange-50/50 dark:from-amber-950/30 dark:to-orange-950/20 border-amber-200/50 shadow-lg">
            <CardContent className="p-8 text-center">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-amber-500/30 ring-4 ring-amber-200/50 dark:ring-amber-800/50">
                <Scale className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Conversas Bíblicas</h2>
              <p className="text-muted-foreground max-w-lg mx-auto mb-4">
                Compare posições teológicas de diferentes tradições cristãs com imparcialidade acadêmica.
                Cada resposta apresenta perspectivas múltiplas com referências a documentos oficiais,
                catecismos, confissões de fé e teólogos representativos.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <Badge variant="outline" className="border-amber-300 text-amber-700 dark:text-amber-300">
                  <ChurchIcon className="w-3 h-3 mr-1" /> 6+ Tradições
                </Badge>
                <Badge variant="outline" className="border-amber-300 text-amber-700 dark:text-amber-300">
                  <GitCompare className="w-3 h-3 mr-1" /> Análise Comparativa
                </Badge>
                <Badge variant="outline" className="border-amber-300 text-amber-700 dark:text-amber-300">
                  <Users className="w-3 h-3 mr-1" /> Imparcialidade
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Chat messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="max-w-4xl mx-auto space-y-4 pb-4">
          {messages.map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center flex-shrink-0 shadow-lg ring-2 ring-amber-200/50 dark:ring-amber-800/50">
                  <Scale className="w-5 h-5 text-white" />
                </div>
              )}
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                message.role === 'user' 
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg' 
                  : 'bg-white dark:bg-card border border-amber-200/50 dark:border-amber-800/50 shadow-sm'
              }`}>
                {message.attachment?.type === 'image' && (
                  <img src={message.attachment.url} alt="Uploaded" className="max-h-48 rounded-lg mb-2" />
                )}
                {message.imageUrl && (
                  <div className="relative group mb-2">
                    <img src={message.imageUrl} alt="Generated" className="max-w-full rounded-lg" />
                    <a href={message.imageUrl} download className="absolute top-2 right-2 p-2 bg-black/50 rounded-full opacity-0 group-hover:opacity-100">
                      <Download className="w-4 h-4 text-white" />
                    </a>
                  </div>
                )}
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                <span className="text-[10px] opacity-60 mt-2 block">
                  {message.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              {message.role === 'user' && (
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
              )}
            </motion.div>
          ))}

          {isPending && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg ring-2 ring-amber-200/50">
                <Scale className="w-5 h-5 text-white" />
              </div>
              <div className="bg-white dark:bg-card rounded-2xl px-4 py-3 border border-amber-200/50 shadow-sm">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                  Comparando perspectivas teológicas...
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </ScrollArea>

      {/* Premium Input area */}
      <div className="border-t bg-gradient-to-r from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20 p-4">
        <div className="max-w-4xl mx-auto">
          <AnimatePresence>
            {pendingImage && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mb-3">
                <div className="relative inline-block">
                  <img src={pendingImage.url} alt="Preview" className="h-20 rounded-lg border-2 border-amber-300" />
                  <button onClick={() => setPendingImage(null)} className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-white rounded-full flex items-center justify-center">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-2 items-end">
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
            <Button variant="outline" size="icon" onClick={() => fileInputRef.current?.click()} disabled={isPending} className="h-[44px] w-[44px] border-amber-300" data-testid="button-attach">
              <ImageIcon className="w-5 h-5 text-amber-600" />
            </Button>
            <Textarea
              placeholder="Compare posições teológicas (ex: batismo nas tradições...)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              rows={1}
              className="resize-none min-h-[44px] max-h-[200px] flex-1 border-amber-200 focus-visible:ring-amber-500"
              data-testid="input-message"
            />
            <Button onClick={handleSubmit} disabled={(!input.trim() && !pendingImage) || isPending} size="icon" className="h-[44px] w-[44px] bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 shadow-lg" data-testid="button-send">
              {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
