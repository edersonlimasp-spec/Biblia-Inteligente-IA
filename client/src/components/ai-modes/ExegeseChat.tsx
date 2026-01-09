import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { getDeviceId } from "@/hooks/use-device-id";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Microscope, 
  Send,
  Loader2,
  User,
  Crown,
  BookOpenCheck,
  Languages,
  FileSearch,
  Quote,
  Image as ImageIcon,
  X,
  Download,
  Sparkles,
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

interface ExegeseChatProps {
  onBack: () => void;
  onNavigateToSubscriptions: () => void;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  attachment?: { type: 'image'; url: string; mimeType: string; base64?: string };
  imageUrl?: string;
  references?: string[];
}

interface SavedConversation {
  id: string;
  title: string;
  messages: Message[];
  savedAt: Date;
}

const EXEGESIS_TOPICS = [
  { icon: Languages, text: "Análise do grego em João 1:1", category: "Grego" },
  { icon: BookOpenCheck, text: "Significado hebraico de 'chesed'", category: "Hebraico" },
  { icon: FileSearch, text: "Contexto literário de Romanos 8", category: "Contexto" },
  { icon: Quote, text: "Estrutura quiástica em Mateus 5-7", category: "Estrutura" },
];

const SYSTEM_PROMPT = `Você é um EXEGETA BÍBLICO de nível acadêmico, especialista em línguas originais (hebraico, aramaico e grego koiné). Sua análise DEVE incluir:

1. ANÁLISE LINGUÍSTICA PROFUNDA:
   - Transliteração e significado das palavras-chave no original
   - Parsing gramatical (tempo, modo, voz, pessoa, número, caso)
   - Raízes etimológicas e campo semântico
   - Uso da palavra em outros textos bíblicos (análise de concordância)

2. REFERÊNCIAS OBRIGATÓRIAS - Cite SEMPRE:
   - Léxicos: BDAG, Thayer, Louw-Nida (grego); BDB, HALOT (hebraico)
   - Gramáticas: Wallace, Robertson (grego); Waltke-O'Connor, Joüon-Muraoka (hebraico)
   - Comentários exegéticos: NICNT, NIGTC, WBC, ICC, Anchor Bible
   - Dicionários teológicos: TDNT, NIDNTT, TDOT, NIDOTTE

3. FORMATO DE RESPOSTA:
   
   📖 TEXTO E TRADUÇÃO
   [Texto original com transliteração]
   
   🔍 ANÁLISE GRAMATICAL
   [Parsing detalhado de palavras-chave]
   
   📚 CAMPO SEMÂNTICO
   [Significados e usos no AT/NT]
   
   🎯 INTERPRETAÇÃO
   [Síntese exegética com implicações teológicas]
   
   📕 REFERÊNCIAS
   [Lista de fontes utilizadas]

4. NUNCA INVENTE - Use apenas dados verificáveis de fontes acadêmicas reconhecidas.

Responda em português brasileiro com precisão acadêmica.`;

