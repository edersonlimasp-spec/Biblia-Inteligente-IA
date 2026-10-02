import { describe, expect, it } from "vitest";
import { devotionalRoutineAt } from "@shared/devotional";
import { getMelDate } from "./mel-date";
import { devotionalJournalKey } from "./devotional-query-keys";

describe("devotional schedule", () => {
  it("uses the São Paulo morning window from 04:00 inclusive to 18:00 exclusive", () => {
    expect(devotionalRoutineAt(new Date("2025-05-13T06:59:00.000Z"))).toBe("noite"); // 03:59 in São Paulo
    expect(devotionalRoutineAt(new Date("2025-05-13T07:00:00.000Z"))).toBe("manha");
    expect(devotionalRoutineAt(new Date("2025-05-13T20:59:00.000Z"))).toBe("manha"); // 17:59
    expect(devotionalRoutineAt(new Date("2025-05-13T21:00:00.000Z"))).toBe("noite");
  });

  it("uses the devotional calendar date in São Paulo", () => {
    expect(getMelDate(new Date("2025-05-13T02:59:00.000Z"))).toBe("2025-05-12");
    expect(getMelDate(new Date("2025-05-13T03:00:00.000Z"))).toBe("2025-05-13");
  });

  it("isolates private journal cache entries by user and session generation", () => {
    const userA = devotionalJournalKey("2025-05-13", "manha", "user-a", 4);
    expect(devotionalJournalKey("2025-05-13", "manha", "user-b", 4)).not.toEqual(userA);
    expect(devotionalJournalKey("2025-05-13", "manha", "user-a", 5)).not.toEqual(userA);
    expect(devotionalJournalKey("2025-05-13", "noite", "user-a", 4)).not.toEqual(userA);
  });
});