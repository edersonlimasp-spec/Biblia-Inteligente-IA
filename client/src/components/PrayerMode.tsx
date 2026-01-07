import { useState, useEffect, useRef, useCallback } from "react";
import { useRequireAuth } from "@/contexts/AuthGateContext";
import { UserButton } from "@/components/UserButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Play, 
  Pause, 
  RotateCcw,
  Plus,
  Heart,
  Home,
  Briefcase,
  Stethoscope,
  Users,
  Check,
  Trash2,
  Edit2,
  Clock,
  Music,
  HandHeart,
  Sparkles,
  Calendar,
  Volume2,
  VolumeX
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";

interface PrayerModeProps {
  onBack: () => void;
}

interface PrayerRequest {
  id: string;
  title: string;
  description: string;
  category: string;
  createdAt: string;
  dueDate?: string;
  answered: boolean;
  answeredAt?: string;
}

const TIMER_PRESETS = [5, 10, 15, 20, 30, 45, 60];

const WORSHIP_TRACKS = [
  { 
    id: "piano", 
    name: "Piano Suave", 
    description: "Melodias tranquilas ao piano",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
  },
  { 
    id: "ambient", 
    name: "Ambiente Celestial", 
    description: "Sons ambientes para meditação",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3"
  },
  { 
    id: "strings", 
    name: "Cordas Clássicas", 
    description: "Violino e violoncelo suaves",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3"
  },
  { 
    id: "worship", 
    name: "Louvor Instrumental", 
    description: "Hinos tradicionais instrumentais",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3"
  },
];

