// @vitest-environment node
import jwt from "jsonwebtoken";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const TEST_SECRET = "strong-auth-test-secret-with-enough-entropy";

const mocks = vi.hoisted(() => {
  process.env.SESSION_SECRET = "strong-auth-test-secret-with-enough-entropy";
  return {
    getAuth: vi.fn(),
    getUserByEmail: vi.fn(),
    createUser: vi.fn(),
  };
});

vi.mock("@clerk/express", () => ({
  getAuth: mocks.getAuth,
}));

vi.mock("./storage", () => ({
  storage: {
    getUserByEmail: mocks.getUserByEmail,
    createUser: mocks.createUser,
  },
}));

type AuthModule = typeof import("./auth");
let auth: AuthModule;

const existingUser = {
  id: "user-1",
  email: "reader@example.com",
  role: "user",
};

function request(headers: Record<string, string> = {}) {
  return {
    headers,
    method: "GET",
    path: "/api/strong/G915",
  } as any;
}

function response() {
  const res = {
    status: vi.fn(),
    json: vi.fn(),
  } as any;
  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);
  return res;
}

beforeAll(async () => {
  auth = await import("./auth");
});

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getAuth.mockReturnValue({ userId: null, sessionClaims: null });
  mocks.getUserByEmail.mockResolvedValue(existingUser);
});

describe("ensureAuthenticated", () => {
  it("aceita JWT legado válido sem header de plataforma", async () => {
    const token = auth.generateToken(existingUser.id, existingUser.email, existingUser.role);
    const req = request({ authorization: `Bearer ${token}` });
    const res = response();
    const next = vi.fn();

    await auth.ensureAuthenticated(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
    expect(req.userId).toBe(existingUser.id);
    expect(req.dbUser).toEqual(existingUser);
  });

  it("preserva autenticação por sessão Clerk", async () => {
    mocks.getAuth.mockReturnValue({
      userId: "clerk-user",
      sessionClaims: { email: existingUser.email },
    });
    const req = request();
    const res = response();
    const next = vi.fn();

    await auth.ensureAuthenticated(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.userId).toBe(existingUser.id);
  });

  it("registra ausência de sessão Clerk e Authorization sem dados sensíveis", async () => {
    const warning = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const req = request();
    const res = response();

    await auth.ensureAuthenticated(req, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(401);
    expect(warning).toHaveBeenCalledWith(expect.stringContaining("clerk_session_missing"));
    expect(warning).toHaveBeenCalledWith(expect.stringContaining("authorization_header_missing"));
    expect(warning.mock.calls.flat().join(" ")).not.toContain(existingUser.email);
    warning.mockRestore();
  });

  it("distingue JWT expirado", async () => {
    const warning = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const token = jwt.sign(
      { userId: existingUser.id, email: existingUser.email, role: existingUser.role },
      TEST_SECRET,
      { expiresIn: -1 },
    );
    const res = response();

    await auth.ensureAuthenticated(
      request({ authorization: `Bearer ${token}` }),
      res,
      vi.fn(),
    );

    expect(res.status).toHaveBeenCalledWith(401);
    expect(warning).toHaveBeenCalledWith(expect.stringContaining("legacy_jwt_expired"));
    warning.mockRestore();
  });

  it("distingue assinatura inválida", async () => {
    const warning = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const token = jwt.sign(
      { userId: existingUser.id, email: existingUser.email },
      "different-signing-secret",
    );
    const res = response();

    await auth.ensureAuthenticated(
      request({ authorization: `Bearer ${token}` }),
      res,
      vi.fn(),
    );

    expect(res.status).toHaveBeenCalledWith(401);
    expect(warning).toHaveBeenCalledWith(expect.stringContaining("legacy_jwt_invalid_signature"));
    warning.mockRestore();
  });

  it("rejeita JWT cujo e-mail não corresponde a usuário existente", async () => {
    mocks.getUserByEmail.mockResolvedValue(null);
    const warning = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const token = auth.generateToken("missing-user", "missing@example.com");
    const res = response();

    await auth.ensureAuthenticated(
      request({ authorization: `Bearer ${token}` }),
      res,
      vi.fn(),
    );

    expect(res.status).toHaveBeenCalledWith(401);
    expect(warning).toHaveBeenCalledWith(expect.stringContaining("legacy_jwt_user_not_found"));
    expect(mocks.createUser).not.toHaveBeenCalled();
    warning.mockRestore();
  });
});