import { useState, useEffect, useRef } from "react";
import { useRequireAuth } from "@/contexts/AuthGateContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { UserButton } from "@/components/UserButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useUsageLimits, getAgendaLimitMessage } from "@/hooks/useUsageLimits";
import { SubscriptionLimitModal } from "@/components/SubscriptionLimitModal";
import { useNavigation } from "@/contexts/NavigationContext";
import { 
  ArrowLeft, 
  Calendar,
  CalendarPlus,
  Plus,
  Edit2,
  Trash2,
  Share2,
  Download,
  Clock,
  MapPin,
  Church,
  Users,
  BookOpen,
  Heart,
  Music,
  Coffee,
  Megaphone,
  GraduationCap,
  Baby,
  Crown,
  Sparkles,
  Check,
  Copy,
  ExternalLink,
  Mail,
  MessageCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SiGoogle, SiApple, SiWhatsapp } from "react-icons/si";

interface AgendaScreenProps {
  onBack: () => void;
}

interface AgendaEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  endTime?: string;
  location?: string;
  type: string;
  theme?: string;
  createdAt: string;
}

const EVENT_TYPE_IDS = [
  { id: "culto", icon: Church, color: "text-blue-500" },
  { id: "estudo", icon: BookOpen, color: "text-emerald-500" },
  { id: "oracao", icon: Heart, color: "text-red-500" },
  { id: "louvor", icon: Music, color: "text-purple-500" },
  { id: "visita", icon: Users, color: "text-amber-500" },
  { id: "evangelismo", icon: Megaphone, color: "text-orange-500" },
  { id: "jovens", icon: Sparkles, color: "text-pink-500" },
  { id: "criancas", icon: Baby, color: "text-cyan-500" },
  { id: "discipulado", icon: GraduationCap, color: "text-indigo-500" },
  { id: "comunhao", icon: Coffee, color: "text-yellow-600" },
  { id: "lideranca", icon: Crown, color: "text-slate-500" },
  { id: "outro", icon: Calendar, color: "text-gray-500" },
];

const EVENT_TYPES = [
  { id: "culto", name: "Culto", icon: Church, color: "text-blue-500" },
  { id: "estudo", name: "Estudo Bíblico", icon: BookOpen, color: "text-emerald-500" },
  { id: "oracao", name: "Oração", icon: Heart, color: "text-red-500" },
  { id: "louvor", name: "Louvor", icon: Music, color: "text-purple-500" },
  { id: "visita", name: "Visita", icon: Users, color: "text-amber-500" },
  { id: "evangelismo", name: "Evangelismo", icon: Megaphone, color: "text-orange-500" },
  { id: "jovens", name: "Jovens", icon: Sparkles, color: "text-pink-500" },
  { id: "criancas", name: "Crianças", icon: Baby, color: "text-cyan-500" },
  { id: "discipulado", name: "Discipulado", icon: GraduationCap, color: "text-indigo-500" },
  { id: "comunhao", name: "Comunhão", icon: Coffee, color: "text-yellow-600" },
  { id: "lideranca", name: "Liderança", icon: Crown, color: "text-slate-500" },
  { id: "outro", name: "Outro", icon: Calendar, color: "text-gray-500" },
];

const THEMES = [
  "Adoração e Louvor",
  "Família",
  "Fé e Esperança",
  "Missões",
  "Santidade",
  "Amor de Deus",
  "Cura e Libertação",
  "Avivamento",
  "Prosperidade Espiritual",
  "Vida Cristã",
  "Evangelismo",
  "Comunhão",
  "Oração e Jejum",
  "Palavra de Deus",
  "Espírito Santo",
  "Outro",
];

const STORAGE_KEY = "agenda-events";

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("pt-BR", { 
    weekday: "long", 
    day: "numeric", 
    month: "long" 
  });
}

function formatShortDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("pt-BR", { 
    day: "2-digit", 
    month: "short" 
  });
}

function isToday(dateStr: string): boolean {
  const today = new Date().toISOString().split("T")[0];
  return dateStr === today;
}

