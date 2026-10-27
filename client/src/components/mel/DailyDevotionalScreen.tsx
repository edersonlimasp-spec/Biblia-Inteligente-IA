import { useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, Check, ChevronLeft, ChevronRight, Moon, Share2, Sun, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import type { DevotionalJournalInput, DevotionalMoment, DevotionalRoutine } from "@shared/devotional";
import { devotionalRoutineAt } from "@shared/devotional";
import { getMelDate } from "@/lib/mel-date";
import { useMel } from "@/hooks/useMel";
import { useCompleteDevotional, useCreateDevotionalPrayer, useDevotionalJournal, useDevotionalMoment, useSaveDevotionalJournal } from "@/hooks/use-devotional";
import { shareDevotionalImage } from "@/components/mel/DevotionalShare";
import { StrongModal } from "@/components/StrongModal";
import { MelMascot } from "@/components/mel/MelMascot";
import { MelCompletionNotice } from "@/components/mel/MelCard";
import { closeDevotionalInvitation } from "@/hooks/useDevotionalInvitation";

interface DailyDevotionalScreenProps {
  date?: string;
  onBack: () => void;
  onSignIn?: () => void;
  onNavigateToSubscriptions?: () => void;
  onNavigateToPrayer?: (result: { listId: string; requestId: string }) => void;
}

function getVersion() {
  try { return localStorage.getItem("bible_version") || "ACF"; } catch { return "ACF"; }
}

function localDateValid(value?: string): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function useCurrentMoment() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const sync = () => {
      setNow(new Date());
      if (timer) clearTimeout(timer);
      timer = setTimeout(sync, 60_000);
    };
    const onVisible = () => { if (document.visibilityState === "visible") sync(); };
    sync();
    window.addEventListener("focus", onVisible);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener("focus", onVisible);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);
  return now;
}

