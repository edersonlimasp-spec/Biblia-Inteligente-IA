import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowLeft, Lock, Check, Clock, Award, Crown, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { getDeviceId } from "@/hooks/use-device-id";
import { LoginPromptModal } from "@/components/LoginPromptModal";
import { canOpenLesson, type UserPlan, type CourseLevel } from "@shared/courseAccess";
import { getApiUrl } from "@/lib/queryClient";

interface ModuleDetailScreenProps {
  moduleId: string;
  onBack: () => void;
  onNavigateToLesson: (lessonId: string, trackLevel: string) => void;
  onNavigateToSubscriptions: () => void;
}

interface Track {
  id: string;
  level: string;
  name: string;
  description: string;
  requiredPlan: string;
  order: number;
  totalLessons: number;
  completedLessons: number;
  percentage: number;
}

interface Lesson {
  id: string;
  title: string;
  estimatedMinutes: number;
  order: number;
  completed: boolean;
}

interface ModuleDetail {
  module: {
    id: string;
    name: string;
    description: string;
    icon: string;
    color: string;
    level: string;
    order: number;
  };
  tracks: Track[];
  progress: { total: number; completed: number; percentage: number };
}

interface SubscriptionStatus {
  hasGold?: boolean;
  hasPremium?: boolean;
  trialActive?: boolean;
}

type ClassLevel = "iniciante" | "moderado" | "avancado";

const CLASS_CONFIG: Record<ClassLevel, { name: string; from: string; to: string; accent: string }> = {
  iniciante: { name: "Classe I",   from: "#22668F", to: "#154968", accent: "#7FB6DA" },
  moderado:  { name: "Classe II",  from: "#4A4285", to: "#362F66", accent: "#9990D0" },
  avancado:  { name: "Classe III", from: "#8A6A2E", to: "#6B501C", accent: "#D3B573" },
};

function Mono({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`font-mono text-[10px] uppercase tracking-[0.12em] ${className}`}>
      {children}
    </span>
  );
}

function ClassBadge({ level }: { level: ClassLevel }) {
  const cfg = CLASS_CONFIG[level] ?? CLASS_CONFIG.iniciante;
  return (
    <span
      className="text-[9px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded-full font-semibold"
      style={{ backgroundColor: `${cfg.accent}20`, color: cfg.accent, border: `1px solid ${cfg.accent}40` }}
    >
      {cfg.name}
    </span>
  );
}

function SegmentedBar({ total, completed, accent, className = "" }: {
  total: number; completed: number; accent: string; className?: string;
}) {
  const capped = Math.min(completed, total);
  return (
    <div className={`flex gap-[2px] h-1.5 ${className}`}>
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className="flex-1 rounded-full"
          style={{ backgroundColor: i < capped ? accent : "rgba(255,255,255,0.12)" }}
        />
      ))}
    </div>
  );
}

function CircleMarker({ state, number, accent }: {
  state: "completed" | "current" | "locked" | "available";
  number: number;
  accent: string;
}) {
  if (state === "completed") {
    return (
      <div
        className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ border: "2px solid rgba(34,197,94,0.55)", backgroundColor: "rgba(34,197,94,0.10)" }}
      >
        <Check className="w-2.5 h-2.5 text-green-500" />
      </div>
    );
  }
  if (state === "current") {
    return (
      <div
        className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: accent, boxShadow: `0 0 8px ${accent}55` }}
      >
        <span className="text-[9px] font-bold text-white leading-none">{number}</span>
      </div>
    );
  }
  if (state === "locked") {
    return (
      <div
        className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ border: "1px solid rgba(255,255,255,0.14)", backgroundColor: "transparent" }}
      >
        <Lock className="w-2.5 h-2.5" style={{ color: "rgba(255,255,255,0.25)" }} />
      </div>
    );
  }
  return (
    <div
      className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
      style={{ border: "1px solid rgba(255,255,255,0.22)", backgroundColor: "transparent" }}
    >
      <span className="text-[9px] font-mono leading-none" style={{ color: "rgba(255,255,255,0.40)" }}>
        {number}
      </span>
    </div>
  );
}

