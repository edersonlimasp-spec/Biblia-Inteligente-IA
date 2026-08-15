// Cache offline de capítulos da Biblioteca (IndexedDB).
// - Capítulos visitados durante a leitura ficam no cache por 7 dias.
// - Capítulos baixados explicitamente pelo botão "Baixar" são "fixados"
//   (pinned) e NÃO expiram — só saem se o usuário limpar os dados do app.
// IndexedDB comporta livros inteiros sem o limite de ~5MB do localStorage.
// Entradas antigas do localStorage são migradas automaticamente na primeira
// abertura e removidas de lá.

const LEGACY_PREFIX = "library_chapter_cache:";
const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias (apenas para não-fixados)

const DB_NAME = "library_offline";
const DB_VERSION = 1;
const STORE = "chapters";

interface CacheRecord<T = unknown> {
  key: string; // `${userId}:${bookId}:${chapterNum}`
  savedAt: number;
  pinned: boolean;
  data: T;
}

function keyFor(userId: string, bookId: string, chapterNum: number): string {
  // Escopo por usuário para evitar vazamento entre contas no mesmo aparelho.
  return `${userId}:${bookId}:${chapterNum}`;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB indisponível"));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "key" });
      }
    };
    req.onsuccess = () => {
      const db = req.result;
      // Se o banco for apagado/atualizado por outra aba, reabrir na próxima chamada.
      db.onversionchange = () => { db.close(); dbPromise = null; };
      db.onclose = () => { dbPromise = null; };
      resolve(db);
    };
    req.onerror = () => { dbPromise = null; reject(req.error ?? new Error("Falha ao abrir IndexedDB")); };
    req.onblocked = () => { /* outra aba segurando versão antiga; a promise resolve quando liberar */ };
  });
  return dbPromise;
}

function reqAsPromise<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// Migração legada roda uma única vez, antes de QUALQUER leitura/escrita, para
// que o primeiro acesso offline após a atualização já encontre o cache antigo.
let migrationPromise: Promise<void> | null = null;
function ensureMigrated(): Promise<void> {
  if (!migrationPromise) migrationPromise = migrateLegacyLocalStorage();
  return migrationPromise;
}

// Variantes "raw" (sem migração) — usadas pela própria migração para não
// criar dependência circular/deadlock com ensureMigrated().
async function getRecordRaw(key: string): Promise<CacheRecord | null> {
  const db = await openDb();
  const tx = db.transaction(STORE, "readonly");
  const rec = await reqAsPromise(tx.objectStore(STORE).get(key));
  return (rec as CacheRecord | undefined) ?? null;
}

async function getRecord(key: string): Promise<CacheRecord | null> {
  await ensureMigrated();
  return getRecordRaw(key);
}

async function putRecordRaw(rec: CacheRecord): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(STORE, "readwrite");
  tx.objectStore(STORE).put(rec);
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

async function putRecord(rec: CacheRecord): Promise<void> {
  await ensureMigrated();
  return putRecordRaw(rec);
}

function isExpired(rec: CacheRecord): boolean {
  if (rec.pinned) return false;
  return Date.now() - rec.savedAt > TTL_MS;
}

/**
 * Salva um capítulo no cache. `pinned=true` para downloads explícitos
 * (botão "Baixar") — nunca expiram. Best-effort: falhas são silenciosas.
 */
export async function saveChapterToCache(
  userId: string,
  bookId: string,
  chapterNum: number,
  data: unknown,
  opts?: { pinned?: boolean }
): Promise<void> {
  try {
    const key = keyFor(userId, bookId, chapterNum);
    // Não rebaixar um capítulo já fixado para não-fixado numa releitura online.
    let pinned = opts?.pinned === true;
    if (!pinned) {
      const existing = await getRecord(key).catch(() => null);
      if (existing?.pinned) pinned = true;
    }
    await putRecord({ key, savedAt: Date.now(), pinned, data });
  } catch {
    // cache é best-effort
  }
}

export async function loadChapterFromCache<T = unknown>(
  userId: string,
  bookId: string,
  chapterNum: number
): Promise<T | null> {
  try {
    const rec = await getRecord(keyFor(userId, bookId, chapterNum));
    if (!rec || typeof rec.savedAt !== "number") return null;
    if (isExpired(rec)) return null;
    return rec.data as T;
  } catch {
    return null;
  }
}

/** Verifica se um capítulo está no cache e válido (fixado ou dentro dos 7 dias). */
export async function isChapterCached(
  userId: string,
  bookId: string,
  chapterNum: number
): Promise<boolean> {
  try {
    const rec = await getRecord(keyFor(userId, bookId, chapterNum));
    return !!rec && typeof rec.savedAt === "number" && !isExpired(rec);
  } catch {
    return false;
  }
}

/**
 * Erros de conectividade real (fetch lança TypeError quando não há rede,
 * DNS falha ou a requisição é abortada pelo navegador). Respostas HTTP
 * (401/403/404/500…) NÃO contam — nunca servir cache quando o servidor
 * negou acesso ou retornou erro.
 */
export function isNetworkError(err: unknown): boolean {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return true;
  return err instanceof TypeError;
}

