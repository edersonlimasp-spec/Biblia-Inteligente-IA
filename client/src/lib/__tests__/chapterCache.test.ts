// Testes do cache offline de capítulos (IndexedDB + migração do localStorage).
// Usa fake-indexeddb; cada teste recria o módulo e o banco para isolar o
// estado interno (dbPromise/migrationPromise são cacheados no módulo).
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { IDBFactory } from "fake-indexeddb";

const LEGACY_PREFIX = "library_chapter_cache:";
const DAY_MS = 24 * 60 * 60 * 1000;

type CacheModule = typeof import("../chapterCache");

async function freshModule(): Promise<CacheModule> {
  vi.resetModules();
  return await import("../chapterCache");
}

beforeEach(() => {
  // Banco IndexedDB limpo e localStorage limpo antes de cada teste.
  globalThis.indexedDB = new IDBFactory();
  localStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("save/load básico", () => {
  it("salva e carrega um capítulo", async () => {
    const cache = await freshModule();
    const data = { title: "Cap 1", content: "No princípio..." };
    await cache.saveChapterToCache("user1", "book1", 1, data);
    const loaded = await cache.loadChapterFromCache("user1", "book1", 1);
    expect(loaded).toEqual(data);
    expect(await cache.isChapterCached("user1", "book1", 1)).toBe(true);
  });

  it("retorna null para capítulo não cacheado", async () => {
    const cache = await freshModule();
    expect(await cache.loadChapterFromCache("user1", "book1", 99)).toBeNull();
    expect(await cache.isChapterCached("user1", "book1", 99)).toBe(false);
  });

  it("escopa o cache por usuário e por livro", async () => {
    const cache = await freshModule();
    await cache.saveChapterToCache("user1", "book1", 1, "conteudo");
    expect(await cache.loadChapterFromCache("user2", "book1", 1)).toBeNull();
    expect(await cache.loadChapterFromCache("user1", "book2", 1)).toBeNull();
  });

  it("clearBookChapterCache remove só os capítulos daquele livro/usuário", async () => {
    const cache = await freshModule();
    await cache.saveChapterToCache("user1", "book1", 1, "a");
    await cache.saveChapterToCache("user1", "book1", 2, "b");
    await cache.saveChapterToCache("user1", "book2", 1, "c");
    await cache.clearBookChapterCache("user1", "book1");
    expect(await cache.isChapterCached("user1", "book1", 1)).toBe(false);
    expect(await cache.isChapterCached("user1", "book1", 2)).toBe(false);
    expect(await cache.isChapterCached("user1", "book2", 1)).toBe(true);
  });
});

describe("expiração de 7 dias (TTL)", () => {
  it("capítulo não-fixado expira após 7 dias", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-07-01T12:00:00Z"));
    const cache = await freshModule();
    await cache.saveChapterToCache("u", "b", 1, "texto");

    // 6 dias depois: ainda válido
    vi.setSystemTime(new Date("2026-07-07T12:00:00Z"));
    expect(await cache.loadChapterFromCache("u", "b", 1)).toBe("texto");

    // 8 dias depois: expirado
    vi.setSystemTime(new Date("2026-07-09T12:00:00Z"));
    expect(await cache.loadChapterFromCache("u", "b", 1)).toBeNull();
    expect(await cache.isChapterCached("u", "b", 1)).toBe(false);
  });

  it("capítulo fixado (pinned) NÃO expira", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-07-01T12:00:00Z"));
    const cache = await freshModule();
    await cache.saveChapterToCache("u", "b", 1, "baixado", { pinned: true });

    // 30 dias depois
    vi.setSystemTime(new Date("2026-07-31T12:00:00Z"));
    expect(await cache.loadChapterFromCache("u", "b", 1)).toBe("baixado");
    expect(await cache.isChapterCached("u", "b", 1)).toBe(true);
  });

  it("regravar online não rebaixa um capítulo já fixado", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-07-01T12:00:00Z"));
    const cache = await freshModule();
    await cache.saveChapterToCache("u", "b", 1, "v1", { pinned: true });
    // Releitura online salva sem pinned — deve continuar fixado
    await cache.saveChapterToCache("u", "b", 1, "v2");

    vi.setSystemTime(new Date("2026-08-15T12:00:00Z"));
    expect(await cache.loadChapterFromCache("u", "b", 1)).toBe("v2");
  });

  it("pruneExpiredChapterCache remove expirados e preserva fixados", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-07-01T12:00:00Z"));
    const cache = await freshModule();
    await cache.saveChapterToCache("u", "b", 1, "velho");
    await cache.saveChapterToCache("u", "b", 2, "fixado", { pinned: true });

    vi.setSystemTime(new Date("2026-07-20T12:00:00Z"));
    await cache.saveChapterToCache("u", "b", 3, "novo");
    await cache.pruneExpiredChapterCache();

    expect(await cache.isChapterCached("u", "b", 1)).toBe(false);
    expect(await cache.isChapterCached("u", "b", 2)).toBe(true);
    expect(await cache.isChapterCached("u", "b", 3)).toBe(true);
  });
});

