import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getDeviceId } from "@/hooks/use-device-id";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { LoginPromptModal } from "@/components/LoginPromptModal";
import { 
  ArrowLeft, 
  Send,
  Loader2,
  GraduationCap,
  User,
  Trash2,
  Plus,
  LogIn,
  Share2,
  Copy,
  Mail,
  MessageCircle
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion } from "framer-motion";

interface ProfessorScreenProps {
  onBack: () => void;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export function ProfessorScreen({ onBack }: ProfessorScreenProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const deviceId = getDeviceId();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [pendingQuestion, setPendingQuestion] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem('professor_chat_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        setMessages(parsed.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        })));
      }
    } catch (e) {
      console.warn('Failed to load chat history');
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('professor_chat_history', JSON.stringify(messages));
    } catch (e) {
      console.warn('Failed to save chat history');
    }
  }, [messages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const askMutation = useMutation({
    mutationFn: async (question: string) => {
      const res = await apiRequest("POST", "/api/ai/ask", {
        question,
        mode: "professor",
        deviceId,
      });
      return res.json();
    },
    onSuccess: (data) => {
      const response = data.response || data.answer || "Desculpe, não consegui gerar uma resposta.";
      setMessages(prev => [...prev, {
        role: "assistant",
        content: response,
        timestamp: new Date()
      }]);
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível obter resposta",
        variant: "destructive",
      });
      setMessages(prev => prev.slice(0, -1));
    },
  });

  const handleSubmit = () => {
    if (!input.trim() || askMutation.isPending) return;
    
    if (!user) {
      setPendingQuestion(input.trim());
      setShowLoginPrompt(true);
      return;
    }
    
    const userMessage: Message = {
      role: "user",
      content: input.trim(),
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    askMutation.mutate(input.trim());
  };
  
  const handleAuthSuccess = () => {
    setShowLoginPrompt(false);
    if (pendingQuestion) {
      const userMessage: Message = {
        role: "user",
        content: pendingQuestion,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMessage]);
      setInput("");
      const questionToSend = pendingQuestion;
      setPendingQuestion("");
      askMutation.mutate(questionToSend);
    }
  };

  const handleNewConversation = () => {
    setMessages([]);
    try {
      localStorage.removeItem('professor_chat_history');
    } catch (e) {}
    toast({
      title: "Nova conversa",
      description: "Histórico limpo. Comece uma nova conversa!",
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const getShareText = (assistantMessage: Message, index: number) => {
    const userMessage = messages[index - 1];
    const question = userMessage?.role === 'user' ? userMessage.content : '';
    return `Pergunta: ${question}

Resposta do Professor IA: ${assistantMessage.content}

---
Enviado por Bíblia Inteligente IA
Conheça: https://bibliainteligente.replit.app`;
  };

  const handleShare = async (message: Message, index: number, method: 'whatsapp' | 'email' | 'copy' | 'native') => {
    const shareText = getShareText(message, index);
    
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} data-testid="button-back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Professor IA</h1>
              <p className="text-xs text-muted-foreground">Chat teológico contínuo</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleNewConversation}
            data-testid="button-new-conversation"
          >
            <Plus className="w-4 h-4 mr-1" />
            Nova
          </Button>
        </div>
      </header>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="max-w-3xl mx-auto space-y-4 pb-4">
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
                <GraduationCap className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Olá! Sou o Professor IA</h2>
              <p className="text-muted-foreground max-w-sm mx-auto">
                Pergunte-me sobre qualquer passagem bíblica, teologia, história ou interpretação. 
                Estou aqui para ajudar em seus estudos!
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {[
                  "O que significa João 3:16?",
                  "Explique as parábolas de Jesus",
                  "Quem foi o apóstolo Paulo?",
                ].map((suggestion, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    onClick={() => setInput(suggestion)}
                    className="text-xs"
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </motion.div>
          )}

          {messages.map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <GraduationCap className="w-4 h-4 text-white" />
                </div>
              )}
              <div 
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === 'user' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <div className="flex items-center justify-between mt-1 gap-2">
                  <span className="text-[10px] opacity-60">
                    {message.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {message.role === 'assistant' && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-60 hover:opacity-100"
                          data-testid={`button-share-message-${index}`}
                        >
                          <Share2 className="w-3 h-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleShare(message, index, 'whatsapp')} data-testid="share-whatsapp">
                          <MessageCircle className="w-4 h-4 mr-2 text-green-500" />
                          WhatsApp
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleShare(message, index, 'email')} data-testid="share-email">
                          <Mail className="w-4 h-4 mr-2 text-blue-500" />
                          E-mail
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleShare(message, index, 'copy')} data-testid="share-copy">
                          <Copy className="w-4 h-4 mr-2" />
                          Copiar texto
                        </DropdownMenuItem>
                        {'share' in navigator && (
                          <DropdownMenuItem onClick={() => handleShare(message, index, 'native')} data-testid="share-native">
                            <Share2 className="w-4 h-4 mr-2" />
                            Mais opções...
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-primary" />
                </div>
              )}
            </motion.div>
          ))}

          {askMutation.isPending && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-3"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-white" />
              </div>
              <div className="bg-muted rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Pensando...
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </ScrollArea>

      <div className="border-t bg-background p-4">
        <div className="max-w-3xl mx-auto flex gap-3">
          <Textarea
            placeholder="Digite sua pergunta..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            rows={1}
            className="resize-none min-h-[44px] max-h-[120px]"
            data-testid="input-message"
          />
          <Button 
            onClick={handleSubmit}
            disabled={!input.trim() || askMutation.isPending}
            size="icon"
            className="h-[44px] w-[44px]"
            data-testid="button-send"
          >
            {askMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>
      
      <LoginPromptModal
        open={showLoginPrompt}
        onOpenChange={setShowLoginPrompt}
        featureName="o Professor IA"
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}
