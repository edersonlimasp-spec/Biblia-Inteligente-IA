import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { getDeviceId } from "@/hooks/use-device-id";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  BookOpen, 
  Brain, 
  Trophy, 
  Timer, 
  Sparkles, 
  TrendingUp,
  Calendar,
  Gamepad2,
  CreditCard,
  ChevronRight,
  Flame,
  Star,
  Target,
  Zap,
  Moon,
  Sun,
  BookMarked,
  MessageCircle,
  GraduationCap,
  Church,
  Scale,
  Microscope
} from "lucide-react";
import { motion } from "framer-motion";

interface DashboardProps {
  onNavigateToBible: () => void;
  onNavigateToZenMode: () => void;
  onNavigateToAchievements: () => void;
  onNavigateToGames: () => void;
  onNavigateToSubscriptions: () => void;
  onNavigateToAI: (mode?: string) => void;
}

const BIBLE_BOOKS = [
  { name: "Gênesis", chapters: 50, testament: "AT" },
  { name: "Êxodo", chapters: 40, testament: "AT" },
  { name: "Levítico", chapters: 27, testament: "AT" },
  { name: "Números", chapters: 36, testament: "AT" },
  { name: "Deuteronômio", chapters: 34, testament: "AT" },
  { name: "Josué", chapters: 24, testament: "AT" },
  { name: "Juízes", chapters: 21, testament: "AT" },
  { name: "Rute", chapters: 4, testament: "AT" },
  { name: "1 Samuel", chapters: 31, testament: "AT" },
  { name: "2 Samuel", chapters: 24, testament: "AT" },
  { name: "1 Reis", chapters: 22, testament: "AT" },
  { name: "2 Reis", chapters: 25, testament: "AT" },
  { name: "1 Crônicas", chapters: 29, testament: "AT" },
  { name: "2 Crônicas", chapters: 36, testament: "AT" },
  { name: "Esdras", chapters: 10, testament: "AT" },
  { name: "Neemias", chapters: 13, testament: "AT" },
  { name: "Ester", chapters: 10, testament: "AT" },
  { name: "Jó", chapters: 42, testament: "AT" },
  { name: "Salmos", chapters: 150, testament: "AT" },
  { name: "Provérbios", chapters: 31, testament: "AT" },
  { name: "Eclesiastes", chapters: 12, testament: "AT" },
  { name: "Cantares", chapters: 8, testament: "AT" },
  { name: "Isaías", chapters: 66, testament: "AT" },
  { name: "Jeremias", chapters: 52, testament: "AT" },
  { name: "Lamentações", chapters: 5, testament: "AT" },
  { name: "Ezequiel", chapters: 48, testament: "AT" },
  { name: "Daniel", chapters: 12, testament: "AT" },
  { name: "Oséias", chapters: 14, testament: "AT" },
  { name: "Joel", chapters: 3, testament: "AT" },
  { name: "Amós", chapters: 9, testament: "AT" },
  { name: "Obadias", chapters: 1, testament: "AT" },
  { name: "Jonas", chapters: 4, testament: "AT" },
  { name: "Miquéias", chapters: 7, testament: "AT" },
  { name: "Naum", chapters: 3, testament: "AT" },
  { name: "Habacuque", chapters: 3, testament: "AT" },
  { name: "Sofonias", chapters: 3, testament: "AT" },
  { name: "Ageu", chapters: 2, testament: "AT" },
  { name: "Zacarias", chapters: 14, testament: "AT" },
  { name: "Malaquias", chapters: 4, testament: "AT" },
  { name: "Mateus", chapters: 28, testament: "NT" },
  { name: "Marcos", chapters: 16, testament: "NT" },
  { name: "Lucas", chapters: 24, testament: "NT" },
  { name: "João", chapters: 21, testament: "NT" },
  { name: "Atos", chapters: 28, testament: "NT" },
  { name: "Romanos", chapters: 16, testament: "NT" },
  { name: "1 Coríntios", chapters: 16, testament: "NT" },
  { name: "2 Coríntios", chapters: 13, testament: "NT" },
  { name: "Gálatas", chapters: 6, testament: "NT" },
  { name: "Efésios", chapters: 6, testament: "NT" },
  { name: "Filipenses", chapters: 4, testament: "NT" },
  { name: "Colossenses", chapters: 4, testament: "NT" },
  { name: "1 Tessalonicenses", chapters: 5, testament: "NT" },
  { name: "2 Tessalonicenses", chapters: 3, testament: "NT" },
  { name: "1 Timóteo", chapters: 6, testament: "NT" },
  { name: "2 Timóteo", chapters: 4, testament: "NT" },
  { name: "Tito", chapters: 3, testament: "NT" },
  { name: "Filemom", chapters: 1, testament: "NT" },
  { name: "Hebreus", chapters: 13, testament: "NT" },
  { name: "Tiago", chapters: 5, testament: "NT" },
  { name: "1 Pedro", chapters: 5, testament: "NT" },
  { name: "2 Pedro", chapters: 3, testament: "NT" },
  { name: "1 João", chapters: 5, testament: "NT" },
  { name: "2 João", chapters: 1, testament: "NT" },
  { name: "3 João", chapters: 1, testament: "NT" },
  { name: "Judas", chapters: 1, testament: "NT" },
  { name: "Apocalipse", chapters: 22, testament: "NT" },
];

