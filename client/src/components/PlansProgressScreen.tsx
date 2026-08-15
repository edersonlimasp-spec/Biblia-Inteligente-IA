import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, BookOpen, Calendar, Clock, Play } from "lucide-react";
import { motion } from "framer-motion";
import type { ReadingPlanTemplate } from "@shared/schema";

interface PlansProgressScreenProps {
  onBack: () => void;
  onNavigateToBible: (book?: string, chapter?: number) => void;
  onOpenMyPlan?: (planId: string) => void;
}

interface DailyReading { book: string; startChapter: number; endChapter?: number }
interface TodayReading { dayIndex: number; readings: DailyReading[]; isCompleted: boolean }
interface ActivePlanResponse {
  activePlan: {
    id: string; templateId: string; startDate: string;
    completedDays: number; streakDays: number; template?: ReadingPlanTemplate;
  } | null;
  todayReading?: TodayReading;
}

/* módulo Planos: #1F6A5C → #134C43 */
const MOD_FROM = "#1F6A5C";
const MOD_TO   = "#134C43";

/* gradientes para os cards de planos — mesma família de tons, sem arco-íris */
const PLAN_GRADIENTS = [
  "linear-gradient(158deg, #1F6A5C, #134C43)",
  "linear-gradient(158deg, #22668F, #154968)",
  "linear-gradient(158deg, #2C6076, #1B4557)",
  "linear-gradient(158deg, #3A4657, #2A3441)",
  "linear-gradient(158deg, #4A4285, #362F66)",
  "linear-gradient(158deg, #1F5C74, #123F53)",
];

