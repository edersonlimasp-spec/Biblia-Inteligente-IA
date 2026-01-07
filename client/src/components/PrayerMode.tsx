import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useDeviceId } from "@/hooks/use-device-id";
import { UserButton } from "@/components/UserButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import type { PrayerList, PrayerRequest } from "@shared/schema";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, LabelList } from "recharts";

interface PrayerModeProps {
  onBack: () => void;
  onNavigateToHymns?: () => void;
}

const PRESET_CATEGORIES = [
  { 
    key: "family", 
    title: "Família e Vida Sentimental", 
    icon: Heart, 
    color: "#EC4899",
    bgGradient: "from-pink-500 to-pink-600"
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

export function PrayerMode({ onBack, onNavigateToHymns }: PrayerModeProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { user } = useAuth();
  const { deviceId } = useDeviceId();
  const queryClient = useQueryClient();
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showAddRequestDialog, setShowAddRequestDialog] = useState(false);
  const [showTimerDialog, setShowTimerDialog] = useState(false);
  const [showAddAlarmDialog, setShowAddAlarmDialog] = useState(false);
  
  const [newRequestTitle, setNewRequestTitle] = useState("");
  const [newRequestDescription, setNewRequestDescription] = useState("");
  
  const [newAlarmTime, setNewAlarmTime] = useState("08:00");
  const [newAlarmLabel, setNewAlarmLabel] = useState("");
  
  const [timerActive, setTimerActive] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
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
    if (timerActive) {
      timerRef.current = setInterval(() => {
        setTimerSeconds(s => s + 1);
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
      setShowAddRequestDialog(false);
      setNewRequestTitle("");
      setNewRequestDescription("");
      toast({ title: "Pedido adicionado!" });
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

  const handleCategoryClick = async (categoryKey: string) => {
    const list = await getOrCreateCategoryList(categoryKey);
    if (list) {
      setSelectedCategory(categoryKey);
    }
  };

  const getCategoryRequests = (categoryKey: string) => {
    const list = prayerLists.find(l => l.categoryKey === categoryKey);
    if (!list) return [];
    return prayerRequests.filter(r => r.listId === list.id);
  };

  const handleAddRequest = async () => {
    if (!newRequestTitle.trim()) {
      toast({ title: "Informe um título", variant: "destructive" });
      return;
    }
    
    const list = prayerLists.find(l => l.categoryKey === selectedCategory);
    if (!list) {
      toast({ title: "Categoria não encontrada", variant: "destructive" });
      return;
    }
    
    createRequestMutation.mutate({
      listId: list.id,
      title: newRequestTitle,
      description: newRequestDescription || undefined,
    });
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

  const startTimer = () => {
    setTimerActive(true);
    setShowTimerDialog(true);
  };

  const stopTimer = () => {
    setTimerActive(false);
    if (timerSeconds > 0) {
      toast({ 
        title: `Oração finalizada!`, 
        description: `Tempo: ${formatTime(timerSeconds)}` 
      });
    }
    setTimerSeconds(0);
    setShowTimerDialog(false);
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
              onClick={startTimer}
              className="text-[#357ABD]"
              data-testid="button-timer"
            >
              <Timer className="w-5 h-5" />
            </Button>
            <UserButton />
          </div>
        </div>
      </header>

      <ScrollArea className="h-[calc(100vh-80px)]">
        <div className="p-4 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm"
          >
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4">
              Dashboard de Oração
            </h2>
            
            <div className="space-y-3">
              {chartData.map((item, index) => (
                <div key={item.name} className="flex items-center gap-3">
                  <span className="text-sm text-slate-600 dark:text-slate-400 w-24">
                    {item.name}
                  </span>
                  <div className="flex-1 h-8 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max((item.value / Math.max(totalRequests, 1)) * 100, item.value > 0 ? 10 : 0)}%` }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="h-full rounded-full flex items-center justify-end pr-2"
                      style={{ backgroundColor: item.color }}
                    >
                      {item.value > 0 && (
                        <span className="text-xs font-bold text-white">
                          {item.value}
                        </span>
                      )}
                    </motion.div>
                  </div>
                  {item.value === 0 && (
                    <span className="text-lg font-bold text-slate-400 w-8 text-right">
                      0
                    </span>
                  )}
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-3">
              Categorias de Oração
            </h2>
            
            <div className="grid grid-cols-2 gap-3">
              {PRESET_CATEGORIES.map((category, index) => {
                const IconComponent = category.icon;
                const requests = getCategoryRequests(category.key);
                const answeredCount = requests.filter(r => r.status === 'answered').length;
                
                return (
                  <motion.button
                    key={category.key}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                    onClick={() => handleCategoryClick(category.key)}
                    className={`relative p-4 rounded-2xl bg-gradient-to-br ${category.bgGradient} text-white text-left shadow-lg hover:shadow-xl transition-all active:scale-95`}
                    data-testid={`category-${category.key}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <ChevronRight className="w-5 h-5 opacity-70" />
                    </div>
                    <h3 className="font-semibold text-sm leading-tight mb-2">
                      {category.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs opacity-80">
                      <span>{requests.length} pedidos</span>
                      {answeredCount > 0 && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            {answeredCount}
                          </span>
                        </>
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <Church className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                    Lista de Oração Igreja
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Motivos da igreja, missões e membros
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={async () => {
                  if (!churchList) {
                    await createListMutation.mutateAsync({
                      title: "Lista de Oração Igreja",
                      icon: "church",
                      color: "#10B981",
                      listType: 'church',
                    });
                  }
                  setSelectedCategory('church');
                }}
                data-testid="button-add-church-request"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            
            {churchRequests.length === 0 ? (
              <div className="text-center py-6 text-slate-500">
                <Globe className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Adicione pedidos de oração da igreja</p>
              </div>
            ) : (
              <div className="space-y-2">
                {churchRequests.slice(0, 3).map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        request.status === 'answered' ? 'bg-green-500' : 'bg-blue-500'
                      }`} />
                      <span className="text-sm text-slate-700 dark:text-slate-200">
                        {request.title}
                      </span>
                    </div>
                    {request.status === 'answered' && (
                      <Check className="w-4 h-4 text-green-500" />
                    )}
                  </div>
                ))}
                {churchRequests.length > 3 && (
                  <button
                    onClick={() => setSelectedCategory('church')}
                    className="w-full text-center text-sm text-[#357ABD] py-2"
                  >
                    Ver todos ({churchRequests.length})
                  </button>
                )}
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm"
          >
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
          </motion.div>

          {onNavigateToHymns && (
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              onClick={onNavigateToHymns}
              className="w-full bg-gradient-to-r from-[#357ABD] to-[#4A90D9] rounded-2xl p-4 shadow-lg text-left"
              data-testid="button-navigate-hymns"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Timer className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-white">Hinos para Oração</h3>
                  <p className="text-sm text-white/80">
                    Ouça hinos instrumentais com temporizador
                  </p>
                </div>
                <ChevronRight className="w-6 h-6 text-white/70" />
              </div>
            </motion.button>
          )}
        </div>
      </ScrollArea>

      <AnimatePresence>
        {selectedCategory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50"
            onClick={() => setSelectedCategory(null)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-800 rounded-t-3xl max-h-[80vh] overflow-hidden"
            >
              <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                    {selectedCategory === 'church' 
                      ? 'Lista de Oração Igreja'
                      : PRESET_CATEGORIES.find(c => c.key === selectedCategory)?.title
                    }
                  </h2>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => setShowAddRequestDialog(true)}
                      data-testid="button-add-request"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Adicionar
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setSelectedCategory(null)}
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </div>
              
              <ScrollArea className="max-h-[60vh]">
                <div className="p-4 space-y-3">
                  {(selectedCategory === 'church' ? churchRequests : getCategoryRequests(selectedCategory)).length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <Heart className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>Nenhum pedido de oração</p>
                      <p className="text-sm">Toque em "Adicionar" para criar</p>
                    </div>
                  ) : (
                    (selectedCategory === 'church' ? churchRequests : getCategoryRequests(selectedCategory)).map((request) => (
                      <motion.div
                        key={request.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-700 rounded-xl"
                      >
                        <button
                          onClick={() => updateRequestMutation.mutate({
                            id: request.id,
                            status: request.status === 'answered' ? 'praying' : 'answered'
                          })}
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                            request.status === 'answered'
                              ? 'bg-green-500 border-green-500'
                              : 'border-slate-300 dark:border-slate-500'
                          }`}
                        >
                          {request.status === 'answered' && (
                            <Check className="w-4 h-4 text-white" />
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium ${
                            request.status === 'answered'
                              ? 'text-slate-400 line-through'
                              : 'text-slate-800 dark:text-white'
                          }`}>
                            {request.title}
                          </p>
                          {request.description && (
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                              {request.description}
                            </p>
                          )}
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-slate-400 hover:text-red-500 flex-shrink-0"
                          onClick={() => deleteRequestMutation.mutate(request.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </motion.div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog open={showAddRequestDialog} onOpenChange={setShowAddRequestDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Novo Pedido de Oração</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="Título do pedido"
              value={newRequestTitle}
              onChange={(e) => setNewRequestTitle(e.target.value)}
              data-testid="input-request-title"
            />
            <Input
              placeholder="Descrição (opcional)"
              value={newRequestDescription}
              onChange={(e) => setNewRequestDescription(e.target.value)}
              data-testid="input-request-description"
            />
          </div>
          <DialogFooter>
            <Button
              onClick={handleAddRequest}
              disabled={createRequestMutation.isPending}
              data-testid="button-save-request"
            >
              Adicionar Pedido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
          <div className="py-8 text-center">
            <div className="text-6xl font-mono font-bold text-[#357ABD] mb-8">
              {formatTime(timerSeconds)}
            </div>
            <div className="flex justify-center gap-4">
              <Button
                size="lg"
                variant={timerActive ? "secondary" : "default"}
                onClick={() => setTimerActive(!timerActive)}
                className="w-20"
              >
                {timerActive ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
              </Button>
              <Button
                size="lg"
                variant="destructive"
                onClick={stopTimer}
                className="w-20"
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