const AI_MODES = [
  {
    id: "professor",
    name: "Professor",
    description: "Explicações didáticas e claras",
    icon: GraduationCap,
    color: "bg-blue-500/10 text-blue-500 dark:bg-blue-500/20",
    premium: false,
  },
  {
    id: "pregador",
    name: "Pregador",
    description: "Mensagens inspiradoras e edificantes",
    icon: Church,
    color: "bg-purple-500/10 text-purple-500 dark:bg-purple-500/20",
    premium: true,
  },
  {
    id: "exegese",
    name: "Exegese Profunda",
    description: "Análise textual e contextual",
    icon: Microscope,
    color: "bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/20",
    premium: true,
  },
  {
    id: "teologica",
    name: "Comparação Teológica",
    description: "Diferentes perspectivas denominacionais",
    icon: Scale,
    color: "bg-amber-500/10 text-amber-500 dark:bg-amber-500/20",
    premium: true,
  },
];

const ACHIEVEMENTS_PREVIEW = [
  { id: "first_read", name: "Primeiro Passo", icon: "BookOpen", unlocked: true },
  { id: "strong_explorer", name: "Explorador Strong", icon: "Brain", unlocked: true },
  { id: "zen_master", name: "Mestre Zen", icon: "Moon", unlocked: false },
  { id: "bible_complete", name: "Bíblia Completa", icon: "Trophy", unlocked: false },
];