export function ExegeseChat({ onBack, onNavigateToSubscriptions }: ExegeseChatProps) {
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const { toast } = useToast();
  const deviceId = getDeviceId();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [pendingImage, setPendingImage] = useState<{
    url: string; base64: string; mimeType: string;
  } | null>(null);
  const [activeTab, setActiveTab] = useState("chat");
  const [savedConversations, setSavedConversations] = useState<SavedConversation[]>([]);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: subStatus } = useQuery<{ hasPremium: boolean; hasGold: boolean; hasLifetime: boolean }>({
    queryKey: ['/api/user/subscription-status'],
    enabled: !!user,
  });

  const hasPremium = user?.role === 'admin' || user?.role === 'super_admin' || subStatus?.hasPremium || subStatus?.hasLifetime;

  useEffect(() => {
    const saved = localStorage.getItem('exegese_chat_v3');
    if (saved) {
      try {
        setMessages(JSON.parse(saved).map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })));
      } catch {}
    }
    const savedHistory = localStorage.getItem('exegese_chat_history');
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
    localStorage.setItem('exegese_chat_v3', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('exegese_chat_history', JSON.stringify(savedConversations));
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
        mode: "exegese",
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
        description: "Exegese Profunda requer assinatura Premium", 
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
      analyzeImageMutation.mutate({ imageBase64: pendingImage.base64, mimeType: pendingImage.mimeType, question: trimmed || "Analise esta imagem do ponto de vista exegético" });
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
      <div className="min-h-screen bg-gradient-to-b from-emerald-950/30 to-background flex flex-col">
        <header className="sticky top-0 z-50 bg-gradient-to-r from-emerald-600 to-teal-700 text-white">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onBack} className="text-white hover:bg-white/20" data-testid="button-back">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Microscope className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold">Exegese Profunda</h1>
              <p className="text-sm text-emerald-100">Análise textual do original</p>
            </div>
            <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
              <Crown className="w-3 h-3 mr-1" /> Premium
            </Badge>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center p-6">
          <Card className="max-w-md w-full bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/50 dark:to-teal-950/50 border-emerald-200">
            <CardContent className="p-8 text-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/30">
                <Microscope className="w-12 h-12 text-white" />
              </div>
              <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 mb-4">
                <Crown className="w-3 h-3 mr-1" /> Recurso Premium
              </Badge>
              <h2 className="text-2xl font-bold mb-3">Exegese Profunda</h2>
              <p className="text-muted-foreground mb-6">
                Acesse análise textual detalhada do hebraico e grego original, 
                com parsing gramatical, léxicos acadêmicos e referências de 
                comentários exegéticos de nível universitário.
              </p>
              <div className="space-y-2 text-left mb-6">
                <div className="flex items-center gap-2 text-sm">
                  <Languages className="w-4 h-4 text-emerald-500" />
                  <span>Análise de palavras em hebraico/grego</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <BookOpenCheck className="w-4 h-4 text-emerald-500" />
                  <span>Referências de BDAG, BDB, HALOT</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <FileSearch className="w-4 h-4 text-emerald-500" />
                  <span>Parsing gramatical completo</span>
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
    <div className="h-screen bg-gradient-to-b from-emerald-950/20 to-background flex flex-col overflow-hidden">
      {/* Premium Header (fixed) */}
      <header className="flex-shrink-0 z-50 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} className="text-white hover:bg-white/20" data-testid="button-back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center ring-2 ring-white/30">
            <Microscope className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold flex items-center gap-2">
              Exegese Profunda
              <Sparkles className="w-4 h-4 text-amber-300" />
            </h1>
            <p className="text-sm text-emerald-100">Análise textual do original hebraico/grego</p>
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
                      <MessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0 text-emerald-500" />
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
            <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0 shadow-lg">
              <Crown className="w-3 h-3 mr-1" /> Premium
            </Badge>
          </div>
        </div>
      </header>

      {/* Premium Tabs (fixed) */}
      <div className="flex-shrink-0 border-b bg-emerald-50/50 dark:bg-emerald-950/20">
        <div className="max-w-6xl mx-auto px-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-transparent gap-4 h-12">
              <TabsTrigger value="chat" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                Chat Exegético
              </TabsTrigger>
              <TabsTrigger value="references" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                Referências Rápidas
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Scrollable content area */}
          <div className="flex-1 overflow-y-auto" ref={scrollRef}>
            {/* Topic suggestions */}
            {messages.length === 0 && (
              <div className="max-w-4xl mx-auto px-4 py-6 w-full">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  {EXEGESIS_TOPICS.map((item, i) => (
                    <Card 
                      key={i} 
                      className="cursor-pointer hover-elevate bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800"
                      onClick={() => setInput(item.text)}
                    >
                      <CardContent className="p-3 flex flex-col items-center text-center gap-2">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                          <item.icon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium uppercase tracking-wide">{item.category}</p>
                          <p className="text-xs font-medium">{item.text}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                <Card className="bg-gradient-to-br from-emerald-50 to-teal-50/50 dark:from-emerald-950/30 dark:to-teal-950/20 border-emerald-200/50 shadow-lg">
                  <CardContent className="p-8 text-center">
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-emerald-500/30 ring-4 ring-emerald-200/50 dark:ring-emerald-800/50">
                      <Microscope className="w-12 h-12 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Laboratório Exegético</h2>
                    <p className="text-muted-foreground max-w-lg mx-auto mb-4">
                      Análise profunda de textos bíblicos nos idiomas originais. 
                      Cada resposta inclui parsing gramatical, referências de léxicos 
                      acadêmicos (BDAG, BDB, HALOT) e citações de comentários exegéticos.
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                      <Badge variant="outline" className="border-emerald-300 text-emerald-700 dark:text-emerald-300">
                        <Languages className="w-3 h-3 mr-1" /> Hebraico & Grego
                      </Badge>
                      <Badge variant="outline" className="border-emerald-300 text-emerald-700 dark:text-emerald-300">
                        <BookOpenCheck className="w-3 h-3 mr-1" /> Léxicos Acadêmicos
                      </Badge>
                      <Badge variant="outline" className="border-emerald-300 text-emerald-700 dark:text-emerald-300">
                        <FileSearch className="w-3 h-3 mr-1" /> Parsing Gramatical
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Chat messages */}
            <div className="p-4">
              <div className="max-w-4xl mx-auto space-y-4 pb-4">
              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0 shadow-lg ring-2 ring-emerald-200/50 dark:ring-emerald-800/50">
                      <Microscope className="w-5 h-5 text-white" />
                    </div>
                  )}
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    message.role === 'user' 
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg' 
                      : 'bg-white dark:bg-card border border-emerald-200/50 dark:border-emerald-800/50 shadow-sm'
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
                    <p className="text-base whitespace-pre-wrap leading-relaxed">{message.content}</p>
                    <span className="text-[10px] opacity-60 mt-2 block">
                      {message.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {message.role === 'user' && (
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                  )}
                </motion.div>
              ))}

              {isPending && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg ring-2 ring-emerald-200/50">
                    <Microscope className="w-5 h-5 text-white" />
                  </div>
                  <div className="bg-white dark:bg-card rounded-2xl px-4 py-3 border border-emerald-200/50 shadow-sm">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                      Analisando texto original...
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
            </div>
          </div>

          {/* Premium Input area (fixed at bottom) */}
          <div className="flex-shrink-0 border-t bg-gradient-to-r from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/20 p-4">
            <div className="max-w-4xl mx-auto">
              <AnimatePresence>
                {pendingImage && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mb-3">
                    <div className="relative inline-block">
                      <img src={pendingImage.url} alt="Preview" className="h-20 rounded-lg border-2 border-emerald-300" />
                      <button onClick={() => setPendingImage(null)} className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-white rounded-full flex items-center justify-center">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex gap-2 items-end">
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                <Button variant="outline" size="icon" onClick={() => fileInputRef.current?.click()} disabled={isPending} className="h-[44px] w-[44px] border-emerald-300" data-testid="button-attach">
                  <ImageIcon className="w-5 h-5 text-emerald-600" />
                </Button>
                <Textarea
                  placeholder="Digite sua análise exegética (ex: João 1:1 no grego...)"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  rows={1}
                  className="resize-none min-h-[44px] max-h-[200px] flex-1 border-emerald-200 focus-visible:ring-emerald-500"
                  data-testid="input-message"
                />
                <Button onClick={handleSubmit} disabled={(!input.trim() && !pendingImage) || isPending} size="icon" className="h-[44px] w-[44px] bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg" data-testid="button-send">
                  {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
