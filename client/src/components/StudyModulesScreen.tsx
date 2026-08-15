import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ChevronDown, Check, Clock, Award, X, BookMarked } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { getDeviceId } from "@/hooks/use-device-id";
import { getApiUrl } from "@/lib/queryClient";

interface StudyModulesScreenProps {
  onBack: () => void;
  onNavigateToModule: (moduleId: string) => void;
  onNavigateToSubscriptions: () => void;
}

interface StudyModule {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  order: number;
  level: string;
  requiredPlan: string;
  isActive: boolean;
  isUnlocked: boolean;
  progress: { total: number; completed: number; percentage: number };
}

interface TrackDetail {
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
  order: number;
  estimatedMinutes: number;
  completed: boolean;
}

type ClassLevel = "iniciante" | "moderado" | "avancado";

const CLASS_CONFIG: Record<ClassLevel, { name: string; from: string; to: string; accent: string }> = {
  iniciante: { name: "Classe I",   from: "#22668F", to: "#154968", accent: "#7FB6DA" },
  moderado:  { name: "Classe II",  from: "#4A4285", to: "#362F66", accent: "#9990D0" },
  avancado:  { name: "Classe III", from: "#8A6A2E", to: "#6B501C", accent: "#D3B573" },
};

// Cursos futuros: nenhum cadastrado ainda. Quando um segundo curso existir,
// hasFutureCourses deve ser derivado dinamicamente de uma API.
const hasFutureCourses = false;

function SegmentedBar({ total, completed, accent, className = "" }: {
  total: number; completed: number; accent: string; className?: string;
}) {
  const safe = Math.min(completed, total);
  return (
    <div className={`flex gap-[2px] h-1.5 w-full ${className}`}>
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className="flex-1 min-w-0 rounded-full"
          style={{ backgroundColor: i < safe ? accent : "rgba(255,255,255,0.18)" }}
        />
      ))}
    </div>
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

function Mono({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`font-mono text-[10px] uppercase tracking-[0.12em] ${className}`}>
      {children}
    </span>
  );
}

function getWeekActivity(
  serverCompletions?: { ts: number; type?: string }[],
): { daysStudied: number[]; libraryDays: number[]; thisWeekCount: number } {
  try {
    let completions: (number | { ts: number; type?: string })[];
    if (serverCompletions) {
      completions = serverCompletions;
    } else {
      const raw = localStorage.getItem("study_completions");
      completions = raw ? JSON.parse(raw) : [];
    }
    const now = new Date();
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    monday.setHours(0, 0, 0, 0);
    const weekDays = new Set<number>();
    const libDays = new Set<number>();
    let count = 0;
    for (const entry of completions) {
      const ts = typeof entry === "number" ? entry : entry?.ts ?? 0;
      const type = typeof entry === "number" ? undefined : entry?.type;
      if (ts >= monday.getTime()) {
        const d = new Date(ts);
        const dayNum = d.getDay() === 0 ? 7 : d.getDay();
        weekDays.add(dayNum);
        if (type === "library_chapter") libDays.add(dayNum);
        count++;
      }
    }
    return { daysStudied: Array.from(weekDays), libraryDays: Array.from(libDays), thisWeekCount: count };
  } catch { return { daysStudied: [], libraryDays: [], thisWeekCount: 0 }; }
}

