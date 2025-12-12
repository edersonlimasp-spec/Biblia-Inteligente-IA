import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, Lock, BookOpen, Sprout, Users, Heart, Library, ChevronRight, Star, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { getDeviceId } from "@/hooks/use-device-id";

interface StudyModulesScreenProps {
  onBack: () => void;
  onNavigateToModule: (moduleId: string) => void;
}

interface StudyModule {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  order: number;
  isActive: boolean;
  progress: {
    total: number;
    completed: number;
    percentage: number;
  };
}

const ICON_MAP: Record<string, React.ElementType> = {
  foundation: BookOpen,
  growth: Sprout,
  topics: Heart,
  people: Users,
  book: Library,
  practice: Star,
};

function getIconComponent(iconName: string): React.ElementType {
  return ICON_MAP[iconName] || Library;
}

function ModuleCard({ module, onClick, delay }: { module: StudyModule; onClick: () => void; delay: number }) {
  const Icon = getIconComponent(module.icon);
  const hasProgress = module.progress.percentage > 0;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      onClick={onClick}
      className="cursor-pointer"
      data-testid={`module-card-${module.id}`}
    >
      <div 
        className="relative overflow-hidden rounded-xl p-4 h-full min-h-[140px] shadow-lg border border-white/10 dark:border-white/5 hover-elevate active-elevate-2"
        style={{ background: `linear-gradient(135deg, ${module.color} 0%, ${module.color}dd 100%)` }}
      >
        <div className="absolute top-2 right-2 opacity-15">
          <Icon className="w-16 h-16" />
        </div>
        
        <div className="relative z-10 h-full flex flex-col">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 shadow-md"
            style={{ backgroundColor: `${module.color}99` }}
          >
            <Icon className="w-5 h-5 text-white" />
          </div>
          
          <h3 className="text-lg font-bold text-white mb-1">{module.name}</h3>
          <p className="text-sm text-white/75 mb-3 line-clamp-2 flex-1">{module.description}</p>
          
          <div className="mt-auto">
            {hasProgress ? (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-white/80">
                  <span>{module.progress.completed}/{module.progress.total} lições</span>
                  <span>{module.progress.percentage}%</span>
                </div>
                <Progress value={module.progress.percentage} className="h-1.5 bg-white/20" />
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="bg-white/20 text-white border-0 text-xs">
                  {module.progress.total} lições
                </Badge>
                <ChevronRight className="w-4 h-4 text-white/70" />
              </div>
            )}
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

export function StudyModulesScreen({ onBack, onNavigateToModule }: StudyModulesScreenProps) {
  const { user } = useAuth();
  const deviceId = getDeviceId();
  
  const { data: modules, isLoading } = useQuery<StudyModule[]>({
    queryKey: ['/api/study/modules'],
  });

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
            <h1 className="text-lg font-serif font-bold">Professor Premium</h1>
            <p className="text-xs text-muted-foreground">Estudos bíblicos estruturados</p>
          </div>
          {!user && (
            <Badge variant="outline" className="text-xs border-primary/30">
              <Clock className="w-3 h-3 mr-1" />
              Trial
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
                <h2 className="font-bold">Seu Progresso Geral</h2>
                <p className="text-sm text-white/80">{completedLessons} de {totalLessons} lições concluídas</p>
              </div>
              <div className="text-2xl font-bold">{overallPercentage}%</div>
            </div>
            <Progress value={overallPercentage} className="h-2 bg-white/20" />
          </motion.div>

          <h2 className="text-lg font-semibold mb-4">Módulos de Estudo</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {isLoading ? (
              <>
                <ModuleCardSkeleton />
                <ModuleCardSkeleton />
                <ModuleCardSkeleton />
                <ModuleCardSkeleton />
                <ModuleCardSkeleton />
                <ModuleCardSkeleton />
              </>
            ) : (
              modules?.map((module, index) => (
                <ModuleCard 
                  key={module.id} 
                  module={module} 
                  onClick={() => onNavigateToModule(module.id)}
                  delay={index * 0.05}
                />
              ))
            )}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-8 p-4 bg-muted/50 rounded-xl text-center"
          >
            <h3 className="font-semibold mb-2">Aproveite ao máximo</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Cada módulo possui trilhas organizadas por nível de dificuldade. Complete as lições para desbloquear conquistas especiais.
            </p>
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline" className="border-green-500/30 text-green-600">Iniciante</Badge>
              <Badge variant="outline" className="border-amber-500/30 text-amber-600">Moderado</Badge>
              <Badge variant="outline" className="border-red-500/30 text-red-600">Avançado</Badge>
            </div>
          </motion.div>
        </div>
      </ScrollArea>
    </div>
  );
}
