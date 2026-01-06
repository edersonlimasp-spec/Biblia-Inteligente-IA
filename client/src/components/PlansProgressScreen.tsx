import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { getDeviceId } from "@/hooks/use-device-id";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  BookOpen, 
  Calendar,
  CheckCircle2,
  Play,
  Clock,
  Star,
  Flame,
  ChevronRight,
  Trophy
} from "lucide-react";
import { motion } from "framer-motion";
import type { ReadingPlanTemplate } from "@shared/schema";

interface PlansProgressScreenProps {
  onBack: () => void;
  onNavigateToBible: (book?: string, chapter?: number) => void;
  onOpenMyPlan?: (planId: string) => void;
}

interface DailyReading {
  book: string;
  startChapter: number;
  endChapter?: number;
}

interface TodayReading {
  dayIndex: number;
  readings: DailyReading[];
  isCompleted: boolean;
  completedReadings?: DailyReading[];
}

interface ActivePlanResponse {
  activePlan: {
    id: string;
    templateId: string;
    startDate: string;
    completedDays: number;
    streakDays: number;
    template?: ReadingPlanTemplate;
  } | null;
  todayReading?: TodayReading;
  overdueReadings?: Array<{ dayIndex: number; readings: DailyReading[] }>;
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

const CATEGORY_FILTERS = [
  { id: 'all', pt: 'Todos', en: 'All', es: 'Todos' },
  { id: 'full-bible', pt: 'Bíblia', en: 'Bible', es: 'Biblia' },
  { id: 'new-testament', pt: 'NT', en: 'NT', es: 'NT' },
  { id: 'old-testament', pt: 'AT', en: 'OT', es: 'AT' },
  { id: 'topical', pt: 'Tema', en: 'Topic', es: 'Tema' },
];

function formatDuration(days: number, lang: 'pt' | 'en' | 'es'): string {
  if (days <= 30) {
    return lang === 'pt' ? `${days}d` : lang === 'es' ? `${days}d` : `${days}d`;
  } else if (days <= 365) {
    const months = Math.round(days / 30);
    return `${months}m`;
  } else {
    const years = Math.round(days / 365);
    return lang === 'pt' ? `${years}a` : lang === 'es' ? `${years}a` : `${years}y`;
  }
}

function formatReadingRef(reading: DailyReading, lang: 'pt' | 'en' | 'es'): string {
  const bookName = getBookName(reading.book, lang);
  if (reading.endChapter && reading.endChapter !== reading.startChapter) {
    return `${bookName} ${reading.startChapter}-${reading.endChapter}`;
  }
  return `${bookName} ${reading.startChapter}`;
}

export function PlansProgressScreen({ onBack, onNavigateToBible, onOpenMyPlan }: PlansProgressScreenProps) {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [view, setView] = useState<'catalog' | 'active'>('catalog');

  const lang = (language || 'pt') as 'pt' | 'en' | 'es';

  const { data: templates, isLoading: templatesLoading } = useQuery<ReadingPlanTemplate[]>({
    queryKey: ['/api/reading-plans/templates'],
  });

  const { data: activePlanData } = useQuery<ActivePlanResponse>({
    queryKey: ['/api/reading-plans/user/active'],
    enabled: true,
  });

  const createPlanMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const response = await apiRequest('POST', '/api/reading-plans/user', {
        templateId,
        startDate: new Date().toISOString(),
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/reading-plans/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/reading-plans/user/active'] });
      toast({
        title: lang === 'pt' ? "Plano iniciado!" : lang === 'es' ? "Plan iniciado!" : "Plan started!",
      });
      if (onOpenMyPlan) {
        onOpenMyPlan(data.id);
      }
    },
    onError: () => {
      toast({
        title: lang === 'pt' ? "Erro ao criar plano" : "Error creating plan",
        variant: "destructive",
      });
    },
  });

  const filteredTemplates = useMemo(() => {
    if (!templates) return [];
    if (categoryFilter === 'all') return templates;
    return templates.filter(t => t.category === categoryFilter);
  }, [templates, categoryFilter]);

  const hasActivePlan = activePlanData?.activePlan != null;

  const getTemplateTitle = (template: ReadingPlanTemplate) => {
    switch (lang) {
      case 'en': return template.titleEn || template.titlePt;
      case 'es': return template.titleEs || template.titlePt;
      default: return template.titlePt;
    }
  };

  const progressPercent = hasActivePlan && activePlanData?.activePlan?.template
    ? Math.round((activePlanData.activePlan.completedDays / activePlanData.activePlan.template.durationDays) * 100)
    : 0;

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="shrink-0 px-4 py-3 border-b bg-background/95 backdrop-blur flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} data-testid="button-back">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-semibold flex-1">
          {lang === 'pt' ? 'Planos de Leitura' : lang === 'es' ? 'Planes de Lectura' : 'Reading Plans'}
        </h1>
      </header>

