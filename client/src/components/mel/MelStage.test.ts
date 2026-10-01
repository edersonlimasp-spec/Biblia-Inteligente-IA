import { act, createElement, StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  dispatchMelCelebration,
  MEL_VISIBILITY_KEY,
  requestMelInteraction,
  setMelVisibility,
} from "@/hooks/useMelVisibility";

const melMock = vi.hoisted(() => ({
  value: {
    status: undefined as any,
    isLoading: false,
    error: undefined as any,
    today: "2025-05-12",
    userId: undefined as string | undefined,
    refresh: vi.fn(),
  },
}));

vi.mock("@/hooks/useMel", () => ({ useMel: () => melMock.value }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: null }) }));

import { MelStage } from "./MelStage";
import { MelCard } from "./MelCard";

let root: Root | undefined;
let host: HTMLDivElement | undefined;

interface RenderOptions {
  strict?: boolean;
  includeCard?: boolean;
}

function renderStage(screen = "bible", options: RenderOptions = {}) {
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  const onContinue = vi.fn();
  const onOpenDevotional = vi.fn();
  const render = (currentScreen: string) => {
    const stage = createElement(MelStage, { currentScreen, onContinue, onOpenDevotional });
    const app = options.includeCard
      ? createElement("div", null,
          createElement(MelCard, { onContinue, onOpenDevotional }),
          stage)
      : stage;
    return options.strict ? createElement(StrictMode, null, app) : app;
  };
  const rerender = (nextScreen = screen) => act(() => root?.render(render(nextScreen)));
  rerender();
  return { rerender, onContinue, onOpenDevotional };
}

