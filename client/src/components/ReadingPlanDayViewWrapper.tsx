import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { ReadingPlanDayView } from "./ReadingPlanDayView";
import { Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { UserReadingPlan, UserDailyReading, ReadingPlanTemplate } from "@shared/schema";

interface ReadingPlanDayViewWrapperProps {
  planId: string;
  onBack: () => void;
  onNavigateToChapter: (book: string, chapter: number) => void;
  onAskAI?: (question: string) => void;
}

interface PlanDetailsResponse {
  plan: UserReadingPlan & { template?: ReadingPlanTemplate };
  todayReading: UserDailyReading | null;
  upcomingReadings: UserDailyReading[];
  overdueReadings: UserDailyReading[];
}

export function ReadingPlanDayViewWrapper({
  planId,
  onBack,
  onNavigateToChapter,
  onAskAI,
}: ReadingPlanDayViewWrapperProps) {
  const { language } = useLanguage();
  const lang = (language || 'pt') as 'pt' | 'en' | 'es';

  const { data, isLoading, error } = useQuery<PlanDetailsResponse>({
    queryKey: ['/api/reading-plans/user', planId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/reading-plans/user/${planId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch plan details');
      }
      return response.json();
    },
    enabled: !!planId,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="mt-2 text-sm text-muted-foreground">
          {lang === 'pt' ? 'Carregando...' : 'Loading...'}
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 items-center justify-center p-4">
        <p className="text-destructive text-center">
          {lang === 'pt' ? 'Erro ao carregar o plano.' : 'Error loading plan.'}
        </p>
        <button 
          onClick={onBack}
          className="mt-4 text-primary underline"
        >
          {lang === 'pt' ? 'Voltar' : 'Go back'}
        </button>
      </div>
    );
  }

  return (
    <ReadingPlanDayView
      plan={data.plan}
      todayReading={data.todayReading}
      upcomingReadings={data.upcomingReadings}
      overdueReadings={data.overdueReadings}
      onBack={onBack}
      onNavigateToChapter={onNavigateToChapter}
      onAskAI={onAskAI}
    />
  );
}
