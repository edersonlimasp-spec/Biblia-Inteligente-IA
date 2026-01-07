import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ArrowLeft,
  Gamepad2,
  Brain,
  BookOpen,
  MessageCircle,
  Star,
  Trophy,
  ChevronRight,
  Check,
  X,
  Sparkles,
  RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface BibleGamesProps {
  onBack: () => void;
}

const QUIZ_QUESTIONS = [
  {
    question: "Quem construiu a arca?",
    options: ["Moisés", "Noé", "Abraão", "Davi"],
    correct: 1,
    category: "personagens",
  },
  {
    question: "Quantos dias Deus levou para criar o mundo?",
    options: ["5 dias", "6 dias", "7 dias", "40 dias"],
    correct: 1,
    category: "criação",
  },
  {
    question: "Qual é o primeiro livro da Bíblia?",
    options: ["Êxodo", "Salmos", "Gênesis", "Mateus"],
    correct: 2,
    category: "livros",
  },
  {
    question: "Quem matou Golias?",
    options: ["Saul", "Davi", "Sansão", "Josué"],
    correct: 1,
    category: "personagens",
  },
  {
    question: "Quantos apóstolos Jesus escolheu?",
    options: ["7", "10", "12", "70"],
    correct: 2,
    category: "novo_testamento",
  },
  {
    question: "Em qual cidade Jesus nasceu?",
    options: ["Jerusalém", "Nazaré", "Belém", "Cafarnaum"],
    correct: 2,
    category: "novo_testamento",
  },
  {
    question: "Quem foi jogado na cova dos leões?",
    options: ["Daniel", "Jonas", "Elias", "Jeremias"],
    correct: 0,
    category: "personagens",
  },
  {
    question: "Quantos livros tem a Bíblia?",
    options: ["39", "46", "66", "73"],
    correct: 2,
    category: "livros",
  },
];

const BOOK_ORDER_GAME = {
  title: "Ordem dos Livros",
  description: "Organize os livros na ordem correta",
  books: [
    { name: "Gênesis", order: 1 },
    { name: "Êxodo", order: 2 },
    { name: "Levítico", order: 3 },
    { name: "Números", order: 4 },
    { name: "Deuteronômio", order: 5 },
  ],
};

type GameMode = "menu" | "quiz" | "order" | "verses" | "characters";