/** Remove todos os capítulos cacheados de um livro para um usuário. */
export async function clearBookChapterCache(userId: string, bookId: string): Promise<void> {
  try {
    await ensureMigrated();
    const prefix = `${userId}:${bookId}:`;
    const db = await openDb();
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    const keys = (await reqAsPromise(store.getAllKeys())) as string[];
    keys.filter(k => typeof k === "string" && k.startsWith(prefix)).forEach(k => store.delete(k));
    await new Promise<void>((resolve) => { tx.oncomplete = () => resolve(); tx.onerror = () => resolve(); });
  } catch {}
}

/**
 * Tamanho aproximado (em bytes) ocupado pelos capítulos cacheados de um
 * livro para um usuário. Aproximação via JSON serializado (UTF-16 → ~2 bytes
 * por caractere seria exagero; usamos o comprimento da string como estimativa
 * conservadora do payload).
 */
export async function getBookCacheSize(
  userId: string,
  bookId: string
): Promise<{ chapters: number; bytes: number }> {
  try {
    await ensureMigrated();
    const prefix = `${userId}:${bookId}:`;
    const db = await openDb();
    const tx = db.transaction(STORE, "readonly");
    const recs = (await reqAsPromise(tx.objectStore(STORE).getAll())) as CacheRecord[];
    let chapters = 0;
    let bytes = 0;
    for (const rec of recs) {
      if (!rec || typeof rec.key !== "string" || !rec.key.startsWith(prefix)) continue;
      if (isExpired(rec)) continue;
      chapters++;
      try {
        bytes += JSON.stringify(rec.data)?.length ?? 0;
      } catch {}
    }
    return { chapters, bytes };
  } catch {
    return { chapters: 0, bytes: 0 };
  }
}

/**
 * Lista os livros com download salvo (ao menos 1 capítulo fixado) para um
 * usuário, com contagem de capítulos e tamanho aproximado — mesma métrica de
 * getBookCacheSize (todos os capítulos válidos do livro, fixados ou não).
 */
export async function listDownloadedBooks(
  userId: string
): Promise<Array<{ bookId: string; chapters: number; bytes: number }>> {
  try {
    await ensureMigrated();
    const prefix = `${userId}:`;
    const db = await openDb();
    const tx = db.transaction(STORE, "readonly");
    const recs = (await reqAsPromise(tx.objectStore(STORE).getAll())) as CacheRecord[];
    const byBook = new Map<string, { chapters: number; bytes: number; pinned: boolean }>();
    for (const rec of recs) {
      if (!rec || typeof rec.key !== "string" || !rec.key.startsWith(prefix)) continue;
      if (isExpired(rec)) continue;
      // key = `${userId}:${bookId}:${chapterNum}` — bookId não contém ":".
      const rest = rec.key.slice(prefix.length);
      const sep = rest.lastIndexOf(":");
      if (sep <= 0) continue;
      const bookId = rest.slice(0, sep);
      const agg = byBook.get(bookId) ?? { chapters: 0, bytes: 0, pinned: false };
      agg.chapters++;
      if (rec.pinned) agg.pinned = true;
      try {
        agg.bytes += JSON.stringify(rec.data)?.length ?? 0;
      } catch {}
      byBook.set(bookId, agg);
    }
    return Array.from(byBook.entries())
      .filter(([, v]) => v.pinned)
      .map(([bookId, v]) => ({ bookId, chapters: v.chapters, bytes: v.bytes }));
  } catch {
    return [];
  }
}

/** Formata bytes em texto legível (ex.: "1,2 MB", "340 KB"). */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 KB";
  if (bytes < 1024) return "menos de 1 KB";
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  const mb = kb / 1024;
  return `${mb.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} MB`;
}

/**
 * Remove entradas NÃO fixadas expiradas (> 7 dias) e migra entradas legadas
 * do localStorage para o IndexedDB. Chamado ao abrir o leitor.
 */
export async function pruneExpiredChapterCache(): Promise<void> {
  await ensureMigrated();
  try {
    const db = await openDb();
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    const recs = (await reqAsPromise(store.getAll())) as CacheRecord[];
    for (const rec of recs) {
      if (!rec || typeof rec.savedAt !== "number" || isExpired(rec)) {
        store.delete(rec.key);
      }
    }
    await new Promise<void>((resolve) => { tx.oncomplete = () => resolve(); tx.onerror = () => resolve(); });
  } catch {}
}

/** Migra o cache antigo (localStorage) para o IndexedDB, preservando savedAt. */
async function migrateLegacyLocalStorage(): Promise<void> {
  try {
    if (typeof localStorage === "undefined") return;
    const legacyKeys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(LEGACY_PREFIX)) legacyKeys.push(k);
    }
    if (legacyKeys.length === 0) return;
    for (const k of legacyKeys) {
      try {
        const raw = localStorage.getItem(k);
        if (raw) {
          const entry = JSON.parse(raw) as { savedAt?: number; data?: unknown } | null;
          if (entry && typeof entry.savedAt === "number" && Date.now() - entry.savedAt <= TTL_MS) {
            const key = k.slice(LEGACY_PREFIX.length); // já é `${userId}:${bookId}:${chapterNum}`
            const existing = await getRecordRaw(key).catch(() => null);
            if (!existing) {
              await putRecordRaw({ key, savedAt: entry.savedAt, pinned: false, data: entry.data });
            }
          }
        }
      } catch {}
      try { localStorage.removeItem(k); } catch {}
    }
  } catch {}
}
