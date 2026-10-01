// @vitest-environment node
import { beforeAll, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  registerPushToken: vi.fn(),
  removePushToken: vi.fn(),
  getUserPushMessages: vi.fn(),
}));

vi.mock("../auth", () => ({
  ensureAuthenticated: (req: any, _res: any, next: () => void) => {
    req.userId = "canonical-session-user";
    next();
  },
  ensureAdmin: (req: any, _res: any, next: () => void) => {
    req.userId = "canonical-admin-user";
    next();
  },
}));
vi.mock("../services/push", () => ({
  buildMelReminder: vi.fn(),
  getCampaignPushMessages: vi.fn(),
  getPushPlatformStats: vi.fn(),
  getUserPushMessages: mocks.getUserPushMessages,
  isPushConfigured: vi.fn(() => false),
  registerPushToken: mocks.registerPushToken,
  removePushToken: mocks.removePushToken,
  runMelPushReminders: vi.fn(),
  schedulerSecretIsValid: vi.fn(),
  sendPushMessages: vi.fn(),
}));
vi.mock("../services/mel", () => ({ getMelStatus: vi.fn() }));

type Handler = (req: any, res: any, next?: () => void) => unknown;
const handlers = new Map<string, Handler[]>();
const app = {
  get: (path: string, ...routeHandlers: Handler[]) => handlers.set(`GET ${path}`, routeHandlers),
  post: (path: string, ...routeHandlers: Handler[]) => handlers.set(`POST ${path}`, routeHandlers),
  delete: (path: string, ...routeHandlers: Handler[]) => handlers.set(`DELETE ${path}`, routeHandlers),
} as any;

let registerPushRoutes: typeof import("./push").registerPushRoutes;

beforeAll(async () => {
  ({ registerPushRoutes } = await import("./push"));
  registerPushRoutes(app);
});

async function invoke(method: string, path: string, body: unknown) {
  const handlersForRoute = handlers.get(`${method} ${path}`);
  if (!handlersForRoute) throw new Error(`Missing test route: ${method} ${path}`);
  const req = { body, userId: "client-supplied-user", header: () => undefined };
  const response: { statusCode: number; body?: unknown } = { statusCode: 200 };
  const res = {
    status(code: number) {
      response.statusCode = code;
      return this;
    },
    json(value: unknown) {
      response.body = value;
      return this;
    },
  };
  for (const handler of handlersForRoute) {
    let continued = false;
    const result = handler(req, res, () => { continued = true; });
    if (result && typeof (result as Promise<unknown>).then === "function") await result;
    if (handler.length >= 3 && !continued) break;
  }
  return response;
}

describe("push token endpoint ownership", () => {
  it("uses the canonical middleware identity rather than accepting userId from the request", async () => {
    const result = await invoke("POST", "/api/push/tokens", {
      userId: "victim-account",
      token: "fcm-token",
      platform: "android",
    });
    expect(result.statusCode).toBe(400);
    expect(mocks.registerPushToken).not.toHaveBeenCalled();
  });

  it("registers tokens against the user resolved from the authenticated session", async () => {
    const result = await invoke("POST", "/api/push/tokens", {
      token: "fcm-token",
      platform: "ios",
    });
    expect(result.statusCode).toBe(200);
    expect(mocks.registerPushToken).toHaveBeenCalledWith("canonical-session-user", "fcm-token", "ios");
  });

  it("deletes a token only for the account in the authenticated session", async () => {
    const result = await invoke("DELETE", "/api/push/tokens", { token: "fcm-token" });
    expect(result.statusCode).toBe(200);
    expect(mocks.removePushToken).toHaveBeenCalledWith("canonical-session-user", "fcm-token");
  });

  it("requires explicit campaign confirmation and rejects arbitrary URL destinations", async () => {
    const notConfirmed = await invoke("POST", "/api/admin/push/campaign", {
      title: "Test",
      body: "Text",
      audience: "all",
      destination: { kind: "devotional", devotionalDate: "2026-06-01" },
    });
    const unsafeDestination = await invoke("POST", "/api/admin/push/campaign", {
      title: "Test",
      body: "Text",
      audience: "all",
      confirmed: true,
      destination: { url: "https://example.com/admin" },
    });
    expect(notConfirmed.statusCode).toBe(400);
    expect(unsafeDestination.statusCode).toBe(400);
  });
});