import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { getDeviceId } from "@/hooks/use-device-id";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  BookOpen, 
  Brain, 
  Trophy, 
  Timer, 
  Gamepad2,
  TrendingUp,
  HandHeart,
  Calendar,
  CreditCard,
  Shield,
  Sparkles,
  GraduationCap,
  Mic
} from "lucide-react";
import { motion } from "framer-motion";

interface DashboardProps {
  onNavigateToBible: () => void;
  onNavigateToPrayer: () => void;
  onNavigateToAchievements: () => void;
  onNavigateToGames: () => void;
  onNavigateToSubscriptions: () => void;
  onNavigateToProfessor: () => void;
  onNavigateToAIModes: () => void;
  onNavigateToPlansProgress: () => void;
  onNavigateToCalendar: () => void;
  onNavigateToRecordings: () => void;
  onNavigateToAdmin: () => void;
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
  testId: string;
  size?: "normal" | "large";
}

function ModuleCard({ 
  title, 
  description, 
  icon: Icon, 
  gradient, 
  iconColor, 
  onClick, 
  badge, 
  delay = 0, 
  testId,
  size = "normal"
}: ModuleCardProps) {
  const isLarge = size === "large";
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className={`cursor-pointer ${isLarge ? "col-span-2 sm:col-span-1" : ""}`}
      onClick={onClick}
      data-testid={testId}
    >
      <div className={`relative overflow-visible rounded-2xl ${gradient} p-5 h-full min-h-[140px] flex flex-col shadow-lg border border-white/10 dark:border-white/5 hover-elevate active-elevate-2`}>
        <div className="absolute top-0 right-0 w-24 h-24 opacity-10">
          <Icon className="w-full h-full" />
        </div>
        
        <div className={`w-12 h-12 rounded-xl ${iconColor} flex items-center justify-center mb-3 shadow-md`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        
        <div className="flex-1 flex flex-col justify-end relative z-10">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="text-base font-bold text-white">{title}</h3>
            {badge && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-white/20 text-white border-0">
                {badge}
              </Badge>
            )}
          </div>
          <p className="text-xs text-white/75 line-clamp-2">{description}</p>
        </div>
      </div>
    </motion.div>
  );
}

