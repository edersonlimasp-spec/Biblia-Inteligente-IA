import { describe, expect, it } from "vitest";
import type { MelStatus } from "@shared/mel";
import {
  createMelStartupGate,
  getActivityGapDays,
  getMelContextScene,
  getMelStartupScene,
  getSaoPauloHour,
  isMelMilestone,
  isMelSleepingHour,
} from "./mel-visual";

const status = (overrides: Partial<MelStatus> = {}): MelStatus => ({
  position: null,
  streak: 0,
  bestStreak: 0,
  completedToday: false,
  mood: "normal",
  lastActivityDate: null,
  activePlan: null,
  course: null,
  devotionalReadToday: false,
  today: "2025-05-12",
  ...overrides,
});

describe("Mel visual scene decisions", () => {
  it("uses São Paulo time and recognizes the sleeping interval", () => {
    expect(getSaoPauloHour(new Date("2025-05-12T10:00:00.000Z"))).toBe(7);
    expect([6, 7, 21, 22].map(isMelSleepingHour)).toEqual([true, false, false, true]);
    expect(getMelStartupScene(status({ position: { kind: "bible", book: "slm", chapter: 23, verse: 1, versionCode: "ACF" } }), "2025-05-12", 23)).toBeNull();
  });

  it("shows only a return reminder after two days away", () => {
    const saudade = status({ mood: "saudade", lastActivityDate: "2025-05-10" });
    expect(getActivityGapDays("2025-05-10", "2025-05-12")).toBe(2);
    expect(getMelStartupScene(saudade, "2025-05-12", 8)).toBe("saudade");
    expect(getMelStartupScene(status({ mood: "saudade", lastActivityDate: "2025-05-11" }), "2025-05-12", 8)).toBeNull();
    expect(getMelStartupScene(saudade, "2025-05-12", 23)).toBeNull();
    expect(getMelStartupScene(status({ completedToday: true }), "2025-05-12", 8)).toBeNull();
    expect(getMelStartupScene(status({ position: { kind: "bible", book: "slm", chapter: 23, verse: 1, versionCode: "ACF" } }), "2025-05-12", 13)).toBeNull();
    expect(getMelStartupScene(undefined, "2025-05-12", 13)).toBeNull();
  });

  it("maps silent companion scenes and excludes protected screens", () => {
    expect(getMelContextScene("bible")).toBe("reading");
    expect(getMelContextScene("prayer")).toBe("praying");
    expect(getMelContextScene("mel-devotional")).toBe("praying");
    expect(getMelContextScene("dashboard")).toBe("peeking");
    expect(getMelContextScene("subscriptions")).toBeNull();
    expect(getMelContextScene("lesson")).toBe("peeking");
    expect(getMelContextScene("module-detail")).toBe("peeking");
    expect(getMelContextScene("professor-premium")).toBe("peeking");
    expect(getMelContextScene("professor")).toBe("peeking");
    expect(getMelContextScene("ai-modes")).toBe("peeking");
    expect(getMelContextScene("plan-day")).toBe("peeking");
    expect(getMelContextScene("plans-progress")).toBe("peeking");
    expect(getMelContextScene("recordings")).toBe("peeking");
    expect(getMelContextScene("atlas")).toBe("peeking");
    expect(getMelContextScene("history")).toBe("peeking");
    expect(getMelContextScene("study")).toBe("peeking");
    expect(getMelContextScene("admin")).toBeNull();
    expect(getMelContextScene("privacy-policy")).toBeNull();
  });

  it.each([7, 30, 100, 365])("recognizes the %i-day milestone", (streak) => {
    expect(isMelMilestone(streak)).toBe(true);
  });
  it("does not treat other streaks as milestones", () => expect(isMelMilestone(8)).toBe(false));
});

describe("per-opening entrance gate", () => {
  it("claims once across remounts, but permits a new opening id after reload", () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    };
    const gateForPage = createMelStartupGate();
    expect(gateForPage.claim(storage, "opening-one")).toBe(true);
    expect(gateForPage.claim(storage, "opening-one")).toBe(false);
    const gateAfterReload = createMelStartupGate();
    expect(gateAfterReload.claim(storage, "opening-two")).toBe(true);
    expect(createMelStartupGate().claim(null, "storage-denied")).toBe(true);
  });
});