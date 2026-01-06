import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { getDeviceId } from "@/hooks/use-device-id";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  BookOpen, 
  TrendingUp, 
  Calendar,
  CheckCircle2,
  Play,
  Clock,
  Filter,
  Sparkles,
  Star,
  Layers,
  Briefcase,
  Zap,
  Heart,
  Users,
  Music,
  Hourglass,
  Feather,
  BookMarked
} from "lucide-react";
import { motion } from "framer-motion";
import type { ReadingPlanTemplate } from "@shared/schema";

interface PlansProgressScreenProps {
  onBack: () => void;
  onNavigateToBible: () => void;
  onOpenMyPlan?: (planId: string) => void;
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

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Calendar,
  BookOpen,
  Layers,
  Briefcase,
  Zap,
  Clock,
  Heart,
  Users,
  Music,
  Hourglass,
  Feather,
  BookMarked,
};

const CATEGORY_LABELS: Record<string, { pt: string; en: string; es: string }> = {
  'all': { pt: 'Todos', en: 'All', es: 'Todos' },
  'full-bible': { pt: 'Bíblia Completa', en: 'Full Bible', es: 'Biblia Completa' },
  'new-testament': { pt: 'Novo Testamento', en: 'New Testament', es: 'Nuevo Testamento' },
  'old-testament': { pt: 'Antigo Testamento', en: 'Old Testament', es: 'Antiguo Testamento' },
  'topical': { pt: 'Temático', en: 'Topical', es: 'Temático' },
};

const DURATION_LABELS: Record<string, { pt: string; en: string; es: string }> = {
  'all': { pt: 'Todas', en: 'All', es: 'Todas' },
  'short': { pt: 'Curto (até 90 dias)', en: 'Short (up to 90 days)', es: 'Corto (hasta 90 días)' },
  'medium': { pt: 'Médio (até 1 ano)', en: 'Medium (up to 1 year)', es: 'Medio (hasta 1 año)' },
  'long': { pt: 'Longo (mais de 1 ano)', en: 'Long (over 1 year)', es: 'Largo (más de 1 año)' },
};

function formatDuration(days: number, lang: 'pt' | 'en' | 'es'): string {
  if (days <= 30) {
    return lang === 'pt' ? `${days} dias` : lang === 'es' ? `${days} días` : `${days} days`;
  } else if (days <= 365) {
    const months = Math.round(days / 30);
    return lang === 'pt' ? `${months} ${months === 1 ? 'mês' : 'meses'}` 
         : lang === 'es' ? `${months} ${months === 1 ? 'mes' : 'meses'}`
         : `${months} ${months === 1 ? 'month' : 'months'}`;
  } else {
    const years = Math.round(days / 365);
    return lang === 'pt' ? `${years} ${years === 1 ? 'ano' : 'anos'}`
         : lang === 'es' ? `${years} ${years === 1 ? 'año' : 'años'}`
         : `${years} ${years === 1 ? 'year' : 'years'}`;
  }
}

