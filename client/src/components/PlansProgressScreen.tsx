import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { getDeviceId } from "@/hooks/use-device-id";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  ArrowLeft, 
  BookOpen, 
  TrendingUp, 
  Calendar,
  CheckCircle2,
  Circle,
  Play,
  Clock,
  Sparkles,
  ChevronRight,
  Loader2,
  RotateCcw,
  History,
  Library,
  ScrollText,
  Heart,
  Music,
  Lightbulb,
  Mail,
  Check,
  SkipForward,
  FileText
} from "lucide-react";
import { motion } from "framer-motion";

interface ReadingPlan {
  id: string;
  slug: string;
  title: string;
  description: string;
  duration: number;
  icon: string;
  gradientFrom: string;
  gradientTo: string;
  weekdaysOnly: boolean;
  userProgress?: {
    progressId: string;
    currentDay: number;
    completedDays: number;
    startDate: string;
    isActive: boolean;
  } | null;
  timesCompleted?: number;
}

interface PlanDetail {
  plan: ReadingPlan;
  days: PlanDay[];
  userProgress?: {
    id: string;
    currentDay: number;
    completedDays: number[];
    completedReadings: Record<number, number[]>;
    notes: Record<number, string>;
    startDate: string;
  } | null;
}

interface PlanDay {
  id: string;
  planId: string;
  dayNumber: number;
  readings: Array<{ book: string; chapter: number }>;
  title: string | null;
}

const getIconComponent = (iconName: string) => {
  const icons: Record<string, typeof Calendar> = {
    Calendar,
    BookOpen,
    Clock,
    History,
    Library,
    ScrollText,
    Heart,
    Music,
    Lightbulb,
    Mail,
  };
  return icons[iconName] || BookOpen;
};

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


