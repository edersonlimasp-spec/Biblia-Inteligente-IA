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
  GraduationCap, 
  Send,
  Loader2,
  User,
  Sparkles,
  BookOpen,
  Lightbulb,
  FileText,
  Image as ImageIcon,
  X,
  Download,
  Plus,
  History,
  MessageSquare,
  Trash2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";

interface ProfessorChatProps {
  onBack: () => void;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  attachment?: { type: 'image'; url: string; mimeType: string; base64?: string };
  imageUrl?: string;
}

interface SavedConversation {
  id: string;
  title: string;
  messages: Message[];
  savedAt: Date;
}

const STUDY_SUGGESTIONS = [
  { icon: BookOpen, text: "Contexto histórico de Êxodo", category: "História" },
  { icon: Lightbulb, text: "Significado das parábolas", category: "Ensino" },
  { icon: FileText, text: "Estrutura do livro de Romanos", category: "Estrutura" },
];

const SYSTEM_PROMPT = `Você é um PROFESSOR DE TEOLOGIA renomado, especialista em estudos bíblicos com décadas de experiência acadêmica. Sua abordagem é:

1. DIDÁTICA E CLARA - Explique conceitos complexos de forma acessível
2. FUNDAMENTADA EM REFERÊNCIAS - SEMPRE cite fontes confiáveis como:
   - Comentários bíblicos (Matthew Henry, John MacArthur, Warren Wiersbe)
   - Dicionários bíblicos (Strong, Vine, DITNT)
   - Obras acadêmicas (F.F. Bruce, D.A. Carson, Gordon Fee)
   - Enciclopédias bíblicas (ISBE, Anchor Bible Dictionary)

3. ESTRUTURADA - Organize suas respostas com:
   - Introdução contextual
   - Desenvolvimento com pontos principais
   - Aplicação prática
   - Referências para aprofundamento

4. NUNCA INVENTE CONTEÚDO - Baseie-se apenas em fontes verificáveis e materiais acadêmicos reconhecidos.

Formato de citação: [Autor, Obra, Ano/Página]

Responda sempre em português brasileiro de forma professoral mas acessível.`;

