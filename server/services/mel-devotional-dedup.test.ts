import { describe, expect, it, vi } from "vitest";

const fake = vi.hoisted(() => ({ rows: [] as unknown[], tail: Promise.resolve(), transaction: vi.fn() }));
vi.mock("../db", () => ({ db: { transaction: fake.transaction } }));
vi.mock("../storage", () => ({ storage: {} }));
import { recordMelActivity } from "./mel";

describe("established Mel daily activity recorder", () => {
  it("uses one advisory-locked daily event for morning, evening and simultaneous retries", async () => {
    fake.rows = [];
    const execute = vi.fn();
    fake.transaction.mockImplementation((callback: Function) => {
      const tx: any = {
        execute,
        select: () => ({ from: () => ({ where: () => ({ limit: async () => fake.rows.slice(0, 1) }) }) }),
        insert: () => ({ values: async (row: unknown) => { fake.rows.push(row); } }),
      };
      const result = fake.tail.then(() => callback(tx));
      fake.tail = result.then(() => undefined);
      return result;
    });
    await Promise.all([
      recordMelActivity("session-owner", "mel_devotional"),
      recordMelActivity("session-owner", "mel_devotional"),
      recordMelActivity("session-owner", "mel_devotional"),
    ]);
    expect(fake.rows).toHaveLength(1);
    expect(fake.rows[0]).toMatchObject({ userId: "session-owner", type: "mel_devotional" });
    expect(execute).toHaveBeenCalledTimes(3);
  });
});