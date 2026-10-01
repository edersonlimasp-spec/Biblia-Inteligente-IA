import { act, createElement, Fragment, StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MEL_VISIBILITY_KEY, setMelVisibility } from "@/hooks/useMelVisibility";

vi.mock("@/hooks/useMel", () => ({
  useMel: () => ({
    status: undefined,
    isLoading: false,
    error: undefined,
    today: "2025-05-12",
    userId: undefined,
    refresh: vi.fn(),
  }),
}));

import { MelCompletionNotice } from "./MelCard";
import { MelStage } from "./MelStage";

let root: Root | undefined;
let host: HTMLDivElement | undefined;

afterEach(() => {
  act(() => root?.unmount());
  root = undefined;
  host?.remove();
  host = undefined;
  localStorage.removeItem(MEL_VISIBILITY_KEY);
  setMelVisibility(true);
  localStorage.removeItem(MEL_VISIBILITY_KEY);
  vi.useRealTimers();
});

describe("Mel completion event lifecycle", () => {
  it("catches the real notice event on mount and preserves it through the 2.2s lesson navigation", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-05-12T13:00:00.000Z")); // 10:00 in São Paulo
    setMelVisibility(true);
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
    let celebrationEvents = 0;
    const onCelebration = () => { celebrationEvents += 1; };
    window.addEventListener("mel:celebrate", onCelebration);

    const onContinue = vi.fn();
    const onOpenDevotional = vi.fn();
    const render = (currentScreen: string) => createElement(
      StrictMode,
      null,
      createElement(Fragment, null,
        createElement(MelCompletionNotice, {
          message: "Que alegria pelo estudo de hoje!",
          streak: 7,
        }),
        createElement(MelStage, { currentScreen, onContinue, onOpenDevotional })),
    );
    act(() => root?.render(render("lesson")));

    expect(celebrationEvents).toBe(1);
    expect(host?.querySelector('[role="dialog"] [data-scene="milestone"]')).not.toBeNull();
    expect(host?.querySelector('[role="dialog"] .mel-stage__milestone')?.textContent).toContain("7 dias");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2_200);
      root?.render(render("dashboard"));
    });
    expect(host?.querySelector('[role="dialog"] [data-scene="milestone"]')).not.toBeNull();
    expect(host?.querySelector('[role="dialog"] .mel-stage__message')?.textContent).toContain("Que alegria");
    expect(onContinue).not.toHaveBeenCalled();
    expect(onOpenDevotional).not.toHaveBeenCalled();

    window.removeEventListener("mel:celebrate", onCelebration);
    const action = host?.querySelector<HTMLButtonElement>('[data-testid="mel-stage-action"]');
    expect(action?.textContent).toContain("Continuar leitura");
    act(() => action?.click());
    expect(host?.querySelector('[role="dialog"]')).toBeNull();
    expect(onContinue).not.toHaveBeenCalled();
    expect(onOpenDevotional).not.toHaveBeenCalled();
  });
});