const getPrayerRequests = (): PrayerRequest[] => {
  try {
    const stored = localStorage.getItem("prayer-requests");
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const savePrayerRequests = (requests: PrayerRequest[]) => {
  try {
    localStorage.setItem("prayer-requests", JSON.stringify(requests));
  } catch (error) {
    console.error("Erro ao salvar pedidos de oração:", error);
  }
};

export function PrayerMode({ onBack }: PrayerModeProps) {
  const { t } = useLanguage();
  const { toast } = useToast();

  const CATEGORIES = [
    { id: "family", name: t("prayer.categories.family"), icon: Home, color: "text-pink-500" },
    { id: "work", name: t("prayer.categories.work"), icon: Briefcase, color: "text-blue-500" },
    { id: "health", name: t("prayer.categories.health"), icon: Stethoscope, color: "text-green-500" },
    { id: "relationships", name: t("prayer.categories.relationships"), icon: Users, color: "text-purple-500" },
    { id: "spiritual", name: t("prayer.categories.spiritual"), icon: Sparkles, color: "text-amber-500" },
    { id: "other", name: t("prayer.categories.other"), icon: Heart, color: "text-rose-500" },
  ];
  const { requireAuth } = useRequireAuth();
  const [activeTab, setActiveTab] = useState("timer");
  
  const [timerMinutes, setTimerMinutes] = useState(15);
  const [timeRemaining, setTimeRemaining] = useState(15 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [prayerRequests, setPrayerRequests] = useState<PrayerRequest[]>(getPrayerRequests);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingRequest, setEditingRequest] = useState<PrayerRequest | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [showAnswered, setShowAnswered] = useState(false);

  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newCategory, setNewCategory] = useState("family");
  const [newDueDate, setNewDueDate] = useState("");

  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(50);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    savePrayerRequests(prayerRequests);
  }, [prayerRequests]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume / 100;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const progress = ((timerMinutes * 60 - timeRemaining) / (timerMinutes * 60)) * 100;

  useEffect(() => {
    if (isRunning && timeRemaining > 0) {
      timerIntervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            setIsCompleted(true);
            toast({
              title: "Tempo de oração completo!",
              description: "Que Deus abençoe seu momento de comunhão.",
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isRunning, timeRemaining, toast]);

  const handleStart = () => {
    if (timeRemaining === 0) {
      setTimeRemaining(timerMinutes * 60);
    }
    setIsRunning(true);
    setIsCompleted(false);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeRemaining(timerMinutes * 60);
    setIsCompleted(false);
  };

  const handleTimerChange = (minutes: number) => {
    setTimerMinutes(minutes);
    if (!isRunning) {
      setTimeRemaining(minutes * 60);
    }
  };

  const resetForm = () => {
    setNewTitle("");
    setNewDescription("");
    setNewCategory("family");
    setNewDueDate("");
  };

  const handleAddRequest = () => {
    if (!newTitle.trim()) {
      toast({
        title: "Erro",
        description: "Informe um título para o pedido de oração",
        variant: "destructive",
      });
      return;
    }

    requireAuth(() => {
      const newRequest: PrayerRequest = {
        id: Date.now().toString(),
        title: newTitle.trim(),
        description: newDescription.trim(),
        category: newCategory,
        createdAt: new Date().toISOString(),
        dueDate: newDueDate || undefined,
        answered: false,
      };

      setPrayerRequests((prev) => [newRequest, ...prev]);
      resetForm();
      setShowAddDialog(false);
      
      toast({
        title: "Pedido adicionado",
        description: "Seu motivo de oração foi registrado",
      });
    }, "adicionar pedido de oração");
  };

  const handleEditRequest = () => {
    if (!editingRequest || !newTitle.trim()) {
      toast({
        title: "Erro",
        description: "Informe um título para o pedido de oração",
        variant: "destructive",
      });
      return;
    }

    requireAuth(() => {
      setPrayerRequests((prev) =>
        prev.map((req) =>
          req.id === editingRequest.id
            ? { 
                ...req, 
                title: newTitle.trim(), 
                description: newDescription.trim(), 
                category: newCategory,
                dueDate: newDueDate || undefined
              }
            : req
        )
      );
      
      setEditingRequest(null);
      resetForm();
      
      toast({
        title: "Pedido atualizado",
        description: "As alterações foram salvas",
      });
    }, "editar pedido de oração");
  };

  const handleDeleteRequest = () => {
    if (!deleteConfirmId) return;
    requireAuth(() => {
      setPrayerRequests((prev) => prev.filter((req) => req.id !== deleteConfirmId));
      setDeleteConfirmId(null);
      toast({
        title: "Pedido removido",
        description: "O motivo de oração foi excluído",
      });
    }, "excluir pedido de oração");
  };

  const handleMarkAnswered = (id: string) => {
    requireAuth(() => {
      setPrayerRequests((prev) =>
        prev.map((req) =>
          req.id === id
            ? { ...req, answered: !req.answered, answeredAt: req.answered ? undefined : new Date().toISOString() }
            : req
        )
      );
      
      const request = prayerRequests.find((r) => r.id === id);
      if (request && !request.answered) {
        toast({
          title: "Oração respondida!",
          description: "Glória a Deus pela resposta!",
        });
      }
    }, "marcar oração como respondida");
  };

  const openEditDialog = (request: PrayerRequest) => {
    setEditingRequest(request);
    setNewTitle(request.title);
    setNewDescription(request.description);
    setNewCategory(request.category);
    setNewDueDate(request.dueDate || "");
  };

  const closeDialog = () => {
    setShowAddDialog(false);
    setEditingRequest(null);
    resetForm();
  };

  const handlePlayTrack = (trackId: string) => {
    const track = WORSHIP_TRACKS.find(t => t.id === trackId);
    if (!track) return;

    if (selectedTrack === trackId && isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(track.audioUrl);
    audio.volume = isMuted ? 0 : volume / 100;
    audio.loop = true;
    
    audio.onended = () => {
      setIsPlaying(false);
    };

    audio.onerror = () => {
      toast({
        title: "Erro ao carregar áudio",
        description: "Não foi possível reproduzir este louvor",
        variant: "destructive",
      });
      setIsPlaying(false);
    };

    audio.play().then(() => {
      audioRef.current = audio;
      setSelectedTrack(trackId);
      setIsPlaying(true);
    }).catch(() => {
      toast({
        title: "Erro",
        description: "Não foi possível iniciar a reprodução",
        variant: "destructive",
      });
    });
  };

  const handleToggleMute = () => {
    setIsMuted(!isMuted);
    if (audioRef.current) {
      audioRef.current.volume = !isMuted ? 0 : volume / 100;
    }
  };

  const filteredRequests = prayerRequests.filter((req) => {
    if (filterCategory !== "all" && req.category !== filterCategory) return false;
    if (!showAnswered && req.answered) return false;
    return true;
  });

  const getCategoryIcon = (categoryId: string) => {
    const cat = CATEGORIES.find((c) => c.id === categoryId);
    return cat?.icon || Heart;
  };

  const getCategoryColor = (categoryId: string) => {
    const cat = CATEGORIES.find((c) => c.id === categoryId);
    return cat?.color || "text-rose-500";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const pendingCount = prayerRequests.filter((r) => !r.answered).length;
  const answeredCount = prayerRequests.filter((r) => r.answered).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-amber-950/10 dark:to-amber-900/5">
      <header className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b">
        <div className="flex items-center justify-between p-4 max-w-2xl mx-auto">
          <Button variant="ghost" size="icon" onClick={onBack} data-testid="button-back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold flex items-center gap-2">
            <HandHeart className="w-5 h-5 text-amber-500" />
            {t("prayer.title")}
          </h1>
          <UserButton />
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="timer" data-testid="tab-timer">
              <Clock className="w-4 h-4 mr-2" />
              {t("prayer.tabTimer")}
            </TabsTrigger>
            <TabsTrigger value="requests" data-testid="tab-requests">
              <Heart className="w-4 h-4 mr-2" />
              {t("prayer.tabRequests")}
              {pendingCount > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs">{pendingCount}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="worship" data-testid="tab-worship">
              <Music className="w-4 h-4 mr-2" />
              {t("prayer.tabWorship")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="timer" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative"
            >
              <Card className="border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent overflow-hidden">
                <CardContent className="p-8 flex flex-col items-center">
                  <div className="relative w-64 h-64 flex items-center justify-center">
                    <svg className="absolute inset-0 w-full h-full -rotate-90">
                      <circle
                        cx="128"
                        cy="128"
                        r="120"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="8"
                        className="text-muted/20"
                      />
                      <circle
                        cx="128"
                        cy="128"
                        r="120"
                        fill="none"
                        stroke="url(#gradientPrayer)"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={2 * Math.PI * 120}
                        strokeDashoffset={2 * Math.PI * 120 * (1 - progress / 100)}
                        className="transition-all duration-1000"
                      />
                      <defs>
                        <linearGradient id="gradientPrayer" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#f59e0b" />
                          <stop offset="100%" stopColor="#d97706" />
                        </linearGradient>
                      </defs>
                    </svg>
                    
                    <div className="text-center z-10">
                      <AnimatePresence mode="wait">
                        {isCompleted ? (
                          <motion.div
                            key="completed"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-center"
                          >
                            <Sparkles className="w-16 h-16 text-amber-500 mx-auto mb-2" />
                            <p className="text-lg font-medium text-amber-500">Amém!</p>
                            <p className="text-sm text-muted-foreground">Oração completa</p>
                          </motion.div>
                        ) : (
                          <motion.div
                            key="timer"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                          >
                            <span className="text-5xl font-mono font-bold" data-testid="text-timer">
                              {formatTime(timeRemaining)}
                            </span>
                            <p className="text-sm text-muted-foreground mt-2">
                              {isRunning ? t("prayer.start") + "..." : t("prayer.prepareHeart")}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mt-6">
                    {isRunning ? (
                      <Button
                        size="lg"
                        variant="outline"
                        className="w-14 h-14 rounded-full"
                        onClick={handlePause}
                        data-testid="button-pause"
                      >
                        <Pause className="w-6 h-6" />
                      </Button>
                    ) : (
                      <Button
                        size="lg"
                        className="w-14 h-14 rounded-full bg-amber-600 hover:bg-amber-700"
                        onClick={handleStart}
                        data-testid="button-start"
                      >
                        <Play className="w-6 h-6 ml-1" />
                      </Button>
                    )}
                    <Button
                      size="lg"
                      variant="ghost"
                      className="w-14 h-14 rounded-full"
                      onClick={handleReset}
                      data-testid="button-reset"
                    >
                      <RotateCcw className="w-5 h-5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{t("prayer.duration")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {TIMER_PRESETS.map((minutes) => (
                    <Button
                      key={minutes}
                      variant={timerMinutes === minutes ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleTimerChange(minutes)}
                      disabled={isRunning}
                      data-testid={`button-timer-${minutes}`}
                    >
                      {minutes} min
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <HandHeart className="w-5 h-5 text-amber-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Versículo do Dia</p>
                    <p className="text-sm text-muted-foreground italic">
                      "Orai sem cessar." - 1 Tessalonicenses 5:17
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="requests" className="space-y-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-[160px]" data-testid="select-filter-category">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" data-testid="filter-all">Todas</SelectItem>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id} data-testid={`filter-${cat.id}`}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2">
                <Button
                  variant={showAnswered ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowAnswered(!showAnswered)}
                  data-testid="button-toggle-answered"
                >
                  <Check className="w-4 h-4 mr-1" />
                  {t("prayer.answered")} ({answeredCount})
                </Button>

                <Button
                  onClick={() => setShowAddDialog(true)}
                  data-testid="button-add-prayer"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  {t("prayer.addRequest")}
                </Button>
              </div>
            </div>

            <ScrollArea className="h-[calc(100vh-320px)]">
              <div className="space-y-3 pr-2">
                {filteredRequests.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="p-8 text-center">
                      <Heart className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                      <p className="text-muted-foreground">
                        {showAnswered
                          ? t("prayer.noRequests")
                          : t("prayer.noRequestsDesc")}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  filteredRequests.map((request) => {
                    const CategoryIcon = getCategoryIcon(request.category);
                    return (
                      <motion.div
                        key={request.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <Card
                          className={`${request.answered ? "border-green-500/30 bg-green-500/5" : ""}`}
                          data-testid={`prayer-request-${request.id}`}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-lg bg-muted ${getCategoryColor(request.category)}`}>
                                <CategoryIcon className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <h3 className={`font-medium truncate ${request.answered ? "line-through text-muted-foreground" : ""}`}>
                                    {request.title}
                                  </h3>
                                  {request.answered && (
                                    <Badge variant="outline" className="text-green-600 border-green-600">
                                      <Check className="w-3 h-3 mr-1" />
                                      {t("prayer.answered")}
                                    </Badge>
                                  )}
                                </div>
                                {request.description && (
                                  <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                    {request.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {formatDate(request.createdAt)}
                                  </span>
                                  {request.dueDate && (
                                    <span className="text-amber-600">
                                      • Data: {formatDate(request.dueDate)}
                                    </span>
                                  )}
                                  {request.answeredAt && (
                                    <span className="text-green-600">
                                      • {t("prayer.answered")}: {formatDate(request.answeredAt)}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleMarkAnswered(request.id)}
                                  data-testid={`button-mark-answered-${request.id}`}
                                >
                                  <Check className={`w-4 h-4 ${request.answered ? "text-green-600" : ""}`} />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openEditDialog(request)}
                                  data-testid={`button-edit-${request.id}`}
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setDeleteConfirmId(request.id)}
                                  data-testid={`button-delete-${request.id}`}
                                >
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="worship" className="space-y-4">
            <Card className="bg-gradient-to-br from-amber-500/10 to-transparent border-amber-500/20">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Music className="w-5 h-5 text-amber-500" />
                  Louvores e Hinos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Selecione um louvor para ouvir enquanto ora:
                </p>
                
                <div className="grid gap-3">
                  {WORSHIP_TRACKS.map((track) => (
                    <Card
                      key={track.id}
                      className={`cursor-pointer transition-all ${
                        selectedTrack === track.id
                          ? "border-amber-500 bg-amber-500/10"
                          : "hover-elevate"
                      }`}
                      onClick={() => handlePlayTrack(track.id)}
                      data-testid={`track-${track.id}`}
                    >
                      <CardContent className="p-4 flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium">{track.name}</h4>
                          <p className="text-sm text-muted-foreground">{track.description}</p>
                        </div>
                        <Button
                          size="icon"
                          variant={selectedTrack === track.id && isPlaying ? "default" : "outline"}
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePlayTrack(track.id);
                          }}
                          data-testid={`button-play-${track.id}`}
                        >
                          {selectedTrack === track.id && isPlaying ? (
                            <Pause className="w-5 h-5" />
                          ) : (
                            <Play className="w-5 h-5" />
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {selectedTrack && (
                  <Card>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Volume</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleToggleMute}
                          data-testid="button-mute"
                        >
                          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                        </Button>
                      </div>
                      <div className="flex items-center gap-4">
                        <VolumeX className="w-4 h-4 text-muted-foreground" />
                        <Slider
                          value={[volume]}
                          onValueChange={([v]) => setVolume(v)}
                          max={100}
                          step={1}
                          className="flex-1"
                          disabled={isMuted}
                          data-testid="slider-volume"
                        />
                        <Volume2 className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={showAddDialog || !!editingRequest} onOpenChange={(open) => {
        if (!open) closeDialog();
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingRequest ? t("common.edit") : t("prayer.addRequest")}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("auth.name")} *</label>
              <Input
                placeholder="Ex: Saúde da minha mãe"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                data-testid="input-prayer-title"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Descrição (opcional)</label>
              <Textarea
                placeholder="Detalhes do seu pedido de oração..."
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                rows={3}
                data-testid="input-prayer-description"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Categoria</label>
              <Select value={newCategory} onValueChange={setNewCategory}>
                <SelectTrigger data-testid="select-prayer-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id} data-testid={`category-${cat.id}`}>
                      <div className="flex items-center gap-2">
                        <cat.icon className={`w-4 h-4 ${cat.color}`} />
                        {cat.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Data (opcional)</label>
              <Input
                type="date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                data-testid="input-prayer-date"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} data-testid="button-cancel-prayer">
              {t("common.cancel")}
            </Button>
            <Button 
              onClick={editingRequest ? handleEditRequest : handleAddRequest} 
              data-testid="button-save-prayer"
            >
              {editingRequest ? t("common.save") : t("common.add")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("common.delete")}?</AlertDialogTitle>
            <AlertDialogDescription>
              {t("agenda.deleteConfirm")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRequest} data-testid="button-confirm-delete">
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