afterEach(() => {
  act(() => root?.unmount());
  root = undefined;
  host?.remove();
  host = undefined;
  melMock.value = {
    status: undefined as any,
    isLoading: false,
    error: undefined as any,
    today: "2025-05-12",
    userId: undefined as string | undefined,
    refresh: vi.fn(),
  };
  localStorage.removeItem(MEL_VISIBILITY_KEY);
  setMelVisibility(true);
  localStorage.removeItem(MEL_VISIBILITY_KEY);
  vi.unstubAllGlobals();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("MelStage visual behavior", () => {
  it("shows the automatic startup at most once across StrictMode and rerenders, including guest query loading", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-05-12T13:00:00.000Z")); // 10:00 in São Paulo
    melMock.value = { ...melMock.value, isLoading: true };
    const { rerender } = renderStage("dashboard", { strict: true });
    expect(host?.querySelector('[role="dialog"] [data-scene="morning"]')).not.toBeNull();

    act(() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })));
    rerender("dashboard");
    expect(host?.querySelector('[role="dialog"]')).toBeNull();

    act(() => root?.render(null));
    rerender("dashboard");
    expect(host?.querySelector('[role="dialog"]')).toBeNull();
  });

  it("shows lesson celebrations and retains them through automatic navigation to dashboard", () => {
    const { rerender, onContinue } = renderStage("lesson");
    act(() => dispatchMelCelebration("Que alegria pelo estudo de hoje!", 7));
    expect(host?.querySelector('[role="dialog"] [data-scene="milestone"]')).not.toBeNull();
    expect(host?.querySelector(".mel-stage__milestone")?.textContent).toContain("7 dias");

    rerender("dashboard");
    expect(host?.querySelector('[role="dialog"] [data-scene="milestone"]')).not.toBeNull();
    const action = host?.querySelector<HTMLButtonElement>('[data-testid="mel-stage-action"]');
    expect(action?.textContent).toContain("Continuar leitura");
    act(() => action?.click());
    expect(host?.querySelector('[role="dialog"]')).toBeNull();
    expect(onContinue).not.toHaveBeenCalled();
  });

  it("lets the user repeatedly tap the mascot for a fresh squash and greeting", () => {
    renderStage("prayer");
    act(() => requestMelInteraction());
    const mascotButton = host?.querySelector<HTMLButtonElement>('[data-testid="mel-stage-mascot"]');
    expect(mascotButton?.querySelector('[data-scene="praying"]')).not.toBeNull();
    expect(mascotButton?.getAttribute("data-interaction-revision")).toBe("1");
    expect(host?.querySelector(".mel-stage__bleat")?.textContent).toBe("Bééé!");

    act(() => mascotButton?.click());
    expect(mascotButton?.getAttribute("data-interaction-revision")).toBe("2");
    expect(mascotButton?.querySelector(".mel-mascot--interaction")).not.toBeNull();
    act(() => mascotButton?.click());
    expect(mascotButton?.getAttribute("data-interaction-revision")).toBe("3");
    expect(host?.querySelector('[data-testid="mel-stage-action"]')?.textContent).toContain("Amém!");
  });

  it("closes with Escape or a backdrop click", () => {
    const rafQueue: FrameRequestCallback[] = [];
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      rafQueue.push(callback);
      return rafQueue.length;
    });
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    renderStage();
    act(() => requestMelInteraction());
    expect(host?.querySelector('[role="dialog"]')).not.toBeNull();
    act(() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })));
    expect(host?.querySelector('[role="dialog"]')).toBeNull();
    act(() => rafQueue.splice(0).forEach((callback) => callback(0)));
    expect(document.activeElement).toBe(host?.querySelector('[data-testid="mel-stage-companion"]'));

    act(() => requestMelInteraction());
    const backdrop = host?.querySelector<HTMLElement>(".mel-stage__backdrop");
    act(() => backdrop?.dispatchEvent(new MouseEvent("click", { bubbles: true })));
    expect(host?.querySelector('[role="dialog"]')).toBeNull();
    act(() => rafQueue.splice(0).forEach((callback) => callback(0)));
    expect(document.activeElement).toBe(host?.querySelector('[data-testid="mel-stage-companion"]'));
  });

  it("traps focus with Tab and restores it after closing with X", () => {
    const rafQueue: FrameRequestCallback[] = [];
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      rafQueue.push(callback);
      return rafQueue.length;
    });
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    renderStage();
    const companion = host?.querySelector<HTMLButtonElement>('[data-testid="mel-stage-companion"]');
    act(() => {
      companion?.focus();
      companion?.click();
    });

    const closeButton = host?.querySelector<HTMLButtonElement>('[aria-label="Fechar"]');
    expect(document.activeElement).toBe(closeButton);
    const focusables = Array.from(host?.querySelectorAll<HTMLElement>("[data-mel-dialog-focusable]") ?? []);
    const lastButton = focusables[focusables.length - 1];
    act(() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", shiftKey: true, bubbles: true })));
    expect(document.activeElement).toBe(lastButton);
    act(() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true })));
    expect(document.activeElement).toBe(closeButton);

    act(() => closeButton?.click());
    act(() => rafQueue.splice(0).forEach((callback) => callback(0)));
    expect(document.activeElement).toBe(host?.querySelector('[data-testid="mel-stage-companion"]'));
  });

  it("restores focus to the connected event opener when it is still present", () => {
    const rafQueue: FrameRequestCallback[] = [];
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      rafQueue.push(callback);
      return rafQueue.length;
    });
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    renderStage();
    const cardMascot = document.createElement("button");
    cardMascot.setAttribute("aria-label", "Conversar com a Mel");
    host?.prepend(cardMascot);

    act(() => {
      cardMascot.focus();
      requestMelInteraction();
    });
    expect(host?.querySelector('[role="dialog"]')).not.toBeNull();
    act(() => host?.querySelector<HTMLButtonElement>('[aria-label="Fechar"]')?.click());
    act(() => rafQueue.splice(0).forEach((callback) => callback(0)));
    expect(document.activeElement).toBe(cardMascot);
  });

  it("does not return focus to the previous screen after navigation closes an interaction", () => {
    const rafQueue: FrameRequestCallback[] = [];
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      rafQueue.push(callback);
      return rafQueue.length;
    });
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    const { rerender } = renderStage("lesson");
    const previousCompanion = host?.querySelector<HTMLButtonElement>('[data-testid="mel-stage-companion"]');
    act(() => {
      previousCompanion?.focus();
      previousCompanion?.click();
    });
    expect(host?.querySelector('[role="dialog"]')).not.toBeNull();

    rerender("dashboard");
    act(() => rafQueue.splice(0).forEach((callback) => callback(0)));
    const nextCompanion = host?.querySelector<HTMLButtonElement>('[data-testid="mel-stage-companion"]');
    expect(nextCompanion).not.toBe(previousCompanion);
    expect(document.activeElement).toBe(nextCompanion);
  });

  it("uses a complete static message with reduced motion", () => {
    vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({
      matches: true,
      media: "(prefers-reduced-motion: reduce)",
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    renderStage("prayer");
    act(() => requestMelInteraction());
    const completeMessage = host?.querySelector("#mel-stage-description")?.textContent;
    expect(completeMessage).toContain("Estou aqui em oração");
    expect(host?.querySelector(".mel-stage__message")?.textContent).toBe(completeMessage);
  });

  it("hides only Mel visuals when disabled, preserving Phase1 card text and actions", () => {
    renderStage("bible", { includeCard: true });
    expect(host?.querySelector('[data-testid="button-mel-continue"]')).not.toBeNull();
    expect(host?.querySelector('[data-testid="button-mel-devotional"]')).not.toBeNull();
    expect(host?.querySelector('[data-testid="mel-stage-companion"]')).not.toBeNull();

    act(() => setMelVisibility(false));
    expect(host?.querySelector('[data-testid="mel-stage-companion"]')).toBeNull();
    expect(host?.querySelector('[data-testid="mel-stage-dialog"]')).toBeNull();
    expect(host?.querySelector('[aria-label="Conversar com a Mel"]')).toBeNull();
    expect(host?.querySelector('[data-testid="button-mel-continue"]')).not.toBeNull();
    expect(host?.querySelector('[data-testid="button-mel-devotional"]')).not.toBeNull();
    expect(host?.querySelector("#mel-card-title")?.textContent).toContain("Sua caminhada com a Mel");
  });

  it("does not resume an authenticated reader from a stale saved position", () => {
    const savedPosition = {
      kind: "bible" as const,
      book: "jhn",
      chapter: 3,
      verse: 16,
      versionCode: "ACF",
    };
    melMock.value = {
      ...melMock.value,
      status: { position: savedPosition, course: null, streak: 0, bestStreak: 0, completedToday: false, mood: "normal", lastActivityDate: null, activePlan: null, devotionalReadToday: false, today: "2025-05-12" },
      userId: "user-1",
      isLoading: false,
      error: undefined,
    };
    const { onContinue } = renderStage("bible");
    act(() => requestMelInteraction());
    const action = host?.querySelector<HTMLButtonElement>('[data-testid="mel-stage-action"]');
    expect(action?.textContent).toContain("Continuar leitura");
    expect(action?.disabled).toBe(false);
    act(() => action?.click());
    expect(onContinue).not.toHaveBeenCalled();
  });

  it("resumes a saved position from a non-reading screen only after status is ready", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-05-12T13:00:00.000Z"));
    const savedPosition = {
      kind: "devotional" as const,
      devotionalDate: "2025-05-12",
    };
    melMock.value = {
      ...melMock.value,
      status: {
        position: savedPosition,
        course: null,
        streak: 1,
        bestStreak: 1,
        completedToday: false,
        mood: "normal",
        lastActivityDate: "2025-05-11",
        activePlan: null,
        devotionalReadToday: false,
        today: "2025-05-12",
      },
      userId: "user-1",
      isLoading: false,
      error: undefined,
    };
    const { onContinue } = renderStage("settings");
    act(() => requestMelInteraction());
    const action = host?.querySelector<HTMLButtonElement>('[data-testid="mel-stage-action"]');
    expect(action?.disabled).toBe(false);
    act(() => action?.click());
    expect(onContinue).toHaveBeenCalledWith(savedPosition);
  });

  it("blocks authenticated resume while loading or errored and only offers a read-only retry", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-05-12T13:00:00.000Z"));
    const refresh = vi.fn();
    melMock.value = {
      ...melMock.value,
      status: undefined,
      userId: "user-1",
      isLoading: true,
      error: undefined,
      refresh,
    };
    const { rerender, onContinue } = renderStage("settings");
    act(() => requestMelInteraction());
    let action = host?.querySelector<HTMLButtonElement>('[data-testid="mel-stage-action"]');
    expect(action?.disabled).toBe(true);
    act(() => action?.click());
    expect(onContinue).not.toHaveBeenCalled();

    melMock.value = { ...melMock.value, isLoading: false, error: new Error("network unavailable") };
    rerender("settings");
    action = host?.querySelector<HTMLButtonElement>('[data-testid="mel-stage-action"]');
    expect(action?.disabled).toBe(true);
    expect(host?.querySelector('[role="alert"]')?.textContent).toContain("seu progresso não foi alterado");
    act(() => host?.querySelector<HTMLButtonElement>('[data-testid="mel-stage-retry"]')?.click());
    expect(refresh).toHaveBeenCalledTimes(1);
    act(() => action?.click());
    expect(onContinue).not.toHaveBeenCalled();
  });

  it("keeps the Bible and prayer companion scenes awake at night", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-05-12T07:00:00.000Z")); // 04:00 in São Paulo
    const { rerender } = renderStage("bible");
    let companion = host?.querySelector<HTMLButtonElement>('[data-testid="mel-stage-companion"]');
    expect(companion?.querySelector('[data-scene="reading"]')).not.toBeNull();
    expect(companion?.getAttribute("aria-label")).toContain("durante a leitura");

    rerender("prayer");
    companion = host?.querySelector<HTMLButtonElement>('[data-testid="mel-stage-companion"]');
    expect(companion?.querySelector('[data-scene="praying"]')).not.toBeNull();
    expect(companion?.getAttribute("aria-label")).toContain("em oração");
  });
});