function CourseBottomSheet({
  open, onClose, alicerceProgress, modules
}: {
  open: boolean;
  onClose: () => void;
  alicerceProgress: { percentage: number };
  modules: StudyModule[];
}) {
  const initModules = modules.filter(m => m.level === "iniciante");
  const modModules  = modules.filter(m => m.level === "moderado");
  const advModules  = modules.filter(m => m.level === "avancado");

  const avg = (arr: StudyModule[]) =>
    arr.length ? Math.round(arr.reduce((s, m) => s + m.progress.percentage, 0) / arr.length) : 0;

  const thirds = (arr: StudyModule[]): [number, number, number] => {
    const n = arr.length;
    if (!n) return [0, 0, 0];
    const t = Math.ceil(n / 3);
    return [avg(arr.slice(0, t)), avg(arr.slice(t, 2 * t)), avg(arr.slice(2 * t))];
  };

  const [i1, i2, i3] = thirds(initModules);
  const [m1, m2, m3] = thirds(modModules);
  const [a1, a2, a3] = thirds(advModules);

  const nineBars = [
    { pct: i1, accent: CLASS_CONFIG.iniciante.accent },
    { pct: i2, accent: CLASS_CONFIG.iniciante.accent },
    { pct: i3, accent: CLASS_CONFIG.iniciante.accent },
    { pct: m1, accent: CLASS_CONFIG.moderado.accent },
    { pct: m2, accent: CLASS_CONFIG.moderado.accent },
    { pct: m3, accent: CLASS_CONFIG.moderado.accent },
    { pct: a1, accent: CLASS_CONFIG.avancado.accent },
    { pct: a2, accent: CLASS_CONFIG.avancado.accent },
    { pct: a3, accent: CLASS_CONFIG.avancado.accent },
  ];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/60" onClick={onClose} />
          <motion.div
            className="absolute inset-x-0 bottom-0 rounded-t-2xl overflow-hidden"
            style={{ backgroundColor: "#0E1B2B", maxHeight: "60vh" }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
          >
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-9 h-1 rounded-full bg-white/20" />
            </div>
            <div className="px-4 pb-2 flex items-center justify-between">
              <Mono className="text-[#647B90]">Seu progresso</Mono>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="px-4 pb-8">
              <div
                className="rounded-xl p-4"
                style={{ border: "1.5px solid #9990D0", backgroundColor: "rgba(153,144,208,0.08)" }}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div>
                    <p className="font-serif font-semibold text-white">Alicerce</p>
                    <p className="text-xs text-white/60 mt-0.5">Formação bíblica completa</p>
                  </div>
                  <span className="text-xs font-mono text-white/60 flex-shrink-0">
                    {alicerceProgress.percentage}%
                  </span>
                </div>
                <div className="flex gap-[3px] mt-3 h-1.5">
                  {nineBars.map((b, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-full"
                      style={{
                        backgroundColor: b.pct > 0
                          ? `${b.accent}${Math.max(40, Math.round(b.pct * 2.55)).toString(16).padStart(2, "0")}`
                          : "rgba(255,255,255,0.10)",
                        height: "100%",
                      }}
                    />
                  ))}
                </div>
                <div className="flex justify-between mt-2">
                  {(["Classe I", "Classe II", "Classe III"] as const).map((label, i) => (
                    <span key={i} className="text-[9px] font-mono" style={{ color: nineBars[i * 3].accent + "80" }}>
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ContinueCard({
  activeModule, activeTrack, currentLesson, onNavigateToModule
}: {
  activeModule: StudyModule | null;
  activeTrack: TrackDetail | null;
  currentLesson: Lesson | null;
  onNavigateToModule: (id: string) => void;
}) {
  if (!activeModule || !activeTrack) {
    return (
      <div
        className="rounded-xl p-5"
        style={{
          background: `linear-gradient(158deg, ${CLASS_CONFIG.iniciante.from}, ${CLASS_CONFIG.iniciante.to})`,
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.13), inset 0 0 0 1px rgba(255,255,255,0.05)",
        }}
      >
        <ClassBadge level="iniciante" />
        <p className="font-serif text-white text-lg font-medium mt-3 mb-1">Comece sua jornada</p>
        <p className="text-white/70 text-sm mb-4">Inicie a Classe I e construa sua formação bíblica.</p>
      </div>
    );
  }

  const level = (activeModule.level as ClassLevel) || "iniciante";
  const cfg = CLASS_CONFIG[level] ?? CLASS_CONFIG.iniciante;
  const lessonNumber = activeTrack.completedLessons + 1;
  const remainingMin = currentLesson?.estimatedMinutes ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
      className="rounded-xl p-4 cursor-pointer"
      style={{
        background: `linear-gradient(158deg, ${cfg.from}, ${cfg.to})`,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.13), inset 0 0 0 1px rgba(255,255,255,0.05)",
      }}
      onClick={() => onNavigateToModule(activeModule.id)}
    >
      <div className="flex items-center gap-2 mb-3">
        <ClassBadge level={level} />
        <Mono className="text-white/50">Continuar</Mono>
      </div>

      <p className="font-serif text-white text-base font-medium leading-snug mb-3">
        {currentLesson?.title ?? activeModule.name}
      </p>

      <SegmentedBar
        total={activeTrack.totalLessons}
        completed={activeTrack.completedLessons}
        accent={cfg.accent}
        className="mb-3"
      />

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-white/60 text-[11px] leading-snug">
          {activeModule.name} · Aula {lessonNumber} de {activeTrack.totalLessons}
          {remainingMin > 0 && ` · ${remainingMin} min`}
        </p>
        <button
          className="flex-shrink-0 text-[11px] font-semibold px-3 py-1.5 rounded-lg"
          style={{ backgroundColor: "rgba(255,255,255,0.14)", color: "#fff" }}
          onClick={(e) => { e.stopPropagation(); onNavigateToModule(activeModule.id); }}
          data-testid="button-resume-lesson"
        >
          Retomar aula
        </button>
      </div>
    </motion.div>
  );
}

function RhythmCard({ activeTrack }: { activeTrack: TrackDetail | null }) {
  const { user } = useAuth();
  // Fonte primária: servidor (mantém o ritmo entre aparelhos); fallback: localStorage
  const { data: serverCompletions } = useQuery<{ ts: number; type?: string }[]>({
    queryKey: ["/api/study/completions"],
    enabled: !!user,
    staleTime: 60 * 1000,
  });
  const { daysStudied, libraryDays, thisWeekCount } = useMemo(
    () => getWeekActivity(serverCompletions ?? undefined),
    [serverCompletions],
  );
  const weeklyGoal = 5;
  const dayLabels = ["S", "T", "Q", "Q", "S", "S", "D"];
  const todayDow = new Date().getDay() === 0 ? 7 : new Date().getDay();

  const remaining = activeTrack ? activeTrack.totalLessons - activeTrack.completedLessons : 0;
  let estimatedText = "";
  if (thisWeekCount > 0 && remaining > 0) {
    const ms = (remaining / thisWeekCount) * 7 * 24 * 60 * 60 * 1000;
    const date = new Date(Date.now() + ms);
    estimatedText = `Estimativa: ${date.toLocaleDateString("pt-BR", { month: "short", day: "numeric" })} · Trilha atual`;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: 0.05 }}
      className="rounded-xl p-4 bg-card border border-border"
    >
      <div className="mb-3">
        <Mono className="text-[#647B90]">Seu ritmo</Mono>
        <p className="text-sm text-foreground mt-1">
          <span className="font-serif font-semibold">{thisWeekCount}</span>
          <span className="text-muted-foreground"> de {weeklyGoal} aulas esta semana</span>
        </p>
      </div>

      <div className="flex gap-1 mb-3 w-full min-w-0">
        {[1, 2, 3, 4, 5, 6, 7].map((dayNum) => {
          const studied = daysStudied.includes(dayNum);
          const readLibrary = libraryDays.includes(dayNum);
          const isToday = dayNum === todayDow;
          const accent = CLASS_CONFIG.iniciante.accent;
          return (
            <div key={dayNum} className="flex-1 min-w-0 flex flex-col items-center gap-0.5">
              <div
                className="w-full aspect-square rounded-md flex items-center justify-center"
                style={{
                  backgroundColor: studied
                    ? `${accent}38`
                    : isToday
                    ? "hsl(var(--muted))"
                    : "hsl(var(--muted))",
                  border: isToday
                    ? `1.5px solid ${accent}`
                    : studied
                    ? `1px solid ${accent}70`
                    : `1px solid hsl(var(--border))`,
                }}
              >
                {studied && (readLibrary
                  ? <BookMarked className="w-2.5 h-2.5" style={{ color: accent }} />
                  : <Check className="w-2.5 h-2.5" style={{ color: accent }} />)}
              </div>
              <span className="text-[8px] text-muted-foreground font-mono leading-none">{dayLabels[dayNum - 1]}</span>
            </div>
          );
        })}
      </div>

      {estimatedText ? (
        <p className="text-[11px] text-muted-foreground">{estimatedText}</p>
      ) : thisWeekCount === 0 ? (
        <p className="text-[11px] text-muted-foreground">Continue estudando para ver sua estimativa</p>
      ) : null}
    </motion.div>
  );
}

