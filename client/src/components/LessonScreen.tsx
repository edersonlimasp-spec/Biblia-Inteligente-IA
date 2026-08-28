import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Check, MessageCircle, Send, Clock, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient, getApiUrl, getAuthHeaders } from "@/lib/queryClient";
import { recordStudyCompletion } from "@/lib/completions";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { getDeviceId } from "@/hooks/use-device-id";

interface LessonScreenProps {
  lessonId: string;
  trackLevel: string;
  onBack: () => void;
}

interface Lesson {
  id: string;
  trackId?: string;
  title: string;
  content: string;
  references: string;
  questions: string;
  application: string;
  summary: string;
  estimatedMinutes: number;
  order: number;
}

interface LessonData {
  lesson: Lesson;
  completed: boolean;
}

interface ApiError {
  error: string;
  reason: string;
}

type ClassLevel = "iniciante" | "moderado" | "avancado";

const CLASS_CONFIG: Record<ClassLevel, { name: string; from: string; to: string; accent: string }> = {
  iniciante: { name: "Classe I",   from: "#22668F", to: "#154968", accent: "#7FB6DA" },
  moderado:  { name: "Classe II",  from: "#4A4285", to: "#362F66", accent: "#9990D0" },
  avancado:  { name: "Classe III", from: "#8A6A2E", to: "#6B501C", accent: "#D3B573" },
};

function Mono({ children, className = "", style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <span className={`font-mono text-[10px] uppercase tracking-[0.12em] ${className}`} style={style}>
      {children}
    </span>
  );
}

function SegmentedBar({ total, current, accent }: {
  total: number; current: number; accent: string;
}) {
  const filled = Math.min(current, total);
  return (
    <div className="flex gap-[2px] h-1">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className="flex-1 rounded-full"
          style={{ backgroundColor: i < filled ? accent : "rgba(255,255,255,0.10)" }}
        />
      ))}
    </div>
  );
}