export function ProfessorChat({ onBack }: ProfessorChatProps) {
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const { toast } = useToast();
  const deviceId = getDeviceId();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [pendingImage, setPendingImage] = useState<{
    url: string; base64: string; mimeType: string;
  } | null>(null);
  const [savedConversations, setSavedConversations] = useState<SavedConversation[]>([]);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: subStatus } = useQuery<{ hasPremium: boolean; hasGold: boolean; hasLifetime: boolean }>({
    queryKey: ['/api/user/subscription-status'],
    enabled: !!user,
  });

  const hasPremium = user?.role === 'admin' || user?.role === 'super_admin' || subStatus?.hasPremium || subStatus?.hasLifetime;
  const hasAccess = hasPremium || subStatus?.hasGold;

  useEffect(() => {
    const saved = localStorage.getItem('professor_chat_v3');
    if (saved) {
      try {
        setMessages(JSON.parse(saved).map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })));
      } catch {}
    }
    const savedHistory = localStorage.getItem('professor_chat_history');
    if (savedHistory) {
      try {
        setSavedConversations(JSON.parse(savedHistory).map((c: any) => ({
          ...c,
          savedAt: new Date(c.savedAt),
          messages: c.messages.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }))
        })));
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('professor_chat_v3', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('professor_chat_history', JSON.stringify(savedConversations));
  }, [savedConversations]);

  const handleNewConversation = useCallback(() => {
    if (messages.length > 0) {
      const firstUserMsg = messages.find(m => m.role === 'user');
      const title = firstUserMsg ? firstUserMsg.content.slice(0, 50) + (firstUserMsg.content.length > 50 ? '...' : '') : 'Conversa sem título';
      const newConversation: SavedConversation = {
        id: Date.now().toString(),
        title,
        messages: [...messages],
        savedAt: new Date()
      };
      setSavedConversations(prev => [newConversation, ...prev].slice(0, 10));
      toast({ title: "Conversa salva", description: "A conversa foi salva no histórico" });
    }
    setMessages([]);
    setInput("");
    setPendingImage(null);
  }, [messages, toast]);

  const handleLoadConversation = useCallback((conversation: SavedConversation) => {
    if (messages.length > 0) {
      const firstUserMsg = messages.find(m => m.role === 'user');
      const title = firstUserMsg ? firstUserMsg.content.slice(0, 50) + (firstUserMsg.content.length > 50 ? '...' : '') : 'Conversa sem título';
      const newConversation: SavedConversation = {
        id: Date.now().toString(),
        title,
        messages: [...messages],
        savedAt: new Date()
      };
      setSavedConversations(prev => {
        const filtered = prev.filter(c => c.id !== conversation.id);
        return [newConversation, ...filtered].slice(0, 10);
      });
    }
    setMessages(conversation.messages);
    setSavedConversations(prev => prev.filter(c => c.id !== conversation.id));
  }, [messages]);

  const handleDeleteConversation = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedConversations(prev => prev.filter(c => c.id !== id));
    toast({ title: "Conversa excluída" });
  }, [toast]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const askMutation = useMutation({
    mutationFn: async (question: string) => {
      const res = await apiRequest("POST", "/api/ai/ask", {
        question,
        mode: "professor",
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
    <div className="min-h-screen bg-gradient-to-b from-blue-950/20 to-background flex flex-col">
      {/* Header - Classroom style */}
      <header className="sticky top-0 z-50 bg-blue-600/95 backdrop-blur text-white">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} className="text-white hover:bg-white/20" data-testid="button-back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Modo Professor</h1>
            <p className="text-sm text-blue-100">Explicações didáticas e claras</p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleNewConversation}
              className="text-white hover:bg-white/20"
              title="Nova conversa"
              data-testid="button-new-conversation"
            >
              <Plus className="w-5 h-5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 relative" data-testid="button-history">
                  <History className="w-5 h-5" />
                  {savedConversations.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full text-[10px] flex items-center justify-center">
                      {savedConversations.length}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                <DropdownMenuLabel className="flex items-center gap-2">
                  <History className="w-4 h-4" />
                  Histórico de Conversas
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {savedConversations.length === 0 ? (
                  <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                    Nenhuma conversa salva
                  </div>
                ) : (
                  savedConversations.map((conv) => (
                    <DropdownMenuItem 
                      key={conv.id} 
                      onClick={() => handleLoadConversation(conv)}
                      className="flex items-start gap-2 cursor-pointer"
                    >
                      <MessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-500" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{conv.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {conv.messages.length} msgs • {new Date(conv.savedAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 flex-shrink-0"
                        onClick={(e) => handleDeleteConversation(conv.id, e)}
                      >
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </Button>
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            <Badge className="bg-amber-500 text-white border-0">Gold+</Badge>
          </div>
        </div>
      </header>

      {/* Study suggestions sidebar-style */}
      {messages.length === 0 && (
        <div className="max-w-4xl mx-auto px-4 py-6 w-full">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {STUDY_SUGGESTIONS.map((item, i) => (
              <Card 
                key={i} 
                className="cursor-pointer hover-elevate bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800"
                onClick={() => setInput(item.text)}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">{item.category}</p>
                    <p className="text-sm font-medium">{item.text}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <Card className="bg-blue-50/50 dark:bg-blue-950/20 border-blue-200/50">
            <CardContent className="p-6 text-center">
              <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center mx-auto mb-4">
                <GraduationCap className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Bem-vindo à Sala de Aula</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Sou seu professor de teologia. Faça perguntas sobre passagens bíblicas, 
                contexto histórico, interpretação ou qualquer dúvida teológica.
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-4">
                Todas as respostas incluem referências de comentaristas renomados
              </p>
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
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
              )}
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                message.role === 'user' ? 'bg-blue-600 text-white' : 'bg-muted border border-blue-200/30'
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
                <div className="w-10 h-10 rounded-xl bg-blue-200 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-blue-600 dark:text-blue-300" />
                </div>
              )}
            </motion.div>
          ))}

          {isPending && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div className="bg-muted rounded-2xl px-4 py-3 border border-blue-200/30">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Preparando explicação...
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
              placeholder="Pergunte ao Professor..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              rows={1}
              className="resize-none min-h-[44px] max-h-[200px] flex-1"
              data-testid="input-message"
            />
            <Button onClick={handleSubmit} disabled={(!input.trim() && !pendingImage) || isPending} size="icon" className="h-[44px] w-[44px] bg-blue-600 hover:bg-blue-700" data-testid="button-send">
              {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