function isFuture(dateStr: string): boolean {
  const today = new Date().toISOString().split("T")[0];
  return dateStr >= today;
}

export function AgendaScreen({ onBack }: AgendaScreenProps) {
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const { requireAuth } = useRequireAuth();
  const { navigate } = useNavigation();
  const { agendaLimit, subscriptionType, isLoading: isLoadingLimits } = useUsageLimits();
  const cardRef = useRef<HTMLDivElement>(null);
  
  const [events, setEvents] = useState<AgendaEvent[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState<AgendaEvent | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [shareEvent, setShareEvent] = useState<AgendaEvent | null>(null);
  const [showShareAgenda, setShowShareAgenda] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [activeTab, setActiveTab] = useState("upcoming");
  
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newDate, setNewDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [newTime, setNewTime] = useState("19:00");
  const [newEndTime, setNewEndTime] = useState("21:00");
  const [newLocation, setNewLocation] = useState("");
  const [newType, setNewType] = useState("culto");
  const [newTheme, setNewTheme] = useState("");
  
  const isAtLimit = events.length >= agendaLimit;

  const handleGoToSubscription = () => {
    setShowLimitModal(false);
    navigate('subscriptions');
  };

  const handleOpenAddDialog = () => {
    if (isAtLimit) {
      setShowLimitModal(true);
      return;
    }
    setShowAddDialog(true);
  };

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setEvents(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Error loading events:", e);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    } catch (e) {
      console.error("Error saving events:", e);
    }
  }, [events]);

  const resetForm = () => {
    setNewTitle("");
    setNewDescription("");
    setNewDate(new Date().toISOString().split("T")[0]);
    setNewTime("19:00");
    setNewEndTime("21:00");
    setNewLocation("");
    setNewType("culto");
    setNewTheme("");
  };

  const handleAddEvent = () => {
    if (!newTitle.trim()) {
      toast({
        title: t("common.error"),
        description: t("agenda.requiredTitle"),
        variant: "destructive",
      });
      return;
    }

    requireAuth(() => {
      const event: AgendaEvent = {
        id: Date.now().toString(),
        title: newTitle.trim(),
        description: newDescription.trim(),
        date: newDate,
        time: newTime,
        endTime: newEndTime || undefined,
        location: newLocation.trim() || undefined,
        type: newType,
        theme: newTheme || undefined,
        createdAt: new Date().toISOString(),
      };

      setEvents((prev) => [...prev, event].sort((a, b) => 
        new Date(a.date + "T" + a.time).getTime() - new Date(b.date + "T" + b.time).getTime()
      ));
      
      setShowAddDialog(false);
      resetForm();
      
      toast({
        title: t("agenda.eventAdded"),
        description: t("agenda.eventAddedDesc"),
      });
    }, t("agenda.addEvent"));
  };

  const handleEditEvent = () => {
    if (!editingEvent || !newTitle.trim()) {
      toast({
        title: t("common.error"),
        description: t("agenda.requiredTitle"),
        variant: "destructive",
      });
      return;
    }

    requireAuth(() => {
      setEvents((prev) =>
        prev.map((ev) =>
          ev.id === editingEvent.id
            ? {
                ...ev,
                title: newTitle.trim(),
                description: newDescription.trim(),
                date: newDate,
                time: newTime,
                endTime: newEndTime || undefined,
                location: newLocation.trim() || undefined,
                type: newType,
                theme: newTheme || undefined,
              }
            : ev
        ).sort((a, b) => 
          new Date(a.date + "T" + a.time).getTime() - new Date(b.date + "T" + b.time).getTime()
        )
      );

      setEditingEvent(null);
      resetForm();

      toast({
        title: t("agenda.eventUpdated"),
        description: t("agenda.eventUpdatedDesc"),
      });
    }, t("agenda.editEvent"));
  };

  const handleDeleteEvent = () => {
    if (!deleteConfirmId) return;
    requireAuth(() => {
      setEvents((prev) => prev.filter((ev) => ev.id !== deleteConfirmId));
      setDeleteConfirmId(null);
      toast({
        title: t("agenda.eventRemoved"),
        description: t("agenda.eventRemovedDesc"),
      });
    }, t("agenda.deleteEvent"));
  };

  const openEditDialog = (event: AgendaEvent) => {
    setEditingEvent(event);
    setNewTitle(event.title);
    setNewDescription(event.description);
    setNewDate(event.date);
    setNewTime(event.time);
    setNewEndTime(event.endTime || "");
    setNewLocation(event.location || "");
    setNewType(event.type);
    setNewTheme(event.theme || "");
  };

  const closeDialog = () => {
    setShowAddDialog(false);
    setEditingEvent(null);
    resetForm();
  };

  const getEventType = (typeId: string) => {
    const eventType = EVENT_TYPE_IDS.find((et) => et.id === typeId) || EVENT_TYPE_IDS[EVENT_TYPE_IDS.length - 1];
    return {
      ...eventType,
      name: t(`agenda.types.${eventType.id}` as any)
    };
  };

  const createGoogleCalendarLink = (event: AgendaEvent) => {
    const startDate = new Date(`${event.date}T${event.time}:00`);
    const endDate = event.endTime 
      ? new Date(`${event.date}T${event.endTime}:00`)
      : new Date(startDate.getTime() + 2 * 60 * 60000);
    
    const formatDate = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    
    const details = [
      event.description,
      event.theme ? `Tema: ${event.theme}` : "",
      "Enviado por Bíblia Inteligente IA\nConheça a BI: https://bibliainteligente.replit.app",
    ].filter(Boolean).join("\n\n");
    
    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: event.title,
      dates: `${formatDate(startDate)}/${formatDate(endDate)}`,
      details,
      location: event.location || "",
    });
    
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  };

  const createICSContent = (event: AgendaEvent) => {
    const startDate = new Date(`${event.date}T${event.time}:00`);
    const endDate = event.endTime 
      ? new Date(`${event.date}T${event.endTime}:00`)
      : new Date(startDate.getTime() + 2 * 60 * 60000);
    
    const formatDate = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    
    const description = [
      event.description,
      event.theme ? `Tema: ${event.theme}` : "",
    ].filter(Boolean).join("\\n");

    return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Biblia Inteligente//PT
BEGIN:VEVENT
DTSTART:${formatDate(startDate)}
DTEND:${formatDate(endDate)}
SUMMARY:${event.title}
DESCRIPTION:${description}
LOCATION:${event.location || ""}
END:VEVENT
END:VCALENDAR`;
  };

  const handleAddToGoogle = (event: AgendaEvent) => {
    const link = createGoogleCalendarLink(event);
    window.open(link, "_blank");
    toast({
      title: "Google Calendar",
      description: "Abrindo Google Calendar",
    });
  };

  const handleAddToApple = (event: AgendaEvent) => {
    const icsContent = createICSContent(event);
    const blob = new Blob([icsContent], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${event.title.replace(/\s+/g, "-").toLowerCase()}.ics`;
    a.click();
    URL.revokeObjectURL(url);
    toast({
      title: "Apple Calendar",
      description: "Arquivo .ics baixado",
    });
  };

  const generateShareText = (event: AgendaEvent) => {
    const eventType = getEventType(event.type);
    const lines = [
      `${eventType.name.toUpperCase()}`,
      `${event.title}`,
      "",
      `${formatDate(event.date)}`,
      `${event.time}${event.endTime ? ` - ${event.endTime}` : ""}`,
    ];
    
    if (event.location) lines.push(`${event.location}`);
    if (event.theme) lines.push(`Tema: ${event.theme}`);
    if (event.description) lines.push("", event.description);
    
    // Standard app footer
    lines.push("");
    lines.push("---");
    lines.push("Enviado por Bíblia Inteligente IA");
    lines.push("Conheça a BI: https://bibliainteligente.replit.app");
    
    return lines.join("\n");
  };

  const handleShareWhatsApp = (event: AgendaEvent) => {
    const text = generateShareText(event);
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
    setShareEvent(null);
  };

  const handleShareEmail = (event: AgendaEvent) => {
    const subject = encodeURIComponent(`Convite: ${event.title}`);
    const body = encodeURIComponent(generateShareText(event));
    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
    setShareEvent(null);
  };

  const handleShareNative = async (event: AgendaEvent) => {
    const text = generateShareText(event);
    
    if (navigator.share) {
      try {
        await navigator.share({ text });
      } catch (e) {
        // User cancelled or error - copy to clipboard as fallback
        if ((e as Error).name !== "AbortError") {
          await navigator.clipboard.writeText(text);
          toast({
            title: "Copiado!",
            description: "Texto copiado. Cole no WhatsApp ou outro app.",
          });
        }
      }
    } else {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copiado!",
        description: "Texto copiado. Cole no WhatsApp ou outro app.",
      });
    }
  };

  const handleCopyText = async (event: AgendaEvent) => {
    await navigator.clipboard.writeText(generateShareText(event));
    toast({
      title: "Copiado",
      description: "Texto copiado para a área de transferência",
    });
    setShareEvent(null);
  };

  const generateFullAgendaText = () => {
    const upcoming = events.filter((e) => isFuture(e.date));
    if (upcoming.length === 0) return "Nenhum evento agendado.";
    
    const lines = [
      "MINHA AGENDA - PROXIMOS EVENTOS",
      "================================",
      "",
    ];
    
    upcoming.forEach((event, index) => {
      const eventType = getEventType(event.type);
      lines.push(`${index + 1}. ${event.title}`);
      lines.push(`   ${eventType.name}`);
      lines.push(`   ${formatDate(event.date)} - ${event.time}${event.endTime ? ` ate ${event.endTime}` : ""}`);
      if (event.location) lines.push(`   Local: ${event.location}`);
      if (event.theme) lines.push(`   Tema: ${event.theme}`);
      lines.push("");
    });
    
    // Standard app footer
    lines.push("---");
    lines.push("Enviado por Bíblia Inteligente IA");
    lines.push("Conheça a BI: https://bibliainteligente.replit.app");
    
    return lines.join("\n");
  };

  const createFullAgendaICS = () => {
    const upcoming = events.filter((e) => isFuture(e.date));
    if (upcoming.length === 0) return "";
    
    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Biblia Inteligente//PT",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
    ];
    
    upcoming.forEach((event) => {
      const startDate = new Date(`${event.date}T${event.time}:00`);
      const endDate = event.endTime 
        ? new Date(`${event.date}T${event.endTime}:00`)
        : new Date(startDate.getTime() + 2 * 60 * 60000);
      
      const fmtDate = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
      
      const descParts = [];
      if (event.description) descParts.push(event.description);
      if (event.theme) descParts.push(`Tema: ${event.theme}`);
      const description = descParts.join(" - ").replace(/\n/g, "\\n");
      
      lines.push("BEGIN:VEVENT");
      lines.push(`UID:${event.id}@biblia-inteligente`);
      lines.push(`DTSTART:${fmtDate(startDate)}`);
      lines.push(`DTEND:${fmtDate(endDate)}`);
      lines.push(`SUMMARY:${event.title}`);
      if (description) lines.push(`DESCRIPTION:${description}`);
      if (event.location) lines.push(`LOCATION:${event.location}`);
      lines.push("END:VEVENT");
    });
    
    lines.push("END:VCALENDAR");
    return lines.join("\r\n");
  };

  const handleShareAgendaWhatsApp = () => {
    const text = generateFullAgendaText();
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
    setShowShareAgenda(false);
  };

  const handleShareAgendaEmail = () => {
    const subject = encodeURIComponent("Minha Agenda - Proximos Eventos");
    const body = encodeURIComponent(generateFullAgendaText());
    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
    setShowShareAgenda(false);
  };

  const handleShareAgendaNative = async () => {
    const text = generateFullAgendaText();
    
    if (navigator.share) {
      try {
        await navigator.share({ text });
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          await navigator.clipboard.writeText(text);
          toast({
            title: "Copiado!",
            description: "Texto copiado. Cole no WhatsApp ou outro app.",
          });
        }
      }
    } else {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copiado!",
        description: "Texto copiado. Cole no WhatsApp ou outro app.",
      });
    }
  };

  const handleCopyAgendaText = async () => {
    await navigator.clipboard.writeText(generateFullAgendaText());
    toast({
      title: "Copiado",
      description: "Agenda copiada para a area de transferencia",
    });
    setShowShareAgenda(false);
  };

  const handleDownloadAgendaICS = () => {
    const icsContent = createFullAgendaICS();
    if (!icsContent) {
      toast({
        title: "Sem eventos",
        description: "Nao ha eventos para exportar",
        variant: "destructive",
      });
      return;
    }
    const blob = new Blob([icsContent], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "minha-agenda.ics";
    a.click();
    URL.revokeObjectURL(url);
    toast({
      title: "Exportado",
      description: "Arquivo .ics baixado com todos os eventos",
    });
    setShowShareAgenda(false);
  };

  const upcomingEvents = events.filter((e) => isFuture(e.date));
  const pastEvents = events.filter((e) => !isFuture(e.date)).reverse();

  const EventCard = ({ event }: { event: AgendaEvent }) => {
    const eventType = getEventType(event.type);
    const IconComponent = eventType.icon;
    const today = isToday(event.date);

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="mb-3"
      >
        <Card className={`overflow-visible hover-elevate ${today ? "border-primary/50 bg-primary/5" : ""}`}>
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="flex flex-col items-center justify-center min-w-[50px]">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${today ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                  <IconComponent className={`w-6 h-6 ${today ? "" : eventType.color}`} />
                </div>
                <span className="text-xs text-muted-foreground mt-1 text-center">
                  {formatShortDate(event.date)}
                </span>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-base truncate">{event.title}</h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {eventType.name}
                      </Badge>
                      {today && (
                        <Badge className="text-xs bg-primary">Hoje</Badge>
                      )}
                      {event.theme && (
                        <Badge variant="secondary" className="text-xs truncate max-w-[120px]">
                          {event.theme}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {event.time}{event.endTime && ` - ${event.endTime}`}
                  </span>
                  {event.location && (
                    <span className="flex items-center gap-1 truncate max-w-[150px]">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                      {event.location}
                    </span>
                  )}
                </div>
                
                {event.description && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                    {event.description}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-1 mt-3 pt-3 border-t">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => handleShareNative(event)}
                data-testid={`button-share-event-${event.id}`}
              >
                <Share2 className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => handleAddToGoogle(event)}
                data-testid={`button-google-event-${event.id}`}
              >
                <SiGoogle className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => handleAddToApple(event)}
                data-testid={`button-apple-event-${event.id}`}
              >
                <SiApple className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => openEditDialog(event)}
                data-testid={`button-edit-event-${event.id}`}
              >
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setDeleteConfirmId(event.id)}
                data-testid={`button-delete-event-${event.id}`}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  const InviteCard = ({ event }: { event: AgendaEvent }) => {
    const eventType = getEventType(event.type);
    const IconComponent = eventType.icon;

    return (
      <div 
        ref={cardRef}
        className="bg-card border border-border rounded-xl shadow-lg max-w-sm mx-auto overflow-hidden"
        data-testid="share-event-card"
      >
        <div className="bg-gradient-to-r from-primary to-primary/80 px-4 py-3 flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center border border-white/30 shadow-sm flex-shrink-0">
            <IconComponent className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-primary-foreground leading-tight">Biblia Inteligente IA</h3>
            <p className="text-[10px] text-primary-foreground/60 truncate">bibliainteligente.replit.app</p>
          </div>
        </div>
        
        <div className="p-5 space-y-4">
          <div className="space-y-2">
            <Badge variant="secondary" className="uppercase text-[10px] font-semibold tracking-wider px-2 py-0.5">
              {eventType.name}
            </Badge>
            <h2 className="text-xl font-bold text-foreground leading-tight">{event.title}</h2>
          </div>
          
          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2 text-foreground">
              <Calendar className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="text-sm font-medium">{formatDate(event.date)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="text-sm font-semibold text-foreground">
                {event.time}{event.endTime && ` - ${event.endTime}`}
              </span>
            </div>
            {event.location && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-sm">{event.location}</span>
              </div>
            )}
          </div>
          
          {event.theme && (
            <div className="flex items-center gap-2 text-sm">
              <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <span className="text-muted-foreground">Tema:</span>
              <span className="font-semibold text-foreground">{event.theme}</span>
            </div>
          )}
          
          {event.description && (
            <p className="text-sm text-muted-foreground italic border-l-2 border-primary/30 pl-3">
              "{event.description}"
            </p>
          )}
        </div>
        
        <div className="bg-muted/30 border-t border-border px-4 py-2.5 text-center">
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Enviado por Biblia Inteligente IA
          </p>
          <a 
            href="https://bibliainteligente.replit.app" 
            className="text-[10px] text-primary/70 hover:text-primary"
          >
            bibliainteligente.replit.app
          </a>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center justify-between p-4 max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onBack}
              data-testid="button-back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-semibold text-lg">Minha Agenda</h1>
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground">{events.length} eventos</p>
                <Badge 
                  variant={isAtLimit && !isLoadingLimits ? "destructive" : "secondary"} 
                  className="text-xs"
                  data-testid="badge-events-count"
                >
                  {isLoadingLimits ? `${events.length}` : `${events.length}/${agendaLimit}`}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {upcomingEvents.length > 0 && (
              <Button 
                variant="outline" 
                size="icon"
                onClick={handleShareAgendaNative} 
                data-testid="button-share-agenda"
              >
                <Share2 className="w-4 h-4" />
              </Button>
            )}
            <Button onClick={handleOpenAddDialog} data-testid="button-add-event">
              <Plus className="w-4 h-4 mr-2" />
              Novo
            </Button>
            <UserButton />
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="upcoming" data-testid="tab-upcoming">
              Proximos ({upcomingEvents.length})
            </TabsTrigger>
            <TabsTrigger value="past" data-testid="tab-past">
              Passados ({pastEvents.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="mt-0">
            <ScrollArea className="h-[calc(100vh-200px)]">
              {upcomingEvents.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="p-8 text-center">
                    <CalendarPlus className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-medium mb-2">Nenhum evento agendado</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Adicione eventos da igreja, estudos biblicos e mais
                    </p>
                    <Button onClick={handleOpenAddDialog} data-testid="button-add-first-event">
                      <Plus className="w-4 h-4 mr-2" />
                      Criar Primeiro Evento
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <AnimatePresence>
                  {upcomingEvents.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </AnimatePresence>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="past" className="mt-0">
            <ScrollArea className="h-[calc(100vh-200px)]">
              {pastEvents.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="p-8 text-center">
                    <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-medium mb-2">Nenhum evento passado</h3>
                    <p className="text-sm text-muted-foreground">
                      Eventos passados aparecerao aqui
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <AnimatePresence>
                  {pastEvents.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </AnimatePresence>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={showAddDialog || !!editingEvent} onOpenChange={(open) => {
        if (!open) closeDialog();
      }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingEvent ? "Editar Evento" : "Novo Evento"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Titulo *</Label>
              <Input
                placeholder="Ex: Culto de Domingo"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                data-testid="input-event-title"
              />
            </div>

            <div className="space-y-2">
              <Label>Tipo de Evento</Label>
              <Select value={newType} onValueChange={setNewType}>
                <SelectTrigger data-testid="select-event-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      <div className="flex items-center gap-2">
                        <type.icon className={`w-4 h-4 ${type.color}`} />
                        {type.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data *</Label>
                <Input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  data-testid="input-event-date"
                />
              </div>
              <div className="space-y-2">
                <Label>Horario Inicio *</Label>
                <Input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  data-testid="input-event-time"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Horario Fim (opcional)</Label>
                <Input
                  type="time"
                  value={newEndTime}
                  onChange={(e) => setNewEndTime(e.target.value)}
                  data-testid="input-event-endtime"
                />
              </div>
              <div className="space-y-2">
                <Label>Local (opcional)</Label>
                <Input
                  placeholder="Ex: Igreja Central"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  data-testid="input-event-location"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tema (opcional)</Label>
              <Select value={newTheme || "none"} onValueChange={(v) => setNewTheme(v === "none" ? "" : v)}>
                <SelectTrigger data-testid="select-event-theme">
                  <SelectValue placeholder="Selecione um tema" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum tema</SelectItem>
                  {THEMES.map((theme) => (
                    <SelectItem key={theme} value={theme}>
                      {theme}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Descricao (opcional)</Label>
              <Textarea
                placeholder="Detalhes do evento..."
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                rows={3}
                data-testid="input-event-description"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} data-testid="button-cancel-event">
              Cancelar
            </Button>
            <Button
              onClick={editingEvent ? handleEditEvent : handleAddEvent}
              data-testid="button-save-event"
            >
              {editingEvent ? "Salvar" : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!shareEvent} onOpenChange={(open) => !open && setShareEvent(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Compartilhar Evento</DialogTitle>
          </DialogHeader>

          {shareEvent && (
            <div className="space-y-6 py-4">
              <InviteCard event={shareEvent} />

              <div className="grid grid-cols-2 gap-3">
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => handleShareWhatsApp(shareEvent)}
                  data-testid="button-share-whatsapp"
                >
                  <SiWhatsapp className="w-4 h-4 mr-2" />
                  WhatsApp
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleShareEmail(shareEvent)}
                  data-testid="button-share-email"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Email
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleCopyText(shareEvent)}
                  data-testid="button-copy-text"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar Texto
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleShareNative(shareEvent)}
                  data-testid="button-share-native"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Mais...
                </Button>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => handleAddToGoogle(shareEvent)}
                  data-testid="button-share-google"
                >
                  <SiGoogle className="w-4 h-4 mr-2" />
                  Google Calendar
                </Button>
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => handleAddToApple(shareEvent)}
                  data-testid="button-share-apple"
                >
                  <SiApple className="w-4 h-4 mr-2" />
                  Apple
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir evento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acao nao pode ser desfeita. O evento sera removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteEvent} data-testid="button-confirm-delete">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showShareAgenda} onOpenChange={setShowShareAgenda}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Compartilhar Agenda Completa</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Minha Agenda</h3>
                    <p className="text-sm text-muted-foreground">
                      {upcomingEvents.length} eventos proximos
                    </p>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground max-h-32 overflow-y-auto space-y-1">
                  {upcomingEvents.slice(0, 5).map((event, i) => (
                    <div key={event.id} className="flex items-center gap-2">
                      <span className="text-primary font-medium">{i + 1}.</span>
                      <span className="truncate">{event.title}</span>
                      <span className="text-muted-foreground/70">
                        {formatShortDate(event.date)}
                      </span>
                    </div>
                  ))}
                  {upcomingEvents.length > 5 && (
                    <div className="text-muted-foreground">
                      ... e mais {upcomingEvents.length - 5} eventos
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-3">
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={handleShareAgendaWhatsApp}
                data-testid="button-share-agenda-whatsapp"
              >
                <SiWhatsapp className="w-4 h-4 mr-2" />
                WhatsApp
              </Button>
              <Button
                variant="outline"
                onClick={handleShareAgendaEmail}
                data-testid="button-share-agenda-email"
              >
                <Mail className="w-4 h-4 mr-2" />
                Email
              </Button>
              <Button
                variant="outline"
                onClick={handleCopyAgendaText}
                data-testid="button-copy-agenda-text"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copiar Texto
              </Button>
              <Button
                variant="outline"
                onClick={handleShareAgendaNative}
                data-testid="button-share-agenda-native"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Mais...
              </Button>
            </div>

            <Button
              variant="secondary"
              className="w-full"
              onClick={handleDownloadAgendaICS}
              data-testid="button-download-agenda-ics"
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar todos (.ics)
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <SubscriptionLimitModal
        open={showLimitModal}
        onOpenChange={setShowLimitModal}
        title="Limite de Eventos Atingido"
        message={getAgendaLimitMessage(subscriptionType)}
        onSubscribe={handleGoToSubscription}
        subscriptionType={subscriptionType}
      />
    </div>
  );
}
