import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, ChevronUp, ChevronDown, MessageSquarePlus, History, Loader2, X, Search, Share2, Copy, Mail, MessageCircle, LogIn, Crown, Lock } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { trackAIQuestion } from "@/lib/tracking";
import { useAuth } from "@/contexts/AuthContext";
import { useRequireAuth } from "@/contexts/AuthGateContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { getDeviceId } from "@/hooks/use-device-id";
import { useLocation } from "wouter";
import { useAIQuota } from "@/hooks/useAIQuota";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

// ===================================
// TYPES - Sistema de Sessões
// ===================================

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
  createdAt: Date;
}

interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

interface AIRequest {
  question: string;
  verse?: string;
  book?: string;
  chapter?: number;
  mode: 'essential' | 'premium';
  deviceId?: string;
  language?: 'pt' | 'en' | 'es';
}

interface AIResponse {
  response: string;
}

// ===================================
// STORAGE - LocalStorage Management
// ===================================

const STORAGE_KEY = "bible-ai-chat-sessions";
const CURRENT_SESSION_KEY = "bible-ai-current-session-id";

function saveSessions(sessions: ChatSession[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch (error) {
    console.error("Erro ao salvar sessões:", error);
  }
}

function loadSessions(): ChatSession[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const parsed = JSON.parse(stored);
    // Convert date strings back to Date objects
    return parsed.map((session: any) => ({
      ...session,
      createdAt: new Date(session.createdAt),
      updatedAt: new Date(session.updatedAt),
      messages: session.messages.map((msg: any) => ({
        ...msg,
        createdAt: new Date(msg.createdAt),
      })),
    }));
  } catch (error) {
    console.error("Erro ao carregar sessões:", error);
    return [];
  }
}

function saveCurrentSessionId(sessionId: string): void {
  try {
    localStorage.setItem(CURRENT_SESSION_KEY, sessionId);
  } catch (error) {
    console.error("Erro ao salvar ID da sessão atual:", error);
  }
}

function loadCurrentSessionId(): string | null {
  try {
    return localStorage.getItem(CURRENT_SESSION_KEY);
  } catch (error) {
    console.error("Erro ao carregar ID da sessão atual:", error);
    return null;
  }
}

// ===================================
// COMPONENT - AIPanel
// ===================================

interface UserSubscription {
  hasPremium: boolean;
  hasGold: boolean;
  trialActive: boolean;
}

interface AIPanelProps {
  hidden?: boolean;
  shouldResetAI?: boolean;
  onResetComplete?: () => void;
}

