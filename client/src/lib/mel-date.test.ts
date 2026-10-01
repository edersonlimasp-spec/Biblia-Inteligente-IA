import { describe, expect, it } from "vitest";
import { getMelDate, millisecondsUntilMelMidnight } from "./mel-date";

describe("Mel calendar date", () => {
  it("uses the São Paulo date boundary, not the device timezone", () => {
    expect(getMelDate(new Date("2025-03-09T02:59:00.000Z"))).toBe("2025-03-08");
    expect(getMelDate(new Date("2025-03-09T03:00:00.000Z"))).toBe("2025-03-09");
  });

  it("updates the client exactly at the next São Paulo midnight", () => {
    const now = new Date("2025-03-09T02:59:00.000Z");
    const delay = millisecondsUntilMelMidnight(now);
    expect(delay).toBeGreaterThanOrEqual(59_990);
    expect(delay).toBeLessThanOrEqual(60_010);
    expect(getMelDate(new Date(now.getTime() + delay))).toBe("2025-03-09");
  });
});