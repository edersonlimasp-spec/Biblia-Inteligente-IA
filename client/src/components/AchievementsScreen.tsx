import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { getDeviceId } from "@/hooks/use-device-id";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft,
  Trophy,
  Star,
  BookOpen,
  Brain,
  Moon,
  Flame,
  Target,
  Award,
  Crown,
  Zap,
  Heart,
  Clock,
  MessageCircle,
  Lock
} from "lucide-react";
import { motion } from "framer-motion";

interface AchievementsScreenProps {
  onBack: () => void;
}

const ACHIEVEMENT_CATEGORIES = [
  { id: "reading", name: "Leitura", icon: BookOpen },
  { id: "study", name: "Estudo", icon: Brain },
  { id: "special", name: "Especiais", icon: Crown },
];

const ALL_ACHIEVEMENTS = [
  {
    id: "first_chapter",
    category: "reading",
    name: "Primeiro Passo",
    description: "Leia seu primeiro capítulo da Bíblia",
    icon: BookOpen,
    points: 10,
    rarity: "comum",
  },
  {
    id: "first_book",
    category: "reading",
    name: "Leitor Iniciante",
    description: "Complete a leitura de um livro inteiro",
    icon: Star,
    points: 50,
    rarity: "comum",
  },
  {
    id: "pentateuch",
    category: "reading",
    name: "Estudante da Torá",
    description: "Complete os 5 livros de Moisés",
    icon: Award,
    points: 200,
    rarity: "raro",
  },
  {
    id: "gospels",
    category: "reading",
    name: "Discípulo",
    description: "Complete os 4 Evangelhos",
    icon: Heart,
    points: 150,
    rarity: "raro",
  },
  {
    id: "new_testament",
    category: "reading",
    name: "Estudante do NT",
    description: "Complete todo o Novo Testamento",
    icon: Trophy,
    points: 500,
    rarity: "épico",
  },
  {
    id: "old_testament",
    category: "reading",
    name: "Estudante do AT",
    description: "Complete todo o Antigo Testamento",
    icon: Crown,
    points: 1000,
    rarity: "lendário",
  },
  {
    id: "bible_complete",
    category: "reading",
    name: "Bíblia Completa",
    description: "Leia toda a Bíblia",
    icon: Crown,
    points: 2000,
    rarity: "lendário",
  },
  {
    id: "strong_first",
    category: "study",
    name: "Curioso",
    description: "Consulte o Strong's pela primeira vez",
    icon: Brain,
    points: 10,
    rarity: "comum",
  },
  {
    id: "strong_explorer",
    category: "study",
    name: "Explorador Strong",
    description: "Consulte 50 palavras no Strong's",
    icon: Brain,
    points: 100,
    rarity: "raro",
  },
  {
    id: "strong_master",
    category: "study",
    name: "Mestre do Strong",
    description: "Consulte 500 palavras no Strong's",
    icon: Brain,
    points: 500,
    rarity: "épico",
  },
  {
    id: "ai_student",
    category: "study",
    name: "Estudante da IA",
    description: "Faça sua primeira pergunta ao Professor IA",
    icon: MessageCircle,
    points: 10,
    rarity: "comum",
  },
  {
    id: "ai_curious",
    category: "study",
    name: "Mente Curiosa",
    description: "Faça 25 perguntas ao Professor IA",
    icon: MessageCircle,
    points: 100,
    rarity: "raro",
  },
  {
    id: "ai_scholar",
    category: "study",
    name: "Erudito Digital",
    description: "Faça 100 perguntas ao Professor IA",
    icon: Zap,
    points: 300,
    rarity: "épico",
  },
  {
    id: "daily_streak_7",
    category: "special",
    name: "Constante",
    description: "Leia por 7 dias consecutivos",
    icon: Flame,
    points: 70,
    rarity: "comum",
  },
  {
    id: "daily_streak_30",
    category: "special",
    name: "Dedicado",
    description: "Leia por 30 dias consecutivos",
    icon: Flame,
    points: 300,
    rarity: "raro",
  },
  {
    id: "daily_streak_100",
    category: "special",
    name: "Inabalável",
    description: "Leia por 100 dias consecutivos",
    icon: Crown,
    points: 1000,
    rarity: "lendário",
  },
  {
    id: "early_bird",
    category: "special",
    name: "Madrugador",
    description: "Leia antes das 6h da manhã",
    icon: Clock,
    points: 25,
    rarity: "comum",
  },
  {
    id: "night_owl",
    category: "special",
    name: "Coruja",
    description: "Leia após meia-noite",
    icon: Moon,
    points: 25,
    rarity: "comum",
  },
];

const RARITY_COLORS = {
  comum: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  raro: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  épico: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  lendário: "bg-amber-500/10 text-amber-500 border-amber-500/20",
};

