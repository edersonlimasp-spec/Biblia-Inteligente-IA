import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  ArrowLeft, 
  Music,
  ChevronDown,
  ChevronRight,
  Play,
  Pause,
  Square,
  Timer,
  Volume2,
  VolumeX,
  Download,
  Heart
} from "lucide-react";
import { motion } from "framer-motion";
import { UserButton } from "@/components/UserButton";
import { Slider } from "@/components/ui/slider";

interface HymnsPageProps {
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
];

const INSTRUMENTAL_HYMNS = [
  { 
    id: "i1", 
    title: "Piano Suave - Meditação", 
    duration: "15:00",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" 
  },
  { 
    id: "i2", 
    title: "Cordas Celestiais", 
    duration: "12:30",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" 
  },
  { 
    id: "i3", 
    title: "Ambiente de Adoração", 
    duration: "20:00",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" 
  },
  { 
    id: "i4", 
    title: "Flauta e Harpa", 
    duration: "10:45",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3" 
  },
  { 
    id: "i5", 
    title: "Piano Clássico - Hinos", 
    duration: "18:20",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3" 
  },
];

export default function HymnsPage({ onBack }: HymnsPageProps) {
  const { toast } = useToast();
  
  const [classicOpen, setClassicOpen] = useState(true);
  const [instrumentalOpen, setInstrumentalOpen] = useState(true);
  
  const [playingTrack, setPlayingTrack] = useState<string | null>(null);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const [showTimerDialog, setShowTimerDialog] = useState(false);
  const [timerActive, setTimerActive] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

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
    audio.volume = isMuted ? 0 : volume;
    audio.onended = () => setPlayingTrack(null);
    audio.play().then(() => {
      audioRef.current = audio;
      setPlayingTrack(trackId);
      
      if (!timerActive && !showTimerDialog) {
        setShowTimerDialog(true);
        setTimerActive(true);
      }
    }).catch(() => {
      toast({ title: "Erro ao reproduzir", variant: "destructive" });
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const stopTimer = () => {
    setTimerActive(false);
    if (timerSeconds > 0) {
      toast({ 
        title: `Tempo de oração: ${formatTime(timerSeconds)}`, 
        description: "Que Deus abençoe sua vida!" 
      });
    }
    setTimerSeconds(0);
    setShowTimerDialog(false);
    
    if (audioRef.current) {
      audioRef.current.pause();
      setPlayingTrack(null);
    }
  };

  const stopMusic = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setPlayingTrack(null);
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900">
      <header className="sticky top-0 z-50 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" size="icon" onClick={onBack} data-testid="button-back">
            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </Button>
          
          <h1 className="text-lg font-bold text-slate-800 dark:text-white">
            Hinos para Oração
          </h1>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowTimerDialog(true)}
              className={timerActive ? "text-green-500" : "text-[#357ABD]"}
              data-testid="button-timer"
            >
              <Timer className="w-5 h-5" />
            </Button>
            <UserButton />
          </div>
        </div>
      </header>

      {playingTrack && (
        <div className="sticky top-[73px] z-40 bg-gradient-to-r from-[#357ABD] to-[#4A90D9] p-3 shadow-lg">
          <div className="flex items-center gap-3">
            <Button
              size="icon"
              variant="ghost"
              onClick={stopMusic}
              className="text-white hover:bg-white/20"
              data-testid="button-stop-music"
            >
              <Square className="w-5 h-5" />
            </Button>
            
            <div className="flex-1">
              <p className="text-white text-sm font-medium truncate">
                {INSTRUMENTAL_HYMNS.find(h => h.id === playingTrack)?.title || "Reproduzindo..."}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Slider
                  value={[volume * 100]}
                  onValueChange={(v) => setVolume(v[0] / 100)}
                  max={100}
                  step={1}
                  className="w-24"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setIsMuted(!isMuted)}
                  className="text-white hover:bg-white/20 h-6 w-6"
                  data-testid="button-mute-toggle"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            
            {timerActive && (
              <div className="text-white font-mono font-bold">
                {formatTime(timerSeconds)}
              </div>
            )}
          </div>
        </div>
      )}

      <ScrollArea className={`h-[calc(100vh-${playingTrack ? '145px' : '80px'})]`}>
        <div className="p-4 space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm"
          >
            <Collapsible open={instrumentalOpen} onOpenChange={setInstrumentalOpen}>
              <CollapsibleTrigger className="flex items-center gap-3 w-full p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors">
                <div className="w-10 h-10 bg-gradient-to-br from-[#357ABD] to-[#4A90D9] rounded-xl flex items-center justify-center">
                  <Music className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <h2 className="font-bold text-slate-800 dark:text-white">
                    Hinos Instrumentais
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Para oração e meditação
                  </p>
                </div>
                {instrumentalOpen ? (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                )}
              </CollapsibleTrigger>
              
              <CollapsibleContent className="mt-3 space-y-2">
                {INSTRUMENTAL_HYMNS.map((hymn, index) => (
                  <motion.button
                    key={hymn.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handlePlayTrack(hymn.id, hymn.audioUrl)}
                    className={`flex items-center gap-3 w-full p-3 rounded-xl transition-all ${
                      playingTrack === hymn.id 
                        ? 'bg-[#357ABD]/10 border-2 border-[#357ABD]'
                        : 'bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600'
                    }`}
                    data-testid={`hymn-instrumental-${hymn.id}`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      playingTrack === hymn.id ? 'bg-[#357ABD]' : 'bg-slate-200 dark:bg-slate-600'
                    }`}>
                      {playingTrack === hymn.id ? (
                        <Pause className="w-5 h-5 text-white" />
                      ) : (
                        <Play className="w-5 h-5 text-slate-600 dark:text-slate-300 ml-0.5" />
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-slate-800 dark:text-white">
                        {hymn.title}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Duração: {hymn.duration}
                      </p>
                    </div>
                    {playingTrack === hymn.id && (
                      <div className="flex gap-1">
                        <span className="w-1 h-4 bg-[#357ABD] rounded-full animate-pulse" />
                        <span className="w-1 h-4 bg-[#357ABD] rounded-full animate-pulse delay-75" />
                        <span className="w-1 h-4 bg-[#357ABD] rounded-full animate-pulse delay-150" />
                      </div>
                    )}
                  </motion.button>
                ))}
              </CollapsibleContent>
            </Collapsible>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm"
          >
            <Collapsible open={classicOpen} onOpenChange={setClassicOpen}>
              <CollapsibleTrigger className="flex items-center gap-3 w-full p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center">
                  <Heart className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <h2 className="font-bold text-slate-800 dark:text-white">
                    Hinos Clássicos
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Letras para louvor e adoração
                  </p>
                </div>
                {classicOpen ? (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                )}
              </CollapsibleTrigger>
              
              <CollapsibleContent className="mt-3 space-y-2">
                {CLASSIC_HYMNS.map((hymn, index) => (
                  <motion.div
                    key={hymn.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700 rounded-xl"
                  >
                    <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                      <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                        {hymn.number}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-800 dark:text-white">
                        {hymn.title}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {hymn.author}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl p-4 shadow-lg"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Download className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-white">Em breve: Downloads</h3>
                <p className="text-sm text-white/80">
                  Baixe hinos para ouvir offline
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </ScrollArea>

      <Dialog open={showTimerDialog} onOpenChange={(open) => {
        if (!open && timerActive) {
          setShowTimerDialog(false);
        } else {
          setShowTimerDialog(open);
        }
      }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">Temporizador de Oração</DialogTitle>
          </DialogHeader>
          <div className="py-8 text-center">
            <div className="text-6xl font-mono font-bold text-[#357ABD] mb-4">
              {formatTime(timerSeconds)}
            </div>
            
            {playingTrack && (
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                Ouvindo: {INSTRUMENTAL_HYMNS.find(h => h.id === playingTrack)?.title}
              </p>
            )}
            
            <div className="flex justify-center gap-4">
              <Button
                size="lg"
                variant={timerActive ? "secondary" : "default"}
                onClick={() => setTimerActive(!timerActive)}
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
