import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { getDeviceId } from "@/hooks/use-device-id";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  Brain, 
  Trophy, 
  Timer, 
  Gamepad2,
  TrendingUp,
  Moon,
  Sparkles
} from "lucide-react";
import { motion } from "framer-motion";

interface DashboardProps {
  onNavigateToBible: () => void;
  onNavigateToZenMode: () => void;
  onNavigateToAchievements: () => void;
  onNavigateToGames: () => void;
  onNavigateToSubscriptions: () => void;
  onNavigateToAI: (mode?: string) => void;
  onNavigateToProgress: () => void;
}

interface ModuleCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  gradient: string;
  iconColor: string;
  onClick: () => void;
  badge?: string;
  delay?: number;
}

function ModuleCard({ title, description, icon: Icon, gradient, iconColor, onClick, badge, delay = 0, testId }: ModuleCardProps & { testId: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="cursor-pointer"
      onClick={onClick}
      data-testid={testId}
    >
      <div className={`relative overflow-visible rounded-2xl ${gradient} p-6 h-full min-h-[180px] flex flex-col shadow-lg border border-white/10 dark:border-white/5 hover-elevate active-elevate-2`}>
        <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
          <Icon className="w-full h-full" />
        </div>
        
        <div className={`w-14 h-14 rounded-xl ${iconColor} flex items-center justify-center mb-4 shadow-md`}>
          <Icon className="w-7 h-7 text-white" />
        </div>
        
        <div className="flex-1 flex flex-col justify-end relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-bold text-white">{title}</h3>
            {badge && (
              <Badge variant="secondary" className="text-xs bg-white/20 text-white border-0">
                {badge}
              </Badge>
            )}
          </div>
          <p className="text-sm text-white/80">{description}</p>
        </div>
      </div>
    </motion.div>
  );
}

export function Dashboard({
  onNavigateToBible,
  onNavigateToZenMode,
  onNavigateToAchievements,
  onNavigateToGames,
  onNavigateToSubscriptions,
  onNavigateToAI,
  onNavigateToProgress,
}: DashboardProps) {
  const { user } = useAuth();
  const deviceId = getDeviceId();

  const { data: trialInfo } = useQuery<{ active: boolean; daysRemaining: number }>({
    queryKey: ['/api/guest/trial', deviceId],
    enabled: !!deviceId && !user,
  });

  const modules = [
    {
      id: "bible",
      title: "Bíblia",
      description: "Textos originais, Strong's e traduções",
      icon: BookOpen,
      gradient: "bg-gradient-to-br from-blue-600 to-blue-800",
      iconColor: "bg-blue-500",
      onClick: onNavigateToBible,
    },
    {
      id: "ai",
      title: "Professor IA",
      description: "4 modos de estudo com GPT-4o",
      icon: Brain,
      gradient: "bg-gradient-to-br from-violet-600 to-purple-800",
      iconColor: "bg-violet-500",
      onClick: () => onNavigateToAI(),
      badge: "GPT-4o",
    },
    {
      id: "progress",
      title: "Progresso",
      description: "Acompanhe sua leitura por livro",
      icon: TrendingUp,
      gradient: "bg-gradient-to-br from-emerald-600 to-teal-800",
      iconColor: "bg-emerald-500",
      onClick: onNavigateToProgress,
    },
    {
      id: "zen",
      title: "Modo Zen",
      description: "Estudo focado com áudio ambiente",
      icon: Moon,
      gradient: "bg-gradient-to-br from-indigo-600 to-slate-800",
      iconColor: "bg-indigo-500",
      onClick: onNavigateToZenMode,
    },
    {
      id: "games",
      title: "Jogos Bíblicos",
      description: "Aprenda se divertindo",
      icon: Gamepad2,
      gradient: "bg-gradient-to-br from-orange-500 to-rose-600",
      iconColor: "bg-orange-500",
      onClick: onNavigateToGames,
    },
    {
      id: "achievements",
      title: "Conquistas",
      description: "Desbloqueie distintivos e marcos",
      icon: Trophy,
      gradient: "bg-gradient-to-br from-amber-500 to-yellow-600",
      iconColor: "bg-amber-500",
      onClick: onNavigateToAchievements,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <h1 className="text-3xl sm:text-4xl font-serif font-bold bg-gradient-to-r from-primary via-blue-500 to-primary bg-clip-text text-transparent mb-2">
            Bíblia Hebraico & Grego
          </h1>
          <p className="text-muted-foreground text-lg">
            {user ? `Bem-vindo de volta, ${user.name || 'estudante'}` : "Estudo bíblico profundo com textos originais"}
          </p>
          {!user && trialInfo && trialInfo.active && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-4"
            >
              <Badge variant="outline" className="text-sm py-1.5 px-4 border-primary/30">
                <Timer className="w-4 h-4 mr-2" />
                {trialInfo.daysRemaining} dias restantes no período de avaliação
              </Badge>
            </motion.div>
          )}
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {modules.map((module, index) => (
            <ModuleCard
              key={module.id}
              title={module.title}
              description={module.description}
              icon={module.icon}
              gradient={module.gradient}
              iconColor={module.iconColor}
              onClick={module.onClick}
              badge={module.badge}
              delay={index * 0.1}
              testId={`module-${module.id}`}
            />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.7 }}
          className="mt-8"
        >
          <div 
            className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/90 to-blue-600 p-6 shadow-xl cursor-pointer"
            onClick={onNavigateToSubscriptions}
            data-testid="button-upgrade"
          >
            <div className="absolute top-0 right-0 w-48 h-48 opacity-10">
              <Sparkles className="w-full h-full" />
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4 relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h3 className="text-xl font-bold text-white mb-1">Desbloqueie Todo o Potencial</h3>
                <p className="text-white/80">
                  IA ilimitada, Strong's completo e todos os recursos premium
                </p>
              </div>
              <div className="bg-white text-primary font-semibold px-6 py-3 rounded-xl shadow-md hover:bg-white/90 transition-colors">
                Ver Planos
              </div>
            </div>
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="text-center text-muted-foreground text-sm mt-8"
        >
          Toque em qualquer módulo para começar
        </motion.p>
      </div>
    </div>
  );
}