function ReferencesBlock({ references }: { references: string }) {
  const lines = references.split(/[\n,]/).map((r) => r.trim()).filter(Boolean);
  if (!lines.length) return null;

  return (
    <div
      className="my-6 rounded-xl overflow-hidden"
      style={{ border: "1px solid rgba(168,132,69,0.28)" }}
    >
      <div className="px-4 py-2.5" style={{ backgroundColor: "rgba(168,132,69,0.10)" }}>
        <Mono style={{ color: "rgba(168,132,69,0.75)" }}>
          Versículos de referência
        </Mono>
      </div>
      {lines.map((ref, i) => {
        const dashIdx = ref.indexOf(" — ") !== -1
          ? ref.indexOf(" — ")
          : ref.indexOf(" - ") !== -1
          ? ref.indexOf(" - ")
          : -1;
        const citation = dashIdx > 0 ? ref.slice(0, dashIdx).trim() : ref;
        const verseText = dashIdx > 0 ? ref.slice(dashIdx + 3).trim() : "";

        return (
          <div
            key={i}
            className="px-4 py-3 bg-card"
            style={{
              borderTop: i > 0 ? "1px solid rgba(168,132,69,0.18)" : undefined,
            }}
          >
            <p
              className="text-[10px] font-mono uppercase tracking-widest mb-1.5 text-muted-foreground"
            >
              {citation}
            </p>
            {verseText && (
              <p className="font-serif text-sm leading-relaxed text-foreground">
                {verseText}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ReflectionQuestions({ questions }: { questions: string }) {
  const qs = questions
    .split("\n")
    .map((q) => q.replace(/^\d+\.\s*/, "").trim())
    .filter(Boolean);

  const [answers, setAnswers] = useState<Record<number, string>>({});

  if (!qs.length) return null;

  return (
    <div className="mt-8">
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-px bg-border/40" />
        <Mono className="text-[#647B90] flex-shrink-0">Antes de concluir</Mono>
        <div className="flex-1 h-px bg-border/40" />
      </div>
      <div className="space-y-5">
        {qs.map((q, i) => (
          <div key={i}>
            <p className="font-serif text-sm text-foreground leading-relaxed mb-2">
              <span className="font-semibold">{i + 1}.</span> {q}
            </p>
            <Textarea
              value={answers[i] ?? ""}
              onChange={(e) => setAnswers((prev) => ({ ...prev, [i]: e.target.value }))}
              placeholder="Sua reflexão…"
              className="min-h-[72px] resize-none bg-card border-border/50 font-serif text-sm"
              data-testid={`input-reflection-${i}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function LessonScreen({ lessonId, trackLevel, onBack }: LessonScreenProps) {
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const deviceId = getDeviceId();
  const { toast } = useToast();

  const [showAskProfessor, setShowAskProfessor] = useState(false);
  const [question, setQuestion] = useState("");
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAskingProfessor, setIsAskingProfessor] = useState(false);
  const [completedUI, setCompletedUI] = useState(false);

  const level = (trackLevel as ClassLevel) in CLASS_CONFIG
    ? (trackLevel as ClassLevel)
    : "iniciante";
  const cfg = CLASS_CONFIG[level];

  const { data: lessonData, isLoading, error } = useQuery<LessonData, ApiError>({
    queryKey: ["/api/study/lessons", lessonId, language],
    queryFn: async () => {
      const headers: HeadersInit = { "x-device-id": deviceId || "", ...getAuthHeaders() };
      const res = await fetch(
        getApiUrl(`/api/study/lessons/${lessonId}?lang=${language}`),
        { credentials: "include", headers }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Falha ao carregar", reason: "UNKNOWN" }));
        throw err;
      }
      return res.json();
    },
    retry: false,
  });

  const lesson = lessonData?.lesson;
  const isCompleted = lessonData?.completed || completedUI;

  // Query da trilha para a barra segmentada
  const { data: trackData } = useQuery<{ lessons: { id: string; completed: boolean }[] }>({
    queryKey: ["/api/study/tracks", lesson?.trackId],
    enabled: !!lesson?.trackId,
    queryFn: async () => {
      const res = await fetch(getApiUrl(`/api/study/tracks/${lesson!.trackId}`));
      return res.json();
    },
  });

  const totalInTrack = trackData?.lessons.length ?? 10;

  const markCompletedMutation = useMutation({
    mutationFn: async () =>
      apiRequest("POST", "/api/study/progress", { lessonId, completed: true }),
    onSuccess: () => {
      // Registra no histórico de conclusões para o cartão Seu ritmo (local + servidor)
      recordStudyCompletion();

      queryClient.invalidateQueries({ queryKey: ["/api/study/lessons", lessonId] });
      queryClient.invalidateQueries({ queryKey: ["/api/study/modules"] });
      queryClient.invalidateQueries({ queryKey: ["/api/study/tracks", lesson?.trackId] });

      setCompletedUI(true);
      toast({
        title: t("courses.lessonCompleted"),
        description: t("courses.progressSaved"),
      });
      setTimeout(() => onBack(), 1200);
    },
    onError: () => {
      toast({
        title: t("common.error"),
        description: t("common.saveFailed"),
        variant: "destructive",
      });
    },
  });

  const handleAskProfessor = async () => {
    if (!question.trim()) return;
    setIsAskingProfessor(true);
    try {
      const endpoint = user ? "/api/ai/ask" : "/api/guest/ai/ask";
      const body = user
        ? { question: `Sobre a lição "${lesson?.title}": ${question}`, mode: "professor", language }
        : { question: `Sobre a lição "${lesson?.title}": ${question}`, mode: "professor", deviceId, language };
      const response = await apiRequest("POST", endpoint, body);
      const data = await response.json();
      setAiResponse(data.answer || data.response);
    } catch (err: any) {
      toast({
        title: t("courses.askError"),
        description: err.message || t("courses.tryAgain"),
        variant: "destructive",
      });
    } finally {
      setIsAskingProfessor(false);
    }
  };

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="h-screen flex flex-col bg-background">
        <div className="flex-shrink-0 sticky top-0 z-40 bg-background/95 backdrop-blur border-b px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Skeleton className="h-5 w-40" />
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
          <Skeleton className="h-7 w-2/3" />
          <Skeleton className="h-1 w-full rounded" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  // ── Erro de acesso ──
  const accessError = error as ApiError | null;
  if (accessError) {
    return (
      <div className="h-screen flex flex-col bg-background">
        <div className="flex-shrink-0 sticky top-0 z-40 bg-background/95 backdrop-blur border-b px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} data-testid="button-back-error">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <span className="text-sm font-medium">{t("courses.accessDenied")}</span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-4 text-center">
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
            <MessageCircle className="w-7 h-7 text-muted-foreground" />
          </div>
          <h2 className="font-serif text-lg font-semibold mb-2">
            {accessError.reason === "NOT_AUTHENTICATED"
              ? t("courses.loginRequired")
              : accessError.reason === "UPGRADE_REQUIRED"
              ? t("courses.upgradeRequired")
              : t("courses.lessonUnavailable")}
          </h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-xs">{accessError.error}</p>
          <Button onClick={onBack} data-testid="button-go-back">
            {t("common.back")}
          </Button>
        </div>
      </div>
    );
  }

  // ── Conteúdo ──
  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden" style={{ maxWidth: "100vw" }}>
      {/* Cabeçalho */}
      <header className="flex-shrink-0 sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="px-4 py-2.5">
          {/* Breadcrumb */}
          <button
            className="flex items-center gap-1.5 mb-1"
            onClick={onBack}
            data-testid="button-back-lesson"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-muted-foreground" />
            <Mono className="text-[#647B90]">{cfg.name}</Mono>
          </button>

          {/* Título + relógio */}
          <h1 className="font-serif text-base font-semibold text-foreground leading-snug truncate">
            {lesson?.title}
          </h1>

          <div className="flex items-center gap-3 mt-1.5">
            <SegmentedBar
              total={totalInTrack}
              current={lesson?.order ?? 1}
              accent={cfg.accent}
            />
            <span className="text-[10px] text-muted-foreground flex-shrink-0 flex items-center gap-1">
              <Clock className="w-2.5 h-2.5" />
              {lesson?.estimatedMinutes} min
            </span>
            {isCompleted && (
              <span
                className="text-[10px] font-mono flex items-center gap-1 flex-shrink-0"
                style={{ color: "#22c55e" }}
              >
                <Check className="w-2.5 h-2.5" />
                Concluída
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Corpo rolável */}
      <div
        className="flex-1 overflow-y-auto overflow-x-hidden"
        style={{ paddingBottom: "88px" }}
      >
        <div className="px-4 py-5 max-w-2xl mx-auto" style={{ wordBreak: "break-word", overflowWrap: "anywhere" }}>

          {/* Conteúdo principal em serif */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <p className="font-serif text-[15px] leading-[1.75] text-foreground whitespace-pre-wrap">
              {lesson?.content}
            </p>
          </motion.div>

          {/* Bloco de versículos (pergaminho) */}
          {lesson?.references && <ReferencesBlock references={lesson.references} />}

          {/* Aplicação prática */}
          {lesson?.application && (
            <div
              className="my-6 rounded-xl p-4 bg-card"
              style={{ border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <Mono className="text-[#647B90] block mb-2">Aplicação prática</Mono>
              <p className="font-serif text-sm text-foreground leading-relaxed">
                {lesson.application}
              </p>
            </div>
          )}

          {/* Perguntas de reflexão com textareas */}
          {lesson?.questions && <ReflectionQuestions questions={lesson.questions} />}
        </div>
      </div>

      {/* Rodapé fixo */}
      <div
        className="fixed inset-x-0 bottom-0 bg-background/95 backdrop-blur border-t border-border"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="max-w-2xl mx-auto px-4 py-3 flex gap-3">
          <Button
            variant="outline"
            size="default"
            className="flex-shrink-0"
            onClick={() => setShowAskProfessor(true)}
            data-testid="button-ask-professor"
          >
            <MessageCircle className="w-4 h-4 mr-1.5" />
            Perguntar
          </Button>
          <Button
            className="flex-1"
            size="default"
            onClick={() => {
              if (!isCompleted) markCompletedMutation.mutate();
              else onBack();
            }}
            disabled={markCompletedMutation.isPending}
            data-testid="button-complete-lesson"
            style={
              completedUI
                ? { backgroundColor: "rgba(34,197,94,0.15)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.25)" }
                : {}
            }
          >
            {completedUI ? (
              <><Check className="w-4 h-4 mr-1.5" /> Aula concluída!</>
            ) : markCompletedMutation.isPending ? (
              t("courses.saving")
            ) : isCompleted ? (
              <><Check className="w-4 h-4 mr-1.5" /> {t("common.back")}</>
            ) : (
              "Concluir aula"
            )}
          </Button>
        </div>
      </div>

      {/* Painel Perguntar ao Professor */}
      <AnimatePresence>
        {showAskProfessor && (
          <motion.div
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-x-0 bottom-0 bg-background border-t border-border rounded-t-2xl max-h-[80vh] flex flex-col"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-muted-foreground" />
                  <span className="font-semibold text-sm">{t("courses.askProfessor")}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setShowAskProfessor(false);
                    setQuestion("");
                    setAiResponse(null);
                  }}
                  data-testid="button-close-ask-professor"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <ScrollArea className="flex-1 px-4 py-4">
                {aiResponse && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl p-4 mb-4 bg-card border border-border"
                  >
                    <Mono className="text-[#647B90] block mb-2">Resposta</Mono>
                    <p className="font-serif text-sm leading-relaxed whitespace-pre-wrap">
                      {aiResponse}
                    </p>
                  </motion.div>
                )}
                {!aiResponse && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Faça uma pergunta sobre <span className="italic">{lesson?.title}</span>
                  </p>
                )}
              </ScrollArea>

              <div
                className="px-4 py-3 border-t border-border"
                style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
              >
                <div className="flex gap-2">
                  <Textarea
                    placeholder={`Pergunte sobre "${lesson?.title}"…`}
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    className="min-h-[56px] resize-none font-serif text-sm"
                    data-testid="input-professor-question"
                  />
                  <Button
                    size="icon"
                    onClick={handleAskProfessor}
                    disabled={!question.trim() || isAskingProfessor}
                    data-testid="button-send-question"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
