import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, Lock, BookOpen, Sprout, Users, Heart, Library, ChevronRight, Star, Clock, Crown, Check, GraduationCap, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { getDeviceId } from "@/hooks/use-device-id";
import { UserButton } from "@/components/UserButton";
import { getApiUrl } from "@/lib/queryClient";

interface StudyModulesScreenProps {
  onBack: () => void;
  onNavigateToModule: (moduleId: string) => void;
  onNavigateToSubscriptions: () => void;
}

interface StudyModule {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  order: number;
  level: string;
  requiredPlan: string;
  isActive: boolean;
  isUnlocked: boolean;
  progress: {
    total: number;
    completed: number;
    percentage: number;
  };
}

interface SubscriptionStatus {
  hasGold?: boolean;
  hasPremium?: boolean;
  trialActive?: boolean;
}

const ICON_MAP: Record<string, React.ElementType> = {
  foundation: BookOpen,
  growth: Sprout,
  topics: Heart,
  people: Users,
  book: Library,
  practice: Star,
  "book-open": BookOpen,
  scroll: Library,
  graduation: GraduationCap,
};

const LEVEL_CONFIG: Record<string, { labelKey: string; color: string; bgClass: string; borderClass: string; icon: React.ElementType }> = {
  iniciante: { 
    labelKey: "courses.beginner", 
    color: "text-green-600 dark:text-green-400",
    bgClass: "bg-green-500/10",
    borderClass: "border-green-500/30",
    icon: Sprout
  },
  moderado: { 
    labelKey: "courses.intermediate", 
    color: "text-amber-600 dark:text-amber-400",
    bgClass: "bg-amber-500/10",
    borderClass: "border-amber-500/30",
    icon: Star
  },
  avancado: { 
    labelKey: "courses.advanced", 
    color: "text-red-600 dark:text-red-400",
    bgClass: "bg-red-500/10",
    borderClass: "border-red-500/30",
    icon: GraduationCap
  },
};

function getIconComponent(iconName: string): React.ElementType {
  return ICON_MAP[iconName] || Library;
}

