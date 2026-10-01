import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import type { MelPosition } from "@shared/mel";
import { Button } from "@/components/ui/button";
import { useMel } from "@/hooks/useMel";
import {
  MEL_CELEBRATION_EVENT,
  MEL_INTERACTION_EVENT,
  useMelVisibility,
} from "@/hooks/useMelVisibility";
import {
  getMelContextScene,
  getMelStartupScene,
  getSaoPauloHour,
  isMelMilestone,
  isMelSleepingHour,
  claimMelStartupEntrance,
} from "@/lib/mel-visual";
import { MelMascot, type MelScene } from "@/components/mel/MelMascot";
import { getBookName } from "@/lib/bible-book-names";
import "./MelStage.css";

export interface MelStageProps {
  currentScreen: string;
  onContinue: (position: MelPosition) => void;
  onOpenDevotional: (date: string) => void;
}

type StagePresentation = {
  id: number;
  scene: MelScene;
  source: "startup" | "interaction" | "celebration";
  message?: string;
  streak?: number;
  tapRevision: number;
};

const stageMessages: Record<MelScene, string> = {
  idle: "Que a paz de Deus acompanhe seu dia. Estou aqui para caminhar com você na Palavra.",
  welcome: "A graça e a paz! Que bom ter você por aqui. Vamos caminhar na Palavra, um versículo de cada vez?",
  morning: "Bom dia! Que a Palavra ilumine seu dia. Vamos reservar alguns minutos para estar com Deus?",
  continue: "Vamos retomar com calma o seu encontro com a Palavra. Deus nos encontra em cada passo.",
  reading: "Estou aqui, em silêncio, acompanhando sua leitura. Que esta Palavra encontre morada no coração.",
  complete: "Que alegria por este tempo na Palavra. Que Deus fortaleça o que floresceu em você hoje.",
  milestone: "Que marco precioso! Cada dia de fidelidade é uma pequena semente de esperança.",
  saudade: "Bééé… senti sua falta. Sem pressa: que tal alguns minutos de reencontro com a Palavra?",
  sleeping: "A Mel está descansando agora. Que sua noite seja tranquila e guardada por Deus.",
  praying: "Estou aqui em oração com você. Que o Senhor ouça o que seu coração deseja entregar.",
  peeking: "Passando de mansinho para lembrar: Deus está perto, em cada detalhe do seu caminho.",
};

let nextStageId = 1;

function getFallbackPosition(status: ReturnType<typeof useMel>["status"]): MelPosition {
  if (status?.position) return status.position;
  if (status?.course) {
    return {
      kind: "lesson",
      lessonId: status.course.lessonId,
      moduleId: status.course.moduleId,
      trackLevel: status.course.trackLevel,
    };
  }
  return { kind: "bible", book: "psa", chapter: 23, verse: 1, versionCode: "ACF" };
}

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() =>
    typeof window !== "undefined" && typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false,
  );
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener?.("change", update);
    return () => query.removeEventListener?.("change", update);
  }, []);
  return reduced;
}

