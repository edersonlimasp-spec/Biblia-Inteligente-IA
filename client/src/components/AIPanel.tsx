import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, ChevronUp, ChevronDown, MessageSquarePlus, History, Loader2, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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

export function AIPanel() {
  const [question, setQuestion] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const { toast } = useToast();

  // ===================================
  // STATE - Sessões e Mensagens
  // ===================================
  
  const [currentSessionId, setCurrentSessionId] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);

  // ===================================
  // INITIALIZATION - Carregar sessões do localStorage
  // ===================================
  
  useEffect(() => {
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
      
      // Expandir painel se já houver mensagens
      if (sessionToLoad.messages.length > 0) {
        setIsExpanded(true);
      }
    } else {
      // Criar primeira sessão vazia
      const newSessionId = `session-${Date.now()}`;
      setCurrentSessionId(newSessionId);
      setMessages([]);
      setChatSessions([]);
      saveCurrentSessionId(newSessionId);
    }
  }, []);

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
    mutationFn: async (request: AIRequest & { sessionId: string }) => {
      const { sessionId, ...aiRequest } = request;
      const res = await apiRequest('POST', '/api/ai/ask', aiRequest);
      const data = await res.json() as AIResponse;
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
      const needsSubscription = error?.status === 403;
      
      toast({
        title: needsSubscription ? "Assinatura Necessária" : "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleAsk = () => {
    if (!question.trim()) return;
    
    // APPEND pergunta do usuário (NÃO substituir)
    const userMessage: ChatMessage = {
      role: "user",
      text: question.trim(),
      createdAt: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);

    // Fazer pergunta à API, capturando sessionId atual para prevenir race conditions
    askAIMutation.mutate({
      question: question.trim(),
      mode: 'essential',
      sessionId: currentSessionId, // CRITICAL: Track which session this response belongs to
    });
  };

  // ===================================
  // RENDER
  // ===================================

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t shadow-lg">
      {/* Expanded Chat Area */}
      {isExpanded && messages.length > 0 && (
        <div className="border-b bg-background">
          <div className="max-w-3xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <span className="font-semibold text-primary">Professor</span>
                <Badge variant="outline" className="text-xs">
                  {messages.length} {messages.length === 1 ? 'mensagem' : 'mensagens'}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNewConversation}
                  data-testid="button-new-conversation"
                >
                  <MessageSquarePlus className="h-4 w-4 mr-2" />
                  Nova Conversa
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
                      <p className="text-sm leading-relaxed whitespace-pre-line">
                        {msg.text}
                      </p>
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
              placeholder="Pergunte ao Professor..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleAsk();
                }
              }}
              className="flex-1"
              data-testid="input-ai-question"
            />
            <Button
              onClick={handleAsk}
              disabled={!question.trim() || askAIMutation.isPending}
              data-testid="button-ask-ai"
            >
              {askAIMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              {askAIMutation.isPending ? 'Pensando...' : 'Perguntar'}
            </Button>
          </div>

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
    </div>
  );
}
