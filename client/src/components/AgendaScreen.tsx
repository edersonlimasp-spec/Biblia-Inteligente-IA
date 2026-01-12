import { useState, useEffect, useRef, useMemo } from "react";
import { useRequireAuth } from "@/contexts/AuthGateContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { UserButton } from "@/components/UserButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
  ChevronLeft,
  ChevronRight,
  Copy,
  Mail
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
  { id: "culto", icon: Church, color: "text-blue-500", bgColor: "bg-blue-500" },
  { id: "estudo", icon: BookOpen, color: "text-emerald-500", bgColor: "bg-emerald-500" },
  { id: "oracao", icon: Heart, color: "text-red-500", bgColor: "bg-red-500" },
  { id: "louvor", icon: Music, color: "text-purple-500", bgColor: "bg-purple-500" },
  { id: "visita", icon: Users, color: "text-amber-500", bgColor: "bg-amber-500" },
  { id: "evangelismo", icon: Megaphone, color: "text-orange-500", bgColor: "bg-orange-500" },
  { id: "jovens", icon: Sparkles, color: "text-pink-500", bgColor: "bg-pink-500" },
  { id: "criancas", icon: Baby, color: "text-cyan-500", bgColor: "bg-cyan-500" },
  { id: "discipulado", icon: GraduationCap, color: "text-indigo-500", bgColor: "bg-indigo-500" },
  { id: "comunhao", icon: Coffee, color: "text-yellow-600", bgColor: "bg-yellow-600" },
  { id: "lideranca", icon: Crown, color: "text-slate-500", bgColor: "bg-slate-500" },
  { id: "outro", icon: Calendar, color: "text-gray-500", bgColor: "bg-gray-500" },
];

const THEME_IDS = [
  "adoracaoLouvor", "familia", "feEsperanca", "missoes", "santidade",
  "amorDeus", "curaLibertacao", "avivamento", "prosperidadeEspiritual",
  "vidaCrista", "evangelismo", "comunhao", "oracaoJejum", "palavraDeus",
  "espiritoSanto", "outro",
];

const STORAGE_KEY = "agenda-events";