export function AIPanel({ hidden = false, shouldResetAI = false, onResetComplete }: AIPanelProps) {
  const [question, setQuestion] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [userSub, setUserSub] = useState<UserSubscription>({ hasPremium: false, hasGold: false, trialActive: false });
  const [guestTrialInfo, setGuestTrialInfo] = useState<{ active: boolean; daysRemaining: number } | null>(null);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { requireAuth, isAuthenticated } = useRequireAuth();
  const { language, t } = useLanguage();
  const [, navigate] = useLocation();
  
  // Centralized quota system
  const { quotaInfo, consumeQuestion, isLoading: quotaLoading } = useAIQuota();

  // ===================================
  // STATE - Sessões e Mensagens
  // ===================================
  
  const [currentSessionId, setCurrentSessionId] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  
  // Ref para scroll automático ao final do chat
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ===================================
  // AUTO-SCROLL - Scroll automático ao final quando mensagens mudam
  // ===================================
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    // Scroll ao final quando mensagens mudarem ou painel expandir
    if (isExpanded && messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, isExpanded]);

  // Colapsar painel quando estava oculto e volta a aparecer
  // Isso evita conflito com AnnotationPanel
  const prevHiddenRef = useRef(hidden);
  useEffect(() => {
    if (prevHiddenRef.current && !hidden) {
      // Voltou de oculto para visível - manter colapsado para evitar conflito
      setIsExpanded(false);
    }
    prevHiddenRef.current = hidden;
  }, [hidden]);

  // Reset completo do Professor quando vindo de Anotações
  // Usar ref para garantir que o reset só aconteça uma vez por ciclo
  const hasProcessedResetRef = useRef(false);
  useEffect(() => {
    console.log('[AIPanel] Reset effect triggered - shouldResetAI:', shouldResetAI, 'hasProcessedResetRef:', hasProcessedResetRef.current);
    if (shouldResetAI && !hasProcessedResetRef.current) {
      hasProcessedResetRef.current = true;
      console.log('[AIPanel] PERFORMING RESET - creating new session');
      
      // Criar nova sessão para limpar conversa
      const newSessionId = `session-${Date.now()}`;
      setCurrentSessionId(newSessionId);
      setMessages([]);
      setQuestion("");
      setIsExpanded(false);
      setIsHistoryOpen(false);
      saveCurrentSessionId(newSessionId);
      
      // Notificar que o reset foi concluído para limpar a flag
      console.log('[AIPanel] Calling onResetComplete');
      onResetComplete?.();
    }
    // Resetar a ref quando shouldResetAI voltar a false
    if (!shouldResetAI) {
      hasProcessedResetRef.current = false;
    }
  }, [shouldResetAI, onResetComplete]);

  // ===================================
  // INITIALIZATION - Carregar status de assinatura
  // ===================================

  useEffect(() => {
    async function fetchSubscriptionStatus() {
      if (user) {
        // Set loading while fetching subscription
        setSubscriptionLoading(true);
        try {
          // Usuário logado: buscar status de assinatura
          const res = await fetch('/api/user/subscription-status');
          if (res.ok) {
            const data = await res.json();
            setUserSub({
              hasPremium: data.hasPremium || false,
              hasGold: data.hasGold || false,
              trialActive: data.trialActive || false,
            });
          }
        } catch (error) {
          console.error('Erro ao carregar status:', error);
        } finally {
          setSubscriptionLoading(false);
        }
      } else {
        // Reset subscription state for guests
        setUserSub({ hasPremium: false, hasGold: false, trialActive: false });
        // Guest: buscar trial info por deviceId
        try {
          const deviceId = getDeviceId();
          const res = await fetch(`/api/guest/trial/${deviceId}`);
          if (res.ok) {
            const data = await res.json();
            setGuestTrialInfo(data);
          }
        } catch (error) {
          console.error('Erro ao carregar status:', error);
        }
      }
    }
    fetchSubscriptionStatus();
  }, [user]);
  
  // ===================================
  // HELPERS - Check if user has unlimited AI access (uses centralized quota)
  // ===================================
  
  const hasUnlimitedAccess = (): boolean => {
    return quotaInfo.hasUnlimitedAccess;
  };

  // ===================================
  // INITIALIZATION - Carregar sessões do localStorage (com RESET automático)
  // IMPORTANTE: Respeitar shouldResetAI para não restaurar sessão quando vindo de anotações
  // ===================================
  
  useEffect(() => {
    console.log('[AIPanel] INITIALIZATION effect - shouldResetAI:', shouldResetAI);
    
    // Se shouldResetAI está ativo, NÃO restaurar sessão anterior
    // O efeito de reset vai cuidar de criar nova sessão limpa
    if (shouldResetAI) {
      console.log('[AIPanel] INITIALIZATION skipped - shouldResetAI is true, waiting for reset effect');
      // Apenas carregar sessões para o histórico, mas não ativar nenhuma
      const loadedSessions = loadSessions();
      setChatSessions(loadedSessions);
      return;
    }
    
    // RESET AUTOMÁTICO: Detectar se app foi reaberto (nova sessão do navegador)
    try {
      const isFirstVisitThisSession = !sessionStorage.getItem('bible-app-session-initialized');
      
      if (isFirstVisitThisSession) {
        // APP REABERTO: Criar nova conversa limpa
        try {
          sessionStorage.setItem('bible-app-session-initialized', 'true');
        } catch (e) {
          console.warn('sessionStorage não disponível');
        }
        
        // Limpar dados de contexto
        localStorage.removeItem('bible-ai-current-session-id');
        
        // Criar primeira sessão vazia (sessões anteriores permanecem no histórico)
        const newSessionId = `session-${Date.now()}`;
        setCurrentSessionId(newSessionId);
        setMessages([]);
        setChatSessions([]);
        saveCurrentSessionId(newSessionId);
      } else {
        // Mesma sessão do navegador: carregar conversa anterior normalmente
        const loadedSessions = loadSessions();
        const savedSessionId = loadCurrentSessionId();
        
        if (loadedSessions.length > 0) {
          // Tentar carregar a sessão que estava ativa
          let sessionToLoad = savedSessionId 
            ? loadedSessions.find(s => s.id === savedSessionId)
            : null;
          
          // Se não encontrou, usar a última sessão
          if (!sessionToLoad) {
            sessionToLoad = loadedSessions[loadedSessions.length - 1];
          }
          
          setCurrentSessionId(sessionToLoad.id);
          setMessages(sessionToLoad.messages);
          setChatSessions(loadedSessions);
          
          // NÃO expandir painel automaticamente - deixar o usuário controlar
          // Isso evita conflito com anotações e comportamento invasivo
          // O usuário pode clicar no painel para expandir quando quiser
        } else {
          // Criar primeira sessão vazia
          const newSessionId = `session-${Date.now()}`;
          setCurrentSessionId(newSessionId);
          setMessages([]);
          setChatSessions([]);
          saveCurrentSessionId(newSessionId);
        }
      }
    } catch (error) {
      console.error('Erro ao inicializar AIPanel:', error);
      // Fallback: criar primeira sessão vazia
      const newSessionId = `session-${Date.now()}`;
      setCurrentSessionId(newSessionId);
      setMessages([]);
      setChatSessions([]);
      saveCurrentSessionId(newSessionId);
    }
  }, [shouldResetAI]);

  // ===================================
  // AUTO-SAVE - Salvar sempre que mensagens mudarem
  // ===================================
  
  useEffect(() => {
    if (currentSessionId && messages.length > 0) {
      updateCurrentSession();
    }
  }, [messages]);

  // ===================================
  // HELPERS - Gerenciamento de Sessões
  // ===================================

  const generateTitle = (firstQuestion: string): string => {
    // Pegar primeiras 50 caracteres da primeira pergunta
    return firstQuestion.length > 50 
      ? firstQuestion.substring(0, 50) + "..."
      : firstQuestion;
  };

  const updateCurrentSession = () => {
    const title = messages.length > 0 && messages[0].role === "user"
      ? generateTitle(messages[0].text)
      : "Nova Conversa";

    const currentSession: ChatSession = {
      id: currentSessionId,
      title,
      messages,
      createdAt: new Date(parseInt(currentSessionId.split('-')[1])),
      updatedAt: new Date(),
    };

    // Atualizar ou adicionar sessão
    setChatSessions(prev => {
      const existingIndex = prev.findIndex(s => s.id === currentSessionId);
      let updated;
      
      if (existingIndex >= 0) {
        // Atualizar sessão existente
        updated = [...prev];
        updated[existingIndex] = currentSession;
      } else {
        // Adicionar nova sessão
        updated = [...prev, currentSession];
      }
      
      // Salvar no localStorage
      saveSessions(updated);
      saveCurrentSessionId(currentSessionId);
      return updated;
    });
  };

  // ===================================
  // ACTIONS - Nova Conversa
  // ===================================

  const handleNewConversation = () => {
    // PASSO 1: Salvar sessão atual se houver mensagens
    if (messages.length > 0) {
      updateCurrentSession();
      
      toast({
        title: "Conversa arquivada",
        description: "Sua conversa anterior foi salva no histórico.",
      });
    }

    // PASSO 2: Criar nova sessão vazia
    const newSessionId = `session-${Date.now()}`;
    setCurrentSessionId(newSessionId);
    setMessages([]);
    setIsExpanded(false);
    saveCurrentSessionId(newSessionId);

    toast({
      title: "Nova conversa iniciada",
      description: "Você pode fazer uma nova pergunta ao Professor.",
    });
  };

  // ===================================
  // ACTIONS - Carregar Sessão do Histórico
  // ===================================

  const handleLoadSession = (sessionId: string) => {
    const session = chatSessions.find(s => s.id === sessionId);
    if (!session) return;

    // Salvar sessão atual antes de trocar (se houver mensagens)
    if (messages.length > 0 && currentSessionId !== sessionId) {
      updateCurrentSession();
    }

    // Carregar sessão selecionada
    setCurrentSessionId(session.id);
    setMessages(session.messages);
    setIsExpanded(true);
    setIsHistoryOpen(false);
    saveCurrentSessionId(session.id);

    toast({
      title: "Conversa carregada",
      description: `"${session.title}"`,
    });
  };

  // ===================================
  // AI MUTATION - Perguntar ao Professor
  // ===================================

  const askAIMutation = useMutation({
    mutationFn: async (request: AIRequest & { sessionId: string; isGuest?: boolean; deviceId?: string }) => {
      const { sessionId, isGuest, deviceId, ...aiRequest } = request;
      
      let data: AIResponse;
      
      if (isGuest) {
        // Guest: usar rota de guest (sem autenticação)
        const res = await fetch('/api/guest/ai/ask', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            deviceId: deviceId || getDeviceId(),
            question: aiRequest.question,
            book: aiRequest.book,
            chapter: aiRequest.chapter,
            verse: aiRequest.verse,
            language: aiRequest.language,
          }),
        });
        
        if (!res.ok) {
          const errorData = await res.json();
          throw { status: res.status, data: errorData };
        }
        
        data = await res.json() as AIResponse;
      } else {
        // Usuário logado: usar rota autenticada
        const res = await apiRequest('POST', '/api/ai/ask', aiRequest);
        data = await res.json() as AIResponse;
      }
      
      return { ...data, sessionId };
    },
    onSuccess: (data) => {
      // CRITICAL: Only append response to the ORIGINAL session (not current one)
      // This prevents responses going to wrong session if user switches mid-request
      const assistantMessage: ChatMessage = {
        role: "assistant",
        text: data.response,
        createdAt: new Date(),
      };

      // If user switched sessions, update the ORIGINAL session in chatSessions
      if (data.sessionId !== currentSessionId) {
        setChatSessions(prev => {
          const targetSession = prev.find(s => s.id === data.sessionId);
          
          // Edge case: Original session was deleted/missing - recreate it to avoid losing response
          if (!targetSession) {
            const recreatedSession: ChatSession = {
              id: data.sessionId,
              title: "Conversa Recuperada",
              messages: [assistantMessage],
              createdAt: new Date(parseInt(data.sessionId.split('-')[1])),
              updatedAt: new Date(),
            };
            const updated = [...prev, recreatedSession];
            saveSessions(updated);
            return updated;
          }

          // Normal case: Update existing session
          const updated = prev.map(s => 
            s.id === data.sessionId
              ? { ...s, messages: [...s.messages, assistantMessage], updatedAt: new Date() }
              : s
          );
          saveSessions(updated);
          return updated;
        });
      } else {
        // User is still in same session, append normally
        setMessages(prev => [...prev, assistantMessage]);
      }

      setIsExpanded(true);
      setQuestion("");
    },
    onError: (error: any) => {
      const errorMessage = error?.data?.error || error?.message || "Erro ao processar pergunta";
      const upgradeMessage = error?.data?.upgradeMessage;
      const needsSubscription = error?.status === 403 || error?.data?.requiresSubscription;
      
      toast({
        title: needsSubscription ? "Limite Diário Atingido" : "Erro",
        description: upgradeMessage || errorMessage,
        variant: "destructive",
        duration: 5000,
      });
    },
  });

  // ===================================
  // ACTIONS - Compartilhar Resposta
  // ===================================

  const getShareText = (assistantMsg: ChatMessage, idx: number) => {
    const userMsg = messages[idx - 1];
    const questionText = userMsg?.role === 'user' ? userMsg.text : '';
    return `Pergunta: ${questionText}

Resposta do Professor IA: ${assistantMsg.text}

---
Enviado por Bíblia Inteligente IA
Conheça: https://bibliainteligente.replit.app`;
  };

  const handleShareMessage = async (msg: ChatMessage, idx: number, method: 'whatsapp' | 'email' | 'copy' | 'native') => {
    const shareText = getShareText(msg, idx);
    
    switch (method) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
        break;
      case 'email':
        window.open(`mailto:?subject=${encodeURIComponent('Resposta do Professor IA - Bíblia Inteligente')}&body=${encodeURIComponent(shareText)}`, '_blank');
        break;
      case 'copy':
        try {
          await navigator.clipboard.writeText(shareText);
          toast({
            title: "Copiado!",
            description: "Resposta copiada para a área de transferência",
          });
        } catch {
          toast({
            title: "Erro",
            description: "Não foi possível copiar",
            variant: "destructive",
          });
        }
        break;
      case 'native':
        if (navigator.share) {
          try {
            await navigator.share({
              title: 'Resposta do Professor IA',
              text: shareText,
            });
          } catch (err) {
            if ((err as Error).name !== 'AbortError') {
              toast({
                title: "Erro",
                description: "Não foi possível compartilhar",
                variant: "destructive",
              });
            }
          }
        }
        break;
    }
  };

  const handleAsk = () => {
    if (!question.trim()) return;
    
    // Store question before clearing
    const currentQuestion = question.trim();
    
    // Clear input immediately for better UX
    setQuestion("");
    
    // ===================================
    // CHECK QUOTA (Centralized system)
    // Guest: 2 permanent questions, User: 5 permanent total
    // ===================================
    
    // Wait for quota to load if authenticated
    if (isAuthenticated && quotaLoading) {
      toast({
        title: "Aguarde",
        description: "Carregando seu plano...",
      });
      setQuestion(currentQuestion); // Restore question
      return;
    }
    
    // ===================================
    // CASE 1: Guest - require login if limit reached
    // ===================================
    if (quotaInfo.requiresLogin) {
      setQuestion(currentQuestion); // Restore question
      setShowLoginPrompt(true);
      return;
    }
    
    // ===================================
    // CASE 2: User without subscription - require upgrade if limit reached
    // ===================================
    if (quotaInfo.requiresSubscription) {
      setQuestion(currentQuestion); // Restore question
      setShowUpgradePrompt(true);
      return;
    }
    
    // ===================================
    // PROCEED - User has quota or unlimited access
    // ===================================
    
    // Add user message to chat
    const userMessage: ChatMessage = {
      role: "user",
      text: currentQuestion,
      createdAt: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    
    // Consume quota (unless unlimited)
    if (!quotaInfo.hasUnlimitedAccess) {
      consumeQuestion();
    }
    
    // Determine mode based on access
    const isAdminUser = user?.role === 'admin' || user?.role === 'super_admin';
    const mode = isAdminUser || userSub.hasPremium ? 'premium' : 'essential';
    
    // Track and send question
    trackAIQuestion(mode).catch(() => {});
    
    askAIMutation.mutate({
      question: currentQuestion,
      mode,
      sessionId: currentSessionId,
      isGuest: !isAuthenticated,
      deviceId: getDeviceId(),
      language,
    });
  };

  // ===================================
  // RENDER
  // ===================================

  // Ocultar completamente quando hidden=true (ex: AnnotationPanel aberto)
  if (hidden) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t shadow-lg">
      {/* Expanded Chat Area */}
      {isExpanded && messages.length > 0 && (
        <div className="border-b bg-background">
          <div className="max-w-3xl mx-auto px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Sparkles className="h-5 w-5 text-primary" />
                <span className="font-semibold text-primary">Professor</span>
                {(userSub.hasPremium || user?.role === 'admin' || user?.role === 'super_admin') && (
                  <Badge variant="default" className="text-xs bg-amber-600">
                    Premium
                  </Badge>
                )}
                {!userSub.hasPremium && userSub.hasGold && !(user?.role === 'admin' || user?.role === 'super_admin') && (
                  <Badge variant="secondary" className="text-xs">
                    Gold
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs hidden sm:inline-flex">
                  {messages.length} {messages.length === 1 ? 'mensagem' : 'mensagens'}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNewConversation}
                  data-testid="button-new-conversation"
                  className="text-xs sm:text-sm"
                >
                  <MessageSquarePlus className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Nova Conversa</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsExpanded(false)}
                  data-testid="button-collapse-ai-panel"
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Chat Messages */}
            <ScrollArea className="h-80">
              <div className="space-y-4 pr-4">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col gap-1 ${
                      msg.role === "user" ? "items-end" : "items-start"
                    }`}
                    data-testid={`message-${msg.role === "assistant" ? "bot" : msg.role}-${idx}`}
                  >
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {msg.role === "user" ? "Você" : "Professor"}
                      <span>•</span>
                      <span>{formatDistanceToNow(msg.createdAt, { addSuffix: true, locale: ptBR })}</span>
                    </div>
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-3 ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-base sm:text-lg leading-relaxed whitespace-pre-line">
                        {msg.text}
                      </p>
                      {msg.role === "assistant" && (
                        <div className="flex justify-end mt-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-60 hover:opacity-100"
                                data-testid={`button-share-message-${idx}`}
                              >
                                <Share2 className="w-3 h-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleShareMessage(msg, idx, 'whatsapp')} data-testid={`share-whatsapp-${idx}`}>
                                <MessageCircle className="w-4 h-4 mr-2 text-green-500" />
                                WhatsApp
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleShareMessage(msg, idx, 'email')} data-testid={`share-email-${idx}`}>
                                <Mail className="w-4 h-4 mr-2 text-blue-500" />
                                E-mail
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleShareMessage(msg, idx, 'copy')} data-testid={`share-copy-${idx}`}>
                                <Copy className="w-4 h-4 mr-2" />
                                Copiar texto
                              </DropdownMenuItem>
                              {'share' in navigator && (
                                <DropdownMenuItem onClick={() => handleShareMessage(msg, idx, 'native')} data-testid={`share-native-${idx}`}>
                                  <Share2 className="w-4 h-4 mr-2" />
                                  Mais opções...
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {/* Loading indicator */}
                {askAIMutation.isPending && (
                  <div className="flex items-start gap-2">
                    <div className="bg-muted rounded-lg px-4 py-3">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  </div>
                )}
                
                {/* Elemento invisível para scroll automático */}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="max-w-3xl mx-auto px-4 py-3">
        <div className="flex items-center gap-2">
          {/* History Drawer */}
          <Sheet open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                data-testid="button-open-history"
              >
                <History className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80">
              <SheetHeader>
                <SheetTitle>Histórico de Conversas</SheetTitle>
              </SheetHeader>
              <ScrollArea className="h-[calc(100vh-8rem)] mt-6">
                <div className="space-y-2">
                  {chatSessions.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Nenhuma conversa salva ainda.
                    </p>
                  ) : (
                    <>
                      {/* Current Session */}
                      {messages.length > 0 && (
                        <div className="mb-4">
                          <p className="text-xs text-muted-foreground mb-2 px-2">CONVERSA ATUAL</p>
                          <button
                            onClick={() => {
                              setIsExpanded(true);
                              setIsHistoryOpen(false);
                            }}
                            className="w-full text-left p-3 rounded-lg border-2 border-primary bg-primary/5 hover-elevate active-elevate-2"
                            data-testid={`session-current`}
                          >
                            <h4 className="font-medium text-sm mb-1 line-clamp-2">
                              {messages[0]?.role === "user" 
                                ? generateTitle(messages[0].text)
                                : "Nova Conversa"
                              }
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              {messages.length} {messages.length === 1 ? 'mensagem' : 'mensagens'}
                            </p>
                          </button>
                        </div>
                      )}
                      
                      {/* Saved Sessions */}
                      {chatSessions.length > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-2 px-2">CONVERSAS ANTERIORES</p>
                          {chatSessions
                            .filter(s => s.id !== currentSessionId || messages.length === 0)
                            .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
                            .map((session) => (
                              <button
                                key={session.id}
                                onClick={() => handleLoadSession(session.id)}
                                className="w-full text-left p-3 rounded-lg border bg-card hover-elevate active-elevate-2 mb-2"
                                data-testid={`session-${session.id}`}
                              >
                                <h4 className="font-medium text-sm mb-1 line-clamp-2">
                                  {session.title}
                                </h4>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span>{session.messages.length} mensagens</span>
                                  <span>•</span>
                                  <span>{formatDistanceToNow(session.updatedAt, { addSuffix: true, locale: ptBR })}</span>
                                </div>
                              </button>
                            ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </ScrollArea>
            </SheetContent>
          </Sheet>

          {/* Input Field */}
          <div className="flex-1 flex gap-2">
            <Input
              placeholder={t("professor.placeholder")}
              aria-label={t("professor.placeholder")}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleAsk();
                }
              }}
              className="flex-1 text-base sm:text-lg"
              data-testid="input-ai-question"
            />
            <Button
              onClick={handleAsk}
              disabled={askAIMutation.isPending || subscriptionLoading}
              data-testid="button-ask-ai"
              className="mobile-search-button text-base sm:text-lg"
            >
              {askAIMutation.isPending || subscriptionLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              {askAIMutation.isPending ? 'Pensando...' : subscriptionLoading ? 'Carregando...' : 'Buscar'}
            </Button>
          </div>

          {/* Remaining Free Questions Badge */}
          {!quotaInfo.hasUnlimitedAccess && (
            <Badge 
              variant={quotaInfo.remaining > 0 ? "secondary" : (quotaInfo.isGuest ? "outline" : "destructive")} 
              className="text-xs whitespace-nowrap"
              data-testid="badge-remaining-questions"
            >
              {quotaInfo.remaining > 0 ? (
                <>{quotaInfo.remaining}/{quotaInfo.limit}</>
              ) : quotaInfo.isGuest ? (
                <><LogIn className="h-3 w-3 mr-1" />Login</>
              ) : (
                <><Lock className="h-3 w-3 mr-1" />Limite</>
              )}
            </Badge>
          )}

          {/* Toggle Expand/Collapse */}
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
              data-testid="button-toggle-ai-panel"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </div>
      
      {/* Upgrade Prompt Dialog */}
      <Dialog open={showUpgradePrompt} onOpenChange={setShowUpgradePrompt}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-500" />
              Limite de perguntas atingido
            </DialogTitle>
            <DialogDescription className="pt-2 space-y-3">
              <p>
                Você utilizou suas <strong>5 perguntas gratuitas</strong> para o Professor IA.
              </p>
              <p>
                Para continuar usando a IA ilimitadamente, faça upgrade para um plano <strong>Gold</strong> ou <strong>Premium</strong>.
              </p>
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 mt-4">
            <Button 
              onClick={() => {
                setShowUpgradePrompt(false);
                navigate("/subscription");
              }}
              className="w-full"
              data-testid="button-upgrade-plan"
            >
              <Crown className="w-4 h-4 mr-2" />
              Ver Planos
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowUpgradePrompt(false)}
              data-testid="button-close-upgrade"
            >
              Voltar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Login Prompt Dialog - shows when guest uses all 2 questions */}
      <Dialog open={showLoginPrompt} onOpenChange={setShowLoginPrompt}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LogIn className="w-5 h-5 text-primary" />
              Faça login para continuar
            </DialogTitle>
            <DialogDescription className="pt-2 space-y-3">
              <p>
                Você utilizou suas <strong>2 perguntas gratuitas</strong> como visitante.
              </p>
              <p>
                Faça login ou crie uma conta para ganhar mais <strong>3 perguntas gratuitas</strong>!
              </p>
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 mt-4">
            <Button 
              onClick={() => {
                setShowLoginPrompt(false);
                requireAuth(() => {
                  toast({
                    title: "Login realizado!",
                    description: "Você ganhou mais 3 perguntas gratuitas!",
                  });
                }, "Professor IA");
              }}
              className="w-full"
              data-testid="button-login-continue"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Entrar / Criar Conta
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowLoginPrompt(false)}
              data-testid="button-close-login"
            >
              Voltar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