export function Dashboard({
  onNavigateToBible,
  onNavigateToZenMode,
  onNavigateToAchievements,
  onNavigateToGames,
  onNavigateToSubscriptions,
  onNavigateToAI,
}: DashboardProps) {
  const { user } = useAuth();
  const deviceId = getDeviceId();
  const [selectedTestament, setSelectedTestament] = useState<"AT" | "NT">("AT");

  const { data: readingProgress } = useQuery<any[]>({
    queryKey: ['/api/reading-progress', deviceId],
    enabled: !!deviceId,
  });

  const { data: achievements } = useQuery<any[]>({
    queryKey: ['/api/achievements', deviceId],
    enabled: !!deviceId,
  });

  const { data: trialInfo } = useQuery<{ active: boolean; daysRemaining: number }>({
    queryKey: ['/api/guest/trial', deviceId],
    enabled: !!deviceId && !user,
  });

  const totalChapters = BIBLE_BOOKS.reduce((sum, b) => sum + b.chapters, 0);
  const chaptersRead = readingProgress?.reduce((sum: number, p: any) => {
    const chapters = Array.isArray(p.chaptersRead) ? p.chaptersRead.length : 0;
    return sum + chapters;
  }, 0) || 0;
  const overallProgress = Math.round((chaptersRead / totalChapters) * 100);

  const filteredBooks = BIBLE_BOOKS.filter(b => b.testament === selectedTestament);

  const getBookProgress = (bookName: string) => {
    const progress = readingProgress?.find((p: any) => p.book === bookName);
    if (!progress) return 0;
    const book = BIBLE_BOOKS.find(b => b.name === bookName);
    if (!book) return 0;
    const chapters = Array.isArray(progress.chaptersRead) ? progress.chaptersRead.length : 0;
    return Math.round((chapters / book.chapters) * 100);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-background">
      <ScrollArea className="h-screen">
        <motion.div 
          className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants} className="text-center space-y-2">
            <h1 className="text-3xl sm:text-4xl font-serif font-bold bg-gradient-to-r from-primary via-blue-500 to-primary bg-clip-text text-transparent">
              Bíblia Hebraico & Grego
            </h1>
            <p className="text-muted-foreground">
              {user ? `Bem-vindo, ${user.name || user.email}` : "Estudo bíblico com textos originais e IA"}
            </p>
            {!user && trialInfo && (
              <Badge variant="secondary" className="mt-2">
                <Timer className="w-3 h-3 mr-1" />
                {trialInfo.daysRemaining} dias restantes no trial
              </Badge>
            )}
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-primary/10">
                      <TrendingUp className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Progresso Geral</h3>
                      <p className="text-sm text-muted-foreground">
                        {chaptersRead} de {totalChapters} capítulos lidos
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-bold text-primary">{overallProgress}%</span>
                  </div>
                </div>
                <Progress value={overallProgress} className="h-3" />
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <span>Antigo Testamento</span>
                  <span>Novo Testamento</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center gap-2 hover-elevate"
              onClick={onNavigateToBible}
              data-testid="button-read-bible"
            >
              <BookOpen className="w-6 h-6 text-primary" />
              <span className="text-sm font-medium">Ler Bíblia</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center gap-2 hover-elevate"
              onClick={onNavigateToZenMode}
              data-testid="button-zen-mode"
            >
              <Moon className="w-6 h-6 text-purple-500" />
              <span className="text-sm font-medium">Modo Zen</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center gap-2 hover-elevate"
              onClick={onNavigateToAchievements}
              data-testid="button-achievements"
            >
              <Trophy className="w-6 h-6 text-amber-500" />
              <span className="text-sm font-medium">Conquistas</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center gap-2 hover-elevate"
              onClick={onNavigateToGames}
              data-testid="button-games"
            >
              <Gamepad2 className="w-6 h-6 text-emerald-500" />
              <span className="text-sm font-medium">Jogos</span>
            </Button>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-primary" />
                    IA Professor
                  </CardTitle>
                  <Badge variant="secondary">GPT-4o</Badge>
                </div>
                <CardDescription>
                  Escolha um modo de estudo assistido por inteligência artificial
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {AI_MODES.map((mode) => (
                  <Button
                    key={mode.id}
                    variant="outline"
                    className="h-auto p-4 justify-start hover-elevate"
                    onClick={() => onNavigateToAI(mode.id)}
                    data-testid={`button-ai-${mode.id}`}
                  >
                    <div className={`p-2 rounded-lg ${mode.color} mr-3`}>
                      <mode.icon className="w-5 h-5" />
                    </div>
                    <div className="text-left flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{mode.name}</span>
                        {mode.premium && (
                          <Badge variant="secondary" className="text-xs px-1.5 py-0">
                            Premium
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{mode.description}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </Button>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <BookMarked className="w-5 h-5 text-primary" />
                    Progresso por Livro
                  </CardTitle>
                  <div className="flex gap-1">
                    <Button
                      variant={selectedTestament === "AT" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setSelectedTestament("AT")}
                      data-testid="button-testament-at"
                    >
                      AT
                    </Button>
                    <Button
                      variant={selectedTestament === "NT" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setSelectedTestament("NT")}
                      data-testid="button-testament-nt"
                    >
                      NT
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                  {filteredBooks.slice(0, 15).map((book) => {
                    const progress = getBookProgress(book.name);
                    return (
                      <div
                        key={book.name}
                        className="p-2 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                        onClick={() => onNavigateToBible()}
                        data-testid={`book-progress-${book.name}`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium truncate">{book.name}</span>
                          <span className="text-xs text-muted-foreground">{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-1.5" />
                      </div>
                    );
                  })}
                </div>
                {filteredBooks.length > 15 && (
                  <Button 
                    variant="ghost" 
                    className="w-full mt-3 text-muted-foreground"
                    onClick={onNavigateToBible}
                  >
                    Ver todos os {filteredBooks.length} livros
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="bg-gradient-to-br from-purple-500/10 to-transparent border-purple-500/20">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Moon className="w-5 h-5 text-purple-500" />
                  Modo Zen
                </CardTitle>
                <CardDescription>
                  Estudo focado com áudio ambiente e temporizador
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex gap-2">
                    {["🌧️", "🌲", "🌊", "🔥"].map((sound, i) => (
                      <div 
                        key={i}
                        className="w-10 h-10 rounded-full bg-background/50 flex items-center justify-center text-lg"
                      >
                        {sound}
                      </div>
                    ))}
                  </div>
                </div>
                <Button 
                  className="w-full"
                  onClick={onNavigateToZenMode}
                  data-testid="button-start-zen"
                >
                  <Timer className="w-4 h-4 mr-2" />
                  Iniciar Sessão
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-500/10 to-transparent border-amber-500/20">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  Conquistas
                </CardTitle>
                <CardDescription>
                  Desbloqueie distintivos completando marcos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-4">
                  {ACHIEVEMENTS_PREVIEW.map((a, i) => (
                    <div 
                      key={i}
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        a.unlocked 
                          ? "bg-amber-500/20 text-amber-500" 
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {a.unlocked ? <Star className="w-5 h-5" /> : <Target className="w-5 h-5" />}
                    </div>
                  ))}
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-sm font-medium">
                    +12
                  </div>
                </div>
                <Button 
                  variant="outline"
                  className="w-full"
                  onClick={onNavigateToAchievements}
                  data-testid="button-view-achievements"
                >
                  Ver Todas
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-500/20">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Gamepad2 className="w-5 h-5 text-emerald-500" />
                  Mini-Jogos Bíblicos
                </CardTitle>
                <CardDescription>
                  Aprenda se divertindo com jogos interativos
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { name: "Quiz Bíblico", icon: Brain, color: "text-blue-500" },
                  { name: "Ordem dos Livros", icon: BookOpen, color: "text-purple-500" },
                  { name: "Versículos", icon: MessageCircle, color: "text-emerald-500" },
                  { name: "Personagens", icon: Star, color: "text-amber-500" },
                ].map((game, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-center gap-2 hover-elevate"
                    onClick={onNavigateToGames}
                    data-testid={`button-game-${i}`}
                  >
                    <game.icon className={`w-6 h-6 ${game.color}`} />
                    <span className="text-xs font-medium text-center">{game.name}</span>
                  </Button>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="border-primary/30 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="p-4 rounded-2xl bg-primary/10">
                    <Sparkles className="w-8 h-8 text-primary" />
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="text-lg font-semibold">Desbloqueie Todo o Potencial</h3>
                    <p className="text-sm text-muted-foreground">
                      Acesso ilimitado à IA, Strong's completo e todos os recursos premium
                    </p>
                  </div>
                  <Button 
                    onClick={onNavigateToSubscriptions}
                    className="w-full sm:w-auto"
                    data-testid="button-upgrade"
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Ver Planos
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Integração com Calendário
                </CardTitle>
                <CardDescription>
                  Agende seus planos de leitura no Google Calendar ou Apple Calendar
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                <Button variant="outline" className="hover-elevate" data-testid="button-google-calendar">
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.5 22H4.5C3.12 22 2 20.88 2 19.5V4.5C2 3.12 3.12 2 4.5 2H19.5C20.88 2 22 3.12 22 4.5V19.5C22 20.88 20.88 22 19.5 22Z" fill="none" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M7 7H17M7 12H17M7 17H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  Google Calendar
                </Button>
                <Button variant="outline" className="hover-elevate" data-testid="button-apple-calendar">
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.5 22H4.5C3.12 22 2 20.88 2 19.5V4.5C2 3.12 3.12 2 4.5 2H19.5C20.88 2 22 3.12 22 4.5V19.5C22 20.88 20.88 22 19.5 22Z" fill="none" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M7 7H17M7 12H17M7 17H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  Apple Calendar
                </Button>
                <Badge variant="secondary">Em breve</Badge>
              </CardContent>
            </Card>
          </motion.div>

          <div className="h-8" />
        </motion.div>
      </ScrollArea>
    </div>
  );
}
