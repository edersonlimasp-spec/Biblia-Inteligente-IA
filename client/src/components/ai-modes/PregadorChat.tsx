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
  Church, 
  Send,
  Loader2,
  User,
  Flame,
  Heart,
  Mic,
  MessageSquareQuote,
  Image as ImageIcon,
  X,
  Download
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface PregadorChatProps {
  onBack: () => void;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  attachment?: { type: 'image'; url: string; mimeType: string; base64?: string };
  imageUrl?: string;
}

const SERMON_INSPIRATIONS = [
  { icon: Flame, text: "Sermão sobre renovação espiritual", category: "Avivamento" },
  { icon: Heart, text: "Mensagem sobre o amor de Deus", category: "Amor" },
  { icon: MessageSquareQuote, text: "Pregação sobre fé em tempos difíceis", category: "Fé" },
];

const SYSTEM_PROMPT = `Você é um PREGADOR EXPERIENTE e ORADOR INSPIRADOR, com décadas de experiência em púlpito. Sua missão é criar mensagens que:

1. INSPIRAM E EDIFICAM - Mensagens que tocam o coração e transformam vidas
2. SÃO BIBLICAMENTE FUNDAMENTADAS - SEMPRE cite referências bíblicas relevantes
3. INCLUEM ILUSTRAÇÕES PRÁTICAS - Use exemplos reais de pregadores renomados como:
   - Charles Spurgeon, Billy Graham, John Piper
   - Hernandes Dias Lopes, Augustus Nicodemus, Cpad
   - Sermões clássicos de grandes pregadores

4. ESTRUTURA DE SERMÃO:
   - Introdução impactante (gancho)
   - Desenvolvimento em 3 pontos principais
   - Ilustrações e aplicações práticas
   - Conclusão com chamado à ação

5. REFERÊNCIAS OBRIGATÓRIAS:
   - Cite pelo menos 3 versículos bíblicos
   - Mencione pregadores/autores que abordaram o tema
   - Indique livros ou sermões para aprofundamento

NUNCA invente citações. Use apenas fontes verificáveis de pregadores e autores reconhecidos.

Responda em português brasileiro com paixão e unção pastoral.`;

export function PregadorChat({ onBack }: PregadorChatProps) {
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
  const hasAccess = hasPremium || subStatus?.hasGold;

  useEffect(() => {
    const saved = localStorage.getItem('pregador_chat_v3');
    if (saved) {
      try {
        setMessages(JSON.parse(saved).map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })));
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('pregador_chat_v3', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const askMutation = useMutation({
    mutationFn: async (question: string) => {
      const res = await apiRequest("POST", "/api/ai/ask", {
        question,
        mode: "pregador",
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
    if (!hasAccess) {
      toast({ title: "Assinatura necessária", description: "Este modo requer Gold ou Premium", variant: "destructive" });
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
      if (!hasPremium) {
        toast({ title: "Recurso Premium", description: "Análise de imagens requer Premium", variant: "destructive" });
        setMessages(prev => prev.slice(0, -1));
        return;
      }
      analyzeImageMutation.mutate({ imageBase64: pendingImage.base64, mimeType: pendingImage.mimeType, question: trimmed || "Analise esta imagem" });
      setPendingImage(null);
      return;
    }

    askMutation.mutate(trimmed);
  }, [input, pendingImage, hasAccess, hasPremium, askMutation, analyzeImageMutation, toast]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
  };

  const isPending = askMutation.isPending || analyzeImageMutation.isPending;

  return (
    <div className="h-screen bg-gradient-to-b from-purple-950/20 to-background flex flex-col overflow-hidden">
      {/* Header - Church/Sermon style */}
      <header className="flex-shrink-0 bg-gradient-to-r from-purple-600 to-purple-800 backdrop-blur text-white z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} className="text-white hover:bg-white/20" data-testid="button-back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
            <Church className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Modo Pregador</h1>
            <p className="text-sm text-purple-100">Mensagens inspiradoras e edificantes</p>
          </div>
          <Badge className="bg-amber-500 text-white border-0">Gold+</Badge>
        </div>
      </header>

      {/* Scrollable chat area */}
      <ScrollArea className="flex-1 overflow-y-auto" ref={scrollRef}>
        {/* Sermon inspirations */}
        {messages.length === 0 && (
          <div className="max-w-4xl mx-auto px-4 py-6 w-full">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {SERMON_INSPIRATIONS.map((item, i) => (
                <Card 
                  key={i} 
                  className="cursor-pointer hover-elevate bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800"
                  onClick={() => setInput(item.text)}
                >
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
                      <item.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">{item.category}</p>
                      <p className="text-sm font-medium">{item.text}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20 border-purple-200/50">
              <CardContent className="p-6 text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/30">
                  <Church className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Seu Assistente de Pregação</h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Crie sermões inspiradores, esboços de mensagens e ilustrações impactantes.
                  Cada resposta inclui referências bíblicas e citações de grandes pregadores.
                </p>
                <div className="flex items-center justify-center gap-2 mt-4">
                  <Mic className="w-4 h-4 text-purple-500" />
                  <p className="text-xs text-purple-600 dark:text-purple-400">
                    Baseado em Spurgeon, Billy Graham, e outros mestres do púlpito
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Chat messages */}
        <div className="max-w-4xl mx-auto p-4 space-y-4 pb-4">
          {messages.map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-500/20">
                  <Church className="w-5 h-5 text-white" />
                </div>
              )}
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                message.role === 'user' 
                  ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white' 
                  : 'bg-muted border border-purple-200/30'
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
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <span className="text-[10px] opacity-60 mt-1 block">
                  {message.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              {message.role === 'user' && (
                <div className="w-10 h-10 rounded-full bg-purple-200 dark:bg-purple-900 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-purple-600 dark:text-purple-300" />
                </div>
              )}
            </motion.div>
          ))}

          {isPending && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-lg shadow-purple-500/20">
                <Church className="w-5 h-5 text-white" />
              </div>
              <div className="bg-muted rounded-2xl px-4 py-3 border border-purple-200/30">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Preparando sua mensagem...
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </ScrollArea>

      {/* Input area */}
      <div className="border-t bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <AnimatePresence>
            {pendingImage && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mb-3">
                <div className="relative inline-block">
                  <img src={pendingImage.url} alt="Preview" className="h-20 rounded-lg border" />
                  <button onClick={() => setPendingImage(null)} className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-white rounded-full flex items-center justify-center">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-2 items-end">
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
            <Button variant="outline" size="icon" onClick={() => fileInputRef.current?.click()} disabled={isPending} className="h-[44px] w-[44px]" data-testid="button-attach">
              <ImageIcon className="w-5 h-5" />
            </Button>
            <Textarea
              placeholder="Descreva sua mensagem ou tema..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              rows={1}
              className="resize-none min-h-[44px] max-h-[200px] flex-1"
              data-testid="input-message"
            />
            <Button onClick={handleSubmit} disabled={(!input.trim() && !pendingImage) || isPending} size="icon" className="h-[44px] w-[44px] bg-purple-600 hover:bg-purple-700" data-testid="button-send">
              {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
