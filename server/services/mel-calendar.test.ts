import { describe, expect, it } from "vitest";
import {
  addCalendarDays,
  calculateMelStreaks,
  melDate,
  melStartOfDayUtc,
  melStreakMilestone,
  mondayWeekKey,
} from "./mel-calendar";

describe("Mel Sao Paulo calendar and streak rules", () => {
  it("uses Sao Paulo local dates around midnight without relying on host timezone", () => {
    expect(melDate(new Date("2025-03-09T02:59:00.000Z"))).toBe("2025-03-08");
    expect(melDate(new Date("2025-03-09T03:00:00.000Z"))).toBe("2025-03-09");
    expect(addCalendarDays("2024-02-28", 1)).toBe("2024-02-29");
    expect(addCalendarDays("2024-02-29", 1)).toBe("2024-03-01");
  });

  it("uses Monday-start calendar weeks", () => {
    expect(mondayWeekKey("2025-03-09")).toBe("2025-03-03");
    expect(mondayWeekKey("2025-03-10")).toBe("2025-03-10");
  });

  it("resolves local day boundaries across the historical Sao Paulo DST jump", () => {
    const dstStart = melStartOfDayUtc("2018-11-04");
    const nextDay = melStartOfDayUtc("2018-11-05");
    expect(dstStart.toISOString()).toBe("2018-11-04T03:00:00.000Z");
    expect(nextDay.toISOString()).toBe("2018-11-05T02:00:00.000Z");
    expect(melDate(dstStart)).toBe("2018-11-04");
    expect(melDate(new Date(dstStart.getTime() - 1))).toBe("2018-11-03");
  });

  it("allows one real absence per week without inventing a study day", () => {
    const result = calculateMelStreaks(
      ["2025-03-07", "2025-03-09", "2025-03-10"],
      "2025-03-10",
    );
    expect(result.streak).toBe(3);
    expect(result.lastActivityDate).toBe("2025-03-10");
    expect(result.bestStreak).toBe(3);
  });

  it("breaks a run after two absent days in one week, but preserves the best historical run", () => {
    const result = calculateMelStreaks(
      ["2025-03-01", "2025-03-02", "2025-03-03", "2025-03-07", "2025-03-10"],
      "2025-03-10",
    );
    expect(result.streak).toBe(1);
    expect(result.bestStreak).toBe(3);
  });

  it("keeps the longest valid suffix after a second weekly absence", () => {
    const result = calculateMelStreaks(
      ["2025-03-03", "2025-03-05", "2025-03-07", "2025-03-08"],
      "2025-03-08",
    );
    expect(result.streak).toBe(3);
    expect(result.bestStreak).toBe(3);
  });

  it("allows one grace absence in each of two different Monday-based weeks", () => {
    const result = calculateMelStreaks(["2025-03-08"], "2025-03-11");
    expect(result.streak).toBe(1);
    expect(result.bestStreak).toBe(1);
  });

  it("does not grant today's absence as grace and still counts only real activity dates", () => {
    const result = calculateMelStreaks(["2025-03-07"], "2025-03-09");
    expect(result.streak).toBe(1);
    expect(result.lastActivityDate).toBe("2025-03-07");
  });

  it("recognizes supported streak milestones", () => {
    expect(melStreakMilestone(7)).toBe(7);
    expect(melStreakMilestone(30)).toBe(30);
    expect(melStreakMilestone(100)).toBe(100);
    expect(melStreakMilestone(365)).toBe(365);
    expect(melStreakMilestone(14)).toBeNull();
  });
});