export function PlansProgressScreen({ onBack, onNavigateToBible, onOpenMyPlan }: PlansProgressScreenProps) {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const deviceId = getDeviceId();
  const [activeTab, setActiveTab] = useState("plans");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [durationFilter, setDurationFilter] = useState("all");

  const lang = (language || 'pt') as 'pt' | 'en' | 'es';

  const { data: templates, isLoading: templatesLoading } = useQuery<ReadingPlanTemplate[]>({
    queryKey: ['/api/reading-plans/templates'],
  });

  const { data: userPlans } = useQuery({
    queryKey: ['/api/reading-plans/user'],
    enabled: true,
  });

  const { data: activePlanData } = useQuery({
    queryKey: ['/api/reading-plans/user/active'],
    enabled: true,
  });

  const { data: readingProgress } = useQuery<Array<{ book: string; chaptersRead: number[] }>>({
    queryKey: ['/api/reading-progress', deviceId],
    enabled: !!deviceId,
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
        title: lang === 'pt' ? "Plano iniciado!" : lang === 'es' ? "¡Plan iniciado!" : "Plan started!",
        description: lang === 'pt' ? "Seu plano de leitura foi criado com sucesso." 
                   : lang === 'es' ? "Tu plan de lectura fue creado con éxito."
                   : "Your reading plan was created successfully.",
      });
      if (onOpenMyPlan) {
        onOpenMyPlan(data.id);
      }
    },
    onError: () => {
      toast({
        title: lang === 'pt' ? "Erro" : "Error",
        description: lang === 'pt' ? "Não foi possível criar o plano." 
                   : lang === 'es' ? "No se pudo crear el plan."
                   : "Could not create the plan.",
        variant: "destructive",
      });
    },
  });

  const filteredTemplates = useMemo(() => {
    if (!templates) return [];
    
    return templates.filter(template => {
      if (categoryFilter !== 'all' && template.category !== categoryFilter) return false;
      
      if (durationFilter !== 'all') {
        if (durationFilter === 'short' && template.durationDays > 90) return false;
        if (durationFilter === 'medium' && (template.durationDays <= 90 || template.durationDays > 365)) return false;
        if (durationFilter === 'long' && template.durationDays <= 365) return false;
      }
      
      return true;
    });
  }, [templates, categoryFilter, durationFilter]);

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

  const getTemplateTitle = (template: ReadingPlanTemplate) => {
    switch (lang) {
      case 'en': return template.titleEn || template.titlePt;
      case 'es': return template.titleEs || template.titlePt;
      default: return template.titlePt;
    }
  };

  const getTemplateDescription = (template: ReadingPlanTemplate) => {
    switch (lang) {
      case 'en': return template.descriptionEn || template.descriptionPt;
      case 'es': return template.descriptionEs || template.descriptionPt;
      default: return template.descriptionPt;
    }
  };

  const hasActivePlan = activePlanData?.activePlan != null;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} data-testid="button-back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">{t("plansProgress.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("plansProgress.subtitle")}</p>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="plans" data-testid="tab-plans">
              <Calendar className="w-4 h-4 mr-2" />
              {lang === 'pt' ? 'Planos' : lang === 'es' ? 'Planes' : 'Plans'}
            </TabsTrigger>
            <TabsTrigger value="my-plan" data-testid="tab-my-plan" disabled={!hasActivePlan}>
              <BookOpen className="w-4 h-4 mr-2" />
              {lang === 'pt' ? 'Meu Plano' : lang === 'es' ? 'Mi Plan' : 'My Plan'}
            </TabsTrigger>
            <TabsTrigger value="progress" data-testid="tab-progress">
              <TrendingUp className="w-4 h-4 mr-2" />
              {t("plansProgress.tabProgress")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="plans" className="mt-4">
            <div className="flex flex-wrap gap-2 mb-4">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-auto min-w-[140px]" data-testid="select-category">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_LABELS).map(([value, labels]) => (
                    <SelectItem key={value} value={value}>
                      {labels[lang]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={durationFilter} onValueChange={setDurationFilter}>
                <SelectTrigger className="w-auto min-w-[160px]" data-testid="select-duration">
                  <Clock className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(DURATION_LABELS).map(([value, labels]) => (
                    <SelectItem key={value} value={value}>
                      {labels[lang]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <ScrollArea className="h-[calc(100vh-260px)]">
              <div className="space-y-4 pb-4">
                {templatesLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <Card key={i} className="animate-pulse">
                        <CardContent className="p-5 h-32 bg-muted/50" />
                      </Card>
                    ))}
                  </div>
                ) : filteredTemplates.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center text-muted-foreground">
                      {lang === 'pt' ? 'Nenhum plano encontrado com estes filtros.'
                       : lang === 'es' ? 'No se encontraron planes con estos filtros.'
                       : 'No plans found with these filters.'}
                    </CardContent>
                  </Card>
                ) : (
                  filteredTemplates.map((template, index) => {
                    const IconComponent = ICON_MAP[template.icon || 'Calendar'] || Calendar;
                    const tags = template.tags || [];
                    const isPopular = tags.includes('popular');
                    const isNew = tags.includes('new');
                    const isRecommended = tags.includes('recommended');
                    
                    return (
                      <motion.div
                        key={template.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card className="overflow-visible hover-elevate">
                          <CardContent className={`p-5 bg-gradient-to-br ${template.colorGradient || 'from-blue-500 to-blue-700'} rounded-lg`}>
                            <div className="flex items-start gap-4">
                              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                                <IconComponent className="w-6 h-6 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  <h3 className="font-bold text-white text-lg">{getTemplateTitle(template)}</h3>
                                  {isPopular && (
                                    <Badge variant="secondary" className="bg-yellow-400/90 text-yellow-900 text-xs">
                                      <Star className="w-3 h-3 mr-1" />
                                      {lang === 'pt' ? 'Popular' : 'Popular'}
                                    </Badge>
                                  )}
                                  {isNew && (
                                    <Badge variant="secondary" className="bg-green-400/90 text-green-900 text-xs">
                                      <Sparkles className="w-3 h-3 mr-1" />
                                      {lang === 'pt' ? 'Novo' : lang === 'es' ? 'Nuevo' : 'New'}
                                    </Badge>
                                  )}
                                  {isRecommended && !isPopular && (
                                    <Badge variant="secondary" className="bg-purple-400/90 text-purple-900 text-xs">
                                      {lang === 'pt' ? 'Recomendado' : lang === 'es' ? 'Recomendado' : 'Recommended'}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-white/80 mb-3 line-clamp-2">{getTemplateDescription(template)}</p>
                                <div className="flex items-center gap-4 text-xs text-white/70">
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {formatDuration(template.durationDays, lang)}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <BookOpen className="w-3 h-3" />
                                    {template.defaultPace} {lang === 'pt' ? 'cap/dia' : lang === 'es' ? 'cap/día' : 'ch/day'}
                                  </span>
                                  {template.weekdaysOnly && (
                                    <span className="flex items-center gap-1">
                                      <Briefcase className="w-3 h-3" />
                                      {lang === 'pt' ? 'Seg-Sex' : lang === 'es' ? 'Lun-Vie' : 'Mon-Fri'}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <Button 
                                size="sm" 
                                className="bg-white/20 text-white hover:bg-white/30 border-0 shrink-0"
                                onClick={() => createPlanMutation.mutate(template.id)}
                                disabled={createPlanMutation.isPending}
                                data-testid={`button-start-${template.slug}`}
                              >
                                <Play className="w-4 h-4 mr-1" />
                                {lang === 'pt' ? 'Iniciar' : lang === 'es' ? 'Iniciar' : 'Start'}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="my-plan" className="mt-4">
            {activePlanData?.activePlan ? (
              <div className="space-y-4">
                <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-primary" />
                      {activePlanData.activePlan.template?.titlePt || lang === 'pt' ? 'Meu Plano' : 'My Plan'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground">
                            {lang === 'pt' ? 'Progresso' : lang === 'es' ? 'Progreso' : 'Progress'}
                          </span>
                          <span className="text-sm font-medium">
                            {activePlanData.activePlan.completedDays} / {activePlanData.activePlan.template?.durationDays || 365} {lang === 'pt' ? 'dias' : lang === 'es' ? 'días' : 'days'}
                          </span>
                        </div>
                        <Progress 
                          value={(activePlanData.activePlan.completedDays / (activePlanData.activePlan.template?.durationDays || 365)) * 100} 
                          className="h-3" 
                        />
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">{activePlanData.activePlan.streakDays}</div>
                        <div className="text-xs text-muted-foreground">{lang === 'pt' ? 'dias seguidos' : 'streak'}</div>
                      </div>
                    </div>

                    {activePlanData.todayReading && (
                      <div className="p-4 rounded-lg border bg-card mb-4">
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-primary" />
                          {lang === 'pt' ? 'Leitura de Hoje' : lang === 'es' ? 'Lectura de Hoy' : "Today's Reading"}
                        </h4>
                        <div className="space-y-2">
                          {activePlanData.todayReading.readings?.map((reading: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-2">
                              <CheckCircle2 className={`w-4 h-4 ${activePlanData.todayReading.isCompleted ? 'text-green-500' : 'text-muted-foreground'}`} />
                              <span className="text-sm">
                                {reading.book.toUpperCase()} {reading.startChapter}
                                {reading.endChapter && reading.endChapter !== reading.startChapter && `-${reading.endChapter}`}
                              </span>
                            </div>
                          ))}
                        </div>
                        <Button 
                          className="w-full mt-4" 
                          onClick={onNavigateToBible}
                          data-testid="button-go-to-reading"
                        >
                          <BookOpen className="w-4 h-4 mr-2" />
                          {lang === 'pt' ? 'Ir para Leitura' : lang === 'es' ? 'Ir a la Lectura' : 'Go to Reading'}
                        </Button>
                      </div>
                    )}

                    {activePlanData.overdueReadings?.length > 0 && (
                      <div className="p-4 rounded-lg border border-orange-500/30 bg-orange-50 dark:bg-orange-900/10">
                        <h4 className="font-medium text-orange-700 dark:text-orange-400 mb-2">
                          {lang === 'pt' ? 'Leituras Atrasadas' : lang === 'es' ? 'Lecturas Atrasadas' : 'Overdue Readings'} ({activePlanData.overdueReadings.length})
                        </h4>
                        <p className="text-sm text-orange-600 dark:text-orange-300">
                          {lang === 'pt' ? 'Você tem leituras pendentes. Complete-as para manter seu progresso!'
                           : lang === 'es' ? '¡Tienes lecturas pendientes. Complétalas para mantener tu progreso!'
                           : 'You have pending readings. Complete them to keep your progress!'}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {lang === 'pt' ? 'Você ainda não tem um plano ativo. Escolha um na aba "Planos".'
                     : lang === 'es' ? 'Todavía no tienes un plan activo. Elige uno en la pestaña "Planes".'
                     : "You don't have an active plan yet. Choose one in the 'Plans' tab."}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

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
                        <h3 className="text-lg font-semibold">{t("plansProgress.overallProgress")}</h3>
                        <p className="text-sm text-muted-foreground">
                          {chaptersRead} {t("plansProgress.of")} {totalChapters} {t("plansProgress.chapters")}
                        </p>
                      </div>
                    </div>
                    <Progress value={overallProgress} className="h-3" />
                  </CardContent>
                </Card>

                <div className="grid grid-cols-2 gap-3">
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2">{t("bible.oldTestament")}</h4>
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
                      <h4 className="font-medium mb-2">{t("bible.newTestament")}</h4>
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
                    <CardTitle className="text-base">{t("plansProgress.booksOf")} {t("plansProgress.at")}</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {atBooks.slice(0, 12).map((book) => {
                      const progress = getBookProgress(book.name);
                      return (
                        <div
                          key={book.name}
                          className="p-2 rounded-lg border bg-card cursor-pointer hover-elevate"
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
                    <CardTitle className="text-base">{t("plansProgress.booksOf")} {t("plansProgress.nt")}</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {ntBooks.slice(0, 12).map((book) => {
                      const progress = getBookProgress(book.name);
                      return (
                        <div
                          key={book.name}
                          className="p-2 rounded-lg border bg-card cursor-pointer hover-elevate"
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
        </Tabs>
      </div>
    </div>
  );
}
