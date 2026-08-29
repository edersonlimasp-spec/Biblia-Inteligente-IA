// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@capacitor/core", () => ({
  Capacitor: {
    getPlatform: () => "ios",
  },
}));

vi.mock("@/hooks/use-device-id", () => ({
  getDeviceId: () => "test-device",
}));

type QueryClientModule = typeof import("../queryClient");

async function freshModule(): Promise<QueryClientModule> {
  vi.resetModules();
  return import("../queryClient");
}

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("transporte JWT persistido", () => {
  it("lê localStorage em cada chamada, sem cópia em memória obsoleta", async () => {
    const client = await freshModule();
    client.setAuthToken("first-token");
    localStorage.setItem("authToken", "persisted-token");

    expect(client.getAuthHeaders()).toMatchObject({
      Authorization: "Bearer persisted-token",
      "x-client-platform": "ios",
    });
  });

  it("revalida uma vez após 401 e repete a chamada Strong", async () => {
    const client = await freshModule();
    client.setAuthToken("old-token");
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      ))
      .mockResolvedValueOnce(new Response(
        JSON.stringify({ id: "user-1" }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ))
      .mockResolvedValueOnce(new Response(
        JSON.stringify({ number: "G915" }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ));

    const response = await client.apiRequestWithAuthRetry("GET", "/api/strong/G915");

    expect(await response.json()).toEqual({ number: "G915" });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[0][1]?.headers).toMatchObject({
      Authorization: "Bearer old-token",
    });
    expect(fetchMock.mock.calls[1][0]).toContain("/api/auth/me");
    expect(fetchMock.mock.calls[2][1]?.headers).toMatchObject({
      Authorization: "Bearer old-token",
    });
  });

  it("não repete revalidação falha para o mesmo token na mesma sessão", async () => {
    const client = await freshModule();
    client.setAuthToken("rejected-token");
    const unauthorized = () => new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { "Content-Type": "application/json" } },
    );
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(unauthorized())
      .mockResolvedValueOnce(unauthorized())
      .mockResolvedValueOnce(unauthorized());

    await expect(
      client.apiRequestWithAuthRetry("GET", "/api/strong/G915"),
    ).rejects.toMatchObject({ status: 401 });
    await expect(
      client.apiRequestWithAuthRetry("GET", "/api/strong/G2191"),
    ).rejects.toMatchObject({ status: 401 });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls.filter(([url]) =>
      String(url).includes("/api/auth/me"),
    )).toHaveLength(1);
  });

  it("não repete a chamada com outra identidade após login concorrente", async () => {
    const client = await freshModule();
    client.setAuthToken("old-token");
    let resolveRevalidation!: (response: Response) => void;
    const delayedRevalidation = new Promise<Response>((resolve) => {
      resolveRevalidation = resolve;
    });
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      ))
      .mockReturnValueOnce(delayedRevalidation);

    const request = client.apiRequestWithAuthRetry("GET", "/api/strong/G915");
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    client.setAuthToken("new-login-token");
    resolveRevalidation(new Response(
      JSON.stringify({ id: "old-user" }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    ));

    await expect(request).rejects.toMatchObject({ status: 401 });
    expect(client.getAuthToken()).toBe("new-login-token");
  });
});