function TrackCard({ module, onClick }: { module: StudyModule; onClick: () => void }) {
  const level = (module.level as ClassLevel) || "iniciante";
  const cfg = CLASS_CONFIG[level] ?? CLASS_CONFIG.iniciante;
  const hasProgress = module.progress.completed > 0;

  return (
    <div
      className="flex-shrink-0 w-44 rounded-xl p-3 cursor-pointer"
      style={{
        background: `linear-gradient(158deg, ${cfg.from}, ${cfg.to})`,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10), inset 0 0 0 1px rgba(255,255,255,0.06)",
      }}
      onClick={onClick}
      data-testid={`track-card-${module.id}`}
    >
      <ClassBadge level={level} />
      <p className="font-serif text-white text-sm font-medium mt-2 mb-2 leading-snug line-clamp-2">{module.name}</p>

      {hasProgress ? (
        <>
          <SegmentedBar
            total={module.progress.total}
            completed={module.progress.completed}
            accent={cfg.accent}
            className="mb-1.5"
          />
          <p className="text-[10px]" style={{ color: `${cfg.accent}CC` }}>
            {module.progress.completed}/{module.progress.total} aulas
          </p>
        </>
      ) : (
        <p className="text-[10px] text-white/50">{module.progress.total} aulas</p>
      )}
    </div>
  );
}

