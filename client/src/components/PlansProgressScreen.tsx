import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  BookOpen, 
  Calendar,
  Clock,
  Play
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
}

const PLAN_GRADIENTS = [
  'linear-gradient(135deg, #4A90D9 0%, #357ABD 100%)',
  'linear-gradient(135deg, #5CB85C 0%, #449D44 100%)',
  'linear-gradient(135deg, #5BC0DE 0%, #31B0D5 100%)',
  'linear-gradient(135deg, #F0AD4E 0%, #EC971F 100%)',
  'linear-gradient(135deg, #9B59B6 0%, #8E44AD 100%)',
  'linear-gradient(135deg, #E74C3C 0%, #C0392B 100%)',
];

export function PlansProgressScreen({ onBack, onNavigateToBible, onOpenMyPlan }: PlansProgressScreenProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'progress' | 'plans'>('plans');
  
  const lang = (language || 'pt') as 'pt' | 'en' | 'es';

  const { data: templates, isLoading: templatesLoading } = useQuery<ReadingPlanTemplate[]>({
    queryKey: ['/api/reading-plans/templates'],
  });

  const { data: activePlanData } = useQuery<ActivePlanResponse>({
    queryKey: ['/api/reading-plans/user/active'],
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const createPlanMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const response = await apiRequest('POST', '/api/reading-plans/user', {
        templateId,
        startDate: new Date().toISOString(),
      });
      return response.json();
    },
    onSuccess: async (data) => {
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['/api/reading-plans/user'] }),
        queryClient.refetchQueries({ queryKey: ['/api/reading-plans/user/active'] }),
      ]);
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

  const hasActivePlan = activePlanData?.activePlan != null;
  
  const progressPercent = hasActivePlan && activePlanData?.activePlan?.template
    ? Math.round((activePlanData.activePlan.completedDays / activePlanData.activePlan.template.durationDays) * 100)
    : 0;

  const getTemplateTitle = (template: ReadingPlanTemplate) => {
    switch (lang) {
      case 'en': return template.titleEn || template.titlePt;
      case 'es': return template.titleEs || template.titlePt;
      default: return template.titlePt;
    }
  };

  const getTemplateDescription = (template: ReadingPlanTemplate) => {
    const days = template.durationDays;
    const pace = template.defaultPace;
    
    if (days <= 7) {
      return lang === 'pt' ? `Leitura rápida • ${days} dias` : `Quick read • ${days} days`;
    } else if (days <= 30) {
      return lang === 'pt' ? `${pace} capítulos por dia • ${days} dias` : `${pace} chapters/day • ${days} days`;
    } else if (days <= 90) {
      const weeks = Math.round(days / 7);
      return lang === 'pt' ? `Leitura em ${weeks} semanas` : `${weeks} weeks reading`;
    } else {
      const months = Math.round(days / 30);
      return lang === 'pt' ? `${pace} cap/dia • ${months} meses` : `${pace} ch/day • ${months} months`;
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900">
      <header className="shrink-0 px-4 py-4 bg-white dark:bg-slate-800 flex items-center gap-3 shadow-sm">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onBack} 
          className="text-slate-600 dark:text-slate-300"
          data-testid="button-back"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-bold text-slate-800 dark:text-white flex-1 text-center pr-10">
          {lang === 'pt' ? 'Planos de Leitura' : lang === 'es' ? 'Planes de Lectura' : 'Reading Plans'}
        </h1>
      </header>

      <div className="shrink-0 px-4 py-3 flex justify-center">
        <div className="inline-flex bg-slate-200 dark:bg-slate-700 rounded-full p-1">
          <button
            onClick={() => setActiveTab('progress')}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
              activeTab === 'progress'
                ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300'
            }`}
            data-testid="tab-progress"
          >
            {lang === 'pt' ? 'Progresso' : 'Progress'}
          </button>
          <button
            onClick={() => setActiveTab('plans')}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
              activeTab === 'plans'
                ? 'bg-[#357ABD] text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300'
            }`}
            data-testid="tab-plans"
          >
            {lang === 'pt' ? 'Planos de Leitura' : 'Reading Plans'}
          </button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="px-4 pb-6 space-y-4">
          {hasActivePlan && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">
                    {lang === 'pt' ? 'Plano Ativo:' : 'Active Plan:'}
                  </p>
                  <h3 className="font-semibold text-slate-800 dark:text-white">
                    {activePlanData?.activePlan?.template 
                      ? getTemplateTitle(activePlanData.activePlan.template)
                      : lang === 'pt' ? 'Bíblia em 1 Ano' : 'Bible in 1 Year'}
                  </h3>
                </div>
                <Button
                  size="sm"
                  className="bg-[#357ABD] hover:bg-[#2A5F8F] text-white rounded-full px-4"
                  onClick={() => {
                    if (onOpenMyPlan && activePlanData?.activePlan) {
                      onOpenMyPlan(activePlanData.activePlan.id);
                    }
                  }}
                  data-testid="button-continue"
                >
                  {lang === 'pt' ? 'Continuar' : 'Continue'}
                </Button>
              </div>
              <Progress 
                value={progressPercent} 
                className="h-2 bg-slate-200 dark:bg-slate-600" 
              />
            </motion.div>
          )}

          {templatesLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-24 rounded-2xl bg-slate-200 dark:bg-slate-700 animate-pulse" />
              ))}
            </div>
          ) : (
            templates?.map((template, index) => {
              const gradient = PLAN_GRADIENTS[index % PLAN_GRADIENTS.length];
              const isActive = activePlanData?.activePlan?.templateId === template.id;
              
              return (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="rounded-2xl overflow-hidden shadow-md"
                  style={{ background: gradient }}
                >
                  <div className="p-4 flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      {index % 4 === 0 && <Calendar className="w-6 h-6 text-white" />}
                      {index % 4 === 1 && <Clock className="w-6 h-6 text-white" />}
                      {index % 4 === 2 && <BookOpen className="w-6 h-6 text-white" />}
                      {index % 4 === 3 && <BookOpen className="w-6 h-6 text-white" />}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-white text-base">
                        {getTemplateTitle(template)}
                      </h3>
                      <p className="text-white/80 text-sm mt-0.5">
                        {getTemplateDescription(template)}
                      </p>
                    </div>
                    
                    <Button
                      size="sm"
                      className="bg-white/20 hover:bg-white/30 text-white border-0 rounded-full px-5"
                      onClick={() => {
                        if (isActive && onOpenMyPlan && activePlanData?.activePlan) {
                          onOpenMyPlan(activePlanData.activePlan.id);
                        } else {
                          createPlanMutation.mutate(template.id);
                        }
                      }}
                      disabled={createPlanMutation.isPending}
                      data-testid={`button-start-${template.slug}`}
                    >
                      {isActive 
                        ? (lang === 'pt' ? 'Abrir' : 'Open')
                        : (lang === 'pt' ? 'Iniciar' : 'Start')}
                    </Button>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
