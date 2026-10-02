import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Express } from "express";
import { melDate } from "../services/mel-calendar";

const services = vi.hoisted(() => ({
  getDevotionalMoment: vi.fn(), readDevotionalJournal: vi.fn(), saveDevotionalJournal: vi.fn(),
  completeDevotionalMoment: vi.fn(), devotionalPrayerRequest: vi.fn(), isMissingDevotionalSchema: vi.fn(),
}));
vi.mock("../db", () => ({ db: {} }));
vi.mock("../services/devotional-moments", () => services);
vi.mock("../services/devotional-editorial", () => ({ generateDevotionalDrafts: vi.fn(), validateDevotionalApproval: vi.fn() }));
vi.mock("../auth", () => ({
  ensureAuthenticated: (req: any, res: any, next: any) => req.userId ? next() : res.status(401).json({ error: "Entre na conta." }),
  ensureAdmin: (req: any, res: any, next: any) => req.isAdmin ? next() : res.status(403).json({ error: "Acesso restrito." }),
}));
import { registerDevotionalRoutes } from "./devotionals";

const routes = new Map<string, Function[]>();
const app: any = {};
for (const method of ["get", "put", "post"]) app[method] = (path: string, ...handlers: Function[]) => routes.set(`${method} ${path}`, handlers);
registerDevotionalRoutes(app as Express);
async function request(method: string, path: string, input: { body?: any; query?: any; userId?: string; isAdmin?: boolean } = {}) {
  const req = { body: {}, query: {}, params: {}, ...input };
  const response: any = { code: 200, sent: false, data: undefined, headers: {},
    status(code: number) { this.code = code; return this; },
    json(data: unknown) { this.data = data; this.sent = true; return this; },
    setHeader(key: string, value: string) { this.headers[key] = value; },
  };
  for (const handler of routes.get(`${method} ${path}`) ?? []) {
    await handler(req, response, () => {});
    if (response.sent) break;
  }
  return response;
}
describe("devotional routes: identity and access", () => {
  const today = melDate(new Date());
  beforeEach(() => {
    vi.clearAllMocks();
    services.getDevotionalMoment.mockResolvedValue({ date: today, routine: "manha", title: "Um momento" });
    services.readDevotionalJournal.mockResolvedValue({ answer: "", completed: false });
    services.saveDevotionalJournal.mockResolvedValue({ answer: "Registro pessoal", completed: false });
    services.completeDevotionalMoment.mockResolvedValue({ completed: true, status: { streak: 1 } });
    services.devotionalPrayerRequest.mockResolvedValue({ listId: "own-list", requestId: "own-request" });
  });
  it("allows a visitor to read but never conclude or access a private journal", async () => {
    expect((await request("get", "/api/devotionals/today")).code).toBe(200);
    expect((await request("post", "/api/devotionals/complete", { body: { date: today, routine: "manha" } })).code).toBe(401);
    expect((await request("get", "/api/devotionals/journal", { query: { date: today, routine: "manha" } })).code).toBe(401);
    expect(services.completeDevotionalMoment).not.toHaveBeenCalled();
  });
  it("reads and writes only the authenticated identity", async () => {
    const query = { date: today, routine: "manha" };
    await request("get", "/api/devotionals/journal", { query, userId: "session-owner" });
    expect(services.readDevotionalJournal).toHaveBeenCalledWith("session-owner", today, "manha");
    await request("put", "/api/devotionals/journal", { userId: "session-owner", body: { ...query, answer: "Registro pessoal" } });
    expect(services.saveDevotionalJournal).toHaveBeenCalledWith("session-owner", expect.objectContaining({ answer: "Registro pessoal" }));
  });
  it("rejects body and query identity injection instead of trusting client IDs", async () => {
    const body = { date: today, routine: "manha", userId: "another-user" };
    expect((await request("put", "/api/devotionals/journal", { userId: "session-owner", body })).code).toBe(400);
    expect((await request("get", "/api/devotionals/journal", { userId: "session-owner", query: body })).code).toBe(400);
    expect((await request("post", "/api/devotionals/complete", { userId: "session-owner", body })).code).toBe(400);
    expect(services.saveDevotionalJournal).not.toHaveBeenCalled();
  });
  it("requires admin access and denies an invented date", async () => {
    expect((await request("get", "/api/admin/devotionals")).code).toBe(403);
    expect((await request("post", "/api/devotionals/complete", { userId: "session-owner", body: { date: "2026-02-30", routine: "manha" } })).code).toBe(400);
  });
  it("transfers prayer using session identity, not a caller-supplied list", async () => {
    const body = { date: today, routine: "noite" };
    expect((await request("post", "/api/devotionals/prayer", { userId: "session-owner", body })).code).toBe(200);
    expect(services.devotionalPrayerRequest).toHaveBeenCalledWith("session-owner", today, "noite");
    expect((await request("post", "/api/devotionals/prayer", { userId: "session-owner", body: { ...body, listId: "foreign-list" } })).code).toBe(400);
  });
});