export function Dashboard({
  onNavigateToBible,
  onNavigateToPrayer,
  onNavigateToAchievements,
  onNavigateToGames,
  onNavigateToSubscriptions,
  onNavigateToProfessor,
  onNavigateToAIModes,
  onNavigateToPlansProgress,
  onNavigateToCalendar,
  onNavigateToRecordings,
  onNavigateToAdmin,
}: DashboardProps) {
  const { user, isSuperAdmin } = useAuth();
  const deviceId = getDeviceId();
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin' || isSuperAdmin;

  const { data: trialInfo } = useQuery<{ active: boolean; daysRemaining: number }>({
    queryKey: ['/api/guest/trial', deviceId],
    enabled: !!deviceId && !user,
  });

  const modules = [
    {
      id: "bible",
      title: "Bíblia",
      description: "Leitura, Strong's, Hebraico e Grego",
      icon: BookOpen,
      gradient: "bg-gradient-to-br from-blue-600 to-blue-800",
      iconColor: "bg-blue-500",
      onClick: onNavigateToBible,
      size: "large" as const,
    },
    {
      id: "professor",
      title: "Professor",
      description: "Chat com IA teológica",
      icon: GraduationCap,
      gradient: "bg-gradient-to-br from-violet-600 to-purple-800",
      iconColor: "bg-violet-500",
      onClick: onNavigateToProfessor,
      badge: "IA",
    },
    {
      id: "ai-modes",
      title: "Modos IA Premium",
      description: "Pregador, Exegese, Teológica",
      icon: Brain,
      gradient: "bg-gradient-to-br from-fuchsia-600 to-pink-700",
      iconColor: "bg-fuchsia-500",
      onClick: onNavigateToAIModes,
      badge: "4 modos",
    },
    {
      id: "plans-progress",
      title: "Planos & Progresso",
      description: "Planos de leitura e progresso por livro",
      icon: TrendingUp,
      gradient: "bg-gradient-to-br from-emerald-600 to-teal-700",
      iconColor: "bg-emerald-500",
      onClick: onNavigateToPlansProgress,
    },
    {
      id: "prayer",
      title: "Modo Oração",
      description: "Pedidos de oração e temporizador",
      icon: HandHeart,
      gradient: "bg-gradient-to-br from-amber-600 to-orange-700",
      iconColor: "bg-amber-500",
      onClick: onNavigateToPrayer,
    },
    {
      id: "achievements",
      title: "Conquistas",
      description: "Distintivos e marcos alcançados",
      icon: Trophy,
      gradient: "bg-gradient-to-br from-amber-500 to-orange-600",
      iconColor: "bg-amber-500",
      onClick: onNavigateToAchievements,
    },
    {
      id: "calendar",
      title: "Minha Agenda",
      description: "Eventos da igreja e compromissos",
      icon: Calendar,
      gradient: "bg-gradient-to-br from-cyan-600 to-blue-700",
      iconColor: "bg-cyan-500",
      onClick: onNavigateToCalendar,
    },
    {
      id: "games",
      title: "Jogos Bíblicos",
      description: "Quiz e desafios interativos",
      icon: Gamepad2,
      gradient: "bg-gradient-to-br from-rose-500 to-red-600",
      iconColor: "bg-rose-500",
      onClick: onNavigateToGames,
    },
    {
      id: "recordings",
      title: "Gravações",
      description: "Grave e organize seus sermões",
      icon: Mic,
      gradient: "bg-gradient-to-br from-red-600 to-orange-600",
      iconColor: "bg-red-500",
      onClick: onNavigateToRecordings,
      badge: "Novo",
    },
    {
      id: "subscriptions",
      title: "Assinaturas",
      description: "Gerencie seu plano e conta",
      icon: CreditCard,
      gradient: "bg-gradient-to-br from-slate-600 to-gray-700",
      iconColor: "bg-slate-500",
      onClick: onNavigateToSubscriptions,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <ScrollArea className="h-screen">
        <div className="max-w-2xl mx-auto px-4 py-6 sm:px-6">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-center mb-6"
          >
            <h1 className="text-2xl sm:text-3xl font-serif font-bold bg-gradient-to-r from-primary via-blue-500 to-primary bg-clip-text text-transparent mb-1">
              Bíblia Inteligente
            </h1>
            <p className="text-muted-foreground text-sm">
              {user ? `Bem-vindo, ${user.name || 'estudante'}` : "Estudo bíblico com textos originais"}
            </p>
            {!user && trialInfo && trialInfo.active && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mt-3"
              >
                <Badge variant="outline" className="text-xs py-1 px-3 border-primary/30">
                  <Timer className="w-3 h-3 mr-1.5" />
                  {trialInfo.daysRemaining} dias de avaliação
                </Badge>
              </motion.div>
            )}
          </motion.div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
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
                delay={index * 0.05}
                testId={`module-${module.id}`}
                size={module.size}
              />
            ))}
            
            {isAdmin && (
              <ModuleCard
                title="Administração"
                description="Painel de controle e estatísticas"
                icon={Shield}
                gradient="bg-gradient-to-br from-red-600 to-rose-800"
                iconColor="bg-red-500"
                onClick={onNavigateToAdmin}
                badge="Admin"
                delay={modules.length * 0.05}
                testId="module-admin"
              />
            )}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.5 }}
            className="mt-6"
          >
            <div 
              className="relative overflow-visible rounded-2xl bg-gradient-to-r from-primary/90 to-blue-600 p-4 shadow-lg cursor-pointer hover-elevate active-elevate-2"
              onClick={onNavigateToSubscriptions}
              data-testid="banner-upgrade"
            >
              <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
                <Sparkles className="w-full h-full" />
              </div>
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-white">Desbloqueie Tudo</h3>
                  <p className="text-xs text-white/80 truncate">
                    IA ilimitada e Strong's completo
                  </p>
                </div>
                <div className="bg-white text-primary text-sm font-semibold px-4 py-2 rounded-lg shadow flex-shrink-0">
                  Ver Planos
                </div>
              </div>
            </div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center text-muted-foreground text-xs mt-6 pb-4"
          >
            Toque em qualquer módulo para começar
          </motion.p>
        </div>
      </ScrollArea>
    </div>
  );
}
