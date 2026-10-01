// @vitest-environment node
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  ownsUserPlan: vi.fn(),
  getOwnedUserPlanById: vi.fn(),
  markReadingComplete: vi.fn(),
  updatePlanStatus: vi.fn(),
  updateNotificationSettings: vi.fn(),
  deletePlan: vi.fn(),
}));

vi.mock("../auth", () => ({
  ensureAuthenticated: (_req: unknown, _res: unknown, next: () => void) => next(),
  optionalAuth: (_req: unknown, _res: unknown, next: () => void) => next(),
  ensureAdmin: vi.fn(),
  ensureSuperAdmin: vi.fn(),
  hashPassword: vi.fn(),
  verifyPassword: vi.fn(),
  generateToken: vi.fn(),
  isTrialActive: vi.fn(),
  getTrialDaysRemaining: vi.fn(),
}));
vi.mock("../storage", () => ({ storage: {} }));
vi.mock("../email", () => ({ sendPasswordResetEmail: vi.fn(), sendReengagementEmail: vi.fn() }));
vi.mock("firebase-admin", () => ({ default: {} }));
vi.mock("../openai", () => ({
  askTheologicalQuestion: vi.fn(),
  generateBiblicalImage: vi.fn(),
  analyzeImageWithVision: vi.fn(),
}));
vi.mock("../db", () => ({ db: {} }));
vi.mock("../init-db", () => ({ forceSeedStrongEntries: vi.fn(), forceSeedStudyModules: vi.fn() }));
vi.mock("../payments/google", () => ({ getGoogleAccessToken: vi.fn() }));
vi.mock("../strong-data-embedded", () => ({ STRONG_DATA: {} }));
vi.mock("../bible/translations", () => ({
  TRANSLATION_REGISTRY: {},
  getEnabledTranslations: vi.fn(),
  hasDataAvailable: vi.fn(),
  getTranslation: vi.fn(),
  getDefaultTranslation: vi.fn(),
}));
vi.mock("../payments/iap-routes", () => ({ default: vi.fn() }));
vi.mock("../services/strong-ai-generator", () => ({
  generateStrongDefinition: vi.fn(),
  isEntryIncomplete: vi.fn(),
}));
vi.mock("../services/sermon-ai", () => ({
  transcribeAudio: vi.fn(),
  generateSermonSummary: vi.fn(),
  generateShareToken: vi.fn(),
}));
vi.mock("../genesis-strong-mappings", () => ({ GENESIS_WORD_STRONG: {} }));
vi.mock("../exo-strong-mappings", () => ({ EXO_WORD_STRONG: {} }));
vi.mock("../num-strong-mappings", () => ({ NUM_WORD_STRONG: {} }));
vi.mock("../lev-strong-mappings", () => ({ LEV_WORD_STRONG: {} }));
vi.mock("../deu-strong-mappings", () => ({ DEU_WORD_STRONG: {} }));
vi.mock("./shared", () => ({
  getClientPlatform: vi.fn(),
  getPlatformAllowedSources: vi.fn(),
  getFromStrongCache: vi.fn(),
  setInStrongCache: vi.fn(),
  initFirebaseAdmin: vi.fn(),
  firebaseInitialized: false,
}));
vi.mock("../reading-plans", () => ({
  readingPlanService: {
    ownsUserPlan: mocks.ownsUserPlan,
    getOwnedUserPlanById: mocks.getOwnedUserPlanById,
    markReadingComplete: mocks.markReadingComplete,
    updatePlanStatus: mocks.updatePlanStatus,
    updateNotificationSettings: mocks.updateNotificationSettings,
    deletePlan: mocks.deletePlan,
    getUserPlans: vi.fn(),
    createUserPlan: vi.fn(),
    getTodaysReading: vi.fn(),
    getUpcomingReadings: vi.fn(),
    getOverdueReadings: vi.fn(),
    getAllTemplates: vi.fn(),
    getTemplateBySlug: vi.fn(),
    getAllBooks: vi.fn(),
    getUserPlanById: vi.fn(),
  },
}));

type Handler = (req: any, res: any) => Promise<unknown> | unknown;
const handlers = new Map<string, Handler[]>();
const app = {
  get: (path: string, ...routeHandlers: Handler[]) => handlers.set(`GET ${path}`, routeHandlers),
  post: (path: string, ...routeHandlers: Handler[]) => handlers.set(`POST ${path}`, routeHandlers),
  patch: (path: string, ...routeHandlers: Handler[]) => handlers.set(`PATCH ${path}`, routeHandlers),
  delete: (path: string, ...routeHandlers: Handler[]) => handlers.set(`DELETE ${path}`, routeHandlers),
} as any;

let registerStudyRoutes: typeof import("./study").registerStudyRoutes;
beforeAll(async () => {
  ({ registerStudyRoutes } = await import("./study"));
  registerStudyRoutes(app);
});

beforeEach(() => {
  vi.clearAllMocks();
  mocks.ownsUserPlan.mockResolvedValue(false);
  mocks.getOwnedUserPlanById.mockResolvedValue(null);
});

function response() {
  const res = { status: vi.fn(), json: vi.fn() } as any;
  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);
  return res;
}

async function call(route: string, req: Record<string, unknown>) {
  const res = response();
  const routeHandlers = handlers.get(route);
  if (!routeHandlers) throw new Error(`Missing test route: ${route}`);
  // Call the final handler directly; authentication is represented by req.userId.
  await routeHandlers[routeHandlers.length - 1](req, res);
  return res;
}

describe("reading-plan route ownership enforcement", () => {
  it("uses the authenticated account for detail reads and returns 404 for another owner", async () => {
    const res = await call("GET /api/reading-plans/user/:planId", {
      params: { planId: "foreign-plan" },
      headers: { "x-device-id": "attacker-device" },
      userId: "signed-in-user",
    });
    expect(mocks.getOwnedUserPlanById).toHaveBeenCalledWith("foreign-plan", "signed-in-user", null);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("checks account ownership before completing a plan day", async () => {
    const res = await call("POST /api/reading-plans/user/:planId/complete", {
      params: { planId: "foreign-plan" },
      headers: {},
      userId: "signed-in-user",
      body: { dayIndex: 1 },
    });
    expect(mocks.ownsUserPlan).toHaveBeenCalledWith("foreign-plan", "signed-in-user", null);
    expect(mocks.markReadingComplete).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("checks ownership before changing status or notification settings", async () => {
    const res = await call("PATCH /api/reading-plans/user/:planId", {
      params: { planId: "foreign-plan" },
      headers: {},
      userId: "signed-in-user",
      body: { status: "paused", notificationsEnabled: false },
    });
    expect(mocks.ownsUserPlan).toHaveBeenCalledWith("foreign-plan", "signed-in-user", null);
    expect(mocks.updatePlanStatus).not.toHaveBeenCalled();
    expect(mocks.updateNotificationSettings).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("checks ownership before deleting a plan", async () => {
    const res = await call("DELETE /api/reading-plans/user/:planId", {
      params: { planId: "foreign-plan" },
      headers: {},
      userId: "signed-in-user",
    });
    expect(mocks.ownsUserPlan).toHaveBeenCalledWith("foreign-plan", "signed-in-user", null);
    expect(mocks.deletePlan).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("uses only the device owner path for guest detail requests", async () => {
    const res = await call("GET /api/reading-plans/user/:planId", {
      params: { planId: "account-plan" },
      headers: { "x-device-id": "guest-device" },
    });
    expect(mocks.getOwnedUserPlanById).toHaveBeenCalledWith("account-plan", null, "guest-device");
    expect(res.status).toHaveBeenCalledWith(404);
  });
});