export function DailyDevotionalScreen({ date, onBack, onSignIn, onNavigateToPrayer, onNavigateToSubscriptions }: DailyDevotionalScreenProps) {
  const { user } = useAuth();
  const { status, savePosition, sessionGeneration } = useMel();
  const now = useCurrentMoment();
  const today = getMelDate(now);
  const [readingDate, setReadingDate] = useState(() => localDateValid(date) ? date : getMelDate());
  const followsToday = useRef(!localDateValid(date) || date === getMelDate());
  const routine: DevotionalRoutine = devotionalRoutineAt(now);
  const isCurrentDate = readingDate === today;
  const [preferredVersion] = useState(getVersion);
  const [version, setVersion] = useState(getVersion);
  const momentQuery = useDevotionalMoment(readingDate, routine, version);
  const journalQuery = useDevotionalJournal(readingDate, routine);
  const saveJournal = useSaveDevotionalJournal(readingDate, routine);
  const complete = useCompleteDevotional(readingDate, routine);
  const createPrayer = useCreateDevotionalPrayer();
  const [step, setStep] = useState(0);
  const [strongOpen, setStrongOpen] = useState(false);
  const [shareError, setShareError] = useState("");
  const [sharePickerOpen, setSharePickerOpen] = useState(false);
  const [actionDone, setActionDone] = useState<boolean | null>(null);
  const [answer, setAnswer] = useState("");
  const [gratitude, setGratitude] = useState("");
  const [surrender, setSurrender] = useState("");
  const [forgiveness, setForgiveness] = useState("");
  const [savedOnce, setSavedOnce] = useState(false);
  const [completionSavedKey, setCompletionSavedKey] = useState("");
  const [journalError, setJournalError] = useState("");
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const initializedKey = useRef("");
  const previousToday = useRef(today);
  const activeIdentity = `${user?.id ?? "guest"}:${sessionGeneration}:${readingDate}:${routine}`;
  const activeIdentityRef = useRef(activeIdentity);
  activeIdentityRef.current = activeIdentity;
  const closeReading = () => {
    if (isCurrentDate) closeDevotionalInvitation(user?.id, readingDate, routine);
    onBack();
  };
  useEffect(() => {
    if (!completionSavedKey || completionSavedKey !== activeIdentity) return;
    closeDevotionalInvitation(user?.id, readingDate, routine);
    // Keep the existing Mel completion notice visible before returning.
    const timer = window.setTimeout(onBack, 2200);
    return () => window.clearTimeout(timer);
  }, [completionSavedKey, activeIdentity, user?.id, readingDate, routine, onBack]);
  useEffect(() => {
    followsToday.current = !localDateValid(date) || date === today;
    if (localDateValid(date)) setReadingDate(date);
  }, [date]);
  const moment = momentQuery.data;
  const isNight = routine === "noite";

  useEffect(() => {
    const priorDate = previousToday.current;
    if (priorDate !== today) {
      previousToday.current = today;
      if (followsToday.current) setReadingDate(today);
    }
  }, [today]);

  useEffect(() => {
    initializedKey.current = "";
    setAnswer("");
    setGratitude("");
    setSurrender("");
    setForgiveness("");
    setActionDone(null);
    setSavedOnce(false);
    setCompletionSavedKey("");
    setJournalError("");
  }, [user?.id, sessionGeneration, readingDate, routine]);

  useEffect(() => {
    if (journalQuery.data && initializedKey.current !== activeIdentity) {
      initializedKey.current = activeIdentity;
      setAnswer(journalQuery.data.answer || "");
      setGratitude(journalQuery.data.gratitude || "");
      setSurrender(journalQuery.data.surrender || "");
      setForgiveness(journalQuery.data.forgiveness || "");
      setActionDone(journalQuery.data.actionDone);
      setSavedOnce(true);
    }
  }, [journalQuery.data, activeIdentity]);

  useEffect(() => {
    if (!user || !moment || !isCurrentDate) return;
    void savePosition({ kind: "devotional", devotionalDate: readingDate }).catch(() => undefined);
  }, [user?.id, moment, isCurrentDate, readingDate, savePosition]);

  const steps = useMemo(() => isNight
    ? ["leitura", "gratidão", "entrega", "perdão", "ação", "oração", "final"]
    : ["versículo", "reflexão", "raiz", "prática", "oração", "pergunta", "final"],
  [isNight]);
  useEffect(() => setStep(0), [readingDate, routine]);

  const goTo = (next: number) => setStep(Math.max(0, Math.min(steps.length - 1, next)));
  const journalInput = (): DevotionalJournalInput => ({
    date: readingDate, routine, answer, gratitude, surrender, forgiveness, actionDone,
  });
  const persistJournal = async () => {
    if (!user) return false;
    const saveIdentity = activeIdentity;
    const input = journalInput();
    setJournalError("");
    try {
      await saveJournal.mutateAsync(input);
      if (activeIdentityRef.current !== saveIdentity) return false;
      setSavedOnce(true);
      return true;
    } catch (error) {
      if (activeIdentityRef.current !== saveIdentity) return false;
      setJournalError(error instanceof Error ? error.message : "Não foi possível salvar seu registro.");
      return false;
    }
  };
  const advance = async () => {
    const identity = activeIdentity;
    if (user && journalQuery.isSuccess) await persistJournal();
    if (activeIdentityRef.current === identity) goTo(step + 1);
  };
  const share = async (square: boolean) => {
    if (!moment) return;
    setSharePickerOpen(false);
    setShareError("");
    try { await shareDevotionalImage(moment, square); }
    catch (error) { setShareError(error instanceof Error ? error.message : "Não foi possível compartilhar agora."); }
  };
  const startPrayer = async () => {
    if (!user) { onSignIn?.(); return; }
    try {
      const result = await createPrayer.mutateAsync({ date: readingDate, routine });
      onNavigateToPrayer?.(result);
    } catch {
      setJournalError("Não foi possível criar o pedido de oração. Tente novamente.");
    }
  };
  const finish = async () => {
    if (!user || !isCurrentDate || journalQuery.data?.completed) {
      closeReading();
      return;
    }
    const identity = activeIdentity;
    if (journalQuery.isSuccess) {
      const saved = await persistJournal();
      if (!saved || activeIdentityRef.current !== identity) return;
    }
    try {
      await complete.mutateAsync();
      if (activeIdentityRef.current === identity) setCompletionSavedKey(identity);
    } catch {
      // The mutation error is rendered below without interrupting reading.
    }
  };

  const routineLabel = isNight ? "Boa Noite com Deus" : "Bom Dia com Deus";
  const title = routineLabel;
  const theme = isNight
    ? { bg: "#172328", ink: "#f1e9d9", muted: "#b8b7ad", accent: "#c6ae72", panel: "#202f33", line: "rgba(241,233,217,.13)" }
    : { bg: "#f2e7ce", ink: "#342e24", muted: "#756b59", accent: "#8c6c36", panel: "#f8efd9", line: "rgba(73,57,35,.18)" };
  const alreadyComplete = !!journalQuery.data?.completed;
  const completionRecorded = alreadyComplete || completionSavedKey === activeIdentity;

  const heading = (kicker: string, headline: string, copy?: string) => (
    <div className="mb-8">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[.2em]" style={{ color: theme.accent }}>{kicker}</p>
      <h2 className="font-serif text-4xl leading-[1.12] sm:text-5xl" style={{ color: theme.ink }}>{headline}</h2>
      {copy && <p className="mt-4 max-w-xl text-base leading-7" style={{ color: theme.muted }}>{copy}</p>}
    </div>
  );
  const field = (label: string, value: string, setter: (value: string) => void, placeholder: string) => (
    <label className="block">
      <span className="mb-3 block text-sm font-medium" style={{ color: theme.ink }}>{label}</span>
      <Textarea value={value} onChange={(event) => { setter(event.target.value); setSavedOnce(false); }}
        placeholder={placeholder} rows={5}
        className="resize-none rounded-2xl border-0 px-4 py-4 text-base leading-7 shadow-none focus-visible:ring-2"
        style={{ background: theme.panel, color: theme.ink }} />
    </label>
  );

  const renderStep = (data: DevotionalMoment) => {
    if (step === 0 && !isNight) return (
      <div>
        {heading("A Palavra", data.title, "Leia sem pressa. A Bíblia é o centro deste momento; a Mel apenas acompanha você.")}
        <article className="relative rounded-[2rem] px-6 py-8 sm:px-10 sm:py-12" style={{ background: theme.panel }}>
          <div className="mb-5 flex items-center justify-between gap-4">
            <p className="font-serif text-xl" style={{ color: theme.accent }}>{data.verse.reference}</p>
            <span className="text-xs font-medium tracking-wide" style={{ color: theme.muted }}>{data.verse.versionCode || version}</span>
          </div>
          <blockquote className="font-serif text-[1.8rem] leading-[1.5] sm:text-[2.5rem]" style={{ color: theme.ink }}>
            “{data.verse.text}”
          </blockquote>
          <Button type="button" variant="ghost" size="sm" onClick={() => setSharePickerOpen(true)} className="mt-8 min-h-11 gap-2 px-0 hover:bg-transparent" style={{ color: theme.accent }}>
            <Share2 className="h-4 w-4" /> Compartilhar este versículo
          </Button>
          {shareError && <p role="alert" className="mt-2 text-sm">{shareError}</p>}
        </article>
      </div>
    );
    if (step === 0 && isNight) return (
      <div>
        {heading("Leitura da noite", data.nightReading?.title || data.title, "Um trecho breve para encerrar o dia na presença de Deus.")}
        <article className="rounded-[2rem] px-6 py-8 sm:px-10 sm:py-12" style={{ background: theme.panel }}>
          <p className="whitespace-pre-line font-serif text-2xl leading-[1.7] sm:text-3xl" style={{ color: theme.ink }}>
            {data.nightReading?.text || data.verse.text}
          </p>
          {(data.nightReading?.reference || data.verse.reference) && <p className="mt-7 text-sm font-medium" style={{ color: theme.accent }}>{data.nightReading?.reference || data.verse.reference}</p>}
        </article>
        <Button type="button" variant="ghost" onClick={() => setSharePickerOpen(true)} className="mt-5 min-h-11 gap-2 px-0 hover:bg-transparent" style={{ color: theme.accent }}>
          <Share2 className="h-4 w-4" /> Compartilhar um versículo
        </Button>
        {shareError && <p role="alert" className="mt-2 text-sm">{shareError}</p>}
      </div>
    );
    const morningStep = step - 1;
    if (!isNight && morningStep === 0) return <div>{heading("Para guardar", "O que essa Palavra revela?", data.reflection)}</div>;
    if (!isNight && morningStep === 1) return (
      <div>{heading("Uma palavra de raiz", "Volte ao sentido original.", "Uma nota de estudo, a serviço da leitura bíblica — não acima dela.")}
        {data.root ? <div className="rounded-[2rem] p-7 sm:p-9" style={{ background: theme.panel }}>
          <div className="flex items-start justify-between gap-4">
            <div><p className="font-serif text-4xl" style={{ color: theme.ink }}>{data.root.lemma}</p><p className="mt-2 text-sm italic" style={{ color: theme.muted }}>{data.root.transliteration}</p></div>
            <span className="rounded-full border px-3 py-1 font-mono text-xs" style={{ borderColor: theme.line, color: theme.accent }}>{data.root.strongNumber}</span>
          </div>
          <p className="mt-6 font-serif text-2xl leading-relaxed" style={{ color: theme.ink }}>{data.root.meaning}</p>
          <Button variant="ghost" className="mt-5 min-h-11 px-0 hover:bg-transparent" style={{ color: theme.accent }} onClick={() => setStrongOpen(true)}>Consultar entrada completa</Button>
          {strongOpen && <StrongModal strongNumber={data.root.strongNumber} onClose={() => setStrongOpen(false)} onNavigateToSubscriptions={onNavigateToSubscriptions} />}
        </div> : <p className="rounded-2xl p-5 text-sm leading-6" style={{ background: theme.panel, color: theme.muted }}>A raiz original não está disponível para este trecho. A leitura bíblica permanece completa.</p>}
      </div>
    );
    if (!isNight && morningStep === 2) return <div>{heading("Um passo possível", "Leve a Palavra para o seu dia.", data.action)}
      <p className="mt-8 text-sm" style={{ color: theme.muted }}>A prática é um convite. Você pode seguir adiante sem marcar como realizada.</p>
    </div>;
    if (!isNight && morningStep === 3) return <div>{heading("Oração", "Fale com Deus com suas próprias palavras.", data.prayer)}
      <Button onClick={startPrayer} disabled={createPrayer.isPending} variant="outline" className="mt-7 min-h-12 rounded-full px-5" style={{ borderColor: theme.line, color: theme.ink }}>{createPrayer.isPending ? "Preparando..." : "Levar este momento ao Modo Oração"}</Button>
    </div>;
    if (!isNight && morningStep === 4) return <div>{heading("Uma pergunta para você", data.question)}
      {user ? field("Seu registro, se desejar", answer, setAnswer, "Escreva livremente. Este espaço é seu.") : <div className="rounded-2xl p-5" style={{ background: theme.panel }}><p className="text-sm leading-6" style={{ color: theme.muted }}>Você pode refletir sem entrar. Para guardar sua resposta, entre na sua conta.</p><Button variant="ghost" onClick={onSignIn} className="mt-2 min-h-11 px-0" style={{ color: theme.accent }}>Entrar para salvar</Button></div>}
      </div>;
    if (isNight && step === 1) return <div>{heading("Gratidão", "Pelo que você agradece hoje?")}{user ? field("Registre se desejar", gratitude, setGratitude, "Uma coisa pequena também merece ser lembrada.") : field("Seu registro", gratitude, setGratitude, "Sua resposta fica apenas nesta tela.")}</div>;
    if (isNight && step === 2) return <div>{heading("Entrega", "O que você pode confiar a Deus nesta noite?")}{user ? field("Registre se desejar", surrender, setSurrender, "Deixe aqui o que pesa ou preocupa.") : field("Seu registro", surrender, setSurrender, "Sua resposta fica apenas nesta tela.")}</div>;
    if (isNight && step === 3) return <div>{heading("Perdão", "Há algo que você gostaria de colocar diante de Deus?")}{user ? field("Registre se desejar", forgiveness, setForgiveness, "Sem pressa, sem obrigação.") : field("Seu registro", forgiveness, setForgiveness, "Sua resposta fica apenas nesta tela.")}</div>;
    if (isNight && step === 4) return <div>{heading("A prática da manhã", "Como foi o passo que você escolheu?", data.morningAction)}
      <div className="mt-8 grid gap-3 sm:grid-cols-2"><button type="button" onClick={() => { setActionDone(true); setSavedOnce(false); }} aria-pressed={actionDone === true} className="min-h-14 rounded-2xl border px-5 text-left font-medium" style={{ borderColor: actionDone === true ? theme.accent : theme.line, color: theme.ink, background: actionDone === true ? `${theme.accent}22` : theme.panel }}>Sim</button><button type="button" onClick={() => { setActionDone(false); setSavedOnce(false); }} aria-pressed={actionDone === false} className="min-h-14 rounded-2xl border px-5 text-left font-medium" style={{ borderColor: actionDone === false ? theme.accent : theme.line, color: theme.ink, background: actionDone === false ? `${theme.accent}22` : theme.panel }}>Ainda não</button></div>
    </div>;
    if (isNight && step === 5) return <div>{heading("Oração", "Encerre o dia em oração.", data.prayer)}<Button onClick={startPrayer} disabled={createPrayer.isPending} variant="outline" className="mt-7 min-h-12 rounded-full px-5" style={{ borderColor: theme.line, color: theme.ink }}>{createPrayer.isPending ? "Preparando..." : "Levar este momento ao Modo Oração"}</Button></div>;
    return <div className="py-8 text-center">
      <MelMascot scene="complete" className="mx-auto mb-5 h-32 w-32" />
      <p className="mb-4 text-[11px] font-semibold uppercase tracking-[.2em]" style={{ color: theme.accent }}>Mel</p>
      <h2 className="mx-auto max-w-2xl font-serif text-4xl leading-tight sm:text-5xl" style={{ color: theme.ink }}>{completionRecorded ? "Que bom ter vivido este momento." : "Que a Palavra siga com você."}</h2>
      <p className="mx-auto mt-5 max-w-lg leading-7" style={{ color: theme.muted }}>Este espaço é só um apoio. Leve consigo o que leu na Bíblia e caminhe no seu tempo.</p>
      {user && <p className="mt-8 font-serif text-2xl" style={{ color: theme.accent }}>{completionSavedKey === activeIdentity ? complete.data?.status?.streak ?? status?.streak ?? 0 : status?.streak ?? 0} <span className="text-base">dias com Deus</span></p>}
      <Button onClick={() => setSharePickerOpen(true)} variant="ghost" className="mt-6 min-h-11 gap-2" style={{ color: theme.accent }}><Share2 className="h-4 w-4" /> Compartilhar o versículo</Button>
      {shareError && <p role="alert" className="text-sm">{shareError}</p>}
      {completionSavedKey === activeIdentity && <div className="mt-5"><MelCompletionNotice message="Que alegria ter vivido este momento com Deus." streak={complete.data?.status?.streak} /></div>}
      {user ? <div className="mt-5">
        {completionRecorded ? <><p className="inline-flex items-center gap-2 text-sm" style={{ color: theme.accent }}><Check className="h-4 w-4" /> Momento concluído</p><Button onClick={closeReading} variant="outline" className="mx-auto mt-4 block min-h-12 rounded-full px-7" style={{ borderColor: theme.line, color: theme.ink }}>Fechar leitura</Button></> : <Button onClick={finish} disabled={complete.isPending} className="min-h-12 rounded-full px-7" style={{ background: theme.accent, color: isNight ? "#172328" : "#fff" }}>{complete.isPending ? "Registrando..." : isCurrentDate ? "Concluir meu momento" : "Concluir leitura"}</Button>}
        {!isCurrentDate && <p className="mt-3 text-sm" style={{ color: theme.muted }}>Momentos de outra data podem ser lidos, mas não registrados como concluídos.</p>}
        {complete.isError && <p role="alert" className="mt-3 text-sm text-red-700">Não foi possível registrar. Tente novamente.</p>}
      </div> : <div className="mt-5"><Button onClick={finish} className="min-h-12 rounded-full px-7" style={{ background: theme.accent, color: isNight ? "#172328" : "#fff" }}>Concluir leitura</Button><Button variant="outline" onClick={onSignIn} className="mx-auto mt-3 block min-h-12 rounded-full px-6" style={{ borderColor: theme.line, color: theme.ink }}>Entre para guardar seu progresso</Button></div>}
    </div>;
  };

  return (
    <main className="min-h-[100dvh] overflow-hidden transition-colors duration-500" style={{ background: theme.bg, color: theme.ink, paddingTop: "var(--safe-area-inset-top,env(safe-area-inset-top,0px))", paddingBottom: "var(--safe-area-inset-bottom,env(safe-area-inset-bottom,0px))" }} data-testid="devotional-screen" data-routine={routine}>
      <header className="mx-auto flex w-full max-w-4xl items-center justify-between px-4 py-4 sm:px-8">
        <Button variant="ghost" size="icon" onClick={closeReading} aria-label="Fechar devocional" className="h-11 w-11 rounded-full" style={{ color: theme.ink }}><X className="h-5 w-5" /></Button>
        <div className="text-center">
          <p className="font-serif text-lg">{routineLabel}</p>
          <p className="mt-0.5 text-xs" style={{ color: theme.muted }}>{new Date(`${readingDate}T12:00:00`).toLocaleDateString("pt-BR", { dateStyle: "long" })} · {isNight ? "À noite" : "Pela manhã"}</p>
        </div>
        <div className="flex items-center gap-2">
          {isNight ? <Moon className="h-4 w-4" style={{ color: theme.accent }} /> : <Sun className="h-4 w-4" style={{ color: theme.accent }} />}
          <span className="hidden text-xs sm:inline" style={{ color: theme.muted }}>{isNight ? "3 min" : "5 min"}</span>
        </div>
      </header>
      <div className="mx-auto max-w-4xl px-4 pb-8 sm:px-8">
        {version !== preferredVersion && <p className="mb-4 text-center text-xs" style={{ color: theme.muted }}>
          Este momento está em {version}. Sua preferência por {preferredVersion} não foi alterada.
        </p>}
        <div className="mb-8" aria-label={`Etapa ${step + 1} de ${steps.length}`}>
          <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-[.14em]" style={{ color: theme.muted }}>
            <span>{step + 1} / {steps.length} · {steps[step]}</span><span>{Math.round(((step + 1) / steps.length) * 100)}%</span>
          </div>
          <div className="h-[2px] w-full overflow-hidden" style={{ background: theme.line }}>
            <div className="h-full transition-[width] duration-300" style={{ width: `${((step + 1) / steps.length) * 100}%`, background: theme.accent }} />
          </div>
        </div>
        {!moment && momentQuery.isLoading ? <div className="space-y-5 py-12" role="status" aria-label="Carregando momento"><Skeleton className="h-5 w-28" /><Skeleton className="h-12 w-3/4" /><Skeleton className="h-48 w-full rounded-[2rem]" /></div>
          : momentQuery.isError || !moment ? <div className="rounded-3xl border p-7" style={{ borderColor: theme.line }}>
            <BookOpen className="mb-5 h-6 w-6" style={{ color: theme.accent }} /><h2 className="font-serif text-3xl">Não foi possível carregar este momento.</h2>
            <p className="mt-3 text-sm leading-6" style={{ color: theme.muted }}>
              {momentQuery.error?.message.includes("versão escolhida")
                ? `O trecho não está disponível em ${version}. Não trocaremos sua versão sem sua escolha.`
                : "Verifique sua conexão e tente novamente. Não inventaremos o texto bíblico."}
            </p>
            <Button onClick={() => momentQuery.refetch()} className="mt-5 min-h-11">Tentar novamente</Button>
            {version !== "ACF" && momentQuery.error?.message.includes("versão escolhida") &&
              <Button variant="outline" onClick={() => setVersion("ACF")} className="ml-2 mt-5 min-h-11">Ler em ACF neste momento</Button>}
          </div> : <div onTouchStart={(event) => { touchStart.current = { x: event.touches[0]?.clientX ?? 0, y: event.touches[0]?.clientY ?? 0 }; }} onTouchEnd={(event) => {
            if (touchStart.current === null) return;
            const deltaX = (event.changedTouches[0]?.clientX ?? touchStart.current.x) - touchStart.current.x;
            const deltaY = (event.changedTouches[0]?.clientY ?? touchStart.current.y) - touchStart.current.y;
            if (Math.abs(deltaX) > 65 && Math.abs(deltaX) > Math.abs(deltaY) * 1.35) {
              if (deltaX < 0) void advance();
              if (deltaX > 0) goTo(step - 1);
            }
            touchStart.current = null;
          }} className="min-h-[54vh] animate-in fade-in duration-300" key={`${readingDate}-${routine}-${step}`}>
            {step === 0 && <div className="mb-7 flex items-center gap-3" style={{ color: theme.muted }}><MelMascot scene={isNight ? "sleeping" : "morning"} className="h-16 w-16 shrink-0" /><p className="text-sm">{title}</p></div>}
            {renderStep(moment)}
            {journalError && <p role="alert" className="mt-5 text-sm text-red-700">{journalError}</p>}
            {user && (answer || gratitude || surrender || forgiveness || actionDone !== null) && <div className="mt-5 flex items-center gap-2 text-xs" style={{ color: theme.muted }}>
              <Button variant="ghost" size="sm" onClick={() => void persistJournal()} disabled={saveJournal.isPending} className="min-h-10 px-2" style={{ color: theme.accent }}>{saveJournal.isPending ? "Salvando..." : "Salvar registro"}</Button>
              <span>{savedOnce && !saveJournal.isPending ? "Salvo na sua conta" : "Ainda não salvo"}</span>
            </div>}
            {!user && <p className="mt-4 text-center text-xs" style={{ color: theme.muted }}>{step === 0 || step === steps.length - 1 ? "Leitura gratuita. Seu registro pessoal não é salvo neste dispositivo." : "Este registro fica apenas enquanto esta tela estiver aberta."}</p>}
          </div>}
        <footer className="mt-10 flex items-center justify-between border-t pt-4" style={{ borderColor: theme.line }}>
          <Button variant="ghost" onClick={() => goTo(step - 1)} disabled={step === 0} className="min-h-11 gap-2 px-2" style={{ color: theme.ink }}><ChevronLeft className="h-4 w-4" /> Anterior</Button>
          <div className="flex gap-1.5" aria-hidden="true">{steps.map((entry, index) => <span key={entry} className="h-1.5 rounded-full transition-all" style={{ width: index === step ? 20 : 6, background: index <= step ? theme.accent : theme.line }} />)}</div>
          <Button variant="ghost" onClick={() => void advance()} disabled={step === steps.length - 1 || !moment} className="min-h-11 gap-2 px-2" style={{ color: theme.ink }}>Continuar <ChevronRight className="h-4 w-4" /></Button>
        </footer>
        {user && journalQuery.isError && <p role="alert" className="mt-3 text-center text-xs" style={{ color: theme.muted }}>Não foi possível carregar seu registro. Você ainda pode seguir com a leitura.</p>}
      </div>
      {sharePickerOpen && <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/45 p-3 sm:items-center" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSharePickerOpen(false); }}>
        <section role="dialog" aria-modal="true" aria-labelledby="share-format-title" className="w-full max-w-md rounded-3xl p-5 shadow-2xl sm:p-6" style={{ background: theme.panel, color: theme.ink }}>
          <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-semibold uppercase tracking-[.18em]" style={{ color: theme.accent }}>Imagem para compartilhar</p><h2 id="share-format-title" className="mt-1 font-serif text-2xl">Escolha o formato</h2></div><Button variant="ghost" size="icon" aria-label="Fechar opções de compartilhamento" onClick={() => setSharePickerOpen(false)}><X className="h-4 w-4" /></Button></div>
          <p className="mt-2 text-sm leading-6" style={{ color: theme.muted }}>O versículo, a referência e a assinatura do app estarão na imagem.</p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <Button variant="outline" className="min-h-14 whitespace-normal" style={{ borderColor: theme.line, color: theme.ink }} onClick={() => void share(false)}>Retrato<br />1080 × 1920</Button>
            <Button variant="outline" className="min-h-14 whitespace-normal" style={{ borderColor: theme.line, color: theme.ink }} onClick={() => void share(true)}>Quadrado<br />1080 × 1080</Button>
          </div>
        </section>
      </div>}
    </main>
  );
}