      {hasActivePlan && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="shrink-0 mx-4 mt-4 p-4 rounded-xl bg-primary/10 border border-primary/20"
        >
          <div className="flex items-start gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                {lang === 'pt' ? 'Plano Atual' : lang === 'es' ? 'Plan Actual' : 'Current Plan'}
              </p>
              <h3 className="font-semibold text-base truncate">
                {activePlanData?.activePlan?.template 
                  ? getTemplateTitle(activePlanData.activePlan.template)
                  : lang === 'pt' ? 'Meu Plano' : 'My Plan'}
              </h3>
              
              <div className="flex items-center gap-4 mt-2">
                <div className="flex-1">
                  <Progress value={progressPercent} className="h-1.5" />
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {activePlanData?.activePlan?.completedDays || 0}/{activePlanData?.activePlan?.template?.durationDays || '?'}
                </span>
              </div>

              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1 text-sm">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span className="font-medium">{activePlanData?.activePlan?.streakDays || 0}</span>
                  <span className="text-muted-foreground text-xs">
                    {lang === 'pt' ? 'dias' : 'days'}
                  </span>
                </div>
                
                {activePlanData?.todayReading && !activePlanData.todayReading.isCompleted && (
                  <Button
                    size="sm"
                    onClick={() => {
                      const reading = activePlanData.todayReading?.readings[0];
                      if (reading) {
                        onNavigateToBible(reading.book, reading.startChapter);
                      }
                    }}
                    data-testid="button-continue-reading"
                  >
                    <Play className="w-3 h-3 mr-1" />
                    {lang === 'pt' ? 'Continuar' : lang === 'es' ? 'Continuar' : 'Continue'}
                  </Button>
                )}

                {activePlanData?.todayReading?.isCompleted && (
                  <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    {lang === 'pt' ? 'Completo' : 'Done'}
                  </Badge>
                )}
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenMyPlan?.(activePlanData?.activePlan?.id || '')}
              data-testid="button-view-plan"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>

          {activePlanData?.todayReading && !activePlanData.todayReading.isCompleted && (
            <div className="mt-3 pt-3 border-t border-primary/10">
              <p className="text-xs text-muted-foreground mb-2">
                {lang === 'pt' ? 'Leitura de hoje:' : lang === 'es' ? 'Lectura de hoy:' : "Today's reading:"}
              </p>
              <div className="flex flex-wrap gap-2">
                {activePlanData.todayReading.readings.map((reading, idx) => (
                  <button
                    key={idx}
                    onClick={() => onNavigateToBible(reading.book, reading.startChapter)}
                    className="px-2.5 py-1 rounded-md bg-background text-sm font-medium hover-elevate"
                    data-testid={`today-reading-${idx}`}
                  >
                    {formatReadingRef(reading, lang)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      <div className="shrink-0 px-4 py-3 flex gap-2 overflow-x-auto scrollbar-hide">
        {CATEGORY_FILTERS.map(filter => (
          <button
            key={filter.id}
            onClick={() => setCategoryFilter(filter.id)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              categoryFilter === filter.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
            data-testid={`filter-${filter.id}`}
          >
            {filter[lang]}
          </button>
        ))}
      </div>

      <ScrollArea className="flex-1">
        <div className="px-4 pb-6 space-y-3">
          {templatesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {lang === 'pt' ? 'Nenhum plano encontrado.' : 'No plans found.'}
            </div>
          ) : (
            filteredTemplates.map((template, index) => {
              const isPopular = template.tags?.includes('popular');
              const isActive = activePlanData?.activePlan?.templateId === template.id;
              
              return (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <button
                    onClick={() => {
                      if (isActive) {
                        onOpenMyPlan?.(activePlanData?.activePlan?.id || '');
                      } else {
                        createPlanMutation.mutate(template.id);
                      }
                    }}
                    disabled={createPlanMutation.isPending}
                    className="w-full text-left p-4 rounded-xl border bg-card hover-elevate active-elevate-2 transition-all"
                    data-testid={`plan-${template.slug}`}
                  >
                    <div className="flex items-start gap-3">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                        style={{ 
                          background: template.colorGradient 
                            ? `linear-gradient(135deg, ${template.colorGradient.split(' ')[1]}, ${template.colorGradient.split(' ')[3] || template.colorGradient.split(' ')[1]})`
                            : 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary)/0.7))'
                        }}
                      >
                        <BookOpen className="w-5 h-5 text-white" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium truncate">{getTemplateTitle(template)}</h3>
                          {isPopular && (
                            <Star className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
                          )}
                          {isActive && (
                            <Badge variant="secondary" className="text-xs shrink-0">
                              {lang === 'pt' ? 'Ativo' : 'Active'}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDuration(template.durationDays, lang)}
                          </span>
                          <span className="flex items-center gap-1">
                            <BookOpen className="w-3 h-3" />
                            {template.defaultPace} {lang === 'pt' ? 'cap/dia' : 'ch/day'}
                          </span>
                        </div>
                      </div>
                      
                      {!isActive && (
                        <Play className="w-5 h-5 text-primary shrink-0" />
                      )}
                    </div>
                  </button>
                </motion.div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
