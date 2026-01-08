import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useDeviceId } from "@/hooks/use-device-id";
import { UserButton } from "@/components/UserButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  ArrowLeft, 
  Plus,
  Heart,
  Users,
  Briefcase,
  Star,
  Church,
  Globe,
  Bell,
  BellOff,
  Timer,
  Play,
  Pause,
  Square,
  ChevronRight,
  Trash2,
  Check,
  X,
  Share2,
  Music,
  BookOpen,
  Clock,
  ListChecks
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import type { PrayerList, PrayerRequest } from "@shared/schema";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, LabelList } from "recharts";

interface PrayerModeProps {
  onBack: () => void;
}

const CLASSIC_HYMNS = [
  { id: "1", title: "Mais Perto Quero Estar", number: "387", author: "Fanny Crosby" },
  { id: "2", title: "Se Paz a Mais Doce", number: "336", author: "Horatio Spafford" },
  { id: "3", title: "Divino Companheiro", number: "212", author: "Desconhecido" },
  { id: "4", title: "Quando Jesus Estendeu a Sua Mão", number: "431", author: "Desconhecido" },
  { id: "5", title: "Santo, Santo, Santo", number: "1", author: "Reginald Heber" },
  { id: "6", title: "Castelo Forte", number: "18", author: "Martinho Lutero" },
  { id: "7", title: "Vem, Jesus, Tão Desejado", number: "97", author: "Charles Wesley" },
  { id: "8", title: "Sublime Graça", number: "277", author: "John Newton" },
  { id: "9", title: "Quão Grande És Tu", number: "17", author: "Carl Boberg" },
  { id: "10", title: "A Deus Demos Glória", number: "22", author: "Fanny Crosby" },
  { id: "11", title: "Vencendo Vem Jesus", number: "110", author: "Philip Bliss" },
  { id: "12", title: "Firme nas Promessas", number: "262", author: "Russell Carter" },
  { id: "13", title: "Perto de Ti, Senhor", number: "389", author: "Sarah Adams" },
  { id: "14", title: "Graças Dou", number: "152", author: "Johnson Oatman Jr." },
  { id: "15", title: "Eu Sei Que Meu Senhor Cuida de Mim", number: "345", author: "Civilla Martin" },
];

const PRESET_CATEGORIES = [
  { 
    key: "family", 
    title: "Família e Vida Sentimental", 
    icon: Heart, 
    color: "#8B5CF6",
    bgGradient: "from-violet-500 to-violet-600"
  },
  { 
    key: "spiritual", 
    title: "Vida Espiritual e Ministério", 
    icon: Church, 
    color: "#8B5CF6",
    bgGradient: "from-purple-500 to-purple-600"
  },
  { 
    key: "professional", 
    title: "Vida Profissional e Estudos", 
    icon: Briefcase, 
    color: "#3B82F6",
    bgGradient: "from-blue-500 to-blue-600"
  },
  { 
    key: "dreams", 
    title: "Meus Sonhos e Conquistas", 
    icon: Star, 
    color: "#F59E0B",
    bgGradient: "from-amber-500 to-amber-600"
  },
];

const DEFAULT_ALARMS = [
  { time: "06:00", label: "Oração Matinal", enabled: true },
  { time: "12:00", label: "Intercessão", enabled: true },
  { time: "18:00", label: "Oração Vespertina", enabled: true },
  { time: "21:00", label: "Oração Noturna", enabled: true },
];

