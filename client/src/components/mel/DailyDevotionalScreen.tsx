import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, BookOpen, Check, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import type { MelPosition } from "@shared/mel";
import { useMel } from "@/hooks/useMel";
import { apiRequest } from "@/lib/queryClient";
import { getBookName } from "@/lib/bible-book-names";
import { MelCompletionNotice } from "@/components/mel/MelCard";

interface DailyDevotionalScreenProps {
  date?: string;
  onBack: () => void;
  onSignIn?: () => void;
}

interface BibleChapterResponse {
  book: { id: string; name: string };
  chapter: { chapter: number; verses: { verse: number; text: string }[] };
  version?: string;
}

function isDateString(value?: string): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const timestamp = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === value;
}

function psalmForDate(date: string) {
  const timestamp = Date.parse(`${date}T00:00:00Z`);
  const dayNumber = Math.floor(timestamp / 86_400_000);
  return ((dayNumber % 150) + 150) % 150 + 1;
}

export function DailyDevotionalScreen({ date, onBack, onSignIn }: DailyDevotionalScreenProps) {
  const { user } = useAuth();
  const { status, savePosition, recordActivity, isRecordingActivity, today } = useMel();
  const [readingDate, setReadingDate] = useState(() => isDateString(date) ? date : today);
  const previousTodayRef = useRef(today);
  const isToday = readingDate === today;
  const psalm = useMemo(() => psalmForDate(readingDate), [readingDate]);
  const [notice, setNotice] = useState<string | null>(null);
  const [noticeStreak, setNoticeStreak] = useState<number | undefined>();
  const [activityError, setActivityError] = useState<string | null>(null);
  const [version] = useState(() => {
    try {
      return localStorage.getItem("bible_version") || "ACF";
    } catch {
      return "ACF";
    }
  });

  const { data, isLoading, error } = useQuery<BibleChapterResponse>({
    queryKey: ["/api/bible", "psa", psalm, version],
    queryFn: async () => (await apiRequest("GET", `/api/bible/psa/${psalm}?version=${encodeURIComponent(version)}`)).json(),
    staleTime: 60_000,
  });

  useEffect(() => {
    if (previousTodayRef.current === today) return;
    const previousToday = previousTodayRef.current;
    previousTodayRef.current = today;
    setReadingDate((currentDate) => currentDate === previousToday ? today : currentDate);
  }, [today]);

  useEffect(() => {
    if (!user || !data || !isToday) return;
    const position: MelPosition = { kind: "devotional", devotionalDate: readingDate };
    void savePosition(position).catch((saveError) => {
      console.warn("[Mel] Could not save devotional position:", saveError);
    });
  }, [data, isToday, readingDate, savePosition, user]);

  const alreadyReadToday = !!user && isToday && status?.today === today && !!status.devotionalReadToday;

  const markAsRead = async () => {
    setActivityError(null);
    const currentStatus = status?.today === today ? status : undefined;
    setNoticeStreak(currentStatus?.completedToday ? currentStatus.streak : (currentStatus?.streak ?? 0) + 1);
    try {
      await recordActivity({ kind: "devotional", devotionalDate: readingDate });
      setNotice("Que alegria ter você por aqui. Que este tempo de leitura acompanhe o seu dia.");
    } catch (activityException) {
      setActivityError(activityException instanceof Error ? activityException.message : "Não foi possível registrar a leitura.");
    }
  };

  const title = data?.book?.name || getBookName("psa", "pt");
  const passageText = data?.chapter?.verses
    ?.map((verse) => ({ ...verse, text: verse.text?.trim() }))
    .filter((verse) => verse.text)
    .slice(0, 5);
  const passageReference = passageText?.length
    ? `${title} ${psalm}:${passageText[0].verse}${passageText.length > 1 ? `–${passageText[passageText.length - 1].verse}` : ""}`
    : `${title} ${psalm}`;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={onBack} aria-label="Voltar" data-testid="button-back-devotional">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="font-serif text-lg font-semibold">Devocional do dia</h1>
            <p className="text-xs text-muted-foreground">
              {new Date(`${readingDate}T12:00:00`).toLocaleDateString("pt-BR", { dateStyle: "long" })}
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-5 px-4 py-6 pb-12">
        <section className="flex items-center gap-4 rounded-2xl border bg-card p-4 sm:p-5" data-testid="daily-devotional-intro">
          <div>
            <h2 className="font-serif text-lg font-semibold">Um momento na Palavra</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Leia o trecho com calma e reserve um instante para refletir. A Mel acompanha sua leitura, sem substituir o texto bíblico.
            </p>
          </div>
        </section>

        {isLoading ? (
          <div className="space-y-3 rounded-xl border p-5" role="status" aria-label="Carregando passagem bíblica">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        ) : error ? (
          <p className="rounded-xl border border-destructive/40 p-4 text-sm text-destructive" role="alert" data-testid="daily-devotional-error">
            Não foi possível carregar o trecho bíblico. Verifique sua conexão e tente novamente.
          </p>
        ) : data && passageText?.length ? (
          <article className="rounded-xl border bg-card p-5 sm:p-7" data-testid="daily-devotional-passage">
            <div className="mb-5 flex items-center gap-2 text-sm font-medium text-primary">
              <BookOpen className="h-4 w-4" aria-hidden="true" />
              <h2 className="font-serif text-xl">{passageReference}</h2>
              <span className="text-xs text-muted-foreground">{data.version || version}</span>
            </div>
            <div className="space-y-4">
              {passageText.map((verse) => (
                <p key={verse.verse} className="font-serif text-base leading-8" data-testid={`devotional-verse-${verse.verse}`}>
                  <span className="mr-2 align-super font-mono text-xs text-muted-foreground">{verse.verse}</span>
                  {verse.text}
                </p>
              ))}
            </div>
            <p className="mt-7 border-t pt-4 text-sm text-muted-foreground">
              Que palavra deste salmo você gostaria de levar consigo hoje?
            </p>
          </article>
        ) : !isLoading && !error ? (
          <p className="rounded-xl border p-4 text-sm text-muted-foreground" role="status">
            Esta passagem não retornou texto. Tente novamente mais tarde.
          </p>
        ) : null}

        {user && isToday ? (
          <Button
            type="button"
            onClick={markAsRead}
            disabled={isRecordingActivity || alreadyReadToday || !passageText?.length}
            className="min-h-11 w-full sm:w-auto"
            data-testid="button-mark-devotional-read"
          >
            {isRecordingActivity ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />Salvando leitura...</>
            ) : alreadyReadToday ? (
              <><Check className="mr-2 h-4 w-4" aria-hidden="true" />Leitura registrada hoje</>
            ) : (
              "Marcar trecho como lido"
            )}
          </Button>
        ) : user ? (
          <p className="text-sm text-muted-foreground" role="status">
            Esta é uma leitura de outra data. Somente o devocional de hoje pode ser registrado como atividade.
          </p>
        ) : (
          <Button type="button" variant="outline" onClick={onSignIn} className="min-h-11" data-testid="button-devotional-sign-in">
            Entre para registrar sua leitura
          </Button>
        )}
        {activityError && <p className="text-sm text-destructive" role="alert">{activityError}</p>}
        {notice && (
          <MelCompletionNotice
            message={notice}
            streak={noticeStreak}
            onDismiss={() => setNotice(null)}
          />
        )}
      </main>
    </div>
  );
}