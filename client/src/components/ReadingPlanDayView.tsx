import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  BookOpen, 
  Calendar,
  CheckCircle2,
  Clock,
  Flame,
  Trophy,
  ChevronRight,
  AlertTriangle,
  Sparkles,
  MessageSquare
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { UserReadingPlan, UserDailyReading, ReadingPlanTemplate, DailyReading } from "@shared/schema";

interface ReadingPlanDayViewProps {
  plan: UserReadingPlan & { template?: ReadingPlanTemplate };
  todayReading: UserDailyReading | null;
  upcomingReadings: UserDailyReading[];
  overdueReadings: UserDailyReading[];
  onBack: () => void;
  onNavigateToChapter: (book: string, chapter: number) => void;
  onAskAI?: (question: string) => void;
}

const BOOK_NAMES: Record<string, { pt: string; en: string; es: string }> = {
  'gen': { pt: 'Gênesis', en: 'Genesis', es: 'Génesis' },
  'exo': { pt: 'Êxodo', en: 'Exodus', es: 'Éxodo' },
  'lev': { pt: 'Levítico', en: 'Leviticus', es: 'Levítico' },
  'num': { pt: 'Números', en: 'Numbers', es: 'Números' },
  'deu': { pt: 'Deuteronômio', en: 'Deuteronomy', es: 'Deuteronomio' },
  'jos': { pt: 'Josué', en: 'Joshua', es: 'Josué' },
  'jdg': { pt: 'Juízes', en: 'Judges', es: 'Jueces' },
  'rut': { pt: 'Rute', en: 'Ruth', es: 'Rut' },
  '1sa': { pt: '1 Samuel', en: '1 Samuel', es: '1 Samuel' },
  '2sa': { pt: '2 Samuel', en: '2 Samuel', es: '2 Samuel' },
  '1ki': { pt: '1 Reis', en: '1 Kings', es: '1 Reyes' },
  '2ki': { pt: '2 Reis', en: '2 Kings', es: '2 Reyes' },
  '1ch': { pt: '1 Crônicas', en: '1 Chronicles', es: '1 Crónicas' },
  '2ch': { pt: '2 Crônicas', en: '2 Chronicles', es: '2 Crónicas' },
  'ezr': { pt: 'Esdras', en: 'Ezra', es: 'Esdras' },
  'neh': { pt: 'Neemias', en: 'Nehemiah', es: 'Nehemías' },
  'est': { pt: 'Ester', en: 'Esther', es: 'Ester' },
  'job': { pt: 'Jó', en: 'Job', es: 'Job' },
  'psa': { pt: 'Salmos', en: 'Psalms', es: 'Salmos' },
  'pro': { pt: 'Provérbios', en: 'Proverbs', es: 'Proverbios' },
  'ecc': { pt: 'Eclesiastes', en: 'Ecclesiastes', es: 'Eclesiastés' },
  'sng': { pt: 'Cantares', en: 'Song of Solomon', es: 'Cantares' },
  'isa': { pt: 'Isaías', en: 'Isaiah', es: 'Isaías' },
  'jer': { pt: 'Jeremias', en: 'Jeremiah', es: 'Jeremías' },
  'lam': { pt: 'Lamentações', en: 'Lamentations', es: 'Lamentaciones' },
  'ezk': { pt: 'Ezequiel', en: 'Ezekiel', es: 'Ezequiel' },
  'dan': { pt: 'Daniel', en: 'Daniel', es: 'Daniel' },
  'hos': { pt: 'Oséias', en: 'Hosea', es: 'Oseas' },
  'joe': { pt: 'Joel', en: 'Joel', es: 'Joel' },
  'amo': { pt: 'Amós', en: 'Amos', es: 'Amós' },
  'oba': { pt: 'Obadias', en: 'Obadiah', es: 'Abdías' },
  'jon': { pt: 'Jonas', en: 'Jonah', es: 'Jonás' },
  'mic': { pt: 'Miquéias', en: 'Micah', es: 'Miqueas' },
  'nam': { pt: 'Naum', en: 'Nahum', es: 'Nahúm' },
  'hab': { pt: 'Habacuque', en: 'Habakkuk', es: 'Habacuc' },
  'zep': { pt: 'Sofonias', en: 'Zephaniah', es: 'Sofonías' },
  'hag': { pt: 'Ageu', en: 'Haggai', es: 'Hageo' },
  'zec': { pt: 'Zacarias', en: 'Zechariah', es: 'Zacarías' },
  'mal': { pt: 'Malaquias', en: 'Malachi', es: 'Malaquías' },
  'mat': { pt: 'Mateus', en: 'Matthew', es: 'Mateo' },
  'mrk': { pt: 'Marcos', en: 'Mark', es: 'Marcos' },
  'luk': { pt: 'Lucas', en: 'Luke', es: 'Lucas' },
  'jhn': { pt: 'João', en: 'John', es: 'Juan' },
  'act': { pt: 'Atos', en: 'Acts', es: 'Hechos' },
  'rom': { pt: 'Romanos', en: 'Romans', es: 'Romanos' },
  '1co': { pt: '1 Coríntios', en: '1 Corinthians', es: '1 Corintios' },
  '2co': { pt: '2 Coríntios', en: '2 Corinthians', es: '2 Corintios' },
  'gal': { pt: 'Gálatas', en: 'Galatians', es: 'Gálatas' },
  'eph': { pt: 'Efésios', en: 'Ephesians', es: 'Efesios' },
  'php': { pt: 'Filipenses', en: 'Philippians', es: 'Filipenses' },
  'col': { pt: 'Colossenses', en: 'Colossians', es: 'Colosenses' },
  '1th': { pt: '1 Tessalonicenses', en: '1 Thessalonians', es: '1 Tesalonicenses' },
  '2th': { pt: '2 Tessalonicenses', en: '2 Thessalonians', es: '2 Tesalonicenses' },
  '1ti': { pt: '1 Timóteo', en: '1 Timothy', es: '1 Timoteo' },
  '2ti': { pt: '2 Timóteo', en: '2 Timothy', es: '2 Timoteo' },
  'tit': { pt: 'Tito', en: 'Titus', es: 'Tito' },
  'phm': { pt: 'Filemom', en: 'Philemon', es: 'Filemón' },
  'heb': { pt: 'Hebreus', en: 'Hebrews', es: 'Hebreos' },
  'jas': { pt: 'Tiago', en: 'James', es: 'Santiago' },
  '1pe': { pt: '1 Pedro', en: '1 Peter', es: '1 Pedro' },
  '2pe': { pt: '2 Pedro', en: '2 Peter', es: '2 Pedro' },
  '1jn': { pt: '1 João', en: '1 John', es: '1 Juan' },
  '2jn': { pt: '2 João', en: '2 John', es: '2 Juan' },
  '3jn': { pt: '3 João', en: '3 John', es: '3 Juan' },
  'jud': { pt: 'Judas', en: 'Jude', es: 'Judas' },
  'rev': { pt: 'Apocalipse', en: 'Revelation', es: 'Apocalipsis' },
};