function ClassSection({
  level, modules, onNavigateToModule
}: {
  level: ClassLevel;
  modules: StudyModule[];
  onNavigateToModule: (id: string) => void;
}) {
  if (!modules.length) return null;
  const cfg = CLASS_CONFIG[level];
  const totalLessons = modules.reduce((s, m) => s + m.progress.total, 0);
  const completedLessons = modules.reduce((s, m) => s + m.progress.completed, 0);
  const pct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3 px-0.5">
        <div className="flex items-center gap-2">
          <span className="font-serif text-base font-semibold text-foreground">{cfg.name}</span>
          <span className="text-[10px] font-mono text-muted-foreground">{modules.length} trilhas</span>
        </div>
        {pct > 0 && (
          <span className="text-[11px] font-mono" style={{ color: `${cfg.accent}CC` }}>{pct}%</span>
        )}
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 w-full min-w-0" style={{ scrollbarWidth: "none" }}>
        {modules.map((m) => (
          <TrackCard key={m.id} module={m} onClick={() => onNavigateToModule(m.id)} />
        ))}
      </div>
    </div>
  );
}

export function StudyModulesScreen({ onBack, onNavigateToModule, onNavigateToSubscriptions }: StudyModulesScreenProps) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const deviceId = getDeviceId();
  const [showCourseSheet, setShowCourseSheet] = useState(false);

  const { data: modules, isLoading } = useQuery<StudyModule[]>({
    queryKey: ["/api/study/modules", language],
    queryFn: async () => {
      const res = await fetch(getApiUrl(`/api/study/modules?lang=${language}`), {
        headers: { "x-device-id": deviceId || "" },
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const sortedModules = useMemo(
    () => [...(modules ?? [])].sort((a, b) => a.order - b.order),
    [modules]
  );

  const activeModule = useMemo(() => {
    const inProgress = sortedModules.find(
      (m) => m.progress.percentage > 0 && m.progress.percentage < 100
    );
    return inProgress ?? sortedModules[0] ?? null;
  }, [sortedModules]);

  const { data: activeModuleDetail } = useQuery<{ module: any; tracks: TrackDetail[]; progress: any }>({
    queryKey: ["/api/study/modules", activeModule?.id, language],
    enabled: !!activeModule?.id,
    queryFn: async () => {
      const res = await fetch(
        getApiUrl(`/api/study/modules/${activeModule!.id}?lang=${language}`),
        { headers: { "x-device-id": deviceId || "" } }
      );
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const activeTrack = useMemo(() => {
    const tracks = activeModuleDetail?.tracks ?? [];
    return (
      tracks.find((t) => t.completedLessons > 0 && t.completedLessons < t.totalLessons) ??
      tracks[0] ??
      null
    );
  }, [activeModuleDetail]);

  const { data: activeTrackData } = useQuery<{ lessons: Lesson[] }>({
    queryKey: ["/api/study/tracks", activeTrack?.id, language],
    enabled: !!activeTrack?.id,
    queryFn: async () => {
      const res = await fetch(getApiUrl(`/api/study/tracks/${activeTrack!.id}?lang=${language}`));
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const currentLesson = useMemo(() => {
    const lessons = activeTrackData?.lessons ?? [];
    return lessons.find((l) => !l.completed) ?? lessons[0] ?? null;
  }, [activeTrackData]);

  const inicianteModules = sortedModules.filter((m) => m.level === "iniciante");
  const moderadoModules  = sortedModules.filter((m) => m.level === "moderado");
  const avancadoModules  = sortedModules.filter((m) => m.level === "avancado");

  const totalLessons   = sortedModules.reduce((s, m) => s + m.progress.total, 0);
  const completedTotal = sortedModules.reduce((s, m) => s + m.progress.completed, 0);
  const overallPct     = totalLessons > 0 ? Math.round((completedTotal / totalLessons) * 100) : 0;
  const hasGoldAccess  = user != null;
  const trackCount     = sortedModules.length;
  // "módulos" = as 3 Classes; "trilhas" = os registros individuais da API
  const classCount     = [inicianteModules, moderadoModules, avancadoModules].filter(a => a.length > 0).length;

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-2xl mx-auto px-4 pt-3 pb-3 flex flex-col gap-2">
          <button
            className="flex items-center gap-1.5 w-fit"
            onClick={onBack}
            data-testid="button-back-courses"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-muted-foreground" />
            <Mono className="text-[#647B90]">Início</Mono>
          </button>

          <div className="flex items-end gap-2">
            {/* Seta e abertura da folha só aparecem quando há mais de um curso */}
            {hasFutureCourses ? (
              <button
                className="flex items-center gap-2"
                onClick={() => setShowCourseSheet(true)}
                data-testid="button-open-course-sheet"
              >
                <h1 className="font-serif text-2xl font-semibold text-foreground leading-none">
                  Alicerce
                </h1>
                <ChevronDown className="w-4 h-4 mt-1" style={{ color: CLASS_CONFIG.moderado.accent }} />
              </button>
            ) : (
              <h1 className="font-serif text-2xl font-semibold text-foreground leading-none">
                Alicerce
              </h1>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            Formação bíblica completa · {classCount} módulos · {trackCount} trilhas · {totalLessons} lições
          </p>
        </div>
      </header>

      <div className="h-[calc(100vh-108px)] overflow-y-auto overflow-x-hidden">
        <div
          className="max-w-2xl mx-auto px-4 py-5 space-y-5"
          style={{ paddingBottom: "calc(2rem + env(safe-area-inset-bottom, 0px))" }}
        >
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-36 w-full rounded-xl" />
              <Skeleton className="h-28 w-full rounded-xl" />
            </div>
          ) : (
            <>
              <ContinueCard
                activeModule={activeModule}
                activeTrack={activeTrack}
                currentLesson={currentLesson}
                onNavigateToModule={onNavigateToModule}
              />

              <RhythmCard activeTrack={activeTrack} />

              <div className="pt-1">
                <ClassSection level="iniciante" modules={inicianteModules} onNavigateToModule={onNavigateToModule} />
                <ClassSection level="moderado"  modules={moderadoModules}  onNavigateToModule={onNavigateToModule} />
                <ClassSection level="avancado"  modules={avancadoModules}  onNavigateToModule={onNavigateToModule} />
              </div>

              {!hasGoldAccess && (
                <div className="rounded-xl p-4 bg-card border border-border text-center">
                  <Mono className="text-[#647B90]">Acesso completo</Mono>
                  <p className="text-sm text-foreground font-serif font-medium mt-2 mb-1">
                    Classe II e III com Gold e Premium
                  </p>
                  <p className="text-xs text-muted-foreground mb-3">
                    Continue sua formação com acesso a todas as trilhas e aulas.
                  </p>
                  <Button size="sm" onClick={onNavigateToSubscriptions} data-testid="button-subscribe-cta">
                    Ver planos
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Folha de troca de curso: ativa somente quando houver mais de um curso */}
      {hasFutureCourses && (
        <CourseBottomSheet
          open={showCourseSheet}
          onClose={() => setShowCourseSheet(false)}
          alicerceProgress={{ percentage: overallPct }}
          modules={sortedModules}
        />
      )}
    </div>
  );
}