export function PlansProgressScreen({ onBack, onNavigateToBible, onOpenMyPlan }: PlansProgressScreenProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"progress" | "plans">("plans");
  const lang = (language || "pt") as "pt" | "en" | "es";

  const { data: templates, isLoading: templatesLoading } = useQuery<ReadingPlanTemplate[]>({
    queryKey: ["/api/reading-plans/templates"],
  });

  const { data: activePlanData } = useQuery<ActivePlanResponse>({
    queryKey: ["/api/reading-plans/user/active"],
    staleTime: 0,
    refetchOnMount: "always",
  });

  const createPlanMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const response = await apiRequest("POST", "/api/reading-plans/user", {
        templateId,
        startDate: new Date().toISOString(),
      });
      return response.json();
    },
    onSuccess: async (data) => {
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ["/api/reading-plans/user"] }),
        queryClient.refetchQueries({ queryKey: ["/api/reading-plans/user/active"] }),
      ]);
      toast({
        title: lang === "pt" ? "Plano iniciado!" : lang === "es" ? "Plan iniciado!" : "Plan started!",
      });
      if (onOpenMyPlan) onOpenMyPlan(data.id);
    },
    onError: () => {
      toast({
        title: lang === "pt" ? "Erro ao criar plano" : "Error creating plan",
        variant: "destructive",
      });
    },
  });

  const hasActivePlan = activePlanData?.activePlan != null;
  const progressPercent = hasActivePlan && activePlanData?.activePlan?.template
    ? Math.round((activePlanData.activePlan.completedDays / activePlanData.activePlan.template.durationDays) * 100)
    : 0;

  const getTemplateTitle = (t: ReadingPlanTemplate) => {
    switch (lang) {
      case "en": return t.titleEn || t.titlePt;
      case "es": return t.titleEs || t.titlePt;
      default: return t.titlePt;
    }
  };

  const getTemplateDesc = (t: ReadingPlanTemplate) => {
    const days = t.durationDays;
    const pace = t.defaultPace;
    if (days <= 7) return lang === "pt" ? `Leitura rápida · ${days} dias` : `Quick read · ${days} days`;
    if (days <= 30) return lang === "pt" ? `${pace} cap./dia · ${days} dias` : `${pace} ch/day · ${days} days`;
    if (days <= 90) {
      const weeks = Math.round(days / 7);
      return lang === "pt" ? `Leitura em ${weeks} semanas` : `${weeks} weeks reading`;
    }
    const months = Math.round(days / 30);
    return lang === "pt" ? `${pace} cap./dia · ${months} meses` : `${pace} ch/day · ${months} months`;
  };

  const iconForIndex = (i: number) => {
    const icons = [Calendar, Clock, BookOpen, BookOpen, Play, Calendar];
    const Icon = icons[i % icons.length];
    return <Icon className="w-5 h-5" style={{ color: "#fff" }} />;
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* cabeçalho com cor do módulo */}
      <header
        className="shrink-0 sticky top-0 z-40 flex items-center gap-3 px-4 py-4"
        style={{
          background: `linear-gradient(158deg, ${MOD_FROM}, ${MOD_TO})`,
          paddingTop: "calc(1rem + env(safe-area-inset-top, 0px))",
        }}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          data-testid="button-back"
          style={{ color: "rgba(255,255,255,0.85)" }}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-base font-serif font-semibold flex-1 text-center pr-10" style={{ color: "#F2F6FA" }}>
          {lang === "pt" ? "Planos de Leitura" : lang === "es" ? "Planes de Lectura" : "Reading Plans"}
        </h1>
      </header>

      {/* abas */}
      <div className="shrink-0 px-4 py-3 flex justify-center border-b border-border bg-background">
        <div
          className="inline-flex rounded-full p-0.5 gap-0.5"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          {[
            { key: "progress", label: lang === "pt" ? "Progresso" : "Progress" },
            { key: "plans",    label: lang === "pt" ? "Planos de Leitura" : "Reading Plans" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as "progress" | "plans")}
              data-testid={`tab-${key}`}
              className="px-5 py-1.5 rounded-full text-sm font-medium transition-all"
              style={
                activeTab === key
                  ? { background: MOD_FROM, color: "#F2F6FA" }
                  : { color: "#8FA3B8" }
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="px-4 pb-8 space-y-3 pt-4">
          {/* plano ativo */}
          {hasActivePlan && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl p-4 border border-border"
              style={{ background: "rgba(31,106,92,0.12)" }}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.12em] mb-0.5" style={{ color: "#647B90" }}>
                    {lang === "pt" ? "Plano Ativo" : "Active Plan"}
                  </p>
                  <h3 className="font-serif text-base font-semibold text-foreground">
                    {activePlanData?.activePlan?.template
                      ? getTemplateTitle(activePlanData.activePlan.template)
                      : "Bíblia em 1 Ano"}
                  </h3>
                  <p className="text-xs mt-0.5" style={{ color: "#8FA3B8" }}>
                    {progressPercent}% concluído
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    if (onOpenMyPlan && activePlanData?.activePlan) onOpenMyPlan(activePlanData.activePlan.id);
                  }}
                  data-testid="button-continue"
                  style={{ background: MOD_FROM, color: "#F2F6FA" }}
                >
                  {lang === "pt" ? "Continuar" : "Continue"}
                </Button>
              </div>
              <Progress value={progressPercent} className="h-1.5" />
            </motion.div>
          )}

          {/* lista de planos */}
          {templatesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: "rgba(255,255,255,0.05)" }} />
              ))}
            </div>
          ) : (
            templates?.map((template, index) => {
              const gradient = PLAN_GRADIENTS[index % PLAN_GRADIENTS.length];
              const isActive = activePlanData?.activePlan?.templateId === template.id;

              return (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className="rounded-xl overflow-hidden"
                  style={{
                    background: gradient,
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.13), inset 0 0 0 1px rgba(255,255,255,0.05)",
                  }}
                >
                  <div className="p-4 flex items-center gap-3">
                    <div
                      className="flex items-center justify-center flex-shrink-0"
                      style={{ width: 40, height: 40, borderRadius: 8, background: "rgba(255,255,255,0.15)" }}
                    >
                      {iconForIndex(index)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-serif font-semibold text-sm" style={{ color: "#fff" }}>
                        {getTemplateTitle(template)}
                      </h3>
                      <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.78)" }}>
                        {getTemplateDesc(template)}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        if (isActive && onOpenMyPlan && activePlanData?.activePlan) {
                          onOpenMyPlan(activePlanData.activePlan.id);
                        } else {
                          createPlanMutation.mutate(template.id);
                        }
                      }}
                      disabled={createPlanMutation.isPending}
                      data-testid={`button-start-${template.slug}`}
                      className="flex-shrink-0"
                      style={{
                        background: "rgba(255,255,255,0.20)",
                        color: "#fff",
                        border: "none",
                      }}
                    >
                      {isActive
                        ? lang === "pt" ? "Abrir" : "Open"
                        : lang === "pt" ? "Iniciar" : "Start"}
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