export function PrayerMode({ onBack }: PrayerModeProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { user } = useAuth();
  const { deviceId } = useDeviceId();
  const queryClient = useQueryClient();
  
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [showTimerDialog, setShowTimerDialog] = useState(false);
  const [showAddAlarmDialog, setShowAddAlarmDialog] = useState(false);
  const [timerContext, setTimerContext] = useState<string | null>(null); // Which category/module started timer
  
  const [newRequestTitle, setNewRequestTitle] = useState("");
  const [newRequestDescription, setNewRequestDescription] = useState("");
  
  const [newAlarmTime, setNewAlarmTime] = useState("08:00");
  const [newAlarmLabel, setNewAlarmLabel] = useState("");
  
  const [timerActive, setTimerActive] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerInitialSeconds, setTimerInitialSeconds] = useState(300); // 5 min default
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const COUNTDOWN_PRESETS = [
    { label: "5 min", seconds: 300 },
    { label: "10 min", seconds: 600 },
    { label: "15 min", seconds: 900 },
    { label: "20 min", seconds: 1200 },
    { label: "30 min", seconds: 1800 },
  ];
  
  const [localAlarms, setLocalAlarms] = useState(() => {
    try {
      const stored = localStorage.getItem("prayer-alarms");
      return stored ? JSON.parse(stored) : DEFAULT_ALARMS;
    } catch {
      return DEFAULT_ALARMS;
    }
  });

  useEffect(() => {
    localStorage.setItem("prayer-alarms", JSON.stringify(localAlarms));
  }, [localAlarms]);

  useEffect(() => {
    if (timerActive && timerSeconds > 0) {
      timerRef.current = setInterval(() => {
        setTimerSeconds(s => {
          if (s <= 1) {
            setTimerActive(false);
            toast({ 
              title: "Tempo de oração concluído!", 
              description: "Que Deus abençoe seu momento de oração." 
            });
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerActive]);

  const { data: prayerLists = [], isLoading: listsLoading } = useQuery<PrayerList[]>({
    queryKey: ['/api/prayer/lists'],
    enabled: !!(user || deviceId),
  });

  const { data: prayerRequests = [] } = useQuery<PrayerRequest[]>({
    queryKey: ['/api/prayer/requests'],
    enabled: !!(user || deviceId),
  });

  const createListMutation = useMutation({
    mutationFn: async (data: { title: string; icon: string; color: string; listType?: string; categoryKey?: string }) => {
      const response = await apiRequest('POST', '/api/prayer/lists', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/prayer/lists'] });
    },
  });

  const createRequestMutation = useMutation({
    mutationFn: async (data: { listId: string; title: string; description?: string }) => {
      const response = await apiRequest('POST', '/api/prayer/requests', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/prayer/requests'] });
    },
  });

  const updateRequestMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await apiRequest('PATCH', `/api/prayer/requests/${id}`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/prayer/requests'] });
      toast({ title: "Pedido atualizado!" });
    },
  });

  const deleteRequestMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/prayer/requests/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/prayer/requests'] });
      toast({ title: "Pedido removido!" });
    },
  });

  const totalRequests = prayerRequests.length;
  const answeredRequests = prayerRequests.filter(r => r.status === 'answered').length;
  const prayingRequests = prayerRequests.filter(r => r.status === 'praying').length;

  const chartData = [
    { name: 'Total', value: totalRequests, color: '#64748B' },
    { name: 'Respondidos', value: answeredRequests, color: '#22C55E' },
    { name: 'Em Oração', value: prayingRequests, color: '#3B82F6' },
  ];

  const getOrCreateCategoryList = async (categoryKey: string) => {
    const category = PRESET_CATEGORIES.find(c => c.key === categoryKey);
    if (!category) return null;
    
    const existingList = prayerLists.find(l => l.categoryKey === categoryKey);
    if (existingList) return existingList;
    
    const newList = await createListMutation.mutateAsync({
      title: category.title,
      icon: category.key,
      color: category.color,
      listType: 'preset',
      categoryKey: category.key,
    });
    
    return newList;
  };

  const toggleExpandCategory = async (categoryKey: string) => {
    if (expandedCategory === categoryKey) {
      setExpandedCategory(null);
      setNewRequestTitle("");
      setNewRequestDescription("");
    } else {
      await getOrCreateCategoryList(categoryKey);
      setExpandedCategory(categoryKey);
      setNewRequestTitle("");
      setNewRequestDescription("");
    }
  };

  const handleAddRequestToExpanded = async () => {
    if (!newRequestTitle.trim() || !expandedCategory) return;
    
    let list = prayerLists.find(l => l.categoryKey === expandedCategory);
    if (!list) {
      list = await getOrCreateCategoryList(expandedCategory);
    }
    
    if (list) {
      await createRequestMutation.mutateAsync({
        listId: list.id,
        title: newRequestTitle.trim(),
        description: newRequestDescription.trim() || undefined,
      });
      setNewRequestTitle("");
      setNewRequestDescription("");
      toast({ title: "Pedido adicionado!" });
    }
  };

  const getCategoryRequests = (categoryKey: string) => {
    const list = prayerLists.find(l => l.categoryKey === categoryKey);
    if (!list) return [];
    return prayerRequests.filter(r => r.listId === list.id);
  };


  const toggleAlarm = (index: number) => {
    setLocalAlarms((prev: typeof DEFAULT_ALARMS) => 
      prev.map((alarm, i) => 
        i === index ? { ...alarm, enabled: !alarm.enabled } : alarm
      )
    );
  };

  const addAlarm = () => {
    if (!newAlarmLabel.trim()) {
      toast({ title: "Informe uma descrição", variant: "destructive" });
      return;
    }
    setLocalAlarms((prev: typeof DEFAULT_ALARMS) => [
      ...prev,
      { time: newAlarmTime, label: newAlarmLabel, enabled: true }
    ]);
    setShowAddAlarmDialog(false);
    setNewAlarmLabel("");
    toast({ title: "Horário adicionado!" });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startTimer = (seconds?: number) => {
    const duration = seconds || timerInitialSeconds;
    setTimerSeconds(duration);
    setTimerInitialSeconds(duration);
    setTimerActive(true);
    setShowTimerDialog(true);
  };

  const stopTimer = () => {
    const elapsed = timerInitialSeconds - timerSeconds;
    setTimerActive(false);
    if (elapsed > 0) {
      toast({ 
        title: `Oração finalizada!`, 
        description: `Tempo orando: ${formatTime(elapsed)}` 
      });
    }
    setTimerSeconds(0);
    setShowTimerDialog(false);
    setTimerContext(null);
  };
  
  const selectPreset = (seconds: number) => {
    setTimerInitialSeconds(seconds);
    setTimerSeconds(seconds);
  };

  // Open timer dialog for a specific category/module
  const openTimerForCategory = (categoryKey: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Don't trigger category click
    setTimerContext(categoryKey);
    setShowTimerDialog(true);
  };


  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copiado!", description: "Pedido copiado para a área de transferência" });
    } catch {
      toast({ title: "Erro ao copiar", variant: "destructive" });
    }
  };

  const shareAllRequests = async () => {
    if (prayerRequests.length === 0) {
      toast({ title: "Nenhum pedido para compartilhar", variant: "destructive" });
      return;
    }

    const pendingRequests = prayerRequests.filter(r => r.status !== 'answered');
    const answeredRequests = prayerRequests.filter(r => r.status === 'answered');
    
    let shareText = `🙏 Lista de Pedidos de Oração\n\n`;
    
    if (pendingRequests.length > 0) {
      shareText += `📌 Orando (${pendingRequests.length}):\n`;
      pendingRequests.forEach((r, i) => {
        shareText += `${i + 1}. ${r.title}${r.description ? ` - ${r.description}` : ''}\n`;
      });
    }
    
    if (answeredRequests.length > 0) {
      shareText += `\n✅ Respondidos (${answeredRequests.length}):\n`;
      answeredRequests.forEach((r, i) => {
        shareText += `${i + 1}. ${r.title}\n`;
      });
    }
    
    shareText += `\n🙌 Ore conosco!`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Lista de Pedidos de Oração',
          text: shareText,
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          await copyToClipboard(shareText);
        }
      }
    } else {
      await copyToClipboard(shareText);
    }
  };

  const churchList = prayerLists.find(l => l.listType === 'church');
  const churchRequests = churchList ? prayerRequests.filter(r => r.listId === churchList.id) : [];

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900">
      <header className="sticky top-0 z-50 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" size="icon" onClick={onBack} data-testid="button-back">
            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </Button>
          
          <h1 className="text-lg font-bold text-slate-800 dark:text-white">
            Modo Oração
          </h1>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowTimerDialog(true)}
              className="text-[#357ABD]"
              data-testid="button-timer"
            >
              <Timer className="w-5 h-5" />
            </Button>
            <UserButton />
          </div>
        </div>
      </header>

      <Tabs defaultValue="prayer" className="flex-1">
        <TabsList className="grid w-full grid-cols-2 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 rounded-none h-12">
          <TabsTrigger 
            value="prayer" 
            className="flex items-center gap-2 data-[state=active]:bg-[#357ABD]/10 data-[state=active]:text-[#357ABD] rounded-none h-full"
            data-testid="tab-prayer"
          >
            <Heart className="w-4 h-4" />
            Modo Oração
          </TabsTrigger>
          <TabsTrigger 
            value="hymns" 
            className="flex items-center gap-2 data-[state=active]:bg-[#357ABD]/10 data-[state=active]:text-[#357ABD] rounded-none h-full"
            data-testid="tab-hymns"
          >
            <Music className="w-4 h-4" />
            Hinos para Oração
          </TabsTrigger>
        </TabsList>

        <TabsContent value="prayer" className="mt-0">
          <ScrollArea className="h-[calc(100vh-140px)]">
            <div className="p-4 space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4">
              Memorial de Oração
            </h2>
            
            <div className="space-y-3">
              {chartData.map((item, index) => (
                <div key={item.name} className="flex items-center gap-3">
                  <span className="text-sm text-slate-600 dark:text-slate-400 w-24">
                    {item.name}
                  </span>
                  <div className="flex-1 h-8 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full flex items-center justify-end pr-2 transition-all duration-300"
                      style={{ 
                        backgroundColor: item.color,
                        width: `${Math.max((item.value / Math.max(totalRequests, 1)) * 100, item.value > 0 ? 10 : 0)}%`
                      }}
                    >
                      {item.value > 0 && (
                        <span className="text-xs font-bold text-white">
                          {item.value}
                        </span>
                      )}
                    </div>
                  </div>
                  {item.value === 0 && (
                    <span className="text-lg font-bold text-slate-400 w-8 text-right">
                      0
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-3">
              Categorias de Oração
            </h2>
            
            <div className="space-y-3">
              {expandedCategory && (() => {
                const category = PRESET_CATEGORIES.find(c => c.key === expandedCategory);
                if (!category) return null;
                const IconComponent = category.icon;
                const requests = getCategoryRequests(category.key);
                const answeredCount = requests.filter(r => r.status === 'answered').length;
                
                return (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className={`rounded-2xl bg-gradient-to-br ${category.bgGradient} text-white shadow-lg overflow-hidden`}
                  >
                    <button
                      onClick={() => toggleExpandCategory(category.key)}
                      className="w-full p-4 text-left flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                          <IconComponent className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-bold text-base">{category.title}</h3>
                          <p className="text-sm text-white/70">
                            {requests.length} pedido{requests.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <X className="w-6 h-6 text-white" />
                    </button>
                    
                    <div className="px-4 pb-4 space-y-3">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Novo pedido de oração..."
                          value={newRequestTitle}
                          onChange={(e) => setNewRequestTitle(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddRequestToExpanded()}
                          className="flex-1 bg-white/20 border-white/30 text-white placeholder:text-white/50"
                          data-testid={`input-request-${category.key}`}
                        />
                        <Button
                          size="icon"
                          onClick={handleAddRequestToExpanded}
                          className="bg-white/20 hover:bg-white/30"
                          disabled={!newRequestTitle.trim()}
                          data-testid={`add-request-${category.key}`}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      {requests.length === 0 ? (
                        <div className="bg-white/10 rounded-xl p-4 text-center">
                          <p className="text-sm text-white/70">Nenhum pedido cadastrado</p>
                          <p className="text-xs text-white/50 mt-1">Digite acima para adicionar</p>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {requests.map((request) => (
                            <div
                              key={request.id}
                              className="flex items-center justify-between bg-white/10 rounded-xl p-3"
                            >
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                                  request.status === 'answered' ? 'bg-green-400' : 'bg-white/60'
                                }`} />
                                <span className={`text-sm truncate ${
                                  request.status === 'answered' ? 'text-white/50 line-through' : 'text-white'
                                }`}>
                                  {request.title}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                {request.status !== 'answered' && (
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => updateRequestMutation.mutate({ id: request.id, status: 'answered' })}
                                    className="h-8 w-8 text-white/70 hover:text-green-300 hover:bg-white/10"
                                    data-testid={`mark-answered-${request.id}`}
                                  >
                                    <Check className="w-4 h-4" />
                                  </Button>
                                )}
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => deleteRequestMutation.mutate(request.id)}
                                  className="h-8 w-8 text-white/70 hover:text-red-300 hover:bg-white/10"
                                  data-testid={`delete-request-${request.id}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })()}
              
              <div className="grid grid-cols-2 gap-3">
                {PRESET_CATEGORIES.filter(c => c.key !== expandedCategory).map((category) => {
                  const IconComponent = category.icon;
                  const requests = getCategoryRequests(category.key);
                  
                  return (
                    <button
                      key={category.key}
                      onClick={() => toggleExpandCategory(category.key)}
                      className={`relative p-4 rounded-2xl bg-gradient-to-br ${category.bgGradient} text-white text-left shadow-lg hover:shadow-xl transition-all active:scale-95`}
                      data-testid={`category-${category.key}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-sm leading-tight">{category.title}</h3>
                          <p className="text-xs text-white/70 mt-0.5">
                            {requests.length === 0 ? 'Toque para adicionar' : `${requests.length} pedido${requests.length !== 1 ? 's' : ''}`}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>


          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                Horários de Oração
              </h2>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowAddAlarmDialog(true)}
                data-testid="button-add-alarm"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-2">
              {localAlarms.map((alarm: typeof DEFAULT_ALARMS[0], index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-700 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-mono font-bold text-[#357ABD]">
                      {alarm.time}
                    </span>
                    <span className="text-slate-600 dark:text-slate-300 text-sm">
                      {alarm.label}
                    </span>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => toggleAlarm(index)}
                    className={alarm.enabled ? "text-[#357ABD]" : "text-slate-300"}
                    data-testid={`button-alarm-${index}`}
                  >
                    {alarm.enabled ? (
                      <Bell className="w-5 h-5" />
                    ) : (
                      <BellOff className="w-5 h-5" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </div>

            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="hymns" className="mt-0">
          <ScrollArea className="h-[calc(100vh-140px)]">
            <div className="p-4 space-y-4">
              <div className="bg-gradient-to-r from-[#357ABD] to-[#4A90D9] rounded-2xl p-6 text-white">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                    <BookOpen className="w-7 h-7" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Hinário Cristão</h2>
                    <p className="text-sm text-white/80">Hinos para sua oração</p>
                  </div>
                </div>
                <p className="text-sm text-white/90">
                  Escolha um hino para meditar durante seu momento de oração.
                </p>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                  <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <Music className="w-5 h-5 text-[#357ABD]" />
                    Hinos Clássicos
                  </h3>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-700">
                  {CLASSIC_HYMNS.map((hymn) => (
                    <div
                      key={hymn.id}
                      className="flex items-center gap-3 p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                      data-testid={`hymn-${hymn.id}`}
                    >
                      <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                          {hymn.number}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-800 dark:text-white truncate">
                          {hymn.title}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {hymn.author}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl p-4 text-center">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Use o temporizador de oração enquanto medita nos hinos
                </p>
                <Button
                  className="mt-3"
                  onClick={() => setShowTimerDialog(true)}
                  data-testid="button-hymns-timer"
                >
                  <Timer className="w-4 h-4 mr-2" />
                  Iniciar Temporizador
                </Button>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>


      <Dialog open={showAddAlarmDialog} onOpenChange={setShowAddAlarmDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Novo Horário de Oração</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                Horário
              </label>
              <Input
                type="time"
                value={newAlarmTime}
                onChange={(e) => setNewAlarmTime(e.target.value)}
                data-testid="input-alarm-time"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                Descrição
              </label>
              <Input
                placeholder="Ex: Oração da Manhã"
                value={newAlarmLabel}
                onChange={(e) => setNewAlarmLabel(e.target.value)}
                data-testid="input-alarm-label"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={addAlarm}
              data-testid="button-save-alarm"
            >
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showTimerDialog} onOpenChange={(open) => {
        if (!open && timerActive) {
          stopTimer();
        } else {
          setShowTimerDialog(open);
        }
      }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">Temporizador de Oração</DialogTitle>
          </DialogHeader>
          <div className="py-6 text-center">
            <div className="text-6xl font-mono font-bold text-[#357ABD] mb-6">
              {formatTime(timerSeconds)}
            </div>
            
            {!timerActive && (
              <div className="mb-6">
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                  Selecione a duração:
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {COUNTDOWN_PRESETS.map((preset) => (
                    <Button
                      key={preset.seconds}
                      size="sm"
                      variant={timerInitialSeconds === preset.seconds ? "default" : "outline"}
                      onClick={() => selectPreset(preset.seconds)}
                      data-testid={`button-preset-${preset.seconds}`}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex justify-center gap-4">
              <Button
                size="lg"
                variant={timerActive ? "secondary" : "default"}
                onClick={() => {
                  if (!timerActive && timerSeconds === 0) {
                    setTimerSeconds(timerInitialSeconds);
                  }
                  setTimerActive(!timerActive);
                }}
                className="w-20"
                data-testid="button-timer-toggle"
              >
                {timerActive ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
              </Button>
              <Button
                size="lg"
                variant="destructive"
                onClick={stopTimer}
                className="w-20"
                data-testid="button-timer-stop"
              >
                <Square className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
