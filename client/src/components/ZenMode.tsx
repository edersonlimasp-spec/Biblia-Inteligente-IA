import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { 
  ArrowLeft, 
  Play, 
  Pause, 
  RotateCcw,
  Volume2,
  VolumeX,
  Moon,
  Sun,
  CloudRain,
  TreePine,
  Waves,
  Flame,
  Wind,
  Bird
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ZenModeProps {
  onBack: () => void;
  initialBook?: string;
  initialChapter?: number;
}

const AMBIENT_SOUNDS = [
  { id: "rain", name: "Chuva", icon: CloudRain, color: "text-blue-400" },
  { id: "forest", name: "Floresta", icon: TreePine, color: "text-emerald-500" },
  { id: "ocean", name: "Oceano", icon: Waves, color: "text-cyan-500" },
  { id: "fireplace", name: "Lareira", icon: Flame, color: "text-orange-500" },
  { id: "wind", name: "Vento", icon: Wind, color: "text-gray-400" },
  { id: "birds", name: "Pássaros", icon: Bird, color: "text-yellow-500" },
];

const TIMER_PRESETS = [5, 10, 15, 20, 25, 30, 45, 60];

export function ZenMode({ onBack, initialBook, initialChapter }: ZenModeProps) {
  const [selectedSound, setSelectedSound] = useState<string | null>("rain");
  const [volume, setVolume] = useState(50);
  const [isMuted, setIsMuted] = useState(false);
  const [timerMinutes, setTimerMinutes] = useState(15);
  const [timeRemaining, setTimeRemaining] = useState(15 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const progress = ((timerMinutes * 60 - timeRemaining) / (timerMinutes * 60)) * 100;

  useEffect(() => {
    if (isRunning && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            setIsCompleted(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeRemaining]);

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-purple-950/20 dark:to-purple-900/10">
      <header className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b">
        <div className="flex items-center justify-between p-4 max-w-2xl mx-auto">
          <Button variant="ghost" size="icon" onClick={onBack} data-testid="button-back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold flex items-center gap-2">
            <Moon className="w-5 h-5 text-purple-500" />
            Modo Zen
          </h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative"
        >
          <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent overflow-hidden">
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
                    stroke="url(#gradient)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 120}
                    strokeDashoffset={2 * Math.PI * 120 * (1 - progress / 100)}
                    className="transition-all duration-1000"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#6366f1" />
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
                        <Sun className="w-16 h-16 text-amber-500 mx-auto mb-2" />
                        <p className="text-lg font-medium text-amber-500">Sessão Completa!</p>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="timer"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <span className="text-5xl font-mono font-bold">
                          {formatTime(timeRemaining)}
                        </span>
                        <p className="text-sm text-muted-foreground mt-2">
                          {isRunning ? "Focando..." : "Pronto para começar"}
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
                    className="w-14 h-14 rounded-full bg-purple-600 hover:bg-purple-700"
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
            <CardTitle className="text-base">Duração da Sessão</CardTitle>
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

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Som Ambiente</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMuted(!isMuted)}
                data-testid="button-mute"
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {AMBIENT_SOUNDS.map((sound) => (
                <Button
                  key={sound.id}
                  variant={selectedSound === sound.id ? "default" : "outline"}
                  className="h-auto p-3 flex flex-col items-center gap-1"
                  onClick={() => setSelectedSound(sound.id)}
                  data-testid={`button-sound-${sound.id}`}
                >
                  <sound.icon className={`w-5 h-5 ${selectedSound === sound.id ? "" : sound.color}`} />
                  <span className="text-xs">{sound.name}</span>
                </Button>
              ))}
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

        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Moon className="w-5 h-5 text-purple-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Dica de Estudo</p>
                <p className="text-sm text-muted-foreground">
                  Use o Modo Zen para meditar em passagens específicas. A concentração profunda 
                  ajuda na memorização e compreensão das Escrituras.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
