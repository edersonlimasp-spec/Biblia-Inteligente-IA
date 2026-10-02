import { beforeEach, describe, expect, it, vi } from "vitest";
import { PgDialect } from "drizzle-orm/pg-core";
import { bibleVerses, bibleVersions, dailyDevotionals } from "@shared/schema";
import { reserveForDate } from "./devotional-reserve";
import { devotionalVerseSnapshot } from "./devotional-verse-snapshots";

const database = vi.hoisted(() => ({ select: vi.fn() }));
vi.mock("../db", () => ({ db: database }));
vi.mock("./mel", () => ({ getMelStatus: vi.fn(), recordMelActivity: vi.fn() }));
import { devotionalPassage, getDevotionalMoment, resolveDevotionalPassage } from "./devotional-moments";

const day = "2026-10-02";
const morning = () => reserveForDate(day, "manha");
let byVersion: Record<string, Array<{ verse: number; text: string }>>;
let active: string[];
let requested: string[];
let approved: ReturnType<typeof morning> | undefined;

beforeEach(() => {
  byVersion = {};
  active = [];
  requested = [];
  approved = undefined;
  database.select.mockReset();
  database.select.mockImplementation(() => {
    let table: unknown;
    let predicate: any;
    const rows = () => {
      if (table === bibleVersions) return active.map((code) => ({ code }));
      if (table === dailyDevotionals) return approved ? [{ content: approved }] : [];
      if (table !== bibleVerses) return [];
      const params = new PgDialect().sqlToQuery(predicate).params;
      const version = params[2] as string;
      requested.push(version);
      return byVersion[version] ?? [];
    };
    const chain: any = {
      from: (value: unknown) => { table = value; return chain; },
      where: (value: unknown) => { predicate = value; return chain; },
      orderBy: () => chain,
      limit: () => chain,
      innerJoin: () => chain,
      then: (resolve: (value: unknown) => unknown) => Promise.resolve(rows()).then(resolve),
    };
    return chain;
  });
});

describe("devotional passage fallback without changing editorial approval", () => {
  it("keeps a complete passage in the requested version", async () => {
    byVersion.NVI = [{ verse: morning().verse, text: "Texto da versão solicitada." }];
    const result = await resolveDevotionalPassage(morning(), "NVI");
    expect(result?.versionCode).toBe("NVI");
    expect(requested).toEqual(["NVI"]);
  });

  it("falls back to ACF without changing the user's preference", async () => {
    byVersion.ACF = [{ verse: morning().verse, text: "Texto ACF." }];
    const result = await resolveDevotionalPassage(morning(), "NVI");
    expect(result).toMatchObject({ versionCode: "ACF", text: "Texto ACF." });
    expect(requested).toEqual(["NVI", "ACF"]);
  });

  it("uses another active version only after requested and ACF fail", async () => {
    active = ["ACF", "ARC", "NVI"];
    byVersion.ARC = [{ verse: morning().verse, text: "Texto ARC." }];
    const result = await resolveDevotionalPassage(morning(), "NVI");
    expect(result?.versionCode).toBe("ARC");
    expect(requested).toEqual(["NVI", "ACF", "ARC"]);
  });

  it("does not accept an incomplete multi-verse passage", async () => {
    const content = { ...morning(), book: "lam", chapter: 3, verse: 22, endVerse: 23 };
    byVersion.NVI = [{ verse: 22, text: "Apenas um dos dois versos." }];
    byVersion.ACF = [{ verse: 22, text: "Primeiro." }, { verse: 23, text: "Segundo." }];
    expect(await resolveDevotionalPassage(content, "NVI")).toMatchObject({
      versionCode: "ACF", text: "Primeiro. Segundo.",
    });
  });

  it("rejects blank text and uses the verified embedded snapshot", async () => {
    byVersion.NVI = [{ verse: morning().verse, text: " " }];
    const result = await resolveDevotionalPassage(morning(), "NVI");
    expect(result).toMatchObject({ versionCode: "ACF", text: morning().verseText });
  });

  it("preserves strict validation for approval when ACF is missing", async () => {
    await expect(devotionalPassage(morning(), "ACF")).rejects.toThrow("versão");
  });

  it("does not mask genuine database errors as missing verses", async () => {
    database.select.mockImplementation(() => { throw new Error("database unavailable"); });
    await expect(resolveDevotionalPassage(morning(), "NVI")).rejects.toThrow("database unavailable");
  });

  it("keeps an approved devotional with its saved verse when Bible data is empty", async () => {
    approved = { ...morning(), title: "Devocional aprovado" };
    expect(await getDevotionalMoment(day, "manha", "NVI")).toMatchObject({
      title: "Devocional aprovado", source: "aprovado",
      verse: { text: approved.verseText, versionCode: "ACF" },
    });
  });

  it("uses a full reserve devotional for legacy approval without a usable verse", async () => {
    approved = { ...morning(), book: "gen", chapter: 1, verse: 1, endVerse: null, verseText: undefined };
    expect(await getDevotionalMoment(day, "manha", "NVI")).toMatchObject({
      source: "reserva", verse: { text: morning().verseText },
    });
  });

  it.each(["manha", "noite"] as const)(
    "loads all fourteen %s reserves with empty devotional and Bible tables",
    async (routine) => {
      active = ["ACF", "ARC", "NVI"];
      for (let index = 1; index <= 14; index++) {
        const date = `2026-10-${String(index).padStart(2, "0")}`;
        const content = reserveForDate(date, routine);
        expect(content.verseText).toBe(devotionalVerseSnapshot(content));
        expect(content.verseText?.length).toBeGreaterThan(20);
        const result = await getDevotionalMoment(date, routine, "NVI");
        expect(result.source).toBe("reserva");
        expect(result.verse).toMatchObject({ text: content.verseText, versionCode: "ACF" });
        if (routine === "noite") expect(result.nightReading?.text).toBe(content.verseText);
      }
    },
  );
});