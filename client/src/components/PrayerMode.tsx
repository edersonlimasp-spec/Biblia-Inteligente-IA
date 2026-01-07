import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRequireAuth } from "@/contexts/AuthGateContext";
import { useAuth } from "@/contexts/AuthContext";
import { useDeviceId } from "@/hooks/use-device-id";
import { UserButton } from "@/components/UserButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
  Home,
  Globe,
  Share2,
  Bell,
  BellOff,
  Music,
  ChevronDown,
  ChevronRight,
  Play,
  Pause,
  Check,
  Trash2,
  Edit2,
  Copy,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import type { PrayerList, PrayerRequest, PrayerAlarm } from "@shared/schema";
import { BarChart, Bar, XAxis, Cell, ResponsiveContainer } from "recharts";

interface PrayerModeProps {
  onBack: () => void;
}

const LIST_ICONS = [
  { id: "heart", icon: Heart, label: "Coração" },
  { id: "home", icon: Home, label: "Casa" },
  { id: "globe", icon: Globe, label: "Missões" },
];

const LIST_COLORS = [
  { id: "blue", color: "#3B82F6", bg: "bg-blue-500" },
  { id: "green", color: "#22C55E", bg: "bg-green-500" },
  { id: "orange", color: "#F59E0B", bg: "bg-amber-500" },
  { id: "purple", color: "#8B5CF6", bg: "bg-purple-500" },
  { id: "pink", color: "#EC4899", bg: "bg-pink-500" },
];

const CLASSIC_HYMNS = [
  { id: "1", title: "Mais Perto Quero Estar", audioUrl: "" },
  { id: "2", title: "Se Paz Há Mais Doce", audioUrl: "" },
  { id: "3", title: "Divino Companheiro", audioUrl: "" },
  { id: "4", title: "Quando Jesus Estendeu a Sua Mão", audioUrl: "" },
];

