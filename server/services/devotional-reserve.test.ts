import { beforeEach, describe, expect, it, vi } from "vitest";
import { PgDialect } from "drizzle-orm/pg-core";
import { devotionalContentSchema, devotionalDateSchema, devotionalRoutineAt } from "@shared/devotional";
import { devotionalReserve, reserveForDate } from "./devotional-reserve";

const database = vi.hoisted(() => ({ select: vi.fn() }));
vi.mock("../db", () => ({ db: database }));
vi.mock("./mel", () => ({ getMelStatus: vi.fn(), recordMelActivity: vi.fn() }));
import { devotionalContentFor, extractSpurgeonEvening } from "./devotional-moments";

describe("editorial reserve and Sao Paulo routines", () => {
  it("covers fourteen different morning/evening pairs with bounded morning reflections", () => {
    expect(devotionalReserve).toHaveLength(14);
    const titles = new Set<string>();
    for (let day = 1; day <= 14; day++) {
      const date = `2026-10-${String(day).padStart(2, "0")}`;
      for (const routine of ["manha", "noite"] as const) {
        const content = reserveForDate(date, routine);
        expect(devotionalContentSchema.safeParse(content).success).toBe(true);
        if (routine === "manha") {
          titles.add(content.title);
          const words = content.reflection.split(/\s+/).length;
          expect(words).toBeGreaterThanOrEqual(150);
          expect(words).toBeLessThanOrEqual(200);
        }
      }
    }
    expect(titles.size).toBe(14);
    expect(reserveForDate("2026-10-01", "manha").title).toBe(reserveForDate("2026-10-15", "manha").title);
  });
  it("uses exact 04:00 and 18:00 boundaries, including after midnight", () => {
    expect(devotionalRoutineAt(new Date("2026-10-02T06:59:59Z"))).toBe("noite");
    expect(devotionalRoutineAt(new Date("2026-10-02T07:00:00Z"))).toBe("manha");
    expect(devotionalRoutineAt(new Date("2026-10-02T20:59:59Z"))).toBe("manha");
    expect(devotionalRoutineAt(new Date("2026-10-02T21:00:00Z"))).toBe("noite");
    expect(devotionalRoutineAt(new Date("2026-10-03T03:00:00Z"))).toBe("noite");
  });
  it("rejects impossible dates instead of normalizing them", () => {
    expect(devotionalDateSchema.safeParse("2026-02-30").success).toBe(false);
    expect(devotionalDateSchema.safeParse("2026-10-02").success).toBe(true);
  });
  it("uses only an explicitly dated evening excerpt, without creating Spurgeon text", () => {
    expect(extractSpurgeonEvening("2 de outubro — Noite", "Trecho realmente armazenado.", "2026-10-02")).toBe("Trecho realmente armazenado.");
    expect(extractSpurgeonEvening("12 de outubro — Noite", "Outro trecho.", "2026-10-02")).toBeNull();
    expect(extractSpurgeonEvening("2 de outubro — Manhã", "Outro trecho.", "2026-10-02")).toBeNull();
    expect(extractSpurgeonEvening("Outubro", "2 de outubro — Noite", "2026-10-02")).toBeNull();
  });
});

describe("approved-only lookup and explicit fallback policy", () => {
  beforeEach(() => { database.select.mockReset(); });
  it("filters by approval and falls back when no approved row exists", async () => {
    let predicate: any;
    const chain: any = { from: () => chain, where: (value: unknown) => { predicate = value; return chain; }, limit: async () => [] };
    database.select.mockReturnValue(chain);
    const result = await devotionalContentFor("2026-10-02", "manha");
    expect(result.source).toBe("reserva");
    expect(new PgDialect().sqlToQuery(predicate).params).toContain("aprovado");
  });
  it("keeps reading available when only the new table migration is missing", async () => {
    database.select.mockImplementation(() => { throw { code: "42P01" }; });
    expect((await devotionalContentFor("2026-10-02", "noite")).source).toBe("reserva");
  });
  it("does not conceal a real database failure as reserve content", async () => {
    database.select.mockImplementation(() => { throw new Error("database unavailable"); });
    await expect(devotionalContentFor("2026-10-02", "manha")).rejects.toThrow("database unavailable");
  });
});