function ModuleCard({ 
  module, 
  onClick, 
  delay,
  isLocked,
  lockReason,
  onUnlock,
  t
}: { 
  module: StudyModule; 
  onClick: () => void; 
  delay: number;
  isLocked: boolean;
  lockReason?: string;
  onUnlock: () => void;
  t: (key: string) => string;
}) {
  const Icon = getIconComponent(module.icon);
  const hasProgress = module.progress.percentage > 0;
  const isCompleted = module.progress.percentage === 100;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      onClick={isLocked ? onUnlock : onClick}
      className="cursor-pointer"
      data-testid={`module-card-${module.id}`}
    >
      <div 
        className={`relative overflow-hidden rounded-xl p-4 h-full min-h-[140px] shadow-lg border ${
          isLocked 
            ? 'bg-muted/50 border-muted-foreground/20' 
            : 'border-white/10 dark:border-white/5 hover-elevate active-elevate-2'
        }`}
        style={!isLocked ? { background: `linear-gradient(135deg, ${module.color} 0%, ${module.color}dd 100%)` } : undefined}
      >
        {isLocked && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm z-20">
            <div className="text-center p-4">
              <Lock className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-xs text-muted-foreground mb-2">{lockReason}</p>
              <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); onUnlock(); }}>
                <Crown className="w-3 h-3 mr-1" />
                {t("courses.unlocked")}
              </Button>
            </div>
          </div>
        )}
        
        <div className="absolute top-2 right-2 opacity-15">
          <Icon className={`w-16 h-16 ${isLocked ? 'text-muted-foreground' : ''}`} />
        </div>
        
        {isCompleted && !isLocked && (
          <div className="absolute top-2 right-2 z-10">
            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
              <Check className="w-4 h-4 text-white" />
            </div>
          </div>
        )}
        
        <div className="relative z-10 h-full flex flex-col">
          <div 
            className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 shadow-md ${
              isLocked ? 'bg-muted' : ''
            }`}
            style={!isLocked ? { backgroundColor: `${module.color}99` } : undefined}
          >
            <Icon className={`w-5 h-5 ${isLocked ? 'text-muted-foreground' : 'text-white'}`} />
          </div>
          
          <h3 className={`text-lg font-bold mb-1 truncate ${isLocked ? 'text-muted-foreground' : 'text-white'}`}>
            {module.name}
          </h3>
          <p className={`text-sm mb-3 line-clamp-2 flex-1 break-words ${isLocked ? 'text-muted-foreground/70' : 'text-white/75'}`}>
            {module.description}
          </p>
          
          <div className="mt-auto">
            {!isLocked && hasProgress ? (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-white/80">
                  <span>{module.progress.completed}/{module.progress.total} {t("courses.lessons")}</span>
                  <span>{module.progress.percentage}%</span>
                </div>
                <Progress value={module.progress.percentage} className="h-1.5 bg-white/20" />
              </div>
            ) : !isLocked ? (
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="bg-white/20 text-white border-0 text-xs">
                  {module.progress.total} {t("courses.lessons")}
                </Badge>
                <ChevronRight className="w-4 h-4 text-white/70" />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ModuleCardSkeleton() {
  return (
    <div className="rounded-xl p-4 min-h-[140px] bg-muted/50">
      <Skeleton className="w-10 h-10 rounded-xl mb-3" />
      <Skeleton className="h-5 w-3/4 mb-2" />
      <Skeleton className="h-4 w-full mb-1" />
      <Skeleton className="h-4 w-2/3 mb-3" />
      <Skeleton className="h-6 w-20" />
    </div>
  );
}

function LevelSection({ 
  level, 
  modules, 
  allModulesSorted,
  onNavigateToModule,
  onUnlock,
  userPlan,
  isAdmin,
  completedModuleIds,
  t
}: { 
  level: string; 
  modules: StudyModule[];
  allModulesSorted: StudyModule[];
  onNavigateToModule: (id: string) => void;
  onUnlock: () => void;
  userPlan: string | null;
  isAdmin: boolean;
  completedModuleIds: Set<string>;
  t: (key: string) => string;
}) {
  const config = LEVEL_CONFIG[level] || LEVEL_CONFIG.iniciante;
  const LevelIcon = config.icon;
  const levelLabel = t(config.labelKey);
  
  const levelLessons = modules.reduce((sum, m) => sum + m.progress.total, 0);
  const levelCompleted = modules.reduce((sum, m) => sum + m.progress.completed, 0);
  const levelPercentage = levelLessons > 0 ? Math.round((levelCompleted / levelLessons) * 100) : 0;
  
  // Regras de acesso aos MÓDULOS (visualização):
  // - Todos podem ABRIR qualquer módulo e ver a lista de aulas
  // - O bloqueio acontece no nível de AULA em ModuleDetailScreen
  // - Isto é essencial para conversão (usuário vê o conteúdo disponível)
  const canAccessLevel = true; // Sempre pode abrir o módulo para ver a lista de aulas
  
  const getGlobalPreviousModule = (module: StudyModule): StudyModule | undefined => {
    const globalIndex = allModulesSorted.findIndex(m => m.id === module.id);
    if (globalIndex <= 0) return undefined;
    return allModulesSorted[globalIndex - 1];
  };
  
  // Módulos nunca são bloqueados - o bloqueio é no nível de aula
  const getLockReason = (_module: StudyModule): string | undefined => {
    return undefined;
  };
  
  // Módulos nunca são bloqueados - usuário pode abrir qualquer módulo para ver aulas
  const isModuleLocked = (_module: StudyModule): boolean => {
    return false;
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      <div className={`flex items-center gap-3 mb-4 p-3 rounded-xl ${config.bgClass} border ${config.borderClass}`}>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${config.bgClass}`}>
          <LevelIcon className={`w-5 h-5 ${config.color}`} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className={`font-bold ${config.color}`}>{levelLabel}</h2>
            <Badge variant="outline" className={`text-xs ${config.borderClass} ${config.color}`}>
              {modules.length} {t("courses.modules")}
            </Badge>
            {!canAccessLevel && (
              <Badge variant="outline" className="text-xs border-amber-500/30 text-amber-600">
                <Crown className="w-3 h-3 mr-1" />
                {t("subscription.gold")}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Progress value={levelPercentage} className="h-1.5 flex-1" />
            <span className="text-xs text-muted-foreground">{levelPercentage}%</span>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {modules.map((module, index) => (
          <ModuleCard
            key={module.id}
            module={module}
            onClick={() => onNavigateToModule(module.id)}
            delay={index * 0.03}
            isLocked={isModuleLocked(module)}
            lockReason={getLockReason(module)}
            onUnlock={onUnlock}
            t={t}
          />
        ))}
      </div>
    </motion.div>
  );
}

interface GuestTrialInfo {
  active: boolean;
  daysRemaining: number;
}

