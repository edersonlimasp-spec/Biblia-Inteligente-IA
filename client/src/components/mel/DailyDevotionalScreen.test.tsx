import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  user: null as { id: string } | null,
  save: vi.fn(async () => ({})),
  complete: vi.fn(async () => ({ completed: true })),
  position: vi.fn(async () => {}),
}));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: mocks.user }) }));
vi.mock("@/hooks/useMel", () => ({ useMel: () => ({ status: { streak: 3 }, savePosition: mocks.position, sessionGeneration: 0 }) }));
vi.mock("@/components/StrongModal", () => ({ StrongModal: () => null }));
vi.mock("@/components/mel/DevotionalShare", () => ({ shareDevotionalImage: vi.fn() }));
vi.mock("@/hooks/use-devotional", () => ({
  useDevotionalMoment: () => ({ data: {
    title: "Confie em Deus", verse: { reference: "Salmos 23:1", text: "O SENHOR é o meu pastor.", versionCode: "ACF" },
    reflection: "Uma reflexão.", action: "Um passo.", prayer: "Uma oração.", question: "Como foi seu dia?", root: null,
  }, isLoading: false, isError: false }),
  useDevotionalJournal: () => ({ data: { completed: false, answer: "", gratitude: "", surrender: "", forgiveness: "", actionDone: null }, isSuccess: true }),
  useSaveDevotionalJournal: () => ({ mutateAsync: mocks.save, isPending: false }),
  useCompleteDevotional: () => ({ mutateAsync: mocks.complete, isPending: false, isError: false }),
  useCreateDevotionalPrayer: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

import { DailyDevotionalScreen } from "./DailyDevotionalScreen";
import { isDevotionalInvitationClosed } from "@/hooks/useDevotionalInvitation";

let root: Root;
let host: HTMLDivElement;
const onBack = vi.fn();

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-02T12:00:00Z"));
  localStorage.clear();
  mocks.user = null;
  mocks.save.mockClear();
  mocks.complete.mockReset();
  mocks.complete.mockResolvedValue({ completed: true });
  onBack.mockClear();
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
  localStorage.clear();
  vi.useRealTimers();
});

function render() {
  act(() => root.render(<DailyDevotionalScreen onBack={onBack} />));
}
function button(label: string) {
  const found = Array.from(host.querySelectorAll("button")).find((element) => element.textContent?.trim() === label);
  if (!found) throw new Error(`Missing button: ${label}`);
  return found;
}
async function readToEnd() {
  for (let index = 0; index < 6; index++) {
    await act(async () => button("Continuar").click());
  }
}

describe("devotional reading close behavior", () => {
  it("allows X to close without saving a completion", () => {
    render();
    act(() => host.querySelector<HTMLButtonElement>('[aria-label="Fechar devocional"]')?.click());
    expect(onBack).toHaveBeenCalledOnce();
    expect(mocks.complete).not.toHaveBeenCalled();
    expect(mocks.save).not.toHaveBeenCalled();
    expect(isDevotionalInvitationClosed(undefined, "2026-10-02", "manha")).toBe(true);
  });

  it("lets a guest finish reading and hides the invitation without recording activity", async () => {
    render();
    await readToEnd();
    await act(async () => button("Concluir leitura").click());
    expect(onBack).toHaveBeenCalledOnce();
    expect(mocks.complete).not.toHaveBeenCalled();
    expect(mocks.save).not.toHaveBeenCalled();
    expect(isDevotionalInvitationClosed(undefined, "2026-10-02", "manha")).toBe(true);
  });

  it("preserves the Mel notice and automatically closes after a successful completion", async () => {
    mocks.user = { id: "reader-1" };
    render();
    await readToEnd();
    await act(async () => button("Concluir meu momento").click());
    expect(mocks.complete).toHaveBeenCalledOnce();
    expect(onBack).not.toHaveBeenCalled();
    expect(host.textContent).toContain("Que alegria ter vivido este momento com Deus.");
    expect(isDevotionalInvitationClosed("reader-1", "2026-10-02", "manha")).toBe(true);
    act(() => vi.advanceTimersByTime(2200));
    expect(onBack).toHaveBeenCalledOnce();
  });

  it("does not hide or close the reader when saving the completion fails", async () => {
    mocks.user = { id: "reader-2" };
    mocks.complete.mockRejectedValue(new Error("Network unavailable"));
    render();
    await readToEnd();
    await act(async () => button("Concluir meu momento").click());
    act(() => vi.advanceTimersByTime(2200));
    expect(onBack).not.toHaveBeenCalled();
    expect(isDevotionalInvitationClosed("reader-2", "2026-10-02", "manha")).toBe(false);
  });
});