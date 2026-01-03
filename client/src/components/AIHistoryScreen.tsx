import { useState, useMemo, useEffect, useCallback } from "react";
import { Calendar, MessageSquare, Search, ArrowLeft, Download, FileText, Trash2, Filter, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserButton } from "@/components/UserButton";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { format, isToday, isYesterday, isThisWeek, isThisMonth, parseISO, startOfDay, endOfDay, subDays } from "date-fns";
import { ptBR, enUS, es } from "date-fns/locale";

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

const STORAGE_KEY = "bible-ai-chat-sessions";

function loadSessions(): ChatSession[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const parsed = JSON.parse(stored);
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

function saveSessions(sessions: ChatSession[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch (error) {
    console.error("Erro ao salvar sessões:", error);
  }
}

type DateFilter = "all" | "today" | "yesterday" | "week" | "month";

interface AIHistoryScreenProps {
  onBack?: () => void;
}

export function AIHistoryScreen({ onBack }: AIHistoryScreenProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [sessions, setSessions] = useState<ChatSession[]>(() => loadSessions());
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());

  const refreshSessions = useCallback(() => {
    setSessions(loadSessions());
  }, []);

  useEffect(() => {
    refreshSessions();
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshSessions();
      }
    };
    
    const handleFocus = () => {
      refreshSessions();
    };
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        refreshSessions();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [refreshSessions]);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const { language, t } = useLanguage();
  const { toast } = useToast();

  const getDateLocale = () => {
    switch (language) {
      case "pt": return ptBR;
      case "es": return es;
      default: return enUS;
    }
  };

  const dateFilterLabels: Record<DateFilter, Record<string, string>> = {
    all: { pt: "Todas", en: "All", es: "Todas" },
    today: { pt: "Hoje", en: "Today", es: "Hoy" },
    yesterday: { pt: "Ontem", en: "Yesterday", es: "Ayer" },
    week: { pt: "Esta semana", en: "This week", es: "Esta semana" },
    month: { pt: "Este mês", en: "This month", es: "Este mes" },
  };

  const filteredSessions = useMemo(() => {
    let result = [...sessions];
    
    if (dateFilter !== "all") {
      const now = new Date();
      result = result.filter(session => {
        const sessionDate = new Date(session.updatedAt);
        switch (dateFilter) {
          case "today": return isToday(sessionDate);
          case "yesterday": return isYesterday(sessionDate);
          case "week": return isThisWeek(sessionDate, { locale: getDateLocale() });
          case "month": return isThisMonth(sessionDate);
          default: return true;
        }
      });
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(session => {
        const titleMatch = session.title.toLowerCase().includes(query);
        const messageMatch = session.messages.some(msg => 
          msg.text.toLowerCase().includes(query)
        );
        return titleMatch || messageMatch;
      });
    }
    
    return result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [sessions, searchQuery, dateFilter]);

  const toggleSession = (sessionId: string) => {
    setExpandedSessions(prev => {
      const next = new Set(prev);
      if (next.has(sessionId)) {
        next.delete(sessionId);
      } else {
        next.add(sessionId);
      }
      return next;
    });
  };

  const deleteSession = (sessionId: string) => {
    const updated = sessions.filter(s => s.id !== sessionId);
    setSessions(updated);
    saveSessions(updated);
    setSessionToDelete(null);
    toast({
      title: language === "pt" ? "Conversa excluída" : language === "es" ? "Conversación eliminada" : "Conversation deleted",
      description: language === "pt" ? "A conversa foi removida do histórico" : language === "es" ? "La conversación fue eliminada del historial" : "The conversation was removed from history",
    });
  };

  const clearAllHistory = () => {
    setSessions([]);
    saveSessions([]);
    setShowClearDialog(false);
    toast({
      title: language === "pt" ? "Histórico limpo" : language === "es" ? "Historial limpio" : "History cleared",
      description: language === "pt" ? "Todas as conversas foram removidas" : language === "es" ? "Todas las conversaciones fueron eliminadas" : "All conversations were removed",
    });
  };

  const formatSessionDate = (date: Date) => {
    const locale = getDateLocale();
    if (isToday(date)) {
      return language === "pt" ? "Hoje" : language === "es" ? "Hoy" : "Today";
    }
    if (isYesterday(date)) {
      return language === "pt" ? "Ontem" : language === "es" ? "Ayer" : "Yesterday";
    }
    return format(date, "d 'de' MMMM", { locale });
  };

  const exportToText = (session: ChatSession) => {
    let content = `${session.title}\n`;
    content += `${"=".repeat(50)}\n`;
    content += `${language === "pt" ? "Data" : language === "es" ? "Fecha" : "Date"}: ${format(session.createdAt, "PPPp", { locale: getDateLocale() })}\n\n`;
    
    session.messages.forEach((msg, index) => {
      const label = msg.role === "user" 
        ? (language === "pt" ? "Você" : language === "es" ? "Tú" : "You")
        : (language === "pt" ? "Professor IA" : language === "es" ? "Profesor IA" : "AI Professor");
      content += `${label}:\n${msg.text}\n\n`;
    });
    
    content += `\n${"─".repeat(50)}\n`;
    content += language === "pt" ? "Exportado de Bíblia Inteligente IA" : language === "es" ? "Exportado de Biblia Inteligente IA" : "Exported from Intelligent Bible AI";
    
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${session.title.replace(/[^a-zA-Z0-9]/g, "_")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: language === "pt" ? "Exportado!" : language === "es" ? "¡Exportado!" : "Exported!",
      description: language === "pt" ? "Arquivo de texto baixado" : language === "es" ? "Archivo de texto descargado" : "Text file downloaded",
    });
  };

  const exportToPDF = (session: ChatSession) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast({
        title: language === "pt" ? "Erro" : "Error",
        description: language === "pt" ? "Pop-up bloqueado. Permita pop-ups para exportar PDF." : language === "es" ? "Pop-up bloqueado. Permita pop-ups para exportar PDF." : "Pop-up blocked. Allow pop-ups to export PDF.",
        variant: "destructive",
      });
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${session.title}</title>
        <style>
          body {
            font-family: Georgia, serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 20px;
            color: #1a1a1a;
            line-height: 1.6;
          }
          h1 {
            font-size: 24px;
            margin-bottom: 8px;
            color: #1A5299;
          }
          .date {
            color: #666;
            font-size: 14px;
            margin-bottom: 30px;
          }
          .message {
            margin-bottom: 24px;
            padding: 16px;
            border-radius: 8px;
          }
          .user {
            background: #f0f7ff;
            border-left: 4px solid #1A5299;
          }
          .assistant {
            background: #f9f9f9;
            border-left: 4px solid #666;
          }
          .label {
            font-weight: bold;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
            color: #666;
          }
          .text {
            white-space: pre-wrap;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            text-align: center;
            font-size: 12px;
            color: #999;
          }
          @media print {
            body { padding: 20px; }
            .message { break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <h1>${session.title}</h1>
        <div class="date">${format(session.createdAt, "PPPp", { locale: getDateLocale() })}</div>
        
        ${session.messages.map(msg => `
          <div class="message ${msg.role}">
            <div class="label">${msg.role === "user" 
              ? (language === "pt" ? "Você" : language === "es" ? "Tú" : "You")
              : (language === "pt" ? "Professor IA" : language === "es" ? "Profesor IA" : "AI Professor")
            }</div>
            <div class="text">${msg.text.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
          </div>
        `).join("")}
        
        <div class="footer">
          ${language === "pt" ? "Exportado de Bíblia Inteligente IA" : language === "es" ? "Exportado de Biblia Inteligente IA" : "Exported from Intelligent Bible AI"}
        </div>
      </body>
      </html>
    `;
    
    printWindow.document.write(html);
    printWindow.document.close();
    
    setTimeout(() => {
      printWindow.print();
    }, 500);
    
    toast({
      title: language === "pt" ? "PDF pronto!" : language === "es" ? "¡PDF listo!" : "PDF ready!",
      description: language === "pt" ? "Use Ctrl+P para salvar como PDF" : language === "es" ? "Use Ctrl+P para guardar como PDF" : "Use Ctrl+P to save as PDF",
    });
  };

  const labels = {
    title: { pt: "Histórico de Conversas", en: "Conversation History", es: "Historial de Conversaciones" },
    subtitle: { pt: "Suas conversas com o Professor IA", en: "Your conversations with AI Professor", es: "Tus conversaciones con el Profesor IA" },
    searchPlaceholder: { pt: "Buscar nas conversas...", en: "Search conversations...", es: "Buscar en conversaciones..." },
    conversations: { pt: "conversas", en: "conversations", es: "conversaciones" },
    clearHistory: { pt: "Limpar Histórico", en: "Clear History", es: "Limpiar Historial" },
    noConversations: { pt: "Nenhuma conversa encontrada", en: "No conversations found", es: "No se encontraron conversaciones" },
    startChatting: { pt: "Comece a conversar com o Professor IA para ver seu histórico aqui", en: "Start chatting with the AI Professor to see your history here", es: "Comienza a chatear con el Profesor IA para ver tu historial aquí" },
    messages: { pt: "mensagens", en: "messages", es: "mensajes" },
    exportPDF: { pt: "Exportar PDF", en: "Export PDF", es: "Exportar PDF" },
    exportText: { pt: "Exportar Texto", en: "Export Text", es: "Exportar Texto" },
    delete: { pt: "Excluir", en: "Delete", es: "Eliminar" },
    confirmClearTitle: { pt: "Limpar todo o histórico?", en: "Clear all history?", es: "¿Limpiar todo el historial?" },
    confirmClearDesc: { pt: "Esta ação não pode ser desfeita. Todas as conversas serão removidas permanentemente.", en: "This action cannot be undone. All conversations will be permanently removed.", es: "Esta acción no se puede deshacer. Todas las conversaciones serán eliminadas permanentemente." },
    confirmDeleteTitle: { pt: "Excluir conversa?", en: "Delete conversation?", es: "¿Eliminar conversación?" },
    confirmDeleteDesc: { pt: "Esta conversa será removida permanentemente.", en: "This conversation will be permanently removed.", es: "Esta conversación será eliminada permanentemente." },
    cancel: { pt: "Cancelar", en: "Cancel", es: "Cancelar" },
    confirm: { pt: "Confirmar", en: "Confirm", es: "Confirmar" },
    filter: { pt: "Filtrar", en: "Filter", es: "Filtrar" },
    you: { pt: "Você", en: "You", es: "Tú" },
    professor: { pt: "Professor IA", en: "AI Professor", es: "Profesor IA" },
  };

  const getLabel = (key: keyof typeof labels) => labels[key][language] || labels[key].en;

  return (
    <div className="min-h-screen bg-background dark:bg-background text-foreground dark:text-foreground">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} data-testid="button-back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">{getLabel("title")}</h1>
            <p className="text-sm text-muted-foreground">{getLabel("subtitle")}</p>
          </div>
          <UserButton />
        </div>
      </header>

      <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={getLabel("searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-history"
            />
          </div>
          
          <Select value={dateFilter} onValueChange={(value) => setDateFilter(value as DateFilter)}>
            <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-date-filter">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(dateFilterLabels) as DateFilter[]).map((key) => (
                <SelectItem key={key} value={key}>
                  {dateFilterLabels[key][language] || dateFilterLabels[key].en}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            {filteredSessions.length} {getLabel("conversations")}
          </p>
          {sessions.length > 0 && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowClearDialog(true)}
              data-testid="button-clear-history"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {getLabel("clearHistory")}
            </Button>
          )}
        </div>

        {filteredSessions.length === 0 ? (
          <Card className="p-8">
            <div className="text-center space-y-3">
              <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground opacity-50" />
              <h3 className="font-medium">{getLabel("noConversations")}</h3>
              <p className="text-sm text-muted-foreground">{getLabel("startChatting")}</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredSessions.map((session) => (
              <Card key={session.id} className="overflow-hidden">
                <div 
                  className="p-4 cursor-pointer hover-elevate"
                  onClick={() => toggleSession(session.id)}
                  data-testid={`history-session-${session.id}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                      <MessageSquare className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-medium text-sm truncate">{session.title}</h3>
                        <Badge variant="secondary" className="text-xs flex-shrink-0">
                          {session.messages.length} {getLabel("messages")}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {formatSessionDate(session.updatedAt)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8" data-testid={`button-export-${session.id}`}>
                            <Download className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => exportToPDF(session)} data-testid="menu-export-pdf">
                            <FileText className="w-4 h-4 mr-2" />
                            {getLabel("exportPDF")}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => exportToText(session)} data-testid="menu-export-text">
                            <FileText className="w-4 h-4 mr-2" />
                            {getLabel("exportText")}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => setSessionToDelete(session.id)}
                            className="text-destructive"
                            data-testid="menu-delete-session"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            {getLabel("delete")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      {expandedSessions.has(session.id) ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </div>
                
                {expandedSessions.has(session.id) && (
                  <div className="border-t bg-muted/30">
                    <ScrollArea className="max-h-96">
                      <div className="p-4 space-y-4">
                        {session.messages.map((msg, idx) => (
                          <div 
                            key={idx} 
                            className={`p-3 rounded-lg ${
                              msg.role === "user" 
                                ? "bg-primary/10 ml-4" 
                                : "bg-background mr-4 border"
                            }`}
                          >
                            <div className="text-xs font-medium text-muted-foreground mb-1">
                              {msg.role === "user" ? getLabel("you") : getLabel("professor")}
                            </div>
                            <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{getLabel("confirmClearTitle")}</DialogTitle>
            <DialogDescription>{getLabel("confirmClearDesc")}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowClearDialog(false)} data-testid="button-cancel-clear">
              {getLabel("cancel")}
            </Button>
            <Button variant="destructive" onClick={clearAllHistory} data-testid="button-confirm-clear">
              {getLabel("confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!sessionToDelete} onOpenChange={() => setSessionToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{getLabel("confirmDeleteTitle")}</DialogTitle>
            <DialogDescription>{getLabel("confirmDeleteDesc")}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSessionToDelete(null)} data-testid="button-cancel-delete">
              {getLabel("cancel")}
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => sessionToDelete && deleteSession(sessionToDelete)}
              data-testid="button-confirm-delete"
            >
              {getLabel("confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
