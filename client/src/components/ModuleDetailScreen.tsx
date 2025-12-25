import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, Lock, BookOpen, ChevronRight, Check, Clock, Crown, Sparkles, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { getDeviceId } from "@/hooks/use-device-id";
import { LoginPromptModal } from "@/components/LoginPromptModal";
import { canOpenLesson, type UserPlan, type CourseLevel } from "@shared/courseAccess";

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
    level: string;
    order: number;
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

interface SubscriptionStatus {
  hasGold?: boolean;
  hasPremium?: boolean;
  trialActive?: boolean;
}

interface GuestTrialInfo {
  active: boolean;
  daysRemaining: number;
}

function TrackCard({ 
  track, 
  userPlan,
  isLoggedIn,
  isAdmin,
  moduleIndex,
  onLessonClick,
  onLoginRequired,
  onUpgradeRequired
}: { 
  track: Track; 
  userPlan: UserPlan;
  isLoggedIn: boolean;
  isAdmin: boolean;
  moduleIndex: number;
  onLessonClick: (lessonId: string) => void;
  onLoginRequired: () => void;
  onUpgradeRequired: (requiredPlan: 'gold' | 'premium', message: string) => void;
}) {
  const levelConfig = LEVEL_CONFIG[track.level] || LEVEL_CONFIG.iniciante;
  
  const { data: lessonsData, isLoading, error } = useQuery<{ lessons: Lesson[] }>({
    queryKey: ['/api/study/tracks', track.id],
  });
  
  const lessons = lessonsData?.lessons || [];
  
  // Debug logging for lesson visibility
  console.log('[TrackCard]', {
    trackId: track.id,
    lessonsCount: lessons.length,
    isLoading,
    error: error ? String(error) : null,
    lessonsData,
  });
  
  const handleLessonClick = (lesson: Lesson) => {
    const courseLevel = track.level as CourseLevel;
    const lessonIndex = lesson.order;
    
    const accessResult = canOpenLesson({
      isLoggedIn,
      plan: userPlan,
      courseLevel,
      moduleIndex,
      lessonIndex,
      isAdmin,
    });
    
    if (accessResult.allowed) {
      onLessonClick(lesson.id);
    } else if (accessResult.reason === 'NOT_AUTHENTICATED') {
      onLoginRequired();
    } else {
      onUpgradeRequired(accessResult.requiredPlan || 'gold', accessResult.message || 'Assine para continuar');
    }
  };
  
  const getLessonLockInfo = (lesson: Lesson): { isLocked: boolean; requiredPlan?: 'gold' | 'premium' } => {
    const courseLevel = track.level as CourseLevel;
    const lessonIndex = lesson.order;
    
    const accessResult = canOpenLesson({
      isLoggedIn,
      plan: userPlan,
      courseLevel,
      moduleIndex,
      lessonIndex,
      isAdmin,
    });
    
    if (accessResult.allowed) {
      return { isLocked: false };
    }
    
    return { 
      isLocked: true, 
      requiredPlan: accessResult.requiredPlan 
    };
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
        </div>
        {track.totalLessons > 0 && (
          <span className="text-xs text-muted-foreground flex-shrink-0">
            {track.completedLessons}/{track.totalLessons}
          </span>
        )}
      </div>
      
      <p className="text-sm text-muted-foreground mb-3 break-words">{track.description}</p>
      
      <div className="space-y-2">
        {/* Debug: show lesson count */}
        <p className="text-xs text-blue-500 font-bold">
          DEBUG: {isLoading ? 'Carregando...' : `${lessons.length} lições encontradas`}
        </p>
        
        {isLoading ? (
          <>
            <LessonItemSkeleton />
            <LessonItemSkeleton />
          </>
        ) : lessons.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma lição encontrada</p>
        ) : (
          <>
            {/* Debug: test simple text rendering */}
            <div className="bg-green-500 text-white p-2 rounded">
              TEST: Renderizando {lessons.length} lições abaixo:
            </div>
            {lessons.map((lesson) => {
              const lockInfo = getLessonLockInfo(lesson);
              return (
                <LessonItem 
                  key={lesson.id} 
                  lesson={lesson} 
                  onClick={() => handleLessonClick(lesson)}
                  isLocked={lockInfo.isLocked}
                  requiredPlan={lockInfo.requiredPlan}
                />
              );
            })}
          </>
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

function LessonItem({ 
  lesson, 
  onClick, 
  isLocked = false,
  requiredPlan
}: { 
  lesson: Lesson; 
  onClick: () => void; 
  isLocked?: boolean;
  requiredPlan?: 'gold' | 'premium';
}) {
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
            ? requiredPlan === 'premium' ? 'bg-purple-500/20' : 'bg-amber-500/20'
            : 'bg-muted'
      }`}>
        {lesson.completed ? (
          <Check className="w-4 h-4" />
        ) : isLocked ? (
          <Lock className={`w-3 h-3 ${requiredPlan === 'premium' ? 'text-purple-600' : 'text-amber-600'}`} />
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
        <Crown className={`w-4 h-4 ${requiredPlan === 'premium' ? 'text-purple-500' : 'text-amber-500'}`} />
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

export function ModuleDetailScreen({ 
  moduleId, 
  onBack, 
  onNavigateToLesson,
  onNavigateToSubscriptions 
}: ModuleDetailScreenProps) {
  const { user, isAdmin } = useAuth();
  const deviceId = getDeviceId();
  const isLoggedIn = !!user;
  
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showPaywallModal, setShowPaywallModal] = useState(false);
  const [paywallInfo, setPaywallInfo] = useState<{ requiredPlan: 'gold' | 'premium'; message: string }>({ 
    requiredPlan: 'gold', 
    message: '' 
  });
  
  const { data: moduleDetail, isLoading: moduleLoading } = useQuery<ModuleDetail>({
    queryKey: ['/api/study/modules', moduleId],
  });

  const { data: subscriptionData } = useQuery<SubscriptionStatus>({
    queryKey: ['/api/user/subscription-status'],
    enabled: !!user,
  });

  const { data: guestTrialData } = useQuery<GuestTrialInfo>({
    queryKey: ['/api/guest/trial', deviceId],
    enabled: !user && !!deviceId,
  });

  const getUserPlan = (): UserPlan => {
    if (!user) return 'free';
    if (subscriptionData?.hasPremium) return 'premium';
    if (subscriptionData?.hasGold) return 'gold';
    return 'free';
  };
  
  const userPlan = getUserPlan();
  
  const getModuleIndex = (): number => {
    if (!moduleDetail?.module) return 1;
    return moduleDetail.module.order || 1;
  };

  const handleLoginRequired = () => {
    setShowLoginModal(true);
  };
  
  const handleUpgradeRequired = (requiredPlan: 'gold' | 'premium', message: string) => {
    setPaywallInfo({ requiredPlan, message });
    setShowPaywallModal(true);
  };

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
  const moduleIndex = getModuleIndex();

  // Debug logging for track visibility
  console.log('[ModuleDetailScreen]', {
    moduleId,
    tracksCount: tracks.length,
    moduleLoading,
    moduleDetail,
  });

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
          {isAdmin && (
            <Badge variant="outline" className="text-xs border-purple-500/30 text-purple-600">
              <Sparkles className="w-3 h-3 mr-1" />
              Admin
            </Badge>
          )}
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
              isLoggedIn={isLoggedIn}
              isAdmin={isAdmin}
              moduleIndex={moduleIndex}
              onLessonClick={(lessonId) => onNavigateToLesson(lessonId, track.level)}
              onLoginRequired={handleLoginRequired}
              onUpgradeRequired={handleUpgradeRequired}
            />
          ))}

          {userPlan === 'free' && !isAdmin && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl text-center mt-6"
            >
              <Sparkles className="w-8 h-8 mx-auto text-amber-500 mb-2" />
              <h3 className="font-semibold mb-1">Desbloqueie todo o conteúdo</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Assine <strong>Gold</strong> para acessar todos os módulos e lições do Iniciante e Moderado
              </p>
              <Button onClick={onNavigateToSubscriptions} data-testid="button-subscribe-cta">
                <Crown className="w-4 h-4 mr-1" />
                Ver Planos
              </Button>
            </motion.div>
          )}
          
          {userPlan === 'gold' && !isAdmin && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl text-center mt-6"
            >
              <Crown className="w-8 h-8 mx-auto text-purple-500 mb-2" />
              <h3 className="font-semibold mb-1">Upgrade para Premium</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Desbloqueie o Moderado completo e todo o conteúdo Avançado
              </p>
              <Button onClick={onNavigateToSubscriptions} variant="outline" className="border-purple-500/30" data-testid="button-upgrade-premium">
                <Sparkles className="w-4 h-4 mr-1" />
                Ver Premium
              </Button>
            </motion.div>
          )}
        </div>
      </ScrollArea>

      <LoginPromptModal
        open={showLoginModal}
        onOpenChange={setShowLoginModal}
        featureName="as lições do curso"
        onAuthSuccess={() => setShowLoginModal(false)}
      />

      <Dialog open={showPaywallModal} onOpenChange={setShowPaywallModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {paywallInfo.requiredPlan === 'premium' ? (
                <Sparkles className="w-5 h-5 text-purple-500" />
              ) : (
                <Crown className="w-5 h-5 text-amber-500" />
              )}
              Conteúdo Bloqueado
            </DialogTitle>
            <DialogDescription>
              {paywallInfo.message}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className={`p-4 rounded-lg ${
              paywallInfo.requiredPlan === 'premium' 
                ? 'bg-purple-500/10 border border-purple-500/20' 
                : 'bg-amber-500/10 border border-amber-500/20'
            }`}>
              <h4 className="font-semibold mb-2">
                {paywallInfo.requiredPlan === 'premium' ? 'Plano Premium' : 'Plano Gold'}
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                {paywallInfo.requiredPlan === 'gold' ? (
                  <>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> 100% do Iniciante</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> 7 lições do Moderado</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Strong's Dicionário</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> IA Essencial</li>
                  </>
                ) : (
                  <>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Tudo do Gold</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> 100% do Moderado</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> 100% do Avançado</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> IA Premium</li>
                  </>
                )}
              </ul>
            </div>
            <Button 
              className="w-full" 
              onClick={() => {
                setShowPaywallModal(false);
                onNavigateToSubscriptions();
              }}
              data-testid="button-paywall-subscribe"
            >
              <Crown className="w-4 h-4 mr-2" />
              Ver Planos
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
