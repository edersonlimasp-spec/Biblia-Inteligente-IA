import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, Lock, BookOpen, ChevronRight, Check, Clock, Crown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { getDeviceId } from "@/hooks/use-device-id";

interface ModuleDetailScreenProps {
  moduleId: string;
  onBack: () => void;
  onNavigateToLesson: (lessonId: string, trackLevel: string) => void;
  onNavigateToSubscriptions: () => void;
}

interface Track {
  id: string;
  level: string;
  name: string;
  description: string;
  requiredPlan: string;
  order: number;
  totalLessons: number;
  completedLessons: number;
  percentage: number;
}

interface Lesson {
  id: string;
  title: string;
  estimatedMinutes: number;
  order: number;
  completed: boolean;
  lastAccessAt: string | null;
}

interface ModuleDetail {
  module: {
    id: string;
    name: string;
    description: string;
    icon: string;
    color: string;
  };
  tracks: Track[];
  progress: {
    total: number;
    completed: number;
    percentage: number;
  };
}

const LEVEL_CONFIG: Record<string, { label: string; color: string; badgeClass: string }> = {
  iniciante: { 
    label: "Iniciante", 
    color: "text-green-600", 
    badgeClass: "bg-green-500/10 text-green-600 border-green-500/30" 
  },
  moderado: { 
    label: "Moderado", 
    color: "text-amber-600", 
    badgeClass: "bg-amber-500/10 text-amber-600 border-amber-500/30" 
  },
  avancado: { 
    label: "Avançado", 
    color: "text-red-600", 
    badgeClass: "bg-red-500/10 text-red-600 border-red-500/30" 
  },
};

