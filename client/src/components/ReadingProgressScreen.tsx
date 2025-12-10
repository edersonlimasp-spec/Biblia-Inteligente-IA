import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { getDeviceId } from "@/hooks/use-device-id";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, BookOpen, TrendingUp, CheckCircle2, Circle } from "lucide-react";
import { motion } from "framer-motion";

interface ReadingProgressScreenProps {
  onBack: () => void;
  onNavigateToBible: (book?: string) => void;
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

export function ReadingProgressScreen({ onBack, onNavigateToBible }: ReadingProgressScreenProps) {
  const { user } = useAuth();
  const deviceId = getDeviceId();
  const [selectedTestament, setSelectedTestament] = useState<"AT" | "NT">("AT");
  const [expandedBook, setExpandedBook] = useState<string | null>(null);

  const { data: readingProgress, isLoading } = useQuery<Array<{ book: string; chaptersRead: number[] }>>({
    queryKey: ['/api/reading-progress', deviceId],
    enabled: !!deviceId,
  });

  const totalChapters = BIBLE_BOOKS.reduce((sum, b) => sum + b.chapters, 0);
  const chaptersRead = readingProgress?.reduce((sum, p) => {
    const chapters = Array.isArray(p.chaptersRead) ? p.chaptersRead.length : 0;
    return sum + chapters;
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

  const filteredBooks = selectedTestament === "AT" ? atBooks : ntBooks;

  const getBookProgress = (bookName: string) => {
    const progress = readingProgress?.find((p) => p.book === bookName);
    if (!progress) return { read: 0, total: 0, chapters: [] as number[] };
    const book = BIBLE_BOOKS.find(b => b.name === bookName);
    if (!book) return { read: 0, total: 0, chapters: [] as number[] };
    const chapters = Array.isArray(progress.chaptersRead) ? progress.chaptersRead : [];
    return { 
      read: chapters.length, 
      total: book.chapters,
      chapters 
    };
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} data-testid="button-back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Progresso de Leitura</h1>
            <p className="text-sm text-muted-foreground">Acompanhe sua jornada bíblica</p>
          </div>
        </div>
      </header>

      <ScrollArea className="h-[calc(100vh-65px)]">
        <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 rounded-xl bg-primary/10">
                    <TrendingUp className="w-8 h-8 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">Progresso Geral</h3>
                    <p className="text-sm text-muted-foreground">
                      {chaptersRead} de {totalChapters} capítulos
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-4xl font-bold text-primary">{overallProgress}%</span>
                  </div>
                </div>
                <Progress value={overallProgress} className="h-4" />
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 gap-4"
          >
            <Card 
              className={`cursor-pointer transition-all ${selectedTestament === "AT" ? "border-primary ring-2 ring-primary/20" : ""}`}
              onClick={() => setSelectedTestament("AT")}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Antigo Testamento</span>
                  <Badge variant="secondary">{Math.round((atRead / atChapters) * 100)}%</Badge>
                </div>
                <Progress value={(atRead / atChapters) * 100} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2">{atRead}/{atChapters} capítulos</p>
              </CardContent>
            </Card>
            
            <Card 
              className={`cursor-pointer transition-all ${selectedTestament === "NT" ? "border-primary ring-2 ring-primary/20" : ""}`}
              onClick={() => setSelectedTestament("NT")}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Novo Testamento</span>
                  <Badge variant="secondary">{Math.round((ntRead / ntChapters) * 100)}%</Badge>
                </div>
                <Progress value={(ntRead / ntChapters) * 100} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2">{ntRead}/{ntChapters} capítulos</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  Livros do {selectedTestament === "AT" ? "Antigo" : "Novo"} Testamento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {filteredBooks.map((book, index) => {
                  const progress = getBookProgress(book.name);
                  const percentage = Math.round((progress.read / progress.total) * 100);
                  const isExpanded = expandedBook === book.name;
                  
                  return (
                    <motion.div
                      key={book.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.02 }}
                    >
                      <div
                        className={`rounded-lg border p-3 cursor-pointer transition-all hover:bg-accent/50 ${
                          percentage === 100 ? "border-green-500/30 bg-green-500/5" : ""
                        }`}
                        onClick={() => setExpandedBook(isExpanded ? null : book.name)}
                        data-testid={`book-${book.name}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {percentage === 100 ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            ) : (
                              <Circle className="w-4 h-4 text-muted-foreground" />
                            )}
                            <span className="font-medium">{book.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                              {progress.read}/{progress.total}
                            </span>
                            <Badge variant={percentage === 100 ? "default" : "secondary"}>
                              {percentage}%
                            </Badge>
                          </div>
                        </div>
                        <Progress value={percentage} className="h-1.5" />
                        
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            className="mt-4 pt-4 border-t"
                          >
                            <div className="flex flex-wrap gap-1.5">
                              {Array.from({ length: book.chapters }, (_, i) => i + 1).map((chapter) => {
                                const isRead = progress.chapters.includes(chapter);
                                return (
                                  <Button
                                    key={chapter}
                                    variant={isRead ? "default" : "outline"}
                                    size="sm"
                                    className={`w-9 h-9 p-0 ${isRead ? "bg-green-600 hover:bg-green-700" : ""}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onNavigateToBible(book.name);
                                    }}
                                    data-testid={`chapter-${book.name}-${chapter}`}
                                  >
                                    {chapter}
                                  </Button>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </ScrollArea>
    </div>
  );
}
