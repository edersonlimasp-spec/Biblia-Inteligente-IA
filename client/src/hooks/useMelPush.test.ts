import { act, createElement, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  isNative: false,
  platform: "web" as "web" | "android" | "ios",
  userId: "user-a" as string | null,
  authToken: "auth-token" as string | null,
  permission: { receive: "prompt" },
  permissionAfterRequest: { receive: "granted" },
  token: "fcm-token-1",
  apiRequest: vi.fn(async () => ({})),
  requestPermissions: vi.fn(async () => mocks.permissionAfterRequest),
  checkPermissions: vi.fn(async () => mocks.permission),
  getToken: vi.fn(async () => ({ token: mocks.token })),
  deleteToken: vi.fn(async () => undefined),
  createChannel: vi.fn(async () => undefined),
  addListener: vi.fn(async (_name: string, _listener: (event: any) => void) => ({ remove: vi.fn(async () => undefined) })),
}));

vi.mock("@capacitor/core", () => ({
  Capacitor: {
    isNativePlatform: () => mocks.isNative,
    getPlatform: () => mocks.platform,
  },
}));

vi.mock("@capacitor-firebase/messaging", () => ({
  FirebaseMessaging: {
    checkPermissions: mocks.checkPermissions,
    requestPermissions: mocks.requestPermissions,
    getToken: mocks.getToken,
    deleteToken: mocks.deleteToken,
    createChannel: mocks.createChannel,
    addListener: mocks.addListener,
  },
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: mocks.userId ? { id: mocks.userId } : null,
    token: "auth-token",
    isLoading: false,
  }),
}));

vi.mock("@/lib/queryClient", () => ({
  apiRequest: mocks.apiRequest,
  getAuthToken: () => mocks.authToken,
}));

import { MelPushProvider, useMelPush } from "@/hooks/useMelPush";
import { melPushEnabledForUser } from "@/lib/mel-push";
import { unregisterMelPushForLogout } from "@/lib/mel-push";

let root: Root | null = null;
let host: HTMLDivElement;

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

function PushProbe() {
  const { isNative, isEnabled, isRegistering, enablePush } = useMelPush();
  const [active, setActive] = useState(false);

  return createElement(
    "button",
    {
      type: "button",
      "data-testid": "activate",
      "data-native": String(isNative),
      "data-enabled": String(isEnabled),
      "data-registering": String(isRegistering),
      onClick: async () => setActive(await enablePush()),
    },
    active ? "Ativo" : "Ativar",
  );
}

async function mountProvider() {
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  await act(async () => {
    root?.render(createElement(MelPushProvider, null, createElement(PushProbe)));
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

beforeEach(() => {
  localStorage.clear();
  mocks.isNative = false;
  mocks.platform = "web";
  mocks.userId = "user-a";
  mocks.authToken = "auth-token";
  mocks.permission = { receive: "prompt" };
  mocks.permissionAfterRequest = { receive: "granted" };
  mocks.token = "fcm-token-1";
  mocks.apiRequest.mockClear();
  mocks.requestPermissions.mockClear();
  mocks.checkPermissions.mockClear();
  mocks.getToken.mockClear();
  mocks.deleteToken.mockClear();
  mocks.createChannel.mockClear();
  mocks.addListener.mockClear();
});

afterEach(async () => {
  await act(async () => root?.unmount());
  root = null;
  host?.remove();
  localStorage.clear();
});

describe("native Mel push consent", () => {
  it("does not import or request browser/native push permission on the web", async () => {
    await mountProvider();

    expect(host.querySelector("button")?.getAttribute("data-native")).toBe("false");
    expect(mocks.checkPermissions).not.toHaveBeenCalled();
    expect(mocks.requestPermissions).not.toHaveBeenCalled();
    expect(mocks.getToken).not.toHaveBeenCalled();
  });

  it("does not register or prompt at startup until this account has opted in", async () => {
    mocks.isNative = true;
    mocks.platform = "ios";
    mocks.permission = { receive: "granted" };

    await mountProvider();
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    expect(mocks.requestPermissions).not.toHaveBeenCalled();
    expect(mocks.getToken).not.toHaveBeenCalled();
    expect(mocks.apiRequest).not.toHaveBeenCalled();
  });

  it("waits for the explicit activation action before requesting permission", async () => {
    mocks.isNative = true;
    mocks.platform = "android";
    await mountProvider();
    expect(mocks.requestPermissions).not.toHaveBeenCalled();

    await act(async () => {
      host.querySelector("button")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    expect(mocks.requestPermissions).toHaveBeenCalledOnce();
    expect(mocks.createChannel).toHaveBeenCalledWith(expect.objectContaining({
      id: "mel-reminders",
      name: "Lembretes da Mel",
    }));
    expect(mocks.apiRequest).toHaveBeenCalledWith("POST", "/api/push/tokens", {
      token: "fcm-token-1",
      platform: "android",
    });

    const tokenListener = mocks.addListener.mock.calls.find(
      ([eventName]) => eventName === "tokenReceived",
    )?.[1];
    expect(tokenListener).toBeTypeOf("function");
    const initialRegistrationCount = mocks.apiRequest.mock.calls.length;

    mocks.userId = "user-b";
    await act(async () => {
      root?.render(createElement(MelPushProvider, null, createElement(PushProbe)));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    await act(async () => {
      tokenListener?.({ token: "fcm-token-for-previous-account" });
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(mocks.apiRequest).toHaveBeenCalledTimes(initialRegistrationCount);
  });

  it("does not register a token when permission resolves after the user changes accounts", async () => {
    mocks.isNative = true;
    mocks.platform = "ios";
    let resolvePermission!: (permission: { receive: string }) => void;
    mocks.requestPermissions.mockImplementationOnce(() => new Promise((resolve) => {
      resolvePermission = resolve;
    }));

    await mountProvider();
    await act(async () => {
      host.querySelector("button")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
      await Promise.resolve();
    });

    mocks.userId = "user-b";
    await act(async () => {
      root?.render(createElement(MelPushProvider, null, createElement(PushProbe)));
    });
    await act(async () => {
      resolvePermission({ receive: "granted" });
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(mocks.getToken).not.toHaveBeenCalled();
    expect(mocks.apiRequest).not.toHaveBeenCalled();
    expect(melPushEnabledForUser("user-a")).toBe(false);
    expect(melPushEnabledForUser("user-b")).toBe(false);
  });

  it("does not send a delayed logout removal under a different session", async () => {
    mocks.isNative = true;
    mocks.platform = "android";
    localStorage.setItem("mel-push-opt-in:user-a", "true");
    let resolveToken!: (result: { token: string }) => void;
    mocks.getToken.mockImplementationOnce(() => new Promise((resolve) => {
      resolveToken = resolve;
    }));

    const unregister = unregisterMelPushForLogout("user-a");
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    mocks.authToken = null;
    await act(async () => {
      resolveToken({ token: "fcm-token-1" });
      await unregister;
    });

    expect(mocks.apiRequest).not.toHaveBeenCalled();
    expect(mocks.deleteToken).toHaveBeenCalledOnce();
    expect(melPushEnabledForUser("user-a")).toBe(false);
  });
});