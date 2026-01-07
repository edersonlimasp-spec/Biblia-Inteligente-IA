import { useState, useEffect, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Check,
  ChevronRight,
  BookOpen
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
  
  const [completedReadings, setCompletedReadings] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState<string>("");

  const serverCompletedReadings = useMemo(() => {
    const set = new Set<string>();
    if (todayReading?.completedReadings) {
      for (const cr of todayReading.completedReadings) {
        set.add(`${cr.book}-${cr.chapter}`);
      }
    }
    return set;
  }, [todayReading?.completedReadings]);

  useEffect(() => {
    setCompletedReadings(new Set(serverCompletedReadings));
  }, [serverCompletedReadings]);

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
    onSuccess: async (data) => {
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['/api/reading-plans/user/active'] }),
        queryClient.refetchQueries({ queryKey: ['/api/reading-plans/user'] }),
        queryClient.refetchQueries({ queryKey: ['/api/reading-plans/user', plan.id] }),
      ]);
      
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

  const getChaptersFromReading = (reading: DailyReading): number[] => {
    const chapters: number[] = [];
    const start = reading.startChapter;
    const end = reading.endChapter || reading.startChapter;
    for (let ch = start; ch <= end; ch++) {
      chapters.push(ch);
    }
    return chapters;
  };

  const isReadingComplete = (reading: DailyReading): boolean => {
    const chapters = getChaptersFromReading(reading);
    return chapters.every(ch => completedReadings.has(`${reading.book}-${ch}`));
  };

  const handleToggleReading = (reading: DailyReading) => {
    const newCompleted = new Set(completedReadings);
    const chapters = getChaptersFromReading(reading);
    const allComplete = isReadingComplete(reading);
    
    for (const ch of chapters) {
      const key = `${reading.book}-${ch}`;
      if (allComplete) {
        newCompleted.delete(key);
      } else {
        newCompleted.add(key);
      }
    }
    
    setCompletedReadings(newCompleted);
  };

  const handleMarkAsRead = () => {
    if (!todayReading) return;
    
    const readings: { book: string; chapter: number }[] = [];
    
    const completedArray = Array.from(completedReadings);
    for (const key of completedArray) {
      const [book, chapterStr] = key.split('-');
      const chapter = parseInt(chapterStr, 10);
      if (book && !isNaN(chapter)) {
        readings.push({ book, chapter });
      }
    }
    
    if (readings.length === 0) {
      toast({
        title: lang === 'pt' ? "Selecione pelo menos uma leitura" : "Select at least one reading",
        variant: "destructive",
      });
      return;
    }
    
    markCompleteMutation.mutate({
      planId: plan.id,
      dayIndex: todayReading.dayIndex,
      completedReadings: readings,
    });
  };

  const handleMarkAllComplete = () => {
    if (!todayReading) return;
    
    const allKeys = new Set<string>();
    const allReadings: { book: string; chapter: number }[] = [];
    
    for (const reading of todayReading.readings) {
      const chapters = getChaptersFromReading(reading);
      for (const ch of chapters) {
        const key = `${reading.book}-${ch}`;
        allKeys.add(key);
        allReadings.push({ book: reading.book, chapter: ch });
      }
    }
    
    setCompletedReadings(allKeys);
    
    markCompleteMutation.mutate({
      planId: plan.id,
      dayIndex: todayReading.dayIndex,
      completedReadings: allReadings,
    });
  };

  const progressPercent = plan.template 
    ? Math.round((plan.completedDays / plan.template.durationDays) * 100)
    : 0;

  const nextDayReading = upcomingReadings.length > 0 ? upcomingReadings[0] : null;
  const nextDayRef = nextDayReading?.readings
    .map(r => formatReadingReference(r, lang))
    .join(', ');

  const planTitle = plan.template 
    ? (lang === 'en' ? plan.template.titleEn : lang === 'es' ? plan.template.titleEs : plan.template.titlePt)
    : (lang === 'pt' ? 'Meu Plano' : 'My Plan');

  return (
    <div className="flex flex-col h-full bg-slate-100 dark:bg-slate-900">
      <header className="shrink-0 px-4 py-3 bg-white dark:bg-slate-800 flex items-center gap-3 border-b border-slate-200 dark:border-slate-700">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onBack}
          className="text-slate-600 dark:text-slate-300"
          data-testid="button-back-plan"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-bold text-[#357ABD] flex-1 text-center pr-10">
          {planTitle} - {lang === 'pt' ? 'Dia' : 'Day'} {plan.currentDay}
        </h1>
      </header>

      <ScrollArea className="flex-1">
        <div className="px-4 py-4 space-y-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                {lang === 'pt' ? 'Progresso:' : 'Progress:'} {progressPercent}% {lang === 'pt' ? 'Completo' : 'Complete'}
              </span>
            </div>
            <Progress 
              value={progressPercent} 
              className="h-2 bg-slate-200 dark:bg-slate-600" 
            />
          </div>

          {todayReading && (
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
              <h2 className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-4">
                {lang === 'pt' ? 'Leitura de Hoje:' : "Today's Reading:"}
              </h2>
              
              <div className="space-y-1">
                {todayReading.readings.map((reading, idx) => {
                  const isChecked = isReadingComplete(reading);
                  
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="flex items-center gap-3 py-3 border-b border-slate-100 dark:border-slate-700 last:border-0"
                    >
                      <button
                        onClick={() => handleToggleReading(reading)}
                        className="text-[#357ABD] shrink-0"
                        data-testid={`check-left-${reading.book}-${reading.startChapter}`}
                      >
                        <Check className="w-5 h-5" />
                      </button>
                      
                      <button
                        onClick={() => onNavigateToChapter(reading.book, reading.startChapter)}
                        className="flex-1 text-left text-slate-700 dark:text-slate-300 font-medium text-base"
                        data-testid={`reading-${reading.book}-${reading.startChapter}`}
                      >
                        {formatReadingReference(reading, lang)}
                      </button>
                      
                      <button
                        onClick={() => handleToggleReading(reading)}
                        className={`w-6 h-6 rounded flex items-center justify-center shrink-0 transition-colors ${
                          isChecked 
                            ? 'bg-[#357ABD]' 
                            : 'border-2 border-[#357ABD]'
                        }`}
                        data-testid={`check-${reading.book}-${reading.startChapter}`}
                      >
                        {isChecked && <Check className="w-4 h-4 text-white" />}
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
            <h2 className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-2">
              {lang === 'pt' ? 'Notas do Dia' : 'Daily Notes'}
            </h2>
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
                  {lang === 'pt' 
                    ? 'Reflexão sobre a leitura de hoje.'
                    : 'Reflection on today\'s reading.'}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 italic mb-3">
                  {lang === 'pt' 
                    ? 'Anote insights e perguntas importantes.'
                    : 'Write down insights and important questions.'}
                </p>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#357ABD]/50"
                  placeholder={lang === 'pt' ? 'Escreva suas notas aqui...' : 'Write your notes here...'}
                  rows={3}
                  data-testid="input-notes"
                />
              </div>
              <div className="w-14 h-14 flex items-center justify-center shrink-0">
                <BookOpen className="w-10 h-10 text-[#5CB85C]" />
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              className="flex-1 bg-[#F0AD4E] hover:bg-[#EC971F] text-white font-semibold rounded-full py-3 h-12"
              onClick={handleMarkAllComplete}
              disabled={markCompleteMutation.isPending || todayReading?.isCompleted}
              data-testid="button-mark-read"
            >
              {markCompleteMutation.isPending
                ? (lang === 'pt' ? 'Salvando...' : 'Saving...')
                : (lang === 'pt' ? 'Marcar como Lido' : 'Mark as Read')}
            </Button>
            
            <Button
              className="flex-1 bg-[#357ABD] hover:bg-[#2A5F8F] text-white font-semibold rounded-full py-3 h-12"
              onClick={() => {
                if (onAskAI && todayReading) {
                  const refs = todayReading.readings.map(r => formatReadingReference(r, lang)).join(', ');
                  onAskAI(`Analise o contexto e principais ensinamentos de ${refs}`);
                }
              }}
              data-testid="button-ai-analysis"
            >
              {lang === 'pt' ? 'Analise IA' : 'AI Analysis'}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          <div className="flex justify-center items-center gap-4 py-3">
            <button 
              className="text-sm text-slate-500 dark:text-slate-400"
              data-testid="button-skip-day"
            >
              {lang === 'pt' ? 'Pular Dia' : 'Skip Day'}
            </button>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            {nextDayReading && (
              <button 
                className="text-sm text-slate-500 dark:text-slate-400"
                data-testid="button-next-day"
              >
                {lang === 'pt' 
                  ? `Dia ${nextDayReading.dayIndex}: Leitura Amanhã`
                  : `Day ${nextDayReading.dayIndex}: Tomorrow's Reading`}
              </button>
            )}
          </div>

          {nextDayRef && (
            <div className="text-center pb-4">
              <span className="text-base font-bold text-slate-700 dark:text-slate-300">
                {nextDayRef}
              </span>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
