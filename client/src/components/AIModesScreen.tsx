import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { getDeviceId } from "@/hooks/use-device-id";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
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
  User,
  Plus,
  Share2,
  Copy,
  Mail,
  MessageCircle,
  Image as ImageIcon,
  X,
  Download,
  Crown,
  ChevronDown
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";

interface AIModesScreenProps {
  onBack: () => void;
  onNavigateToSubscriptions: () => void;
}

interface MessageAttachment {
  type: 'image';
  url: string;
  mimeType: string;
  base64?: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  mode: string;
  attachment?: MessageAttachment;
  imageUrl?: string;
}

export function AIModesScreen({ onBack, onNavigateToSubscriptions }: AIModesScreenProps) {
  const { user, isAdmin } = useAuth();
  const { language, t } = useLanguage();
  const { toast } = useToast();
  const deviceId = getDeviceId();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [pendingImage, setPendingImage] = useState<{
    url: string;
    base64: string;
    mimeType: string;
  } | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [pendingQuestion, setPendingQuestion] = useState("");
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
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
  const [selectedMode, setSelectedMode] = useState(AI_MODES[0]);

  const { data: subStatus } = useQuery<{ hasPremium: boolean; hasGold: boolean; hasLifetime: boolean; trialActive: boolean }>({
    queryKey: ['/api/user/subscription-status'],
    enabled: !!user,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const { data: guestTrialInfo } = useQuery<{ active: boolean; daysRemaining: number }>({
    queryKey: ['/api/guest/trial', deviceId],
    enabled: !user && !!deviceId,
  });

  const hasPremium = isAdmin || subStatus?.hasPremium || subStatus?.hasLifetime || false;
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

  // Load chat history
  useEffect(() => {
    try {
      const saved = localStorage.getItem('ai_modes_chat_history_v2');
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

  // Save chat history
  useEffect(() => {
    try {
      const toSave = messages.map(m => ({
        ...m,
        attachment: m.attachment ? { type: m.attachment.type, url: m.attachment.url, mimeType: m.attachment.mimeType } : undefined
      }));
      localStorage.setItem('ai_modes_chat_history_v2', JSON.stringify(toSave));
    } catch (e) {
      console.warn('Failed to save chat history');
    }
  }, [messages]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const askMutation = useMutation({
    mutationFn: async ({ mode, text }: { mode: string; text: string }) => {
      const modeConfig = AI_MODES.find(m => m.id === mode);
      const res = await apiRequest("POST", "/api/ai/ask", {
        question: `${modeConfig?.prompt} ${text}`,
        mode: mode,
        deviceId,
        language,
      });
      return res.json();
    },
    onSuccess: (data) => {
      const response = data.response || data.answer || t("aiModes.responseReceived");
      setMessages(prev => [...prev, {
        role: "assistant",
        content: response,
        timestamp: new Date(),
        mode: selectedMode.id
      }]);
    },
    onError: (error: any) => {
      toast({
        title: t("common.error"),
        description: error.message || t("aiModes.errorGettingResponse"),
        variant: "destructive",
      });
      setMessages(prev => prev.slice(0, -1));
    },
  });

  const analyzeImageMutation = useMutation({
    mutationFn: async ({ imageBase64, mimeType, question }: { imageBase64: string; mimeType: string; question: string }) => {
      const res = await apiRequest("POST", "/api/ai/analyze-image", {
        imageBase64,
        mimeType,
        question: `${selectedMode.prompt} ${question}`,
        language,
      });
      return res.json();
    },
    onSuccess: (data) => {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: data.analysis,
        timestamp: new Date(),
        mode: selectedMode.id
      }]);
    },
    onError: (error: any) => {
      toast({
        title: t("common.error"),
        description: error.message || "Erro ao analisar imagem",
        variant: "destructive",
      });
      setMessages(prev => prev.slice(0, -1));
    },
  });

  const generateImageMutation = useMutation({
    mutationFn: async (prompt: string) => {
      const res = await apiRequest("POST", "/api/ai/generate-image", {
        prompt,
        language,
      });
      return res.json();
    },
    onSuccess: (data) => {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Imagem gerada com sucesso!",
        timestamp: new Date(),
        mode: selectedMode.id,
        imageUrl: data.imageUrl,
      }]);
    },
    onError: (error: any) => {
      toast({
        title: t("common.error"),
        description: error.message || "Erro ao gerar imagem",
        variant: "destructive",
      });
      setMessages(prev => prev.slice(0, -1));
    },
  });

  const isImageCommand = (text: string): boolean => {
    const patterns = [
      /gerar?\s+imagem/i,
      /criar?\s+imagem/i,
      /fazer?\s+imagem/i,
      /crie?\s+uma?\s+imagem/i,
      /gere?\s+uma?\s+imagem/i,
      /desenhar?/i,
      /ilustrar?/i,
      /mapa\s+d[aeo]/i,
      /generate\s+image/i,
      /create\s+image/i,
      /draw\s+/i,
    ];
    return patterns.some(p => p.test(text));
  };

  const extractImagePrompt = (text: string): string => {
    return text
      .replace(/gerar?\s+imagem\s*(de|do|da|dos|das)?/gi, '')
      .replace(/criar?\s+imagem\s*(de|do|da|dos|das)?/gi, '')
      .replace(/fazer?\s+imagem\s*(de|do|da|dos|das)?/gi, '')
      .replace(/crie?\s+uma?\s+imagem\s*(de|do|da|dos|das)?/gi, '')
      .replace(/gere?\s+uma?\s+imagem\s*(de|do|da|dos|das)?/gi, '')
      .replace(/desenh[ae]r?\s*/gi, '')
      .replace(/ilustr[ae]r?\s*/gi, '')
      .replace(/generate\s+image\s*(of)?/gi, '')
      .replace(/create\s+image\s*(of)?/gi, '')
      .replace(/draw\s+/gi, '')
      .trim();
  };

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: t("common.error"),
        description: "Por favor, selecione uma imagem válida",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: t("common.error"),
        description: "A imagem deve ter no máximo 10MB",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      setPendingImage({
        url: URL.createObjectURL(file),
        base64,
        mimeType: file.type,
      });
    };
    reader.readAsDataURL(file);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [toast, t]);

  const handleSubmit = useCallback(() => {
    const trimmedInput = input.trim();
    if (!trimmedInput && !pendingImage) return;

    if (!user) {
      setPendingQuestion(trimmedInput);
      setShowLoginPrompt(true);
      return;
    }

    if (!canAccessMode(selectedMode)) {
      toast({
        title: selectedMode.requiredPlan === "premium" ? "Modo Premium" : "Modo Gold+",
        description: selectedMode.requiredPlan === "premium" 
          ? "Este modo requer assinatura Premium" 
          : "Este modo requer assinatura Gold ou Premium",
      });
      return;
    }

    // Add user message
    const userMessage: Message = {
      role: "user",
      content: trimmedInput || "Analise esta imagem",
      timestamp: new Date(),
      mode: selectedMode.id,
      attachment: pendingImage ? {
        type: 'image',
        url: pendingImage.url,
        mimeType: pendingImage.mimeType,
        base64: pendingImage.base64,
      } : undefined
    };
    setMessages(prev => [...prev, userMessage]);
    setInput("");

    // Handle image analysis
    if (pendingImage) {
      if (!hasPremium) {
        toast({
          title: "Recurso Premium",
          description: "Análise de imagens requer assinatura Premium",
          variant: "destructive",
        });
        setMessages(prev => prev.slice(0, -1));
        return;
      }
      
      analyzeImageMutation.mutate({
        imageBase64: pendingImage.base64,
        mimeType: pendingImage.mimeType,
        question: trimmedInput || "Analise esta imagem de forma detalhada"
      });
      setPendingImage(null);
      return;
    }

    // Handle image generation command
    if (isImageCommand(trimmedInput)) {
      if (!hasPremium) {
        toast({
          title: "Recurso Premium",
          description: "Geração de imagens requer assinatura Premium",
          variant: "destructive",
        });
        setMessages(prev => prev.slice(0, -1));
        return;
      }
      
      const imagePrompt = extractImagePrompt(trimmedInput);
      generateImageMutation.mutate(imagePrompt || trimmedInput);
      return;
    }

    // Regular question
    askMutation.mutate({ mode: selectedMode.id, text: trimmedInput });
  }, [input, pendingImage, user, selectedMode, hasPremium, askMutation, analyzeImageMutation, generateImageMutation, toast, canAccessMode]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleNewConversation = () => {
    setMessages([]);
    setInput("");
    setPendingImage(null);
    localStorage.removeItem('ai_modes_chat_history_v2');
  };

  const handleAuthSuccess = () => {
    setShowLoginPrompt(false);
    if (pendingQuestion) {
      setTimeout(() => {
        setInput(pendingQuestion);
        setPendingQuestion("");
      }, 100);
    }
  };

  const getShareText = (message: Message, index: number) => {
    const prevMessage = index > 0 ? messages[index - 1] : null;
    const question = prevMessage?.role === 'user' ? prevMessage.content : '';
    const mode = AI_MODES.find(m => m.id === message.mode);
    
    return `📖 ${mode?.name || 'Professor IA'}

❓ ${question}

💡 ${message.content}

---
${t("professor.sentBy")}
https://bibliainteligente.replit.app`;
  };

  const handleShare = async (message: Message, index: number, method: 'whatsapp' | 'email' | 'copy' | 'native') => {
    const shareText = getShareText(message, index);
    
    switch (method) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
        break;
      case 'email':
        window.open(`mailto:?subject=${encodeURIComponent(t("professor.emailSubject"))}&body=${encodeURIComponent(shareText)}`, '_blank');
        break;
      case 'copy':
        try {
          await navigator.clipboard.writeText(shareText);
          toast({
            title: t("common.copied"),
            description: t("professor.copiedToClipboard"),
          });
        } catch {
          toast({
            title: t("common.error"),
            description: t("professor.copyError"),
            variant: "destructive",
          });
        }
        break;
      case 'native':
        if (navigator.share) {
          try {
            await navigator.share({
              title: t("professor.answer"),
              text: shareText,
            });
          } catch (err) {
            if ((err as Error).name !== 'AbortError') {
              toast({
                title: t("common.error"),
                description: t("professor.shareError"),
                variant: "destructive",
              });
            }
          }
        }
        break;
    }
  };

  const isPending = askMutation.isPending || analyzeImageMutation.isPending || generateImageMutation.isPending;
  const SelectedIcon = selectedMode.icon;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} data-testid="button-back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3 flex-1">
            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${selectedMode.color} flex items-center justify-center`}>
              <SelectedIcon className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 hover:opacity-80 transition-opacity" data-testid="button-mode-selector">
                    <h1 className="text-lg font-bold flex items-center gap-2">
                      {selectedMode.name}
                      {hasPremium && (
                        <Badge variant="default" className="bg-amber-600 text-xs">
                          <Crown className="w-3 h-3 mr-1" />
                          Premium
                        </Badge>
                      )}
                    </h1>
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64">
                  {AI_MODES.map((mode) => {
                    const ModeIcon = mode.icon;
                    const isLocked = !canAccessMode(mode);
                    return (
                      <DropdownMenuItem 
                        key={mode.id}
                        onClick={() => !isLocked && setSelectedMode(mode)}
                        className={isLocked ? "opacity-50" : ""}
                        data-testid={`mode-option-${mode.id}`}
                      >
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${mode.color} flex items-center justify-center mr-3`}>
                          <ModeIcon className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium flex items-center gap-2">
                            {mode.name}
                            {isLocked && <Lock className="w-3 h-3" />}
                          </div>
                          <p className="text-xs text-muted-foreground">{mode.description}</p>
                        </div>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
              <p className="text-xs text-muted-foreground">{selectedMode.description}</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleNewConversation}
            data-testid="button-new-conversation"
          >
            <Plus className="w-4 h-4 mr-1" />
            {t("common.new")}
          </Button>
          <UserButton onNavigateToSubscriptions={onNavigateToSubscriptions} showSubscriptionOption />
        </div>
      </header>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="max-w-4xl mx-auto space-y-4 pb-4">
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${selectedMode.color} flex items-center justify-center mx-auto mb-4`}>
                <SelectedIcon className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-xl font-semibold mb-2">{selectedMode.name}</h2>
              <p className="text-muted-foreground max-w-sm mx-auto mb-6">
                {selectedMode.description}
              </p>
              
              <div className="flex flex-wrap justify-center gap-2 mb-4">
                {[
                  t("professor.suggestedQuestions.1"),
                  t("professor.suggestedQuestions.2"),
                  t("professor.suggestedQuestions.3"),
                ].map((suggestion, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    onClick={() => setInput(suggestion)}
                    className="text-xs"
                    data-testid={`suggestion-${i}`}
                  >
                    <Sparkles className="w-3 h-3 mr-1.5 text-primary" />
                    {suggestion}
                  </Button>
                ))}
              </div>

              {hasPremium && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs text-muted-foreground mb-3">
                    Recursos Premium disponíveis
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setInput("Gerar imagem de Jerusalém antiga")}
                      className="text-xs"
                      data-testid="premium-suggestion-image"
                    >
                      <ImageIcon className="w-3 h-3 mr-1.5 text-amber-500" />
                      Gerar imagem bíblica
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs"
                      data-testid="premium-suggestion-analyze"
                    >
                      <ImageIcon className="w-3 h-3 mr-1.5 text-green-500" />
                      Analisar imagem
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {messages.map((message, index) => {
            const ModeIcon = AI_MODES.find(m => m.id === message.mode)?.icon || GraduationCap;
            const modeColor = AI_MODES.find(m => m.id === message.mode)?.color || "from-blue-500 to-blue-700";
            
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${modeColor} flex items-center justify-center flex-shrink-0`}>
                    <ModeIcon className="w-4 h-4 text-white" />
                  </div>
                )}
                <div 
                  className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    message.role === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted'
                  }`}
                >
                  {message.attachment?.type === 'image' && (
                    <div className="mb-2">
                      <img 
                        src={message.attachment.url} 
                        alt="Uploaded" 
                        className="max-w-full max-h-64 rounded-lg object-contain"
                      />
                    </div>
                  )}
                  {message.imageUrl && (
                    <div className="mb-2 relative group">
                      <img 
                        src={message.imageUrl} 
                        alt="Generated"
                        className="w-full max-w-md rounded-lg shadow-lg"
                      />
                      <a
                        href={message.imageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                        className="absolute top-2 right-2 p-2 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Download className="w-4 h-4 text-white" />
                      </a>
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <div className="flex items-center justify-between mt-1 gap-2">
                    <span className="text-[10px] opacity-60">
                      {message.timestamp.toLocaleTimeString(language === 'en' ? 'en-US' : language === 'es' ? 'es-ES' : 'pt-BR', { hour: '2-digit', minute: '2-digit' })}
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
                            {t("common.copy")}
                          </DropdownMenuItem>
                          {'share' in navigator && (
                            <DropdownMenuItem onClick={() => handleShare(message, index, 'native')} data-testid="share-native">
                              <Share2 className="w-4 h-4 mr-2" />
                              {t("common.share")}...
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
            );
          })}

          {isPending && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-3"
            >
              <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${selectedMode.color} flex items-center justify-center`}>
                <SelectedIcon className="w-4 h-4 text-white" />
              </div>
              <div className="bg-muted rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {generateImageMutation.isPending ? "Gerando imagem..." : 
                   analyzeImageMutation.isPending ? "Analisando imagem..." : 
                   t("professor.thinking")}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </ScrollArea>

      <div className="border-t bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <AnimatePresence>
            {pendingImage && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-3"
              >
                <div className="relative inline-block">
                  <img 
                    src={pendingImage.url} 
                    alt="Preview" 
                    className="h-20 rounded-lg object-cover border"
                  />
                  <button
                    onClick={() => setPendingImage(null)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
                    data-testid="button-remove-image"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-2 items-end">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              data-testid="input-file"
            />
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={isPending}
              className="h-[44px] w-[44px] shrink-0"
              data-testid="button-attach-image"
              title={hasPremium ? "Anexar imagem para análise" : "Recurso Premium"}
            >
              <ImageIcon className={`w-5 h-5 ${hasPremium ? '' : 'opacity-50'}`} />
            </Button>

            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                placeholder={pendingImage ? "Faça uma pergunta sobre a imagem..." : t("professor.placeholder")}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                rows={1}
                className="resize-none min-h-[44px] max-h-[200px] pr-12"
                data-testid="input-message"
              />
            </div>

            <Button 
              onClick={handleSubmit}
              disabled={(!input.trim() && !pendingImage) || isPending}
              size="icon"
              className="h-[44px] w-[44px] shrink-0"
              data-testid="button-send"
            >
              {isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>

          {!hasPremium && (
            <p className="text-xs text-muted-foreground text-center mt-2">
              <Crown className="w-3 h-3 inline mr-1 text-amber-500" />
              Assine Premium para gerar e analisar imagens
            </p>
          )}
        </div>
      </div>
      
      <LoginPromptModal
        open={showLoginPrompt}
        onOpenChange={setShowLoginPrompt}
        featureName={t("aiModes.featureName")}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}
