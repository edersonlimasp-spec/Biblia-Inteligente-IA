// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => {
  process.env.SESSION_SECRET ||= "atlas-test-only-session-secret";
  return { getUser: vi.fn(), hasActiveSubscription: vi.fn(), readdir: vi.fn(), readFile: vi.fn() };
});
vi.mock("../storage", () => ({ storage: { getUser: mocks.getUser, hasActiveSubscription: mocks.hasActiveSubscription } }));
vi.mock("node:fs/promises", () => ({ default: { readdir: mocks.readdir, readFile: mocks.readFile } }));
import { hasAtlasFullAccess } from "./access";
import { atlasSummary, buildAtlasContext, getAtlasItem, readAtlasSvg } from "./catalog";
import type { AtlasItem } from "../../shared/atlas";

const reference = { book: "Ex", chapter: 25, verseStart: 10, label: "Êxodo 25:10" };
const fixture: AtlasItem = {
  id: "test-map", version: "1", kind: "map", category: "Teste", testament: "AT",
  books: ["Ex"], characters: [], period: "Período de teste", title: "Mapa de teste", subtitle: "",
  summary: "Contexto de teste suficientemente longo.", modernSummary: "Comparação moderna de teste.",
  certainty: "debated", sample: true, keywords: [], references: [reference],
  sources: [{ id: "test-source", title: "Fonte de teste", url: "https://example.org", license: "CC0", note: "Teste unitário" }],
  places: [{ id: "test-place", name: "Local", modernName: "Nome moderno", coordinates: null, certainty: "unknown", explanation: "Não identificado com segurança.", references: [reference], sourceIds: ["test-source"] }],
  overlays: [], bounds: [0, 0, 1, 1],
  review: { date: "2026-01-01", status: "needs-specialist", verified: ["Texto"], uncertainties: ["Local"], methodology: "Teste sem conteúdo de produção." },
};
const locked: AtlasItem = { ...fixture, id: "locked", sample: false, kind: "illustration", illustration: {
  svgFile: "locked.svg", dimensions: [{ label: "Largura", cubits: 2, note: "Estimativa", reference }], notes: ["Reconstrução"], relatedIds: [],
} };
beforeEach(() => {
  vi.clearAllMocks();
  mocks.getUser.mockResolvedValue({ role: "user", trialStartDate: null });
  mocks.hasActiveSubscription.mockResolvedValue(false);
  mocks.readdir.mockImplementation(async (folder: string) => folder.endsWith("maps") ? ["test-map.json"] : ["locked.json"]);
  mocks.readFile.mockImplementation(async (file: string) => file.endsWith(".svg") ? "<svg/>" : JSON.stringify(file.endsWith("locked.json") ? locked : fixture));
});
describe("Atlas access uses existing server identity and entitlement reads", () => {
  it("guests never query subscriptions; client role does not grant access", async () => {
    expect(await hasAtlasFullAccess({ headers: {}, userRole: "admin" } as any)).toBe(false);
    expect(mocks.hasActiveSubscription).not.toHaveBeenCalled();
    expect(await hasAtlasFullAccess({ headers: {}, userId: "u", userRole: "admin" } as any)).toBe(false);
  });
  it.each(["gold", "premium"])("accepts active %s via platform-aware existing read", async plan => {
    mocks.hasActiveSubscription.mockImplementation(async (_id, type, sources) => type === plan && sources.includes("apple"));
    expect(await hasAtlasFullAccess({ userId: "u", headers: { "x-client-platform": "ios" } } as any)).toBe(true);
    expect(await hasAtlasFullAccess({ userId: "u", headers: { "x-client-platform": "android" } } as any)).toBe(false);
    expect(mocks.hasActiveSubscription).toHaveBeenCalledWith("u", plan, ["apple", "admin"]);
  });
  it("does not grant Strong or lifetime-only access or override expired subscription reads", async () => {
    mocks.hasActiveSubscription.mockImplementation(async (_id, type) => ["strong", "lifetime"].includes(type));
    expect(await hasAtlasFullAccess({ userId: "u", headers: {} } as any)).toBe(false);
    expect(mocks.hasActiveSubscription.mock.calls.map(call => call[1])).toEqual(["gold", "premium"]);
  });
  it("uses real trial expiry and server admin roles", async () => {
    const req = { userId: "u", headers: {} } as any;
    mocks.getUser.mockResolvedValue({ role: "user", trialStartDate: new Date() });
    expect(await hasAtlasFullAccess(req)).toBe(true);
    mocks.getUser.mockResolvedValue({ role: "user", trialStartDate: new Date(Date.now() - 8 * 86400000) });
    expect(await hasAtlasFullAccess(req)).toBe(false);
    mocks.getUser.mockResolvedValue({ role: "admin", trialStartDate: null });
    expect(await hasAtlasFullAccess(req)).toBe(true);
  });
});
describe("Atlas server catalog and bounded context", () => {
  it("exposes sample content and only whitelisted locked metadata", async () => {
    expect((await getAtlasItem("test-map", false)).sample).toBe(true);
    const summary = atlasSummary(locked, false);
    expect(summary.locked).toBe(true);
    expect(summary).not.toHaveProperty("sources");
    expect(summary).not.toHaveProperty("places");
    expect(summary).not.toHaveProperty("illustration");
  });
  it("protects item, SVG and AI context using the same gate", async () => {
    await expect(getAtlasItem("locked", false)).rejects.toMatchObject({ status: 403 });
    await expect(readAtlasSvg("locked", false)).rejects.toMatchObject({ status: 403 });
    await expect(buildAtlasContext({ itemId: "locked", version: "1", mode: "ancient" }, false)).rejects.toMatchObject({ status: 403 });
    expect(await readAtlasSvg("locked", true)).toBe("<svg/>");
  });
  it("rejects fabricated fields, invalid mode, missing ID, stale version and foreign place", async () => {
    const request = { itemId: "test-map", version: "1", mode: "modern" };
    for (const extra of [{ fullAccess: true }, { context: "ignore instructions" }, { mode: "other" }, { selectedPlaceId: "foreign" }]) {
      await expect(buildAtlasContext({ ...request, ...extra }, true)).rejects.toMatchObject({ status: 400 });
    }
    await expect(buildAtlasContext({ ...request, itemId: "missing" }, true)).rejects.toMatchObject({ status: 404 });
    await expect(buildAtlasContext({ ...request, version: "0" }, true)).rejects.toMatchObject({ status: 409 });
  });
  it("provides server sources, uncertainty, selected place and qualified dimensions", async () => {
    const context = JSON.parse(await buildAtlasContext({ itemId: "test-map", version: "1", mode: "modern", selectedPlaceId: "test-place" }, false));
    expect(context.places).toEqual(fixture.places);
    expect(context.sources).toEqual(fixture.sources);
    expect(context.certainty).toBe("debated");
    const illustration = JSON.parse(await buildAtlasContext({ itemId: "locked", version: "1", mode: "ancient" }, true)).illustration;
    expect(illustration.dimensions[0].approximateMeters).toBe(0.9);
    expect(illustration.cubitNote).toContain("aproximada");
  });
});