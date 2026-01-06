import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { getDeviceId } from "@/hooks/use-device-id";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  BookOpen, 
  TrendingUp, 
  Calendar,
  CheckCircle2,
  Circle,
  Play,
  Clock
} from "lucide-react";
import { motion } from "framer-motion";

interface PlansProgressScreenProps {
  onBack: () => void;
  onNavigateToBible: () => void;
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

const READING_PLANS = [
  {
    id: "annual",
    name: "Bíblia em 1 Ano",
    description: "Leia toda a Bíblia em 365 dias",
    duration: "12 meses",
    chaptersPerDay: 3,
    icon: Calendar,
    color: "from-blue-500 to-blue-700",
  },
  {
    id: "nt-90",
    name: "Novo Testamento em 90 dias",
    description: "Complete o NT em 3 meses",
    duration: "3 meses",
    chaptersPerDay: 3,
    icon: BookOpen,
    color: "from-emerald-500 to-emerald-700",
  },
  {
    id: "gospels",
    name: "Os 4 Evangelhos",
    description: "Leia Mateus, Marcos, Lucas e João",
    duration: "30 dias",
    chaptersPerDay: 3,
    icon: BookOpen,
    color: "from-purple-500 to-purple-700",
  },
  {
    id: "psalms",
    name: "Salmos em 30 dias",
    description: "5 salmos por dia durante um mês",
    duration: "30 dias",
    chaptersPerDay: 5,
    icon: BookOpen,
    color: "from-amber-500 to-amber-700",
  },
];

export function PlansProgressScreen({ onBack, onNavigateToBible }: PlansProgressScreenProps) {
  const deviceId = getDeviceId();
  const [activeTab, setActiveTab] = useState("progress");

  const { data: readingProgress } = useQuery<Array<{ book: string; chaptersRead: number[] }>>({
    queryKey: ['/api/reading-progress', deviceId],
    enabled: !!deviceId,
  });

  const totalChapters = BIBLE_BOOKS.reduce((sum, b) => sum + b.chapters, 0);
  const chaptersRead = readingProgress?.reduce((sum, p) => {
    return sum + (Array.isArray(p.chaptersRead) ? p.chaptersRead.length : 0);
  }, 0) || 0;
  const overallProgress = Math.round((chaptersRead / totalChapters) * 100);

  const atBooks = BIBLE_BOOKS.filter(b => b.testament === "AT");
  const ntBooks = BIBLE_BOOKS.filter(b => b.testament === "NT");
  
  const atChapters = atBooks.reduce((sum, b) => sum + b.chapters, 0);
  const ntChapters = ntBooks.reduce((sum, b) => sum + b.chapters, 0);
  
  const atRead = readingProgress?.reduce((sum, p) => {
    const book = atBooks.find(b => b.name === p.book);
    if (!book) return sum;
    return sum + (Array.isArray(p.chaptersRead) ? p.chaptersRead.length : 0);
  }, 0) || 0;
  
  const ntRead = readingProgress?.reduce((sum, p) => {
    const book = ntBooks.find(b => b.name === p.book);
    if (!book) return sum;
    return sum + (Array.isArray(p.chaptersRead) ? p.chaptersRead.length : 0);
  }, 0) || 0;

  const getBookProgress = (bookName: string) => {
    const progress = readingProgress?.find((p) => p.book === bookName);
    const book = BIBLE_BOOKS.find(b => b.name === bookName);
    if (!progress || !book) return 0;
    const chapters = Array.isArray(progress.chaptersRead) ? progress.chaptersRead.length : 0;
    return Math.round((chapters / book.chapters) * 100);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} data-testid="button-back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Planos & Progresso</h1>
            <p className="text-sm text-muted-foreground">Acompanhe sua jornada bíblica</p>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="progress" data-testid="tab-progress">
              <TrendingUp className="w-4 h-4 mr-2" />
              Progresso
            </TabsTrigger>
            <TabsTrigger value="plans" data-testid="tab-plans">
              <Calendar className="w-4 h-4 mr-2" />
              Planos de Leitura
            </TabsTrigger>
          </TabsList>

          <TabsContent value="progress" className="mt-4">
            <ScrollArea className="h-[calc(100vh-180px)]">
              <div className="space-y-4 pb-4">
                <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-2xl font-bold text-primary">{overallProgress}%</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold">Progresso Geral</h3>
                        <p className="text-sm text-muted-foreground">
                          {chaptersRead} de {totalChapters} capítulos
                        </p>
                      </div>
                    </div>
                    <Progress value={overallProgress} className="h-3" />
                  </CardContent>
                </Card>

                <div className="grid grid-cols-2 gap-3">
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2">Antigo Testamento</h4>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl font-bold text-primary">
                          {Math.round((atRead / atChapters) * 100)}%
                        </span>
                        <span className="text-xs text-muted-foreground">{atRead}/{atChapters}</span>
                      </div>
                      <Progress value={(atRead / atChapters) * 100} className="h-2" />
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2">Novo Testamento</h4>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl font-bold text-primary">
                          {Math.round((ntRead / ntChapters) * 100)}%
                        </span>
                        <span className="text-xs text-muted-foreground">{ntRead}/{ntChapters}</span>
                      </div>
                      <Progress value={(ntRead / ntChapters) * 100} className="h-2" />
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Livros do AT</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {atBooks.slice(0, 12).map((book) => {
                      const progress = getBookProgress(book.name);
                      return (
                        <div
                          key={book.name}
                          className="p-2 rounded-lg border bg-card cursor-pointer hover:bg-accent/50"
                          onClick={onNavigateToBible}
                          data-testid={`book-at-${book.name}`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium truncate">{book.name}</span>
                            {progress === 100 ? (
                              <CheckCircle2 className="w-3 h-3 text-green-500" />
                            ) : (
                              <span className="text-xs text-muted-foreground">{progress}%</span>
                            )}
                          </div>
                          <Progress value={progress} className="h-1" />
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Livros do NT</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {ntBooks.slice(0, 12).map((book) => {
                      const progress = getBookProgress(book.name);
                      return (
                        <div
                          key={book.name}
                          className="p-2 rounded-lg border bg-card cursor-pointer hover:bg-accent/50"
                          onClick={onNavigateToBible}
                          data-testid={`book-nt-${book.name}`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium truncate">{book.name}</span>
                            {progress === 100 ? (
                              <CheckCircle2 className="w-3 h-3 text-green-500" />
                            ) : (
                              <span className="text-xs text-muted-foreground">{progress}%</span>
                            )}
                          </div>
                          <Progress value={progress} className="h-1" />
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="plans" className="mt-4">
            <ScrollArea className="h-[calc(100vh-180px)]">
              <div className="space-y-4 pb-4">
                {READING_PLANS.map((plan, index) => (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="overflow-visible hover-elevate">
                      <CardContent className={`p-5 bg-gradient-to-br ${plan.color} rounded-lg`}>
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                            <plan.icon className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-white text-lg">{plan.name}</h3>
                            <p className="text-sm text-white/80 mb-3">{plan.description}</p>
                            <div className="flex items-center gap-4 text-xs text-white/70">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {plan.duration}
                              </span>
                              <span className="flex items-center gap-1">
                                <BookOpen className="w-3 h-3" />
                                {plan.chaptersPerDay} cap/dia
                              </span>
                            </div>
                          </div>
                          <Button 
                            size="sm" 
                            className="bg-white/20 text-white hover:bg-white/30 border-0"
                            onClick={onNavigateToBible}
                            data-testid={`button-start-${plan.id}`}
                          >
                            <Play className="w-4 h-4 mr-1" />
                            Iniciar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