export function ModuleDetailScreen({
  moduleId,
  onBack,
  onNavigateToLesson,
  onNavigateToSubscriptions,
}: ModuleDetailScreenProps) {
  const { user, isAdmin } = useAuth();
  const { language, t } = useLanguage();
  const deviceId = getDeviceId();
  const isLoggedIn = !!user;

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showPaywallModal, setShowPaywallModal] = useState(false);
  const [paywallInfo, setPaywallInfo] = useState<{
    requiredPlan: "gold" | "premium";
    message: string;
  }>({ requiredPlan: "gold", message: "" });

  const { data: moduleDetail, isLoading: moduleLoading } = useQuery<ModuleDetail>({
    queryKey: ["/api/study/modules", moduleId, language],
    queryFn: async () => {
      const res = await fetch(getApiUrl(`/api/study/modules/${moduleId}?lang=${language}`), {
        headers: { "x-device-id": deviceId || "" },
      });
      if (!res.ok) throw new Error("Failed to fetch module");
      return res.json();
    },
  });

  const { data: subscriptionData } = useQuery<SubscriptionStatus>({
    queryKey: ["/api/user/subscription-status"],
    enabled: !!user,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const module = moduleDetail?.module;
  const track = moduleDetail?.tracks?.[0] ?? null;

  const { data: trackLessons, isLoading: lessonsLoading } = useQuery<{ lessons: Lesson[] }>({
    queryKey: ["/api/study/tracks", track?.id, language],
    enabled: !!track?.id,
    queryFn: async () => {
      const res = await fetch(getApiUrl(`/api/study/tracks/${track!.id}?lang=${language}`));
      if (!res.ok) throw new Error("Failed to fetch lessons");
      return res.json();
    },
  });

  const lessons = trackLessons?.lessons ?? [];
  const completedCount = lessons.filter((l) => l.completed).length;
  const lessonsRemaining = lessons.length - completedCount;
  const firstUncompletedIndex = lessons.findIndex((l) => !l.completed);

  const getUserPlan = (): UserPlan => {
    if (!user) return "free";
    if (subscriptionData?.hasPremium) return "premium";
    if (subscriptionData?.hasGold) return "gold";
    return "free";
  };
  const userPlan = getUserPlan();
  const moduleIndex = module?.order ?? 1;
  const level = (module?.level as ClassLevel) ?? "iniciante";
  const cfg = CLASS_CONFIG[level] ?? CLASS_CONFIG.iniciante;
  const className = cfg.name;

  const getLessonState = (
    lesson: Lesson,
    index: number
  ): "completed" | "current" | "locked" | "available" => {
    if (lesson.completed) return "completed";
    const isCurrent = index === firstUncompletedIndex;
    const accessResult = canOpenLesson({
      isLoggedIn,
      plan: userPlan,
      courseLevel: (track?.level ?? "iniciante") as CourseLevel,
      moduleIndex,
      lessonIndex: lesson.order,
      isAdmin,
    });
    if (!accessResult.allowed) return "locked";
    return isCurrent ? "current" : "available";
  };

  const getLockInfo = (lesson: Lesson): { requiredPlan?: "gold" | "premium" } => {
    const result = canOpenLesson({
      isLoggedIn,
      plan: userPlan,
      courseLevel: (track?.level ?? "iniciante") as CourseLevel,
      moduleIndex,
      lessonIndex: lesson.order,
      isAdmin,
    });
    return { requiredPlan: result.requiredPlan };
  };

  const handleLessonClick = (lesson: Lesson) => {
    const result = canOpenLesson({
      isLoggedIn,
      plan: userPlan,
      courseLevel: (track?.level ?? "iniciante") as CourseLevel,
      moduleIndex,
      lessonIndex: lesson.order,
      isAdmin,
    });
    if (result.allowed) {
      onNavigateToLesson(lesson.id, track?.level ?? "iniciante");
    } else if (result.reason === "NOT_AUTHENTICATED") {
      setShowLoginModal(true);
    } else {
      setPaywallInfo({
        requiredPlan: result.requiredPlan ?? "gold",
        message: result.message ?? t("subscription.subscribeToUnlock"),
      });
      setShowPaywallModal(true);
    }
  };

  if (moduleLoading) {
    return (
      <div className="min-h-screen bg-background overflow-x-hidden">
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Skeleton className="h-5 w-40" />
        </div>
        <div className="px-4 py-5 space-y-4">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-6 w-32" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="w-5 h-5 rounded-full flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <Skeleton className="h-4 w-3/4 mb-1" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* ── Cabeçalho fixo ── */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-3">
          {/* Breadcrumb */}
          <button
            className="flex items-center gap-1.5 mb-1"
            onClick={onBack}
            data-testid="button-back-module-detail"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-muted-foreground" />
            <Mono className="text-[#647B90]">Alicerce · {className}</Mono>
          </button>
          {/* Título da trilha */}
          <h1 className="font-serif text-xl font-semibold text-foreground leading-snug">
            {module?.name}
          </h1>
          {track && (
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {track.totalLessons} aulas
              {track.totalLessons > 0 && ` · ~${track.totalLessons * 10} min`}
            </p>
          )}
        </div>
      </header>

      <div className="h-[calc(100vh-80px)] overflow-y-auto overflow-x-hidden">
        <div
          className="max-w-2xl mx-auto pb-10"
          style={{ paddingBottom: "calc(2.5rem + env(safe-area-inset-bottom, 0px))" }}
        >
          {/* ── Bloco de classe colorido ── */}
          {track && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-4 my-4 rounded-xl p-4"
              style={{
                background: `linear-gradient(158deg, ${cfg.from}BB, ${cfg.to}BB)`,
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10), inset 0 0 0 1px rgba(255,255,255,0.05)",
              }}
            >
              <div className="flex items-center gap-2 mb-2.5">
                <ClassBadge level={level} />
              </div>
              <SegmentedBar
                total={lessons.length || track.totalLessons}
                completed={completedCount}
                accent={cfg.accent}
                className="mb-2"
              />
              <p className="text-[11px] text-white/70">
                {completedCount === 0
                  ? `${lessons.length || track.totalLessons} aulas nesta trilha`
                  : completedCount === lessons.length && lessons.length > 0
                  ? "Trilha concluída"
                  : `Você está na aula ${Math.min(completedCount + 1, lessons.length || 1)} de ${lessons.length || track.totalLessons}`}
              </p>
            </motion.div>
          )}

          {/* ── Caminho vertical ── */}
          <div className="px-4">
            {lessonsLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="w-5 h-5 rounded-full flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-3/4 mb-1.5" />
                      <Skeleton className="h-3 w-14" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div>
                {lessons.map((lesson, index) => {
                  const state = getLessonState(lesson, index);
                  const lockInfo = state === "locked" ? getLockInfo(lesson) : {};
                  const isLast = index === lessons.length - 1;

                  return (
                    <div key={lesson.id} className="flex gap-3" data-testid={`lesson-row-${lesson.id}`}>
                      {/* Coluna esquerda: marcador + linha */}
                      <div className="flex flex-col items-center flex-shrink-0 pt-0.5">
                        <CircleMarker state={state} number={lesson.order} accent={cfg.accent} />
                        {!isLast && (
                          <div
                            className="w-[1.5px] flex-1 mt-1"
                            style={{
                              minHeight: state === "current" ? "80px" : "20px",
                              backgroundColor:
                                state === "completed"
                                  ? "rgba(34,197,94,0.22)"
                                  : "rgba(255,255,255,0.08)",
                            }}
                          />
                        )}
                      </div>

                      {/* Conteúdo */}
                      <div
                        className={`flex-1 pb-4 ${state !== "completed" ? "cursor-pointer" : ""}`}
                        onClick={() => handleLessonClick(lesson)}
                      >
                        <p
                          className={`font-serif text-sm font-medium leading-snug ${
                            state === "completed"
                              ? "text-muted-foreground/60 line-through"
                              : state === "current"
                              ? "text-foreground"
                              : state === "locked"
                              ? "text-muted-foreground/50"
                              : "text-foreground/80"
                          }`}
                        >
                          {lesson.title}
                        </p>

                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-[10px] text-muted-foreground/70 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {lesson.estimatedMinutes} min
                          </span>
                          {state === "locked" && lockInfo.requiredPlan && (
                            <span
                              className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded-full"
                              style={
                                lockInfo.requiredPlan === "premium"
                                  ? { color: "#9990D0", backgroundColor: "#9990D015", border: "1px solid #9990D025" }
                                  : { color: "#D3B573", backgroundColor: "#D3B57315", border: "1px solid #D3B57325" }
                              }
                            >
                              {lockInfo.requiredPlan === "premium" ? "Premium" : "Gold"}
                            </span>
                          )}
                        </div>

                        {/* Expansão da aula atual */}
                        {state === "current" && (
                          <div
                            className="mt-3 rounded-xl p-3.5"
                            style={{
                              backgroundColor: `${cfg.from}18`,
                              border: `1px solid ${cfg.accent}28`,
                            }}
                          >
                            <Mono className="text-[#647B90] block mb-3">Você está aqui</Mono>
                            <button
                              className="w-full text-center text-[12px] font-semibold py-2 rounded-lg"
                              style={{
                                backgroundColor: `${cfg.accent}20`,
                                color: cfg.accent,
                                border: `1px solid ${cfg.accent}35`,
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleLessonClick(lesson);
                              }}
                              data-testid="button-resume-current-lesson"
                            >
                              Retomar aula
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Marcador de certificado */}
                <div className="flex gap-3">
                  <div className="flex flex-col items-center flex-shrink-0 pt-0.5">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ border: "1.5px dashed #D3B573", backgroundColor: "transparent" }}
                    >
                      <Award className="w-2.5 h-2.5" style={{ color: "#D3B573" }} />
                    </div>
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="font-serif text-sm font-medium text-foreground/50">
                      Certificado da Trilha
                    </p>
                    {lessonsRemaining > 0 ? (
                      <p className="text-[10px] text-muted-foreground/50 mt-0.5">
                        Faltam {lessonsRemaining} {lessonsRemaining === 1 ? "aula" : "aulas"}
                      </p>
                    ) : (
                      <p className="text-[10px] mt-0.5" style={{ color: "#D3B573" }}>
                        Trilha concluída
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── CTA de upgrade ── */}
          {userPlan === "free" && !isAdmin && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mx-4 mt-6 p-4 rounded-xl text-center"
              style={{
                backgroundColor: "rgba(215,179,115,0.06)",
                border: "1px solid rgba(215,179,115,0.18)",
              }}
            >
              <Crown className="w-7 h-7 mx-auto mb-2" style={{ color: "#D3B573" }} />
              <p className="font-serif text-sm font-medium text-foreground mb-1">
                Acesso completo com Gold
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                {t("courses.subscribeGold")}
              </p>
              <Button size="sm" onClick={onNavigateToSubscriptions} data-testid="button-subscribe-cta">
                <Crown className="w-3.5 h-3.5 mr-1.5" />
                {t("subscription.viewPlans")}
              </Button>
            </motion.div>
          )}

          {userPlan === "gold" && !isAdmin && level === "avancado" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mx-4 mt-6 p-4 rounded-xl text-center"
              style={{
                backgroundColor: "rgba(153,144,208,0.06)",
                border: "1px solid rgba(153,144,208,0.18)",
              }}
            >
              <Sparkles className="w-7 h-7 mx-auto mb-2" style={{ color: "#9990D0" }} />
              <p className="font-serif text-sm font-medium text-foreground mb-1">
                {t("subscription.upgradeToPremium")}
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                {t("subscription.unlockAdvanced")}
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={onNavigateToSubscriptions}
                data-testid="button-upgrade-premium"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                {t("subscription.viewPremium")}
              </Button>
            </motion.div>
          )}
        </div>
      </div>

      {/* ── Modal de login ── */}
      <LoginPromptModal
        open={showLoginModal}
        onOpenChange={setShowLoginModal}
        featureName={t("courses.lessonsFeature")}
        onAuthSuccess={() => setShowLoginModal(false)}
      />

      {/* ── Modal de paywall ── */}
      <Dialog open={showPaywallModal} onOpenChange={setShowPaywallModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {paywallInfo.requiredPlan === "premium" ? (
                <Sparkles className="w-5 h-5 text-purple-500" />
              ) : (
                <Crown className="w-5 h-5 text-amber-500" />
              )}
              {t("subscription.lockedContent")}
            </DialogTitle>
            <DialogDescription>{paywallInfo.message}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div
              className={`p-4 rounded-lg ${
                paywallInfo.requiredPlan === "premium"
                  ? "bg-purple-500/10 border border-purple-500/20"
                  : "bg-amber-500/10 border border-amber-500/20"
              }`}
            >
              <h4 className="font-semibold mb-2">
                {paywallInfo.requiredPlan === "premium"
                  ? t("subscription.premiumPlan")
                  : t("subscription.goldPlan")}
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                {paywallInfo.requiredPlan === "gold" ? (
                  <>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" /> {t("subscription.gold100Beginner")}
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" /> {t("subscription.gold7Intermediate")}
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" /> {t("subscription.strongsDictionary")}
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" /> {t("subscription.essentialAI")}
                    </li>
                  </>
                ) : (
                  <>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" /> {t("subscription.allOfGold")}
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" /> {t("subscription.premium100Intermediate")}
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" /> {t("subscription.premium100Advanced")}
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" /> {t("subscription.premiumAI")}
                    </li>
                  </>
                )}
              </ul>
            </div>
            <Button
              className="w-full"
              onClick={() => {
                setShowPaywallModal(false);
                onNavigateToSubscriptions();
              }}
              data-testid="button-paywall-subscribe"
            >
              <Crown className="w-4 h-4 mr-2" />
              {t("subscription.viewPlans")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
