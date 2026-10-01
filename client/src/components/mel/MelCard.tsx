import { ArrowRight, BookOpen, CalendarDays, Flame, GraduationCap, TrendingUp } from "lucide-react";
import type { MelPosition } from "@shared/mel";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useMel, type MelStatus } from "@/hooks/useMel";
import { MelMascot } from "@/components/mel/MelMascot";

interface MelCardProps {
  onContinue: (position: MelPosition) => void;
  onOpenDevotional: (date: string) => void;
}

function continuationLabel(position: MelPosition | null, status?: MelStatus) {
  if (!position) {
    return status?.course
      ? `Continuar ${status.course.title}`
      : "Começar leitura em Salmos 23";
  }
  if (position.kind === "bible") {
    return `Continuar ${position.book.toUpperCase()} ${position.chapter}:${position.verse}`;
  }
  if (position.kind === "lesson") {
    return status?.course?.lessonId === position.lessonId
      ? `Continuar ${status.course.title}`
      : "Continuar aula";
  }
  return "Retomar devocional do dia";
}

function messageFor(status?: MelStatus, hasAccount = true) {
  if (!hasAccount) return "A Mel está pronta para acompanhar sua leitura. Que tal começar hoje?";
  if (status?.completedToday) return "Que alegria! Você esteve na Palavra hoje.";
  if (status?.mood === "saudade") return "Bééé… senti sua falta. 5 minutinhos em Salmos?";
  if (status?.position) return "Vamos continuar de onde você parou?";
  return "Que tal começar hoje com Salmos 23?";
}

export function MelCard({ onContinue, onOpenDevotional }: MelCardProps) {
  const { user } = useAuth();
  const { status, isLoading, today, error, refresh } = useMel();
  const position = status?.position ?? null;
  const statusForToday = status
    ? { ...status, completedToday: status.today === today && status.completedToday, mood: status.today === today ? status.mood : "normal" as const }
    : undefined;

  return (
    <section
      aria-labelledby="mel-card-title"
      data-testid="mel-card"
      className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-4 shadow-sm sm:p-5"
    >
      <div className="flex items-start gap-3">
        <MelMascot
          mood={statusForToday?.completedToday ? "feliz" : statusForToday?.mood ?? "normal"}
          className="h-16 w-16 shrink-0 sm:h-[72px] sm:w-[72px]"
        />
        <div className="min-w-0 flex-1">
          <h2 id="mel-card-title" className="font-serif text-lg font-semibold">
            Sua caminhada com a Mel
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground" aria-live="polite">
            {error ? "Não foi possível carregar sua caminhada agora. Seu progresso não foi apagado." : messageFor(statusForToday, !!user)}
          </p>
          {error && (
            <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => void refresh()}>
              Tentar novamente
            </Button>
          )}
          {user && !isLoading && status && status.today === today && (
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground" data-testid="mel-streak-summary">
              <span className="inline-flex items-center gap-1.5">
                <Flame className="h-3.5 w-3.5 text-orange-500" aria-hidden="true" />
                {status.streak} {status.streak === 1 ? "dia" : "dias"} seguidos na Palavra
              </span>
              <span className="inline-flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
                Melhor sequência: {status.bestStreak}
              </span>
            </div>
          )}
        </div>
      </div>

      {user && status?.activePlan && (
        <div className="mt-4 rounded-lg bg-background/70 p-3" data-testid="mel-active-plan">
          <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
            <span className="min-w-0 truncate font-medium">{status.activePlan.title}</span>
            <span className="shrink-0 text-muted-foreground">{status.activePlan.percentage}%</span>
          </div>
          <div
            className="h-2 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-label={`Progresso do plano ${status.activePlan.title}`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.max(0, Math.min(100, status.activePlan.percentage))}
          >
            <div
              className="h-full rounded-full bg-primary transition-[width] motion-reduce:transition-none"
              style={{ width: `${Math.max(0, Math.min(100, status.activePlan.percentage))}%` }}
            />
          </div>
        </div>
      )}

      {user && status?.course && (
        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground" data-testid="mel-course-in-progress">
          <GraduationCap className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="truncate">Curso em andamento: {status.course.title}</span>
        </div>
      )}

      <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]">
        <Button
          type="button"
          className="min-h-11 justify-between gap-2"
          onClick={() => {
            if (position) onContinue(position);
            else if (status?.course) onContinue({
              kind: "lesson",
              lessonId: status.course.lessonId,
              moduleId: status.course.moduleId,
              trackLevel: status.course.trackLevel,
            });
            else onContinue({ kind: "bible", book: "psa", chapter: 23, verse: 1, versionCode: "ACF" });
          }}
          disabled={!!user && (isLoading || !!error)}
          data-testid="button-mel-continue"
        >
          <span className="inline-flex min-w-0 items-center gap-2">
            <BookOpen className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="truncate">{continuationLabel(position, status)}</span>
          </span>
          <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant="outline"
          className="min-h-11 gap-2"
          onClick={() => onOpenDevotional(today)}
          disabled={isLoading && !!user}
          data-testid="button-mel-devotional"
        >
          <CalendarDays className="h-4 w-4" aria-hidden="true" />
          Devocional do dia
        </Button>
      </div>
    </section>
  );
}

export function MelCompletionNotice({
  message,
  streak,
  onDismiss,
}: {
  message: string;
  streak?: number;
  onDismiss?: () => void;
}) {
  const milestone = streak && [7, 30, 100, 365].includes(streak);
  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="mel-completion-notice"
      className="flex items-center gap-3 rounded-xl border border-primary/30 bg-card p-3 shadow-lg motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2"
    >
      <MelMascot mood="feliz" celebrate className="h-12 w-12 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{message}</p>
        {milestone && <p className="text-xs text-muted-foreground">{streak} dias seguidos na Palavra. Que marco especial!</p>}
      </div>
      {onDismiss && (
        <Button type="button" variant="ghost" size="sm" onClick={onDismiss} aria-label="Fechar mensagem da Mel">
          Fechar
        </Button>
      )}
    </div>
  );
}