import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const journal = vi.hoisted(() => ({ completed: false }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: null, isSuperAdmin: false }) }));
vi.mock("@/contexts/LanguageContext", () => ({ useLanguage: () => ({ t: (key: string) => key }) }));
vi.mock("@/hooks/use-device-id", () => ({ getDeviceId: () => "test-device" }));
vi.mock("@tanstack/react-query", () => ({ useQuery: () => ({ data: { hasPremium: true } }) }));
vi.mock("@/hooks/use-devotional", () => ({ useDevotionalJournal: () => ({ data: journal }) }));
vi.mock("@/components/LanguageSelector", () => ({ LanguageSelector: () => null }));
vi.mock("@/components/ui/scroll-area", () => ({ ScrollArea: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock("@/lib/tracking", () => ({ trackAppOpen: async () => {}, trackPageView: async () => {} }));

import { Dashboard } from "./Dashboard";

let root: Root;
let host: HTMLDivElement;
const onOpen = vi.fn();
const noop = () => {};
const props = {
  onNavigateToBible: noop, onNavigateToPrayer: noop, onNavigateToSubscriptions: noop,
  onNavigateToProfessor: noop, onNavigateToAIModes: noop, onNavigateToPlansProgress: noop,
  onNavigateToCalendar: noop, onNavigateToRecordings: noop, onNavigateToAdmin: noop,
  onNavigateToProfessorPremium: noop, onNavigateToLogin: noop, onNavigateToSettings: noop,
  onNavigateToLibrary: noop, onNavigateToAtlas: noop, onMelDevotional: onOpen,
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-02T12:00:00Z"));
  localStorage.clear();
  journal.completed = false;
  onOpen.mockClear();
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
const render = () => act(() => root.render(<Dashboard {...props} />));

describe("devotional invitation and permanent module", () => {
  it("keeps the Devocional module in Rotinas and removes only the invitation with X", () => {
    render();
    const module = host.querySelector<HTMLButtonElement>('[data-testid="module-devotional"]')!;
    expect(module.textContent).toContain("Devocional");
    expect(module.parentElement?.previousElementSibling?.textContent).toContain("Rotinas");
    expect(host.querySelector('[data-testid="devotional-invitation"]')).not.toBeNull();
    act(() => host.querySelector<HTMLButtonElement>('[data-testid="dismiss-devotional-invitation"]')?.click());
    expect(host.querySelector('[data-testid="devotional-invitation"]')).toBeNull();
    expect(host.querySelector('[data-testid="module-devotional"]')).not.toBeNull();
    expect(onOpen).not.toHaveBeenCalled();
    act(() => module.click());
    expect(onOpen).toHaveBeenCalledWith("2026-10-02");
    render();
    expect(host.querySelector('[data-testid="devotional-invitation"]')).toBeNull();
  });

  it("hides an already completed invitation while keeping the module available", () => {
    journal.completed = true;
    render();
    expect(host.querySelector('[data-testid="devotional-invitation"]')).toBeNull();
    expect(host.querySelector('[data-testid="module-devotional"]')?.textContent).toContain("Concluído");
  });

  it("shows the evening invitation after dismissing the morning invitation", () => {
    render();
    act(() => host.querySelector<HTMLButtonElement>('[data-testid="dismiss-devotional-invitation"]')?.click());
    act(() => {
      vi.setSystemTime(new Date("2026-10-02T21:00:00Z"));
      window.dispatchEvent(new Event("focus"));
    });
    expect(host.querySelector('[data-testid="devotional-invitation"]')?.textContent).toContain("Boa Noite com Deus");
    expect(host.querySelector('[data-testid="module-devotional"]')?.textContent).toContain("Boa Noite com Deus");
  });
});