export function PlansProgressScreen({ onBack, onNavigateToBible }: PlansProgressScreenProps) {
  const deviceId = getDeviceId();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("plans");
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [selectedPlanSlug, setSelectedPlanSlug] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);

  // Fetch available reading plans from API
  const { data: plansData, isLoading: plansLoading } = useQuery<{ plans: ReadingPlan[] }>({
    queryKey: ['/api/reading-plans'],
  });
  const plans = plansData?.plans || [];

  // Fetch plan details when a plan is selected
  const { data: planDetail, isLoading: planDetailLoading } = useQuery<PlanDetail>({
    queryKey: ['/api/reading-plans', selectedPlanSlug],
    enabled: !!selectedPlanSlug,
  });

  // Start a plan mutation
  const startPlanMutation = useMutation({
    mutationFn: async (slug: string) => {
      return apiRequest('POST', `/api/reading-plans/${slug}/start`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reading-plans'] });
      toast({ title: "Plano iniciado!", description: "Boa leitura!" });
    },
    onError: () => {
      toast({ title: "Erro", description: "Não foi possível iniciar o plano", variant: "destructive" });
    },
  });

  // Complete a day mutation
  const completeDayMutation = useMutation({
    mutationFn: async ({ progressId, dayNumber }: { progressId: string; dayNumber: number }) => {
      return apiRequest('POST', `/api/reading-plans/complete-day`, {
        progressId,
        dayNumber,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reading-plans'] });
      if (selectedPlanSlug) {
        queryClient.invalidateQueries({ queryKey: ['/api/reading-plans', selectedPlanSlug] });
      }
      toast({ title: "Dia completado!", description: "Continue assim!" });
    },
  });

  const { data: readingProgress } = useQuery<Array<{ book: string; chaptersRead: number[] }>>({
    queryKey: ['/api/reading-progress', deviceId],
    enabled: !!deviceId,
  });

  const handleAIAnalysis = async (progressId: string, dayNumber: number) => {
    setIsAnalyzing(true);
    setAnalysisResult(null);
    try {
      const response = await apiRequest('POST', `/api/reading-plans/analyze`, {
        progressId,
        dayNumber,
      });
      const data = await response.json();
      if (data.success) {
        setAnalysisResult(data.analysis);
      } else {
        toast({ title: "Erro", description: data.message || "Não foi possível gerar análise", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Erro", description: "Falha na comunicação com o servidor", variant: "destructive" });
    } finally {
      setIsAnalyzing(false);
    }
  };

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
              {selectedPlanSlug && planDetail ? (
                <PlanDetailView
                  plan={planDetail.plan}
                  days={planDetail.days}
                  progress={planDetail.userProgress}
                  isLoading={planDetailLoading}
                  isAnalyzing={isAnalyzing}
                  analysisResult={analysisResult}
                  onBack={() => {
                    setSelectedPlanSlug(null);
                    setSelectedPlanId(null);
                    setAnalysisResult(null);
                  }}
                  onCompleteDay={(dayNumber) => {
                    if (planDetail.userProgress?.id) {
                      completeDayMutation.mutate({ progressId: planDetail.userProgress.id, dayNumber });
                    }
                  }}
                  onAIAnalysis={(dayNumber) => {
                    if (planDetail.userProgress?.id) {
                      handleAIAnalysis(planDetail.userProgress.id, dayNumber);
                    }
                  }}
                  onNavigateToBible={onNavigateToBible}
                />
              ) : (
                <div className="space-y-4 pb-4">
                  {plansLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <>
                      {plans.filter(p => p.userProgress?.isActive).map((plan) => {
                        const IconComponent = getIconComponent(plan.icon);
                        const progressPercent = Math.round((plan.userProgress!.completedDays / plan.duration) * 100);
                        
                        return (
                          <Card 
                            key={`active-${plan.id}`}
                            className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800"
                            data-testid={`card-active-${plan.slug}`}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-primary">Plano Ativo: {plan.title}</span>
                                <Button 
                                  size="sm"
                                  className="bg-primary text-white"
                                  onClick={() => {
                                    setSelectedPlanSlug(plan.slug);
                                    setSelectedPlanId(plan.id);
                                  }}
                                  data-testid={`button-continue-${plan.slug}`}
                                >
                                  Continuar
                                </Button>
                              </div>
                              <Progress value={progressPercent} className="h-2" />
                              <p className="text-xs text-muted-foreground mt-1">
                                Dia {plan.userProgress?.currentDay} de {plan.duration} - {progressPercent}%
                              </p>
                            </CardContent>
                          </Card>
                        );
                      })}

                      {plans.map((plan, index) => {
                        const IconComponent = getIconComponent(plan.icon);
                        const hasProgress = plan.userProgress?.isActive;
                        const progressPercent = hasProgress 
                          ? Math.round((plan.userProgress!.completedDays / plan.duration) * 100)
                          : 0;

                        return (
                          <motion.div
                            key={plan.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <Card 
                              className="overflow-visible hover-elevate cursor-pointer border-0"
                              onClick={() => {
                                setSelectedPlanSlug(plan.slug);
                                setSelectedPlanId(plan.id);
                              }}
                              data-testid={`card-plan-${plan.slug}`}
                            >
                              <CardContent 
                                className="p-4 rounded-lg"
                                style={{
                                  background: `linear-gradient(135deg, ${plan.gradientFrom}, ${plan.gradientTo})`
                                }}
                              >
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                                    <IconComponent className="w-6 h-6 text-white" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-white text-base">{plan.title}</h3>
                                    <p className="text-sm text-white/80">{plan.description}</p>
                                    <p className="text-xs text-white/60 mt-1">
                                      {plan.weekdaysOnly ? `${plan.duration} dias (Seg-Sex)` : `${plan.duration} dias`}
                                    </p>
                                  </div>
                                  <div className="flex-shrink-0">
                                    {hasProgress ? (
                                      <Button 
                                        size="sm" 
                                        className="bg-white/30 text-white border-0 hover:bg-white/40"
                                        data-testid={`button-continue-plan-${plan.slug}`}
                                      >
                                        Continuar
                                      </Button>
                                    ) : (
                                      <Button 
                                        size="sm" 
                                        className="bg-white/30 text-white border-0 hover:bg-white/40"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          startPlanMutation.mutate(plan.slug);
                                        }}
                                        disabled={startPlanMutation.isPending}
                                        data-testid={`button-start-${plan.slug}`}
                                      >
                                        {startPlanMutation.isPending ? (
                                          <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                          "Iniciar"
                                        )}
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        );
                      })}
                    </>
                  )}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Plan Detail View Component
interface PlanDetailViewProps {
  plan: ReadingPlan;
  days: PlanDay[];
  progress: PlanDetail['userProgress'];
  isLoading: boolean;
  isAnalyzing: boolean;
  analysisResult: string | null;
  onBack: () => void;
  onCompleteDay: (dayNumber: number) => void;
  onAIAnalysis: (dayNumber: number) => void;
  onNavigateToBible: () => void;
}

function PlanDetailView({
  plan,
  days,
  progress,
  isLoading,
  isAnalyzing,
  analysisResult,
  onBack,
  onCompleteDay,
  onAIAnalysis,
  onNavigateToBible,
}: PlanDetailViewProps) {
  const currentDay = progress?.currentDay || 1;
  const completedDays = progress?.completedDays || [];
  const IconComponent = getIconComponent(plan.icon);
  const progressPercent = progress ? Math.round((completedDays.length / plan.duration) * 100) : 0;
  
  const currentDayData = days.find(d => d.dayNumber === currentDay);
  const nextDayData = days.find(d => d.dayNumber === currentDay + 1);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20">
      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="icon" onClick={onBack} data-testid="button-back-plan">
          <ArrowLeft className="w-5 h-5 text-primary" />
        </Button>
        <div className="flex-1 text-center">
          <h2 className="font-bold text-lg text-primary">{plan.title} - Dia {currentDay}</h2>
        </div>
      </div>

      {progress && (
        <Card className="bg-muted/30 border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progresso: {progressPercent}% Completo</span>
            </div>
            <Progress 
              value={progressPercent} 
              className="h-3" 
            />
          </CardContent>
        </Card>
      )}

      {currentDayData && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Leitura de Hoje:</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {currentDayData.readings.map((reading, idx) => {
              const readingText = typeof reading === 'string' 
                ? reading 
                : `${reading.book} ${reading.chapter}`;
              const isReadingCompleted = progress?.completedReadings?.[currentDay]?.includes(idx);
              
              return (
                <div 
                  key={idx}
                  className="flex items-center justify-between py-2 border-b last:border-b-0"
                  data-testid={`reading-item-${currentDay}-${idx}`}
                >
                  <div className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{readingText}</span>
                  </div>
                  <Checkbox
                    checked={isReadingCompleted}
                    className="h-6 w-6 rounded border-primary data-[state=checked]:bg-primary"
                    data-testid={`checkbox-reading-${currentDay}-${idx}`}
                  />
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Notas do Dia</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground italic">
                Reflexão sobre a leitura de hoje.
              </p>
              <p className="text-sm text-muted-foreground italic">
                Anote insights e perguntas importantes.
              </p>
            </div>
            <div className="w-16 h-16 flex items-center justify-center">
              <BookOpen className="w-12 h-12 text-primary/30" />
            </div>
          </div>
        </CardContent>
      </Card>

      {analysisResult && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Análise do Professor IA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{analysisResult}</p>
          </CardContent>
        </Card>
      )}

      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 space-y-3">
        <div className="flex gap-3 max-w-3xl mx-auto">
          <Button 
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
            onClick={() => onCompleteDay(currentDay)}
            data-testid="button-mark-read"
          >
            Marcar como Lido
          </Button>
          <Button 
            className="flex-1 bg-primary hover:bg-primary/90 text-white"
            onClick={() => onAIAnalysis(currentDay)}
            disabled={isAnalyzing}
            data-testid="button-ai-analysis"
          >
            {isAnalyzing ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            Analise IA
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
        <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground max-w-3xl mx-auto">
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            <SkipForward className="w-4 h-4 mr-1" />
            Pular Dia
          </Button>
          <span className="text-muted-foreground">|</span>
          {nextDayData && (
            <span className="text-muted-foreground">
              Dia {currentDay + 1}: Leitura Amanhã
            </span>
          )}
        </div>
        {nextDayData && (
          <div className="text-center text-sm font-medium text-primary">
            {nextDayData.readings.map((r, i) => 
              typeof r === 'string' ? r : `${r.book} ${r.chapter}`
            ).join(', ')}
          </div>
        )}
      </div>

      <div className="mt-6">
        <h3 className="font-semibold mb-3">Todos os Dias</h3>
        <div className="space-y-2">
          {days.slice(0, 30).map((day) => {
            const isCompleted = completedDays.includes(day.dayNumber);
            const isCurrent = day.dayNumber === currentDay;
            
            return (
              <Card 
                key={day.id}
                className={`${isCurrent ? 'border-primary ring-1 ring-primary/20' : ''} ${isCompleted ? 'opacity-60' : ''}`}
                data-testid={`card-day-${day.dayNumber}`}
              >
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <div>
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : isCurrent ? (
                        <Circle className="w-5 h-5 text-primary" />
                      ) : (
                        <Circle className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1">
                      <span className={`text-sm font-medium ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                        Dia {day.dayNumber}
                      </span>
                      {day.title && (
                        <span className="text-xs text-muted-foreground ml-2">- {day.title}</span>
                      )}
                    </div>
                    {isCurrent && (
                      <Badge variant="secondary" className="text-xs">Hoje</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {days.length > 30 && (
        <p className="text-center text-sm text-muted-foreground py-4">
          Mostrando primeiros 30 dias de {days.length}
        </p>
      )}
    </div>
  );
}
