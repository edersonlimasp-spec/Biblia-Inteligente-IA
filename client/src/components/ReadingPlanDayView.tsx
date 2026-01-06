import { useState, useEffect, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  BookOpen, 
  CheckCircle2,
  Flame,
  Trophy,
  ChevronRight,
  MessageSquare,
  Sparkles
} from "lucide-react";
import { motion } from "framer-motion";
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

  const serverCompletedChapters = useMemo(() => {
    const set = new Set<string>();
    if (todayReading?.completedReadings) {
      for (const cr of todayReading.completedReadings) {
        set.add(`${cr.book}-${cr.chapter}`);
      }
    }
    return set;
  }, [todayReading?.completedReadings]);

  useEffect(() => {
    setCompletedChapters(new Set(serverCompletedChapters));
  }, [serverCompletedChapters]);

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
          title: lang === 'pt' ? "Parabéns!" : lang === 'es' ? "Felicidades!" : "Congratulations!",
          description: lang === 'pt' ? "Leitura do dia concluída!" : "Day completed!",
        });
      } else {
        toast({
          title: lang === 'pt' ? "Progresso salvo!" : "Progress saved!",
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

  const handleSaveProgress = () => {
    if (!todayReading) return;
    
    const completedReadings: { book: string; chapter: number }[] = [];
    
    const completedArray = Array.from(completedChapters);
    for (const key of completedArray) {
      const [book, chapterStr] = key.split('-');
      const chapter = parseInt(chapterStr, 10);
      if (book && !isNaN(chapter)) {
        completedReadings.push({ book, chapter });
      }
    }
    
    if (completedReadings.length === 0) {
      toast({
        title: lang === 'pt' ? "Selecione pelo menos um capítulo" : "Select at least one chapter",
        variant: "destructive",
      });
      return;
    }
    
    markCompleteMutation.mutate({
      planId: plan.id,
      dayIndex: todayReading.dayIndex,
      completedReadings,
    });
  };

  const handleMarkAllComplete = () => {
    if (!todayReading) return;
    
    const allChapters = new Set<string>();
    for (const reading of todayReading.readings) {
      const startCh = reading.startChapter;
      const endCh = reading.endChapter || reading.startChapter;
      for (let ch = startCh; ch <= endCh; ch++) {
        allChapters.add(`${reading.book}-${ch}`);
      }
    }
    
    setCompletedChapters(allChapters);
    
    const completedReadings: { book: string; chapter: number }[] = [];
    const allChaptersArray = Array.from(allChapters);
    for (const key of allChaptersArray) {
      const [book, chapterStr] = key.split('-');
      const chapter = parseInt(chapterStr, 10);
      if (book && !isNaN(chapter)) {
        completedReadings.push({ book, chapter });
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

  const totalTodayChapters = todayReading?.readings.reduce((acc, r) => {
    return acc + getChaptersFromReading(r).length;
  }, 0) || 0;

  const completedTodayCount = todayReading?.readings.reduce((acc, reading) => {
    const chapters = getChaptersFromReading(reading);
    return acc + chapters.filter(ch => completedChapters.has(`${reading.book}-${ch}`)).length;
  }, 0) || 0;

  const todayProgress = totalTodayChapters > 0 ? Math.round((completedTodayCount / totalTodayChapters) * 100) : 0;

  const progressPercent = plan.template 
    ? Math.round((plan.completedDays / plan.template.durationDays) * 100)
    : 0;

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="shrink-0 px-4 py-3 border-b bg-background/95 backdrop-blur flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} data-testid="button-back-plan">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold truncate">
            {plan.template 
              ? (lang === 'en' ? plan.template.titleEn : lang === 'es' ? plan.template.titleEs : plan.template.titlePt)
              : lang === 'pt' ? 'Meu Plano' : 'My Plan'}
          </h1>
          <p className="text-xs text-muted-foreground">
            {lang === 'pt' ? `Dia ${plan.currentDay}` : `Day ${plan.currentDay}`} • {progressPercent}%
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-sm">
            <Flame className="w-4 h-4 text-orange-500" />
            <span className="font-medium">{plan.streakDays}</span>
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Trophy className="w-4 h-4 text-yellow-500" />
            <span>{plan.longestStreak}</span>
          </div>
        </div>
      </header>

      <div className="shrink-0 px-4 py-3">
        <Progress value={progressPercent} className="h-1" />
      </div>

      <ScrollArea className="flex-1">
        <div className="px-4 pb-32 space-y-4">
          {overdueReadings.length > 0 && (
            <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20">
              <p className="text-sm font-medium text-orange-600 dark:text-orange-400 mb-2">
                {overdueReadings.length} {lang === 'pt' ? 'leituras atrasadas' : 'overdue readings'}
              </p>
              <div className="flex flex-wrap gap-2">
                {overdueReadings.slice(0, 3).map((reading) => (
                  <Badge 
                    key={reading.id} 
                    variant="secondary" 
                    className="bg-orange-500/20 text-orange-700 dark:text-orange-300"
                  >
                    {lang === 'pt' ? `Dia ${reading.dayIndex}` : `Day ${reading.dayIndex}`}
                  </Badge>
                ))}
                {overdueReadings.length > 3 && (
                  <Badge variant="secondary" className="bg-orange-500/20 text-orange-700 dark:text-orange-300">
                    +{overdueReadings.length - 3}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {todayReading && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  {lang === 'pt' ? 'Leitura de Hoje' : "Today's Reading"}
                </h2>
                {todayReading.isCompleted && (
                  <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    {lang === 'pt' ? 'Completo' : 'Done'}
                  </Badge>
                )}
              </div>

              {!todayReading.isCompleted && (
                <div className="flex items-center gap-3 text-sm">
                  <Progress value={todayProgress} className="flex-1 h-1.5" />
                  <span className="text-muted-foreground whitespace-nowrap">
                    {completedTodayCount}/{totalTodayChapters}
                  </span>
                </div>
              )}

              {todayReading.readings.map((reading, idx) => {
                const chapters = getChaptersFromReading(reading);
                
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="rounded-xl border bg-card overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b bg-muted/30 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-primary" />
                      <span className="font-medium">{getBookName(reading.book, lang)}</span>
                      <span className="text-sm text-muted-foreground ml-auto">
                        {chapters.length} {lang === 'pt' ? 'cap.' : 'ch.'}
                      </span>
                    </div>
                    
                    <div className="divide-y">
                      {chapters.map(chapter => {
                        const isChecked = completedChapters.has(`${reading.book}-${chapter}`);
                        
                        return (
                          <div
                            key={chapter}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
                          >
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={() => handleToggleChapter(reading, chapter)}
                              data-testid={`checkbox-${reading.book}-${chapter}`}
                            />
                            <button
                              onClick={() => onNavigateToChapter(reading.book, chapter)}
                              className="flex-1 text-left flex items-center justify-between group"
                              data-testid={`reading-${reading.book}-${chapter}`}
                            >
                              <span className={isChecked ? 'text-muted-foreground line-through' : ''}>
                                {lang === 'pt' ? 'Capítulo' : 'Chapter'} {chapter}
                              </span>
                              <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {upcomingReadings.length > 1 && (
            <div className="space-y-2">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                {lang === 'pt' ? 'Próximos Dias' : 'Upcoming'}
              </h2>
              {upcomingReadings.slice(1, 4).map((reading) => (
                <div 
                  key={reading.id}
                  className="p-3 rounded-xl border bg-card flex items-center justify-between"
                >
                  <div>
                    <span className="text-sm font-medium">
                      {lang === 'pt' ? `Dia ${reading.dayIndex}` : `Day ${reading.dayIndex}`}
                    </span>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {reading.readings.map(r => formatReadingReference(r, lang)).join(', ')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="p-4 rounded-xl border border-dashed border-primary/30 bg-primary/5 text-center">
            <Sparkles className="w-6 h-6 mx-auto text-primary/50 mb-2" />
            <p className="text-sm text-muted-foreground">
              {lang === 'pt' 
                ? 'S.O.A.P.: Escritura, Observação, Aplicação, Oração'
                : 'S.O.A.P.: Scripture, Observation, Application, Prayer'}
            </p>
          </div>
        </div>
      </ScrollArea>

      {todayReading && !todayReading.isCompleted && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t safe-area-bottom">
          <div className="flex gap-2 max-w-lg mx-auto">
            <Button
              className="flex-1"
              onClick={handleSaveProgress}
              disabled={markCompleteMutation.isPending || completedChapters.size === 0}
              data-testid="button-save-progress"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              {markCompleteMutation.isPending 
                ? (lang === 'pt' ? 'Salvando...' : 'Saving...')
                : (lang === 'pt' ? 'Salvar' : 'Save')}
            </Button>
            
            <Button
              variant="secondary"
              onClick={handleMarkAllComplete}
              disabled={markCompleteMutation.isPending}
              data-testid="button-complete-all"
            >
              {lang === 'pt' ? 'Tudo' : 'All'}
            </Button>
            
            {onAskAI && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  const ref = todayReading.readings.map(r => formatReadingReference(r, lang)).join(', ');
                  onAskAI(`Explique o contexto e principais ensinamentos de ${ref}`);
                }}
                data-testid="button-ask-ai-context"
              >
                <MessageSquare className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