export function StudyModulesScreen({ onBack, onNavigateToModule, onNavigateToSubscriptions }: StudyModulesScreenProps) {
  const { user, isAdmin } = useAuth();
  const { t, language } = useLanguage();
  const deviceId = getDeviceId();
  
  const { data: modules, isLoading } = useQuery<StudyModule[]>({
    queryKey: ['/api/study/modules', language],
    queryFn: async () => {
      const res = await fetch(getApiUrl(`/api/study/modules?lang=${language}`), {
        headers: { 'x-device-id': deviceId || '' }
      });
      if (!res.ok) throw new Error('Failed to fetch modules');
      return res.json();
    }
  });
  
  const { data: subscriptionData } = useQuery<SubscriptionStatus>({
    queryKey: ['/api/user/subscription-status'],
    enabled: !!user,
    staleTime: 0, // Always fetch fresh subscription data
    refetchOnWindowFocus: true,
  });

  // Fetch guest trial info when not logged in
  const { data: guestTrialData } = useQuery<GuestTrialInfo>({
    queryKey: ['/api/guest/trial', deviceId],
    enabled: !user && !!deviceId,
  });
  
  // Determine user plan: logged in user's subscription OR guest with active trial gets 'gold' access
  const userPlan = user
    ? (subscriptionData?.hasPremium ? 'premium' : subscriptionData?.hasGold ? 'gold' : null)
    : (guestTrialData?.active ? 'gold' : null);
  
  const allModulesSorted = [...(modules || [])].sort((a, b) => a.order - b.order);
  const inicianteModules = allModulesSorted.filter(m => m.level === 'iniciante');
  const moderadoModules = allModulesSorted.filter(m => m.level === 'moderado');
  const avancadoModules = allModulesSorted.filter(m => m.level === 'avancado');
  
  const completedModuleIds = new Set(
    modules?.filter(m => m.progress.percentage === 100).map(m => m.id) || []
  );

  const totalLessons = modules?.reduce((sum, m) => sum + m.progress.total, 0) || 0;
  const completedLessons = modules?.reduce((sum, m) => sum + m.progress.completed, 0) || 0;
  const overallPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onBack}
            data-testid="button-back-professor-premium"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-serif font-bold">{t("courses.title")}</h1>
            <p className="text-xs text-muted-foreground">{t("courses.structured")}</p>
          </div>
          {isAdmin && (
            <Badge variant="outline" className="text-xs border-purple-500/30 text-purple-600">
              <Sparkles className="w-3 h-3 mr-1" />
              Admin
            </Badge>
          )}
          <UserButton onNavigateToSubscriptions={onNavigateToSubscriptions} showSubscriptionOption />
          {!user && (
            <Badge variant="outline" className="text-xs border-primary/30">
              <Clock className="w-3 h-3 mr-1" />
              {t("subscription.trial")}
            </Badge>
          )}
        </div>
      </header>

      <ScrollArea className="h-[calc(100vh-60px)]">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-4 mb-6 text-white"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <Library className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h2 className="font-bold">{t("courses.overallProgress")}</h2>
                <p className="text-sm text-white/80">{completedLessons} / {totalLessons} {t("courses.lessonsCompleted")}</p>
              </div>
              <div className="text-2xl font-bold">{overallPercentage}%</div>
            </div>
            <Progress value={overallPercentage} className="h-2 bg-white/20" />
          </motion.div>

          {isLoading ? (
            <div className="space-y-8">
              <div>
                <Skeleton className="h-16 w-full rounded-xl mb-4" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <ModuleCardSkeleton />
                  <ModuleCardSkeleton />
                  <ModuleCardSkeleton />
                  <ModuleCardSkeleton />
                </div>
              </div>
            </div>
          ) : (
            <>
              {inicianteModules.length > 0 && (
                <LevelSection
                  level="iniciante"
                  modules={inicianteModules}
                  allModulesSorted={allModulesSorted}
                  onNavigateToModule={onNavigateToModule}
                  onUnlock={onNavigateToSubscriptions}
                  userPlan={userPlan}
                  isAdmin={isAdmin}
                  completedModuleIds={completedModuleIds}
                  t={t}
                />
              )}
              
              {moderadoModules.length > 0 && (
                <LevelSection
                  level="moderado"
                  modules={moderadoModules}
                  allModulesSorted={allModulesSorted}
                  onNavigateToModule={onNavigateToModule}
                  onUnlock={onNavigateToSubscriptions}
                  userPlan={userPlan}
                  isAdmin={isAdmin}
                  completedModuleIds={completedModuleIds}
                  t={t}
                />
              )}
              
              {avancadoModules.length > 0 && (
                <LevelSection
                  level="avancado"
                  modules={avancadoModules}
                  allModulesSorted={allModulesSorted}
                  onNavigateToModule={onNavigateToModule}
                  onUnlock={onNavigateToSubscriptions}
                  userPlan={userPlan}
                  isAdmin={isAdmin}
                  completedModuleIds={completedModuleIds}
                  t={t}
                />
              )}
            </>
          )}

          {userPlan !== 'gold' && !isAdmin && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl text-center"
            >
              <Crown className="w-8 h-8 mx-auto text-amber-500 mb-2" />
              <h3 className="font-semibold mb-1">{t("courses.unlockAll")}</h3>
              <p className="text-sm text-muted-foreground mb-3">
                {t("courses.subscribeGold")}
              </p>
              <Button onClick={onNavigateToSubscriptions} data-testid="button-subscribe-cta">
                <Crown className="w-4 h-4 mr-1" />
                {t("subscription.viewPlans")}
              </Button>
            </motion.div>
          )}

          <div className="pt-6 pb-4 text-center">
            <p className="text-xs text-muted-foreground">
              Contato:{" "}
              <a 
                href="https://instagram.com/bibliainteligenteia" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
                data-testid="link-instagram-modules"
              >
                @bibliainteligenteia
              </a>
            </p>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