function getBookName(abbr: string, lang: 'pt' | 'en' | 'es'): string {
  return BOOK_NAMES[abbr]?.[lang] || abbr.toUpperCase();
}

function formatReadingReference(reading: DailyReading, lang: 'pt' | 'en' | 'es'): string {
  const bookName = getBookName(reading.book, lang);
  if (reading.endChapter && reading.endChapter !== reading.startChapter) {
    return `${bookName} ${reading.startChapter}-${reading.endChapter}`;
  }
  return `${bookName} ${reading.startChapter}`;
}

export function ReadingPlanDayView({
  plan,
  todayReading,
  upcomingReadings,
  overdueReadings,
  onBack,
  onNavigateToChapter,
  onAskAI,
}: ReadingPlanDayViewProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const lang = (language || 'pt') as 'pt' | 'en' | 'es';
  
  const [completedChapters, setCompletedChapters] = useState<Set<string>>(new Set());

  const markCompleteMutation = useMutation({
    mutationFn: async ({ planId, dayIndex, completedReadings }: { 
      planId: string; 
      dayIndex: number; 
      completedReadings: { book: string; chapter: number }[] 
    }) => {
      const response = await apiRequest('POST', `/api/reading-plans/user/${planId}/complete`, {
        dayIndex,
        completedReadings,
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/reading-plans/user/active'] });
      queryClient.invalidateQueries({ queryKey: ['/api/reading-plans/user'] });
      
      if (data.isCompleted) {
        toast({
          title: lang === 'pt' ? "Parabéns!" : lang === 'es' ? "¡Felicidades!" : "Congratulations!",
          description: lang === 'pt' ? "Leitura do dia concluída!" 
                     : lang === 'es' ? "¡Lectura del día completada!"
                     : "Today's reading completed!",
        });
      }
    },
  });

  const handleToggleChapter = (reading: DailyReading, chapter: number) => {
    const key = `${reading.book}-${chapter}`;
    const newCompleted = new Set(completedChapters);
    
    if (newCompleted.has(key)) {
      newCompleted.delete(key);
    } else {
      newCompleted.add(key);
    }
    
    setCompletedChapters(newCompleted);
  };

  const handleMarkDayComplete = () => {
    if (!todayReading) return;
    
    const completedReadings: { book: string; chapter: number }[] = [];
    
    for (const reading of todayReading.readings) {
      const startCh = reading.startChapter;
      const endCh = reading.endChapter || reading.startChapter;
      
      for (let ch = startCh; ch <= endCh; ch++) {
        completedReadings.push({ book: reading.book, chapter: ch });
      }
    }
    
    markCompleteMutation.mutate({
      planId: plan.id,
      dayIndex: todayReading.dayIndex,
      completedReadings,
    });
  };

  const getChaptersFromReading = (reading: DailyReading): number[] => {
    const chapters: number[] = [];
    const startCh = reading.startChapter;
    const endCh = reading.endChapter || reading.startChapter;
    
    for (let ch = startCh; ch <= endCh; ch++) {
      chapters.push(ch);
    }
    
    return chapters;
  };

  const allTodayChaptersCompleted = todayReading?.readings.every(reading => {
    const chapters = getChaptersFromReading(reading);
    return chapters.every(ch => completedChapters.has(`${reading.book}-${ch}`));
  }) || false;

  const progressPercent = plan.template 
    ? Math.round((plan.completedDays / plan.template.durationDays) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} data-testid="button-back-plan">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">
              {plan.template 
                ? (lang === 'en' ? plan.template.titleEn : lang === 'es' ? plan.template.titleEs : plan.template.titlePt)
                : lang === 'pt' ? 'Meu Plano' : lang === 'es' ? 'Mi Plan' : 'My Plan'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {lang === 'pt' ? `Dia ${plan.currentDay}` : lang === 'es' ? `Día ${plan.currentDay}` : `Day ${plan.currentDay}`}
            </p>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-4 space-y-4">
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">
                    {lang === 'pt' ? 'Progresso Total' : lang === 'es' ? 'Progreso Total' : 'Total Progress'}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {plan.completedDays} / {plan.template?.durationDays || '?'} {lang === 'pt' ? 'dias' : lang === 'es' ? 'días' : 'days'}
                  </span>
                </div>
                <Progress value={progressPercent} className="h-2" />
              </div>
              
              <div className="flex items-center gap-3 text-center">
                <div className="flex flex-col items-center">
                  <div className="flex items-center text-orange-500">
                    <Flame className="w-4 h-4 mr-1" />
                    <span className="font-bold">{plan.streakDays}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {lang === 'pt' ? 'seguidos' : 'streak'}
                  </span>
                </div>
                
                <Separator orientation="vertical" className="h-8" />
                
                <div className="flex flex-col items-center">
                  <div className="flex items-center text-yellow-500">
                    <Trophy className="w-4 h-4 mr-1" />
                    <span className="font-bold">{plan.longestStreak}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {lang === 'pt' ? 'recorde' : 'best'}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {overdueReadings.length > 0 && (
          <Card className="border-orange-500/30 bg-orange-50 dark:bg-orange-900/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 text-orange-700 dark:text-orange-400">
                <AlertTriangle className="w-4 h-4" />
                {lang === 'pt' ? 'Leituras Atrasadas' : lang === 'es' ? 'Lecturas Atrasadas' : 'Overdue Readings'}
                <Badge variant="secondary" className="bg-orange-200 dark:bg-orange-800 text-orange-800 dark:text-orange-200">
                  {overdueReadings.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {overdueReadings.slice(0, 3).map((reading) => (
                <div 
                  key={reading.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-orange-100/50 dark:bg-orange-900/20"
                >
                  <div>
                    <span className="text-sm font-medium text-orange-800 dark:text-orange-300">
                      {lang === 'pt' ? `Dia ${reading.dayIndex}` : `Day ${reading.dayIndex}`}
                    </span>
                    <p className="text-xs text-orange-600 dark:text-orange-400">
                      {reading.readings.map(r => formatReadingReference(r, lang)).join(', ')}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-orange-500" />
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {todayReading && (
          <Card className="border-primary/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                {lang === 'pt' ? 'Leitura de Hoje' : lang === 'es' ? 'Lectura de Hoy' : "Today's Reading"}
                {todayReading.isCompleted && (
                  <Badge className="bg-green-500 text-white">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    {lang === 'pt' ? 'Concluído' : lang === 'es' ? 'Completado' : 'Completed'}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <AnimatePresence>
                {todayReading.readings.map((reading, idx) => {
                  const chapters = getChaptersFromReading(reading);
                  
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="p-4 rounded-lg border bg-card"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-primary" />
                          {getBookName(reading.book, lang)}
                        </h4>
                        <span className="text-sm text-muted-foreground">
                          {chapters.length} {lang === 'pt' ? 'capítulo(s)' : lang === 'es' ? 'capítulo(s)' : 'chapter(s)'}
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        {chapters.map(chapter => {
                          const isChecked = completedChapters.has(`${reading.book}-${chapter}`);
                          
                          return (
                            <div
                              key={chapter}
                              className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 cursor-pointer"
                              onClick={() => onNavigateToChapter(reading.book, chapter)}
                              data-testid={`reading-${reading.book}-${chapter}`}
                            >
                              <Checkbox
                                checked={isChecked}
                                onCheckedChange={() => handleToggleChapter(reading, chapter)}
                                onClick={(e) => e.stopPropagation()}
                                data-testid={`checkbox-${reading.book}-${chapter}`}
                              />
                              <span className={`flex-1 ${isChecked ? 'line-through text-muted-foreground' : ''}`}>
                                {lang === 'pt' ? 'Capítulo' : lang === 'es' ? 'Capítulo' : 'Chapter'} {chapter}
                              </span>
                              <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {!todayReading.isCompleted && (
                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    onClick={handleMarkDayComplete}
                    disabled={markCompleteMutation.isPending}
                    data-testid="button-complete-day"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    {markCompleteMutation.isPending 
                      ? (lang === 'pt' ? 'Salvando...' : 'Saving...')
                      : (lang === 'pt' ? 'Marcar como Lido' : lang === 'es' ? 'Marcar como Leído' : 'Mark as Read')}
                  </Button>
                  
                  {onAskAI && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        const ref = todayReading.readings.map(r => formatReadingReference(r, lang)).join(', ');
                        onAskAI(`Explique o contexto e principais ensinamentos de ${ref}`);
                      }}
                      data-testid="button-ask-ai-context"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      {lang === 'pt' ? 'Pergunte à IA' : 'Ask AI'}
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {upcomingReadings.length > 1 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                {lang === 'pt' ? 'Próximos Dias' : lang === 'es' ? 'Próximos Días' : 'Upcoming Days'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {upcomingReadings.slice(1, 5).map((reading) => (
                <div 
                  key={reading.id}
                  className="flex items-center justify-between p-2 rounded-lg border bg-card hover-elevate"
                >
                  <div>
                    <span className="text-sm font-medium">
                      {lang === 'pt' ? `Dia ${reading.dayIndex}` : `Day ${reading.dayIndex}`}
                    </span>
                    <p className="text-xs text-muted-foreground">
                      {reading.readings.map(r => formatReadingReference(r, lang)).join(', ')}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card className="border-dashed border-primary/30">
          <CardContent className="p-4 text-center">
            <Sparkles className="w-8 h-8 mx-auto text-primary/50 mb-2" />
            <p className="text-sm text-muted-foreground">
              {lang === 'pt' 
                ? 'Use o método S.O.A.P. para aprofundar sua leitura: Escritura, Observação, Aplicação, Oração.'
                : lang === 'es'
                ? 'Usa el método S.O.A.P. para profundizar tu lectura: Escritura, Observación, Aplicación, Oración.'
                : 'Use the S.O.A.P. method to deepen your reading: Scripture, Observation, Application, Prayer.'}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