export function AchievementsScreen({ onBack }: AchievementsScreenProps) {
  const { user } = useAuth();
  const deviceId = getDeviceId();

  const { data: unlockedAchievements = [] } = useQuery<any[]>({
    queryKey: ['/api/achievements', deviceId],
    enabled: !!deviceId,
  });

  const unlockedIds = new Set(unlockedAchievements.map((a: any) => a.achievementType));
  const totalPoints = unlockedAchievements.reduce((sum: number, a: any) => {
    const achievement = ALL_ACHIEVEMENTS.find(x => x.id === a.achievementType);
    return sum + (achievement?.points || 0);
  }, 0);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b">
        <div className="flex items-center justify-between p-4 max-w-4xl mx-auto">
          <Button variant="ghost" size="icon" onClick={onBack} data-testid="button-back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            Conquistas
          </h1>
          <Badge variant="secondary" className="font-mono">
            {totalPoints} pts
          </Badge>
        </div>
      </header>

      <ScrollArea className="h-[calc(100vh-65px)]">
        <main className="max-w-4xl mx-auto p-4 space-y-6">
          <Card className="border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent overflow-hidden">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="p-3 sm:p-4 rounded-2xl bg-amber-500/10 shrink-0">
                  <Trophy className="w-8 h-8 sm:w-10 sm:h-10 text-amber-500" />
                </div>
                <div className="flex-1 min-w-0 text-center sm:text-left w-full">
                  <h2 className="text-xl sm:text-2xl font-bold">{unlockedAchievements.length} / {ALL_ACHIEVEMENTS.length}</h2>
                  <p className="text-sm text-muted-foreground">conquistas desbloqueadas</p>
                  <Progress 
                    value={(unlockedAchievements.length / ALL_ACHIEVEMENTS.length) * 100} 
                    className="h-2 mt-2"
                  />
                </div>
                <div className="text-center sm:text-right shrink-0">
                  <span className="text-2xl sm:text-3xl font-bold text-amber-500">{totalPoints}</span>
                  <p className="text-sm text-muted-foreground">pontos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="all" className="w-full">
            <TabsList className="w-full justify-start overflow-x-auto">
              <TabsTrigger value="all" data-testid="tab-all">Todas</TabsTrigger>
              {ACHIEVEMENT_CATEGORIES.map((cat) => (
                <TabsTrigger key={cat.id} value={cat.id} data-testid={`tab-${cat.id}`}>
                  <cat.icon className="w-4 h-4 mr-1.5" />
                  {cat.name}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="all" className="mt-4">
              <motion.div 
                className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {ALL_ACHIEVEMENTS.map((achievement) => {
                  const isUnlocked = unlockedIds.has(achievement.id);
                  return (
                    <motion.div key={achievement.id} variants={itemVariants}>
                      <Card className={`transition-all ${isUnlocked ? "" : "opacity-60"}`}>
                        <CardContent className="p-3 sm:p-4">
                          <div className="flex items-start gap-3">
                            <div className={`p-2.5 rounded-xl shrink-0 ${isUnlocked ? RARITY_COLORS[achievement.rarity as keyof typeof RARITY_COLORS] : "bg-muted text-muted-foreground"}`}>
                              {isUnlocked ? (
                                <achievement.icon className="w-5 h-5" />
                              ) : (
                                <Lock className="w-5 h-5" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <h3 className="font-medium text-sm truncate">{achievement.name}</h3>
                                <span className={`text-sm font-bold shrink-0 ${isUnlocked ? "text-amber-500" : "text-muted-foreground"}`}>
                                  +{achievement.points}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                {achievement.description}
                              </p>
                              <Badge variant="outline" className="text-xs capitalize mt-1.5">
                                {achievement.rarity}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </motion.div>
            </TabsContent>

            {ACHIEVEMENT_CATEGORIES.map((cat) => (
              <TabsContent key={cat.id} value={cat.id} className="mt-4">
                <motion.div 
                  className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {ALL_ACHIEVEMENTS.filter(a => a.category === cat.id).map((achievement) => {
                    const isUnlocked = unlockedIds.has(achievement.id);
                    return (
                      <motion.div key={achievement.id} variants={itemVariants}>
                        <Card className={`transition-all ${isUnlocked ? "" : "opacity-60"}`}>
                          <CardContent className="p-3 sm:p-4">
                            <div className="flex items-start gap-3">
                              <div className={`p-2.5 rounded-xl shrink-0 ${isUnlocked ? RARITY_COLORS[achievement.rarity as keyof typeof RARITY_COLORS] : "bg-muted text-muted-foreground"}`}>
                                {isUnlocked ? (
                                  <achievement.icon className="w-5 h-5" />
                                ) : (
                                  <Lock className="w-5 h-5" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <h3 className="font-medium text-sm truncate">{achievement.name}</h3>
                                  <span className={`text-sm font-bold shrink-0 ${isUnlocked ? "text-amber-500" : "text-muted-foreground"}`}>
                                    +{achievement.points}
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                  {achievement.description}
                                </p>
                                <Badge variant="outline" className="text-xs capitalize mt-1.5">
                                  {achievement.rarity}
                                </Badge>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </motion.div>
              </TabsContent>
            ))}
          </Tabs>
        </main>
      </ScrollArea>
    </div>
  );
}