const INSTRUMENTAL_HYMNS = [
  { id: "i1", title: "Piano Suave - Hinos", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
  { id: "i2", title: "Cordas Clássicas", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
  { id: "i3", title: "Ambiente Celestial", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
];

const DEFAULT_ALARMS = [
  { time: "08:00", label: "Oração Matinal", enabled: true },
  { time: "13:00", label: "Intercessão à Tarde", enabled: true },
  { time: "18:00", label: "Oração Vespertina", enabled: true },
  { time: "21:30", label: "Oração Noturna", enabled: true },
];

export function PrayerMode({ onBack }: PrayerModeProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { user } = useAuth();
  const { deviceId } = useDeviceId();
  const { requireAuth } = useRequireAuth();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState<"pedidos" | "hinos">("pedidos");
  const [activeSubTab, setActiveSubTab] = useState<"louvor" | "hinos">("louvor");
  
  const [showAddListDialog, setShowAddListDialog] = useState(false);
  const [showAddAlarmDialog, setShowAddAlarmDialog] = useState(false);
  const [editingList, setEditingList] = useState<PrayerList | null>(null);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  
  const [newListTitle, setNewListTitle] = useState("");
  const [newListIcon, setNewListIcon] = useState("heart");
  const [newListColor, setNewListColor] = useState("#3B82F6");
  
  const [newAlarmTime, setNewAlarmTime] = useState("08:00");
  const [newAlarmLabel, setNewAlarmLabel] = useState("");
  
  const [hymnsOpen, setHymnsOpen] = useState(true);
  const [instrumentalOpen, setInstrumentalOpen] = useState(false);
  
  const [playingTrack, setPlayingTrack] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
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

  const { data: prayerLists = [], isLoading: listsLoading } = useQuery<PrayerList[]>({
    queryKey: ['/api/prayer/lists'],
    enabled: !!(user || deviceId),
  });

  const { data: prayerRequests = [] } = useQuery<PrayerRequest[]>({
    queryKey: ['/api/prayer/requests'],
    enabled: !!(user || deviceId),
  });

  const createListMutation = useMutation({
    mutationFn: async (data: { title: string; icon: string; color: string }) => {
      const response = await apiRequest('POST', '/api/prayer/lists', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/prayer/lists'] });
      setShowAddListDialog(false);
      setNewListTitle("");
      toast({ title: "Lista criada!" });
    },
  });

  const updateListMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; title: string; icon: string; color: string }) => {
      const response = await apiRequest('PATCH', `/api/prayer/lists/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/prayer/lists'] });
      setEditingList(null);
      setNewListTitle("");
      toast({ title: "Lista atualizada!" });
    },
  });

  const deleteListMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/prayer/lists/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/prayer/lists'] });
      toast({ title: "Lista removida!" });
    },
  });

  const stats = {
    answered: prayerRequests.filter(r => r.status === 'answered').length,
    praying: prayerRequests.filter(r => r.status === 'praying').length,
    other: prayerRequests.filter(r => r.status === 'other').length,
  };

  const chartData = [
    { name: 'Respondidos', value: stats.answered, color: '#3B82F6' },
    { name: 'Em Oração', value: stats.praying, color: '#22C55E' },
    { name: 'Outros', value: stats.other, color: '#F59E0B' },
  ];

  const handleShare = async (list: PrayerList) => {
    const shareUrl = `${window.location.origin}/lista/${list.shareId || list.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Orações: ${list.title}`,
          text: 'Compartilhe suas orações com a Bíblia Inteligente',
          url: shareUrl,
        });
      } catch {
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      toast({ title: "Link copiado!" });
    }
  };

  const handlePlayTrack = (trackId: string, audioUrl: string) => {
    if (!audioUrl) {
      toast({ title: "Áudio não disponível", variant: "destructive" });
      return;
    }

    if (playingTrack === trackId) {
      audioRef.current?.pause();
      setPlayingTrack(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(audioUrl);
    audio.onended = () => setPlayingTrack(null);
    audio.play().then(() => {
      audioRef.current = audio;
      setPlayingTrack(trackId);
    }).catch(() => {
      toast({ title: "Erro ao reproduzir", variant: "destructive" });
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

  const getListIcon = (iconId: string) => {
    const item = LIST_ICONS.find(i => i.id === iconId);
    return item?.icon || Heart;
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900">
      <header className="sticky top-0 z-50 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" size="icon" onClick={onBack} data-testid="button-back">
            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </Button>
          
          <div className="flex bg-slate-100 dark:bg-slate-700 rounded-full p-1">
            <button
              onClick={() => setActiveTab("pedidos")}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                activeTab === "pedidos"
                  ? "bg-[#357ABD] text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-300"
              }`}
              data-testid="tab-pedidos"
            >
              Pedidos
            </button>
            <button
              onClick={() => setActiveTab("hinos")}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                activeTab === "hinos"
                  ? "bg-[#357ABD] text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-300"
              }`}
              data-testid="tab-hinos"
            >
              Hinos
            </button>
          </div>
          
          <UserButton />
        </div>
      </header>

      <ScrollArea className="h-[calc(100vh-80px)]">
        <div className="p-4 space-y-4">
          <AnimatePresence mode="wait">
            {activeTab === "pedidos" ? (
              <motion.div
                key="pedidos"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                      Minhas Listas de Oração
                    </h2>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowAddListDialog(true)}
                      data-testid="button-add-list"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {prayerLists.length === 0 && !listsLoading && (
                      <div className="text-center py-6 text-slate-500">
                        <Heart className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p>Crie sua primeira lista de oração</p>
                      </div>
                    )}
                    
                    {prayerLists.map((list) => {
                      const IconComponent = getListIcon(list.icon);
                      return (
                        <motion.div
                          key={list.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center justify-between p-3 rounded-xl"
                          style={{ backgroundColor: `${list.color}15` }}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center"
                              style={{ backgroundColor: list.color }}
                            >
                              <IconComponent className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-medium text-slate-800 dark:text-white">
                              {list.title}
                            </span>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-slate-400 hover:text-slate-600"
                            onClick={() => handleShare(list)}
                            data-testid={`button-share-${list.id}`}
                          >
                            <Share2 className="w-5 h-5" />
                          </Button>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm">
                  <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4">
                    Louvor & Hinos
                  </h2>
                  
                  <Collapsible open={hymnsOpen} onOpenChange={setHymnsOpen}>
                    <CollapsibleTrigger className="flex items-center gap-2 w-full p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors">
                      <Music className="w-5 h-5 text-[#357ABD]" />
                      <span className="font-medium text-[#357ABD]">Hinos Clássicos</span>
                      {hymnsOpen ? (
                        <ChevronDown className="w-4 h-4 ml-auto text-slate-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 ml-auto text-slate-400" />
                      )}
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pl-4 mt-2 space-y-1">
                      {CLASSIC_HYMNS.map((hymn) => (
                        <div
                          key={hymn.id}
                          className="flex items-center gap-2 py-2 text-slate-600 dark:text-slate-300"
                        >
                          <span className="text-slate-400">•</span>
                          <span>{hymn.title}</span>
                        </div>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>

                  <Collapsible open={instrumentalOpen} onOpenChange={setInstrumentalOpen} className="mt-2">
                    <CollapsibleTrigger className="flex items-center gap-2 w-full p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors">
                      <Music className="w-5 h-5 text-slate-500" />
                      <span className="font-medium text-slate-700 dark:text-slate-300">Instrumentais</span>
                      {instrumentalOpen ? (
                        <ChevronDown className="w-4 h-4 ml-auto text-slate-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 ml-auto text-slate-400" />
                      )}
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pl-4 mt-2 space-y-1">
                      {INSTRUMENTAL_HYMNS.map((hymn) => (
                        <button
                          key={hymn.id}
                          onClick={() => handlePlayTrack(hymn.id, hymn.audioUrl)}
                          className="flex items-center gap-2 py-2 w-full text-left text-slate-600 dark:text-slate-300 hover:text-[#357ABD]"
                        >
                          {playingTrack === hymn.id ? (
                            <Pause className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                          <span>{hymn.title}</span>
                        </button>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="hinos"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="flex bg-slate-200 dark:bg-slate-700 rounded-full p-1 mb-4">
                  <button
                    onClick={() => setActiveSubTab("louvor")}
                    className={`flex-1 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      activeSubTab === "louvor"
                        ? "bg-[#357ABD] text-white"
                        : "text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    Louvor
                  </button>
                  <button
                    onClick={() => setActiveSubTab("hinos")}
                    className={`flex-1 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      activeSubTab === "hinos"
                        ? "bg-[#357ABD] text-white"
                        : "text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    Hinos
                  </button>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm">
                  <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4">
                    Dashboard de Oração
                  </h2>
                  
                  <div className="space-y-3">
                    {chartData.map((item, index) => (
                      <div key={item.name} className="flex items-center gap-3">
                        <div className="flex-1 h-6 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.max((item.value / Math.max(stats.answered + stats.praying + stats.other, 1)) * 100, 5)}%` }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                        </div>
                        <span className="text-lg font-bold text-slate-700 dark:text-slate-300 w-8 text-right">
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                      Lista de Pedidos
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
                          <span className="text-slate-600 dark:text-slate-300">
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

                <div className="bg-gradient-to-r from-[#357ABD] to-[#4A90D9] rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                        <Plus className="w-6 h-6 text-white" />
                      </div>
                      <span className="font-medium text-white">
                        Compartilhe suas Orações!
                      </span>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-white hover:bg-white/20"
                      onClick={() => {
                        if (navigator.share) {
                          navigator.share({
                            title: 'Minhas Orações',
                            text: 'Compartilhe suas orações com a Bíblia Inteligente',
                            url: window.location.origin,
                          });
                        }
                      }}
                    >
                      <Share2 className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>

      <Dialog open={showAddListDialog || !!editingList} onOpenChange={(open) => {
        if (!open) {
          setShowAddListDialog(false);
          setEditingList(null);
          setNewListTitle("");
        }
      }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {editingList ? "Editar Lista" : "Nova Lista de Oração"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="Nome da lista"
              value={newListTitle}
              onChange={(e) => setNewListTitle(e.target.value)}
              data-testid="input-list-title"
            />
            
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                Ícone
              </label>
              <div className="flex gap-2">
                {LIST_ICONS.map((item) => {
                  const IconComp = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setNewListIcon(item.id)}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center border-2 transition-all ${
                        newListIcon === item.id
                          ? "border-[#357ABD] bg-[#357ABD]/10"
                          : "border-slate-200 dark:border-slate-600"
                      }`}
                    >
                      <IconComp className="w-5 h-5" />
                    </button>
                  );
                })}
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                Cor
              </label>
              <div className="flex gap-2">
                {LIST_COLORS.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setNewListColor(item.color)}
                    className={`w-8 h-8 rounded-full transition-all ${item.bg} ${
                      newListColor === item.color
                        ? "ring-2 ring-offset-2 ring-slate-400"
                        : ""
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                if (!newListTitle.trim()) {
                  toast({ title: "Informe um nome", variant: "destructive" });
                  return;
                }
                if (editingList) {
                  updateListMutation.mutate({
                    id: editingList.id,
                    title: newListTitle,
                    icon: newListIcon,
                    color: newListColor,
                  });
                } else {
                  createListMutation.mutate({
                    title: newListTitle,
                    icon: newListIcon,
                    color: newListColor,
                  });
                }
              }}
              disabled={createListMutation.isPending || updateListMutation.isPending}
              data-testid="button-save-list"
            >
              {editingList ? "Salvar" : "Criar Lista"}
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
    </div>
  );
}