function getLocale(language: string): string {
  return language === 'pt' ? 'pt-BR' : language === 'es' ? 'es-ES' : 'en-US';
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
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newDate, setNewDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [newTime, setNewTime] = useState("19:00");
  const [newEndTime, setNewEndTime] = useState("21:00");
  const [newLocation, setNewLocation] = useState("");
  const [newType, setNewType] = useState("culto");
  const [newTheme, setNewTheme] = useState("");
  
  const isAtLimit = events.length >= agendaLimit;

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString(getLocale(language), { 
      weekday: "long", 
      day: "numeric", 
      month: "long" 
    });
  };

  const formatShortDate = (dateStr: string): string => {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString(getLocale(language), { 
      day: "2-digit", 
      month: "short" 
    });
  };

  const getEventTypeName = (id: string): string => t(`agenda.types.${id}`);
  const getThemeName = (id: string): string => t(`agenda.themes.${id}`);

  const getEventType = (typeId: string) => {
    const type = EVENT_TYPE_IDS.find(t => t.id === typeId) || EVENT_TYPE_IDS[EVENT_TYPE_IDS.length - 1];
    return { ...type, name: getEventTypeName(type.id) };
  };

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
      if (stored) setEvents(JSON.parse(stored));
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
      toast({ title: t("common.error"), description: t("agenda.requiredTitle"), variant: "destructive" });
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
      toast({ title: t("agenda.eventAdded"), description: t("agenda.eventAddedDesc") });
    }, t("agenda.addEvent"));
  };

  const handleEditEvent = () => {
    if (!editingEvent || !newTitle.trim()) {
      toast({ title: t("common.error"), description: t("agenda.requiredTitle"), variant: "destructive" });
      return;
    }
    requireAuth(() => {
      setEvents((prev) =>
        prev.map((ev) =>
          ev.id === editingEvent.id
            ? { ...ev, title: newTitle.trim(), description: newDescription.trim(), date: newDate, time: newTime, endTime: newEndTime || undefined, location: newLocation.trim() || undefined, type: newType, theme: newTheme || undefined }
            : ev
        ).sort((a, b) => new Date(a.date + "T" + a.time).getTime() - new Date(b.date + "T" + b.time).getTime())
      );
      setEditingEvent(null);
      resetForm();
      toast({ title: t("agenda.eventUpdated"), description: t("agenda.eventUpdatedDesc") });
    }, t("agenda.editEvent"));
  };

  const handleDeleteEvent = () => {
    if (!deleteConfirmId) return;
    requireAuth(() => {
      setEvents((prev) => prev.filter((ev) => ev.id !== deleteConfirmId));
      setDeleteConfirmId(null);
      toast({ title: t("agenda.eventRemoved"), description: t("agenda.eventRemovedDesc") });
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

  // Calendar helpers
  const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const eventDates = useMemo(() => {
    const dates = new Set<string>();
    events.forEach(e => dates.add(e.date));
    return dates;
  }, [events]);

  const formatDateISO = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const calendarDays = useMemo(() => {
    const days: { date: string; day: number; isCurrentMonth: boolean; isToday: boolean; hasEvent: boolean }[] = [];
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const todayStr = formatDateISO(new Date());
    
    // Previous month days - use Date object to handle year rollover correctly
    const prevMonth = new Date(year, month - 1, 1);
    const prevMonthDays = getDaysInMonth(prevMonth);
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const dateObj = new Date(prevMonth.getFullYear(), prevMonth.getMonth(), d);
      const dateStr = formatDateISO(dateObj);
      days.push({ date: dateStr, day: d, isCurrentMonth: false, isToday: false, hasEvent: eventDates.has(dateStr) });
    }
    
    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, month, d);
      const dateStr = formatDateISO(dateObj);
      days.push({ date: dateStr, day: d, isCurrentMonth: true, isToday: dateStr === todayStr, hasEvent: eventDates.has(dateStr) });
    }
    
    // Next month days - use Date object to handle year rollover correctly
    const nextMonth = new Date(year, month + 1, 1);
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      const dateObj = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), d);
      const dateStr = formatDateISO(dateObj);
      days.push({ date: dateStr, day: d, isCurrentMonth: false, isToday: false, hasEvent: eventDates.has(dateStr) });
    }
    
    return days;
  }, [currentMonth, eventDates]);

  const weekDays = useMemo(() => {
    const locale = getLocale(language);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(2024, 0, i); // Start from Sunday
      return d.toLocaleDateString(locale, { weekday: 'narrow' });
    });
  }, [language]);

  const monthYearLabel = useMemo(() => {
    return currentMonth.toLocaleDateString(getLocale(language), { month: 'long', year: 'numeric' });
  }, [currentMonth, language]);

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));

  const upcomingEvents = events.filter((e) => isFuture(e.date));
  const filteredEvents = selectedDate 
    ? events.filter(e => e.date === selectedDate)
    : upcomingEvents;

  // Share functions
  const createGoogleCalendarLink = (event: AgendaEvent) => {
    const startDate = new Date(`${event.date}T${event.time}:00`);
    const endDate = event.endTime ? new Date(`${event.date}T${event.endTime}:00`) : new Date(startDate.getTime() + 2 * 60 * 60000);
    const fmtDate = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const details = [event.description, event.theme ? `${t("agenda.themeLabel")} ${getThemeName(event.theme)}` : "", `${t("agenda.sentBy")}\n${t("agenda.discoverApp")} https://bibliainteligente.replit.app`].filter(Boolean).join("\n\n");
    const params = new URLSearchParams({ action: "TEMPLATE", text: event.title, dates: `${fmtDate(startDate)}/${fmtDate(endDate)}`, details, location: event.location || "" });
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  };

  const createICSContent = (event: AgendaEvent) => {
    const startDate = new Date(`${event.date}T${event.time}:00`);
    const endDate = event.endTime ? new Date(`${event.date}T${event.endTime}:00`) : new Date(startDate.getTime() + 2 * 60 * 60000);
    const fmtDate = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const description = [event.description, event.theme ? `${t("agenda.themeLabel")} ${getThemeName(event.theme)}` : ""].filter(Boolean).join("\\n");
    return `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Biblia Inteligente//PT\nBEGIN:VEVENT\nDTSTART:${fmtDate(startDate)}\nDTEND:${fmtDate(endDate)}\nSUMMARY:${event.title}\nDESCRIPTION:${description}\nLOCATION:${event.location || ""}\nEND:VEVENT\nEND:VCALENDAR`;
  };

  const handleAddToGoogle = (event: AgendaEvent) => {
    window.open(createGoogleCalendarLink(event), "_blank");
    toast({ title: t("agenda.googleCalendar"), description: t("agenda.openingGoogleCalendar") });
  };

  const handleAddToApple = (event: AgendaEvent) => {
    const blob = new Blob([createICSContent(event)], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${event.title.replace(/\s+/g, "-").toLowerCase()}.ics`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: t("agenda.appleCalendar"), description: t("agenda.icsDownloaded") });
  };

  const generateShareText = (event: AgendaEvent) => {
    const eventType = getEventType(event.type);
    const lines = [`${eventType.name.toUpperCase()}`, `${event.title}`, "", `${formatDate(event.date)}`, `${event.time}${event.endTime ? ` - ${event.endTime}` : ""}`];
    if (event.location) lines.push(`${event.location}`);
    if (event.theme) lines.push(`${t("agenda.themeLabel")} ${getThemeName(event.theme)}`);
    if (event.description) lines.push("", event.description);
    lines.push("", "---", t("agenda.sentBy"), `${t("agenda.discoverApp")} https://bibliainteligente.replit.app`);
    return lines.join("\n");
  };

  const handleShareWhatsApp = (event: AgendaEvent) => {
    window.open(`https://wa.me/?text=${encodeURIComponent(generateShareText(event))}`, "_blank");
    setShareEvent(null);
  };

  const handleShareEmail = (event: AgendaEvent) => {
    window.open(`mailto:?subject=${encodeURIComponent(`Convite: ${event.title}`)}&body=${encodeURIComponent(generateShareText(event))}`, "_blank");
    setShareEvent(null);
  };

  const handleShareNative = async (event: AgendaEvent) => {
    const text = generateShareText(event);
    if (navigator.share) {
      try { await navigator.share({ text }); } catch (e) {
        if ((e as Error).name !== "AbortError") {
          await navigator.clipboard.writeText(text);
          toast({ title: t("common.copied"), description: t("agenda.textCopiedPaste") });
        }
      }
    } else {
      await navigator.clipboard.writeText(text);
      toast({ title: t("common.copied"), description: t("agenda.textCopiedPaste") });
    }
  };

  const handleCopyText = async (event: AgendaEvent) => {
    await navigator.clipboard.writeText(generateShareText(event));
    toast({ title: t("common.copied"), description: t("agenda.textCopied") });
    setShareEvent(null);
  };

  // Elegant Event Card with large date/time
  const EventCard = ({ event }: { event: AgendaEvent }) => {
    const eventType = getEventType(event.type);
    const IconComponent = eventType.icon;
    const today = isToday(event.date);
    const eventDate = new Date(event.date + "T00:00:00");
    const dayNum = eventDate.getDate();
    const monthShort = eventDate.toLocaleDateString(getLocale(language), { month: 'short' }).toUpperCase();
    const weekday = eventDate.toLocaleDateString(getLocale(language), { weekday: 'short' });

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="mb-4"
      >
        <Card className={`overflow-visible hover-elevate ${today ? "ring-2 ring-primary/50 shadow-lg shadow-primary/10" : ""}`}>
          <CardContent className="p-0">
            <div className="flex">
              {/* Date Column - Large and Prominent */}
              <div className={`flex flex-col items-center justify-center px-4 py-5 min-w-[85px] ${today ? "bg-primary text-primary-foreground" : "bg-gradient-to-b from-muted/80 to-muted/40"} rounded-l-lg`}>
                <span className={`text-xs font-medium uppercase tracking-wider ${today ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                  {monthShort}
                </span>
                <span className={`text-4xl font-bold leading-none ${today ? "text-primary-foreground" : "text-foreground"}`}>
                  {dayNum}
                </span>
                <span className={`text-xs font-medium capitalize ${today ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                  {weekday}
                </span>
                {today && (
                  <Badge className="mt-2 text-[10px] bg-white/20 text-white border-0">
                    {t("agenda.today")}
                  </Badge>
                )}
              </div>
              
              {/* Content Column */}
              <div className="flex-1 p-4">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${eventType.bgColor}/10`}>
                    <IconComponent className={`w-5 h-5 ${eventType.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg leading-tight mb-1">{event.title}</h3>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="text-xs font-medium">
                        {eventType.name}
                      </Badge>
                      {event.theme && (
                        <Badge variant="secondary" className="text-xs">
                          {getThemeName(event.theme)}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Time and Location */}
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2 w-fit">
                    <Clock className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-xl font-bold text-foreground">
                      {event.time}
                    </span>
                    {event.endTime && (
                      <span className="text-muted-foreground text-lg">
                        - {event.endTime}
                      </span>
                    )}
                  </div>
                  {event.location && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span>{event.location}</span>
                    </div>
                  )}
                </div>
                
                {event.description && (
                  <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                    {event.description}
                  </p>
                )}
                
                {/* Actions */}
                <div className="flex items-center gap-1 mt-4 pt-3 border-t">
                  <Button size="icon" variant="ghost" onClick={() => setShareEvent(event)} data-testid={`button-share-event-${event.id}`}>
                    <Share2 className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => handleAddToGoogle(event)} data-testid={`button-google-event-${event.id}`}>
                    <SiGoogle className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => handleAddToApple(event)} data-testid={`button-apple-event-${event.id}`}>
                    <SiApple className="w-4 h-4" />
                  </Button>
                  <div className="flex-1" />
                  <Button size="icon" variant="ghost" onClick={() => openEditDialog(event)} data-testid={`button-edit-event-${event.id}`}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => setDeleteConfirmId(event.id)} data-testid={`button-delete-event-${event.id}`}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  // Compact Elegant Share Card
  const InviteCard = ({ event }: { event: AgendaEvent }) => {
    const eventType = getEventType(event.type);
    const IconComponent = eventType.icon;
    const eventDate = new Date(event.date + "T00:00:00");
    const dayNum = eventDate.getDate();
    const monthShort = eventDate.toLocaleDateString(getLocale(language), { month: 'short' }).toUpperCase();
    const weekdayShort = eventDate.toLocaleDateString(getLocale(language), { weekday: 'short' });

    return (
      <div 
        ref={cardRef}
        className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl shadow-xl w-72 mx-auto overflow-hidden"
        data-testid="share-event-card"
      >
        {/* Top Bar */}
        <div className="h-1 bg-gradient-to-r from-primary to-primary/70" />
        
        {/* Header */}
        <div className="px-4 pt-3 pb-2 text-center">
          <div className="inline-flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1 mb-2">
            <IconComponent className="w-3 h-3 text-primary" />
            <span className="text-[10px] font-semibold text-white/90 uppercase tracking-wide">
              {eventType.name}
            </span>
          </div>
          <h2 className="text-lg font-bold text-white leading-tight line-clamp-2">{event.title}</h2>
        </div>
        
        {/* Date & Time Row */}
        <div className="mx-3 bg-gradient-to-br from-primary to-primary/80 rounded-xl p-3 flex items-center justify-between">
          <div className="text-center flex-1">
            <p className="text-[10px] text-white/70 uppercase tracking-wider">{monthShort}</p>
            <p className="text-4xl font-black text-white leading-none">{dayNum}</p>
            <p className="text-xs text-white/80 capitalize">{weekdayShort}</p>
          </div>
          <div className="w-px h-12 bg-white/20" />
          <div className="text-center flex-1">
            <Clock className="w-4 h-4 text-white/70 mx-auto mb-0.5" />
            <p className="text-xl font-bold text-white">{event.time}</p>
            {event.endTime && (
              <p className="text-xs text-white/70">{t("agenda.until")} {event.endTime}</p>
            )}
          </div>
        </div>
        
        {/* Location & Theme */}
        <div className="px-4 py-2 space-y-1">
          {event.location && (
            <div className="flex items-center justify-center gap-1.5 text-white/70">
              <MapPin className="w-3 h-3" />
              <span className="text-xs truncate">{event.location}</span>
            </div>
          )}
          {event.theme && (
            <div className="flex items-center justify-center gap-1.5">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span className="text-xs text-amber-300">{getThemeName(event.theme)}</span>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="bg-white/5 px-4 py-2 text-center border-t border-white/10">
          <div className="flex items-center justify-center gap-1.5">
            <div className="w-4 h-4 bg-primary rounded flex items-center justify-center">
              <BookOpen className="w-2.5 h-2.5 text-white" />
            </div>
            <span className="text-xs font-medium text-white/70">{t("app.name")}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center justify-between p-4 max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack} data-testid="button-back">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-semibold text-lg">{t("agenda.title")}</h1>
              <div className="flex items-center gap-2">
                <Badge variant={isAtLimit && !isLoadingLimits ? "destructive" : "secondary"} className="text-xs" data-testid="badge-events-count">
                  {isLoadingLimits ? `${events.length}` : `${events.length}/${agendaLimit}`}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleOpenAddDialog} data-testid="button-add-event">
              <Plus className="w-4 h-4 mr-2" />
              {t("common.new")}
            </Button>
            <UserButton />
          </div>
        </div>
      </header>

      <ScrollArea className="h-[calc(100vh-65px)]">
        <main className="max-w-2xl mx-auto p-4 space-y-6">
          
          {/* Elegant Compact Calendar */}
          <Card className="overflow-hidden border-0 shadow-sm">
            <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30">
              <Button variant="ghost" size="sm" onClick={prevMonth} className="h-7 w-7 p-0">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <h2 className="text-sm font-semibold capitalize tracking-wide">{monthYearLabel}</h2>
              <Button variant="ghost" size="sm" onClick={nextMonth} className="h-7 w-7 p-0">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            
            <CardContent className="p-2">
              {/* Week days header */}
              <div className="grid grid-cols-7 mb-1">
                {weekDays.map((day, i) => (
                  <div key={i} className="text-center text-[10px] font-medium text-muted-foreground py-1 uppercase">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Calendar grid - compact */}
              <div className="grid grid-cols-7 gap-px">
                {calendarDays.map((day, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedDate(day.date === selectedDate ? null : day.date)}
                    className={`relative h-8 flex flex-col items-center justify-center text-xs transition-colors
                      ${day.isCurrentMonth ? "text-foreground" : "text-muted-foreground/30"}
                      ${day.isToday ? "bg-primary text-primary-foreground font-bold rounded-full" : ""}
                      ${day.date === selectedDate && !day.isToday ? "bg-primary/15 text-primary font-semibold rounded-full" : ""}
                      ${day.isCurrentMonth && !day.isToday && day.date !== selectedDate ? "hover:bg-muted/60 rounded" : ""}
                    `}
                    data-testid={`calendar-day-${day.date}`}
                  >
                    <span>{day.day}</span>
                    {day.hasEvent && (
                      <span className={`absolute bottom-0.5 w-1 h-1 rounded-full ${day.isToday ? "bg-white" : "bg-primary"}`} />
                    )}
                  </button>
                ))}
              </div>
              
              {/* Minimal Legend */}
              <div className="flex items-center justify-center gap-3 mt-2 pt-2 border-t border-dashed text-[10px] text-muted-foreground">
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span>{t("agenda.withEvents")}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[8px] font-bold">
                    {new Date().getDate()}
                  </span>
                  <span>{t("agenda.today")}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Filter indicator */}
          {selectedDate && (
            <div className="flex items-center justify-between bg-muted/50 rounded-lg px-4 py-2">
              <span className="text-sm font-medium">
                {formatDate(selectedDate)}
              </span>
              <Button variant="ghost" size="sm" onClick={() => setSelectedDate(null)}>
                {t("agenda.showAll")}
              </Button>
            </div>
          )}
          
          {/* Event Cards */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <CalendarPlus className="w-5 h-5 text-primary" />
              {selectedDate ? t("agenda.eventsOnDate") : t("agenda.upcoming")}
              <Badge variant="secondary" className="ml-auto">
                {filteredEvents.length}
              </Badge>
            </h3>
            
            {filteredEvents.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="p-8 text-center">
                  <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-medium mb-2">{t("agenda.noScheduledEvents")}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{t("agenda.addChurchEvents")}</p>
                  <Button onClick={handleOpenAddDialog} data-testid="button-add-first-event">
                    <Plus className="w-4 h-4 mr-2" />
                    {t("agenda.createFirstEvent")}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <AnimatePresence>
                {filteredEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </AnimatePresence>
            )}
          </div>
        </main>
      </ScrollArea>

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog || !!editingEvent} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-h-[90vh] overflow-y-auto w-[95vw] max-w-md px-4">
          <DialogHeader>
            <DialogTitle>{editingEvent ? t("agenda.editEventTitle") : t("agenda.newEvent")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t("agenda.titleRequired")}</Label>
              <Input placeholder={t("agenda.titlePlaceholder")} value={newTitle} onChange={(e) => setNewTitle(e.target.value)} data-testid="input-event-title" />
            </div>
            <div className="space-y-2">
              <Label>{t("agenda.eventTypeLabel")}</Label>
              <Select value={newType} onValueChange={setNewType}>
                <SelectTrigger data-testid="select-event-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EVENT_TYPE_IDS.map((type) => {
                    const IconComponent = type.icon;
                    return (
                      <SelectItem key={type.id} value={type.id}>
                        <div className="flex items-center gap-2">
                          <IconComponent className={`w-4 h-4 ${type.color}`} />
                          {getEventTypeName(type.id)}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("agenda.dateRequired")}</Label>
                <Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} data-testid="input-event-date" />
              </div>
              <div className="space-y-2">
                <Label>{t("agenda.startTimeRequired")}</Label>
                <Input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} data-testid="input-event-time" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("agenda.endTimeOptional")}</Label>
                <Input type="time" value={newEndTime} onChange={(e) => setNewEndTime(e.target.value)} data-testid="input-event-endtime" />
              </div>
              <div className="space-y-2">
                <Label>{t("agenda.locationOptional")}</Label>
                <Input placeholder={t("agenda.locationPlaceholder")} value={newLocation} onChange={(e) => setNewLocation(e.target.value)} data-testid="input-event-location" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("agenda.themeOptional")}</Label>
              <Select value={newTheme || "none"} onValueChange={(v) => setNewTheme(v === "none" ? "" : v)}>
                <SelectTrigger data-testid="select-event-theme"><SelectValue placeholder={t("agenda.selectTheme")} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("agenda.themes.none")}</SelectItem>
                  {THEME_IDS.map((themeId) => (
                    <SelectItem key={themeId} value={themeId}>{getThemeName(themeId)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("agenda.descriptionOptional")}</Label>
              <Textarea placeholder={t("agenda.descriptionPlaceholder")} value={newDescription} onChange={(e) => setNewDescription(e.target.value)} rows={3} data-testid="input-event-description" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} data-testid="button-cancel-event">{t("common.cancel")}</Button>
            <Button onClick={editingEvent ? handleEditEvent : handleAddEvent} data-testid="button-save-event">{editingEvent ? t("common.save") : t("common.add")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Event Dialog with Elegant Card */}
      <Dialog open={!!shareEvent} onOpenChange={(open) => !open && setShareEvent(null)}>
        <DialogContent className="max-w-md bg-transparent border-0 shadow-none">
          {shareEvent && (
            <div className="space-y-4">
              <InviteCard event={shareEvent} />
              
              <Card className="bg-background">
                <CardContent className="p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <Button className="bg-green-600 hover:bg-green-700" onClick={() => handleShareWhatsApp(shareEvent)} data-testid="button-share-whatsapp">
                      <SiWhatsapp className="w-4 h-4 mr-2" />
                      WhatsApp
                    </Button>
                    <Button variant="outline" onClick={() => handleShareEmail(shareEvent)} data-testid="button-share-email">
                      <Mail className="w-4 h-4 mr-2" />
                      Email
                    </Button>
                    <Button variant="outline" onClick={() => handleCopyText(shareEvent)} data-testid="button-copy-text">
                      <Copy className="w-4 h-4 mr-2" />
                      {t("agenda.copyText")}
                    </Button>
                    <Button variant="outline" onClick={() => handleShareNative(shareEvent)} data-testid="button-share-native">
                      <Share2 className="w-4 h-4 mr-2" />
                      {t("agenda.more")}
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="secondary" className="flex-1" onClick={() => handleAddToGoogle(shareEvent)} data-testid="button-share-google">
                      <SiGoogle className="w-4 h-4 mr-2" />
                      Google
                    </Button>
                    <Button variant="secondary" className="flex-1" onClick={() => handleAddToApple(shareEvent)} data-testid="button-share-apple">
                      <SiApple className="w-4 h-4 mr-2" />
                      Apple
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("agenda.deleteEventQuestion")}</AlertDialogTitle>
            <AlertDialogDescription>{t("agenda.deleteEventWarning")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteEvent} data-testid="button-confirm-delete">{t("common.delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <SubscriptionLimitModal
        open={showLimitModal}
        onOpenChange={setShowLimitModal}
        title={t("agenda.limitTitle")}
        message={getAgendaLimitMessage(subscriptionType)}
        onSubscribe={handleGoToSubscription}
        subscriptionType={subscriptionType}
      />
    </div>
  );
}