describe("migração legada do localStorage", () => {
  it("migra entradas válidas do localStorage para o IndexedDB e as remove de lá", async () => {
    const savedAt = Date.now() - 1 * DAY_MS;
    localStorage.setItem(
      `${LEGACY_PREFIX}user1:book1:3`,
      JSON.stringify({ savedAt, data: { content: "legado" } })
    );
    const cache = await freshModule();

    const loaded = await cache.loadChapterFromCache("user1", "book1", 3);
    expect(loaded).toEqual({ content: "legado" });
    // Entrada legada removida do localStorage
    expect(localStorage.getItem(`${LEGACY_PREFIX}user1:book1:3`)).toBeNull();
  });

  it("não migra entradas legadas já expiradas (> 7 dias), mas as remove", async () => {
    const savedAt = Date.now() - 10 * DAY_MS;
    const key = `${LEGACY_PREFIX}user1:book1:5`;
    localStorage.setItem(key, JSON.stringify({ savedAt, data: "velho" }));
    const cache = await freshModule();

    expect(await cache.loadChapterFromCache("user1", "book1", 5)).toBeNull();
    expect(localStorage.getItem(key)).toBeNull();
  });

  it("ignora e remove entradas legadas corrompidas sem quebrar", async () => {
    const key = `${LEGACY_PREFIX}user1:book1:7`;
    localStorage.setItem(key, "não é json {");
    localStorage.setItem("outra_chave_qualquer", "preservar");
    const cache = await freshModule();

    expect(await cache.loadChapterFromCache("user1", "book1", 7)).toBeNull();
    expect(localStorage.getItem(key)).toBeNull();
    // Chaves não relacionadas ficam intactas
    expect(localStorage.getItem("outra_chave_qualquer")).toBe("preservar");
  });

  it("não sobrescreve registro já existente no IndexedDB", async () => {
    // Primeiro grava no IndexedDB
    let cache = await freshModule();
    await cache.saveChapterToCache("u", "b", 1, "novo-formato");
    // Depois aparece uma entrada legada com a mesma chave (cenário raro)
    localStorage.setItem(
      `${LEGACY_PREFIX}u:b:1`,
      JSON.stringify({ savedAt: Date.now(), data: "legado" })
    );
    // Novo boot do app (módulo recarregado, mesmo banco)
    cache = await freshModule();
    expect(await cache.loadChapterFromCache("u", "b", 1)).toBe("novo-formato");
  });

  it("migração preserva savedAt legado: entrada migrada ainda expira no prazo original", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-07-10T12:00:00Z"));
    const savedAt = new Date("2026-07-05T12:00:00Z").getTime(); // 5 dias atrás
    localStorage.setItem(
      `${LEGACY_PREFIX}u:b:2`,
      JSON.stringify({ savedAt, data: "migrado" })
    );
    const cache = await freshModule();
    expect(await cache.loadChapterFromCache("u", "b", 2)).toBe("migrado");

    // 3 dias depois (8 dias desde savedAt original): expirado
    vi.setSystemTime(new Date("2026-07-13T12:00:00Z"));
    expect(await cache.loadChapterFromCache("u", "b", 2)).toBeNull();
  });
});

describe("isNetworkError (fallback offline do leitor)", () => {
  it("TypeError (fetch sem rede) conta como erro de rede", async () => {
    const cache = await freshModule();
    expect(cache.isNetworkError(new TypeError("Failed to fetch"))).toBe(true);
  });

  it("erros HTTP/aplicação NÃO contam como erro de rede", async () => {
    const cache = await freshModule();
    expect(cache.isNetworkError(new Error("401: Unauthorized"))).toBe(false);
    expect(cache.isNetworkError("qualquer coisa")).toBe(false);
  });

  it("navigator.onLine === false conta como offline", async () => {
    const cache = await freshModule();
    const spy = vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
    expect(cache.isNetworkError(new Error("qualquer"))).toBe(true);
    spy.mockRestore();
  });
});

describe("tamanho do cache", () => {
  it("getBookCacheSize conta capítulos válidos e estima bytes", async () => {
    const cache = await freshModule();
    await cache.saveChapterToCache("u", "b", 1, { content: "abc" });
    await cache.saveChapterToCache("u", "b", 2, { content: "defg" }, { pinned: true });
    await cache.saveChapterToCache("u", "outro", 1, { content: "x" });
    const { chapters, bytes } = await cache.getBookCacheSize("u", "b");
    expect(chapters).toBe(2);
    expect(bytes).toBeGreaterThan(0);
  });
});