function TrackCard({ 
  track, 
  userPlan,
  isAdmin,
  onLessonClick,
  onUnlock
}: { 
  track: Track; 
  userPlan: string | null;
  isAdmin: boolean;
  onLessonClick: (lessonId: string) => void;
  onUnlock: () => void;
}) {
  const levelConfig = LEVEL_CONFIG[track.level] || LEVEL_CONFIG.iniciante;
  // Usa track.level para determinar acesso (não requiredPlan que pode estar errado nos dados)
  const canAccess = canAccessLesson(track.level, userPlan, isAdmin);
  
  // Sempre buscar lições - todos podem VER a lista
  const { data: lessonsData, isLoading } = useQuery<{ lessons: Lesson[] }>({
    queryKey: ['/api/study/tracks', track.id],
  });
  
  const lessons = lessonsData?.lessons || [];
  
  // Ao clicar na aula: se não tem acesso, mostra modal de assinatura
  const handleLessonClick = (lessonId: string) => {
    if (canAccess) {
      onLessonClick(lessonId);
    } else {
      onUnlock(); // Redireciona para tela de assinatura
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
      data-testid={`track-card-${track.id}`}
    >
      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          <Badge variant="outline" className={levelConfig.badgeClass}>
            {levelConfig.label}
          </Badge>
          <h3 className="font-semibold truncate">{track.name}</h3>
          {!canAccess && (
            <Badge variant="outline" className="text-xs border-amber-500/30 text-amber-600">
              <Crown className="w-3 h-3 mr-1" />
              Gold
            </Badge>
          )}
        </div>
        {track.totalLessons > 0 && (
          <span className="text-xs text-muted-foreground flex-shrink-0">
            {track.completedLessons}/{track.totalLessons}
          </span>
        )}
      </div>
      
      <p className="text-sm text-muted-foreground mb-3 break-words">{track.description}</p>
      
      {/* Sempre mostra lista de aulas - bloqueio é no clique */}
      <div className="space-y-2">
        {isLoading ? (
          <>
            <LessonItemSkeleton />
            <LessonItemSkeleton />
          </>
        ) : (
          lessons.map((lesson) => (
            <LessonItem 
              key={lesson.id} 
              lesson={lesson} 
              onClick={() => handleLessonClick(lesson.id)}
              isLocked={!canAccess}
            />
          ))
        )}
        {!isLoading && track.percentage > 0 && (
          <div className="pt-2">
            <Progress value={track.percentage} className="h-1.5" />
          </div>
        )}
      </div>
    </motion.div>
  );
}

function LessonItem({ lesson, onClick, isLocked = false }: { lesson: Lesson; onClick: () => void; isLocked?: boolean }) {
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 p-3 rounded-lg bg-card border cursor-pointer hover-elevate active-elevate-2"
      data-testid={`lesson-item-${lesson.id}`}
    >
      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
        lesson.completed 
          ? 'bg-green-500 text-white' 
          : isLocked
            ? 'bg-amber-500/20'
            : 'bg-muted'
      }`}>
        {lesson.completed ? (
          <Check className="w-4 h-4" />
        ) : isLocked ? (
          <Lock className="w-3 h-3 text-amber-600" />
        ) : (
          <span className="text-sm font-medium">{lesson.order}</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm truncate">{lesson.title}</h4>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span>{lesson.estimatedMinutes} min</span>
        </div>
      </div>
      {isLocked ? (
        <Crown className="w-4 h-4 text-amber-500" />
      ) : (
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      )}
    </div>
  );
}

function LessonItemSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-card border">
      <Skeleton className="w-8 h-8 rounded-full" />
      <div className="flex-1">
        <Skeleton className="h-4 w-3/4 mb-1" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}

// Regras de acesso às AULAS:
// - FREE: Acesso TOTAL aos conteúdos INICIANTES (level = 'iniciante')
// - PREMIUM: Pode VER lista de aulas, mas NÃO pode abrir aulas moderado/avançado
// - GOLD: Acesso TOTAL a tudo
// IMPORTANTE: Usa o campo 'level' do track, não o 'requiredPlan' (que pode estar incorreto nos dados)
function canAccessLesson(trackLevel: string, userPlan: string | null, isAdmin: boolean = false): boolean {
  if (isAdmin) return true;
  // Gold tem acesso total
  if (userPlan === 'gold') return true;
  // Conteúdo iniciante é acessível por TODOS (FREE, PREMIUM, sem plano)
  if (trackLevel === 'iniciante') return true;
  // Módulos moderado/avançado - somente Gold pode abrir aulas
  return false;
}

interface SubscriptionStatus {
  hasGold?: boolean;
  hasPremium?: boolean;
  trialActive?: boolean;
}

interface GuestTrialInfo {
  active: boolean;
  daysRemaining: number;
}

export function ModuleDetailScreen({ 
  moduleId, 
  onBack, 
  onNavigateToLesson,
  onNavigateToSubscriptions 
}: ModuleDetailScreenProps) {
  const { user, isAdmin } = useAuth();
  const deviceId = getDeviceId();
  
  const { data: moduleDetail, isLoading: moduleLoading } = useQuery<ModuleDetail>({
    queryKey: ['/api/study/modules', moduleId],
  });

  const { data: subscriptionData } = useQuery<SubscriptionStatus>({
    queryKey: ['/api/user/subscription-status'],
    enabled: !!user,
  });

  // Fetch guest trial info when not logged in
  const { data: guestTrialData } = useQuery<GuestTrialInfo>({
    queryKey: ['/api/guest/trial', deviceId],
    enabled: !user && !!deviceId,
  });

  // Determine user plan: logged in user's subscription OR guest with active trial gets 'gold' access
  // GOLD = acesso total, PREMIUM = acesso moderado/avançado bloqueado
  const userPlan = user 
    ? (subscriptionData?.hasGold ? 'gold' : subscriptionData?.hasPremium ? 'premium' : null)
    : (guestTrialData?.active ? 'gold' : null);

  if (moduleLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Skeleton className="h-6 w-48" />
          </div>
        </header>
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  const module = moduleDetail?.module;
  const tracks = moduleDetail?.tracks || [];
  const progress = moduleDetail?.progress;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onBack}
            data-testid="button-back-module-detail"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-serif font-bold truncate">{module?.name}</h1>
            <p className="text-xs text-muted-foreground">
              {progress?.completed}/{progress?.total} lições concluídas
            </p>
          </div>
        </div>
      </header>

      <ScrollArea className="h-[calc(100vh-60px)]">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl p-4 mb-6 text-white"
            style={{ background: `linear-gradient(135deg, ${module?.color} 0%, ${module?.color}cc 100%)` }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <BookOpen className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h2 className="font-bold">{module?.name}</h2>
                <p className="text-sm text-white/80">{module?.description}</p>
              </div>
            </div>
            {progress && progress.total > 0 && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span>Progresso do módulo</span>
                  <span>{progress.percentage}%</span>
                </div>
                <Progress value={progress.percentage} className="h-2 bg-white/20" />
              </div>
            )}
          </motion.div>

          <h2 className="text-lg font-semibold mb-4">Trilhas de Estudo</h2>
          
          {tracks.map((track) => (
            <TrackCard
              key={track.id}
              track={track}
              userPlan={userPlan}
              isAdmin={isAdmin}
              onLessonClick={(lessonId) => onNavigateToLesson(lessonId, track.level)}
              onUnlock={onNavigateToSubscriptions}
            />
          ))}

          {userPlan !== 'gold' && !isAdmin && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl text-center mt-6"
            >
              <Sparkles className="w-8 h-8 mx-auto text-amber-500 mb-2" />
              <h3 className="font-semibold mb-1">Desbloqueie todo o conteúdo</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Assine <strong>Gold</strong> para acessar todos os módulos e lições
              </p>
              <Button onClick={onNavigateToSubscriptions} data-testid="button-subscribe-cta">
                <Crown className="w-4 h-4 mr-1" />
                Ver Planos
              </Button>
            </motion.div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