export function BibleGames({ onBack }: BibleGamesProps) {
  const { t } = useLanguage();
  const [gameMode, setGameMode] = useState<GameMode>("menu");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const [shuffledQuestions, setShuffledQuestions] = useState(QUIZ_QUESTIONS);

  const startQuiz = () => {
    const shuffled = [...QUIZ_QUESTIONS].sort(() => Math.random() - 0.5).slice(0, 5);
    setShuffledQuestions(shuffled);
    setCurrentQuestion(0);
    setScore(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setGameComplete(false);
    setGameMode("quiz");
  };

  const handleAnswer = (index: number) => {
    if (showResult) return;
    setSelectedAnswer(index);
    setShowResult(true);
    if (index === shuffledQuestions[currentQuestion].correct) {
      setScore(score + 1);
    }
  };

  const nextQuestion = () => {
    if (currentQuestion < shuffledQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      setGameComplete(true);
    }
  };

  const GAMES = [
    {
      id: "quiz",
      name: t("games.quizBiblico"),
      description: t("games.quizDesc"),
      icon: Brain,
      color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      available: true,
    },
    {
      id: "order",
      name: t("games.orderBooks"),
      description: t("games.orderBooksDesc"),
      icon: BookOpen,
      color: "bg-purple-500/10 text-purple-500 border-purple-500/20",
      available: false,
    },
    {
      id: "verses",
      name: t("games.completeVerse"),
      description: t("games.completeVerseDesc"),
      icon: MessageCircle,
      color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
      available: false,
    },
    {
      id: "characters",
      name: t("games.whoIsWho"),
      description: t("games.whoIsWhoDesc"),
      icon: Star,
      color: "bg-amber-500/10 text-amber-500 border-amber-500/20",
      available: false,
    },
  ];

  if (gameMode === "quiz") {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b">
          <div className="flex items-center justify-between p-4 max-w-2xl mx-auto">
            <Button variant="ghost" size="icon" onClick={() => setGameMode("menu")} data-testid="button-back-menu">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-semibold">{t("games.quizBiblico")}</h1>
            <Badge variant="secondary" className="font-mono">
              {score}/{shuffledQuestions.length}
            </Badge>
          </div>
        </header>

        <main className="max-w-2xl mx-auto p-4">
          <AnimatePresence mode="wait">
            {!gameComplete ? (
              <motion.div
                key={currentQuestion}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Pergunta {currentQuestion + 1} de {shuffledQuestions.length}</span>
                    <Badge variant="outline" className="capitalize">
                      {shuffledQuestions[currentQuestion].category.replace("_", " ")}
                    </Badge>
                  </div>
                  <Progress value={((currentQuestion + 1) / shuffledQuestions.length) * 100} className="h-2" />
                </div>

                <Card className="border-2">
                  <CardContent className="p-6">
                    <h2 className="text-xl font-semibold text-center mb-6">
                      {shuffledQuestions[currentQuestion].question}
                    </h2>

                    <div className="space-y-3">
                      {shuffledQuestions[currentQuestion].options.map((option, index) => {
                        const isCorrect = index === shuffledQuestions[currentQuestion].correct;
                        const isSelected = selectedAnswer === index;
                        
                        let buttonClass = "w-full justify-start h-auto py-4 px-4 text-left";
                        if (showResult) {
                          if (isCorrect) {
                            buttonClass += " bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-400";
                          } else if (isSelected && !isCorrect) {
                            buttonClass += " bg-red-500/10 border-red-500 text-red-700 dark:text-red-400";
                          }
                        }

                        return (
                          <Button
                            key={index}
                            variant="outline"
                            className={buttonClass}
                            onClick={() => handleAnswer(index)}
                            disabled={showResult}
                            data-testid={`button-option-${index}`}
                          >
                            <div className="flex items-center gap-3 w-full">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                                showResult && isCorrect ? "bg-emerald-500 text-white" :
                                showResult && isSelected && !isCorrect ? "bg-red-500 text-white" :
                                "bg-muted"
                              }`}>
                                {showResult && isCorrect ? <Check className="w-4 h-4" /> :
                                 showResult && isSelected && !isCorrect ? <X className="w-4 h-4" /> :
                                 String.fromCharCode(65 + index)}
                              </div>
                              <span className="flex-1">{option}</span>
                            </div>
                          </Button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {showResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={nextQuestion}
                      data-testid="button-next"
                    >
                      {currentQuestion < shuffledQuestions.length - 1 ? t("games.nextQuestion") : t("games.seeResult")}
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </motion.div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="complete"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-6 py-8"
              >
                <div className="inline-flex p-6 rounded-full bg-primary/10">
                  <Trophy className="w-16 h-16 text-primary" />
                </div>
                
                <div>
                  <h2 className="text-2xl font-bold mb-2">Quiz Concluído!</h2>
                  <p className="text-muted-foreground">
                    Você acertou {score} de {shuffledQuestions.length} perguntas
                  </p>
                </div>

                <div className="flex justify-center gap-2">
                  {[...Array(shuffledQuestions.length)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-4 h-4 rounded-full ${i < score ? "bg-emerald-500" : "bg-red-500/50"}`}
                    />
                  ))}
                </div>

                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-center gap-2">
                      <Sparkles className="w-5 h-5 text-amber-500" />
                      <span className="font-medium">+{score * 10} pontos ganhos!</span>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex gap-3 justify-center">
                  <Button variant="outline" onClick={() => setGameMode("menu")} data-testid="button-menu">
                    Voltar ao Menu
                  </Button>
                  <Button onClick={startQuiz} data-testid="button-play-again">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Jogar Novamente
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b">
        <div className="flex items-center justify-between p-4 max-w-2xl mx-auto">
          <Button variant="ghost" size="icon" onClick={onBack} data-testid="button-back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-emerald-500" />
            Mini-Jogos
          </h1>
          <div className="w-10" />
        </div>
      </header>

      <ScrollArea className="h-[calc(100vh-65px)]">
        <main className="max-w-2xl mx-auto p-4 space-y-6">
          <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent">
            <CardContent className="p-6 text-center">
              <Gamepad2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Aprenda se Divertindo!</h2>
              <p className="text-muted-foreground">
                Teste seus conhecimentos bíblicos com jogos interativos e ganhe pontos
              </p>
            </CardContent>
          </Card>

          <div className="space-y-3">
            {GAMES.map((game) => (
              <Card 
                key={game.id}
                className={`transition-all ${game.available ? "hover-elevate cursor-pointer" : "opacity-60"}`}
                onClick={() => game.available && game.id === "quiz" && startQuiz()}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${game.color}`}>
                    <game.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{game.name}</h3>
                      {!game.available && (
                        <Badge variant="secondary" className="text-xs">Em breve</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{game.description}</p>
                  </div>
                  {game.available && <ChevronRight className="w-5 h-5 text-muted-foreground" />}
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Trophy className="w-5 h-5 text-amber-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Ganhe Conquistas!</p>
                  <p className="text-sm text-muted-foreground">
                    Complete jogos para desbloquear conquistas especiais e subir no ranking.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </ScrollArea>
    </div>
  );
}