export function MelStage({ currentScreen, onContinue, onOpenDevotional }: MelStageProps) {
  const { status, isLoading, error, today, userId, refresh } = useMel();
  const { enabled } = useMelVisibility();
  const reducedMotion = useReducedMotion();
  const [hour, setHour] = useState(getSaoPauloHour);
  const [presentation, setPresentation] = useState<StagePresentation | null>(null);
  const [typedMessage, setTypedMessage] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);
  const companionRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<{ element: HTMLElement; screen: string } | null>(null);
  const currentScreenRef = useRef(currentScreen);
  const focusRestoreFrameRef = useRef<{ id: number; animationFrame: boolean } | null>(null);
  const previousScreenRef = useRef(currentScreen);
  const previousUserRef = useRef(userId);
  currentScreenRef.current = currentScreen;
  const contextScene = getMelContextScene(currentScreen);
  const sleeping = isMelSleepingHour(hour);
  const usableStatus = status
    ? {
        ...status,
        completedToday: status.today === today && status.completedToday,
        mood: status.today === today ? status.mood : "normal" as const,
      }
    : undefined;

  const rememberOpener = useCallback((element: EventTarget | null) => {
    if (
      typeof HTMLElement !== "undefined"
      && element instanceof HTMLElement
      && element !== document.body
      && element !== document.documentElement
      && element.matches('button, a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])')
    ) {
      openerRef.current = { element, screen: currentScreen };
    } else {
      openerRef.current = null;
    }
  }, [currentScreen]);

  useEffect(() => {
    const updateHour = () => {
      if (document.visibilityState === "visible") setHour(getSaoPauloHour());
    };
    const timer = window.setInterval(updateHour, 60_000);
    document.addEventListener("visibilitychange", updateHour);
    window.addEventListener("focus", updateHour);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", updateHour);
      window.removeEventListener("focus", updateHour);
    };
  }, []);

  useEffect(() => {
    if (previousScreenRef.current === currentScreen) return;
    previousScreenRef.current = currentScreen;
    setPresentation((current) => current?.source === "celebration" ? current : null);
  }, [currentScreen]);

  useEffect(() => {
    if (previousUserRef.current !== userId) {
      previousUserRef.current = userId;
      setPresentation(null);
    }
  }, [userId]);

  useEffect(() => {
    if (!enabled) {
      setPresentation(null);
      return;
    }
    if (currentScreen !== "dashboard" || (userId && (isLoading || error || !status))) return;
    if (!claimMelStartupEntrance()) return;
    const scene = getMelStartupScene(usableStatus, today, hour);
    if (scene !== "sleeping") {
      rememberOpener(document.activeElement);
      setPresentation((current) => current?.source === "celebration"
        ? current
        : { id: nextStageId++, scene, source: "startup", tapRevision: 0 });
    }
  }, [currentScreen, enabled, error, hour, isLoading, rememberOpener, status, today, usableStatus, userId]);

  const closeStage = useCallback(() => setPresentation(null), []);

  useLayoutEffect(() => {
    if (!enabled || !contextScene) return;
    const interactiveScene: MelScene = sleeping && contextScene !== "reading" && contextScene !== "praying"
      ? "sleeping"
      : contextScene;
    const openInteractiveStage = (event: Event) => {
      const opener = (event as CustomEvent<{ opener?: EventTarget | null }>).detail?.opener;
      rememberOpener(opener ?? document.activeElement);
      setPresentation({
        id: nextStageId++,
        scene: interactiveScene,
        source: "interaction",
        tapRevision: 1,
      });
    };
    const celebrate = (event: Event) => {
      const { message, streak } = (event as CustomEvent<{ message: string; streak?: number }>).detail ?? {};
      const milestone = isMelMilestone(streak);
      rememberOpener(document.activeElement);
      setPresentation({
        id: nextStageId++,
        scene: milestone ? "milestone" : "complete",
        source: "celebration",
        message: message || stageMessages[milestone ? "milestone" : "complete"],
        streak,
        tapRevision: 0,
      });
    };
    window.addEventListener(MEL_INTERACTION_EVENT, openInteractiveStage);
    window.addEventListener(MEL_CELEBRATION_EVENT, celebrate);
    return () => {
      window.removeEventListener(MEL_INTERACTION_EVENT, openInteractiveStage);
      window.removeEventListener(MEL_CELEBRATION_EVENT, celebrate);
    };
  }, [contextScene, enabled, rememberOpener, sleeping]);

  const fullMessage = presentation?.message ?? (presentation ? stageMessages[presentation.scene] : "");
  useEffect(() => {
    if (!presentation) {
      setTypedMessage("");
      return;
    }
    if (reducedMotion) {
      setTypedMessage(fullMessage);
      return;
    }
    let index = 0;
    setTypedMessage("");
    const timer = window.setInterval(() => {
      index += 1;
      setTypedMessage(fullMessage.slice(0, index));
      if (index >= fullMessage.length) window.clearInterval(timer);
    }, 28);
    return () => window.clearInterval(timer);
  }, [fullMessage, presentation?.id, reducedMotion]);

  useEffect(() => {
    if (!presentation || !enabled || !contextScene) return;
    if (focusRestoreFrameRef.current) {
      const pending = focusRestoreFrameRef.current;
      if (pending.animationFrame) window.cancelAnimationFrame(pending.id);
      else window.clearTimeout(pending.id);
      focusRestoreFrameRef.current = null;
    }
    const dialog = dialogRef.current;
    if (!dialog) return;
    const focusable = () => Array.from(dialog.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ));
    focusable()[0]?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeStage();
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusable();
      if (!items.length) {
        event.preventDefault();
        dialog.focus();
      } else if (event.shiftKey && document.activeElement === items[0]) {
        event.preventDefault();
        items[items.length - 1].focus();
      } else if (!event.shiftKey && document.activeElement === items[items.length - 1]) {
        event.preventDefault();
        items[0].focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      const restoreFocus = () => {
        focusRestoreFrameRef.current = null;
        const opener = openerRef.current;
        const sameScreenOpener = opener?.screen === currentScreenRef.current
          && opener.element.isConnected
          && !opener.element.closest("[hidden], [aria-hidden='true']");
        const target = sameScreenOpener ? opener.element : companionRef.current;
        if (target?.isConnected && !target.closest("[hidden], [aria-hidden='true']")) target.focus();
        openerRef.current = null;
      };
      if (typeof window.requestAnimationFrame === "function") {
        const id = window.requestAnimationFrame(restoreFocus);
        focusRestoreFrameRef.current = { id, animationFrame: true };
      } else {
        const id = window.setTimeout(restoreFocus, 0);
        focusRestoreFrameRef.current = { id, animationFrame: false };
      }
    };
  }, [closeStage, contextScene, enabled, presentation?.id]);

  if (!enabled || !contextScene) return null;

  const currentStageScene = presentation?.scene
    ?? (sleeping && contextScene !== "reading" && contextScene !== "praying" ? "sleeping" : contextScene);
  const prayerContext = currentScreen === "prayer" || currentScreen === "mel-devotional";
  const sleepContext = (sleeping && (!presentation || presentation.scene === "sleeping"))
    || presentation?.scene === "sleeping";
  const isCelebration = presentation?.source === "celebration";
  const actionLabel = isCelebration
    ? "Continuar leitura"
    : prayerContext || presentation?.scene === "praying"
      ? "Amém!"
      : sleepContext
        ? "Boa noite!"
        : presentation?.scene === "morning" || presentation?.scene === "welcome"
          ? "Ler agora"
          : presentation?.scene === "saudade"
            ? "Voltar a ler"
            : "Continuar leitura";
  const interactiveAction = !prayerContext && !sleepContext && !isCelebration;
  const mayResumeFromStage = interactiveAction && currentScreen !== "bible";
  const authenticatedResumeBlocked = mayResumeFromStage && !!userId && (isLoading || !!error || !status);
  const shouldNavigateToContinuation = mayResumeFromStage && !authenticatedResumeBlocked;
  const reference = usableStatus?.position?.kind === "bible"
    ? `${getBookName(usableStatus.position.book, "pt")} ${usableStatus.position.chapter}:${usableStatus.position.verse}`
    : "Salmos 23";

  return (
    <>
      {!presentation && currentScreen !== "bible" && currentScreen !== "library-reader" && (
        <button
          type="button"
          className="mel-stage__companion"
          ref={companionRef}
          aria-label={currentStageScene === "sleeping"
            ? "Mel está dormindo. Toque para interagir"
            : currentStageScene === "reading"
              ? "Interagir com a Mel durante a leitura"
              : currentStageScene === "praying"
                ? "Interagir com a Mel em oração"
                : "Interagir com a Mel"}
          onClick={() => {
            if (!enabled) return;
            rememberOpener(companionRef.current);
            setPresentation({
              id: nextStageId++,
              scene: sleeping && contextScene !== "reading" && contextScene !== "praying" ? "sleeping" : contextScene,
              source: "interaction",
              tapRevision: 1,
            });
          }}
          data-testid="mel-stage-companion"
        >
          <MelMascot
            scene={currentStageScene}
            reference={reference}
            milestone={usableStatus?.streak ?? 0}
            interaction={false}
            className="mel-stage__companion-art"
          />
        </button>
      )}

      {presentation && (
        <div
          className="mel-stage__backdrop"
          onClick={(event) => {
            if (event.target === event.currentTarget) closeStage();
          }}
          data-testid="mel-stage-backdrop"
        >
          <section
            ref={dialogRef}
            className="mel-stage__dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mel-stage-title"
            aria-describedby="mel-stage-description"
            tabIndex={-1}
            data-testid="mel-stage-dialog"
          >
            <button
              type="button"
              className="mel-stage__close"
              aria-label="Fechar"
              onClick={closeStage}
              data-mel-dialog-focusable
            >
              <X aria-hidden="true" />
            </button>
            <div className="mel-stage__art-wrap">
              <button
                type="button"
                className="mel-stage__art-button"
                aria-label="Fazer carinho na Mel"
                aria-describedby="mel-stage-description"
                data-testid="mel-stage-mascot"
                data-interaction-revision={presentation.tapRevision}
                onClick={() => setPresentation((current) => current
                  ? { ...current, tapRevision: current.tapRevision + 1 }
                  : current)}
              >
                <MelMascot
                  key={`${presentation.id}-${presentation.tapRevision}`}
                  scene={presentation.scene}
                  reference={reference}
                  milestone={presentation.streak ?? usableStatus?.streak ?? 0}
                  interaction={presentation.tapRevision > 0}
                  className="mel-stage__art"
                />
              </button>
            </div>
            <div className="mel-stage__copy">
              <p className="mel-stage__eyebrow" id="mel-stage-title">
                {presentation.source === "celebration"
                  ? isMelMilestone(presentation.streak) ? "Um marco na caminhada" : "Que alegria!"
                  : presentation.source === "interaction" ? "A Mel chegou pertinho" : "Um momento com a Mel"}
              </p>
              {presentation.tapRevision > 0 && <p className="mel-stage__bleat" aria-hidden="true">Bééé!</p>}
              {presentation.scene === "milestone" && presentation.streak && (
                <p className="mel-stage__milestone">{presentation.streak} dias caminhando na Palavra</p>
              )}
              <div className="mel-stage__speech-bubble">
                <p className="mel-stage__message" aria-hidden="true">{typedMessage}</p>
              </div>
              <span id="mel-stage-description" className="mel-stage__visually-hidden">{fullMessage}</span>
              <div className="mel-stage__actions">
                <Button
                  type="button"
                  className="min-h-11"
                  disabled={authenticatedResumeBlocked}
                  onClick={() => {
                    closeStage();
                    if (shouldNavigateToContinuation) onContinue(getFallbackPosition(usableStatus));
                  }}
                  data-mel-dialog-focusable
                  data-testid="mel-stage-action"
                >
                  {actionLabel}
                </Button>
                {!prayerContext && !sleepContext && !isCelebration && (
                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-11"
                    onClick={() => {
                      closeStage();
                      onOpenDevotional(today);
                    }}
                    data-mel-dialog-focusable
                  >
                    Devocional do dia
                  </Button>
                )}
              </div>
              {userId && isLoading && (
                <p className="mt-3 text-sm text-muted-foreground" role="status">Carregando sua caminhada com a Mel…</p>
              )}
              {userId && !isLoading && !status && !error && (
                <p className="mt-3 text-sm text-muted-foreground" role="status">Sua caminhada ainda está carregando…</p>
              )}
              {userId && error && (
                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-destructive" role="alert">
                  <span>Não foi possível carregar sua caminhada; seu progresso não foi alterado.</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    data-testid="mel-stage-retry"
                    onClick={() => void refresh()}
                  >
                    Tentar novamente
                  </Button>
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </>
  );
}