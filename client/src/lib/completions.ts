// Histórico de conclusões de estudo (cartão "Seu ritmo")
// Fonte primária: servidor (por usuário). O localStorage é mantido como
// fallback offline e para usuários não logados.

import { apiRequest, queryClient } from "@/lib/queryClient";

export type CompletionEntry = number | { ts: number; type?: string };

const STORAGE_KEY = "study_completions";
const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

export function getLocalCompletions(): CompletionEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function entryTs(entry: CompletionEntry): number {
  return typeof entry === "number" ? entry : entry?.ts ?? 0;
}

export function entryType(entry: CompletionEntry): string | undefined {
  return typeof entry === "number" ? undefined : entry?.type;
}

/**
 * Registra uma conclusão (aula ou capítulo da Biblioteca).
 * Grava sempre no localStorage (fallback offline) e, se o usuário estiver
 * logado, envia também ao servidor para manter o ritmo entre aparelhos.
 */
export function recordStudyCompletion(type?: string): void {
  const now = Date.now();

  // 1) localStorage (fallback offline / não logado)
  try {
    const cutoff = now - NINETY_DAYS_MS;
    const pruned = getLocalCompletions().filter((c) => entryTs(c) > cutoff);
    pruned.push(type ? { ts: now, type } : now);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pruned));
  } catch {
    /* noop */
  }

  // 2) Servidor (fire-and-forget; se falhar, o fallback local cobre)
  const token = localStorage.getItem("authToken");
  if (token) {
    apiRequest("POST", "/api/study/completions", { ts: now, ...(type ? { type } : {}) })
      .then(() => {
        markAsSynced([now]);
        queryClient.invalidateQueries({ queryKey: ["/api/study/completions"] });
      })
      .catch(() => {
        /* offline ou erro — o localStorage já cobre; será sincronizado depois */
      });
  }
}

// -------------------- SINCRONIZAÇÃO (login / voltar a ficar online) --------------------
// Conclusões feitas antes do login (ou offline) ficam apenas no localStorage.
// Ao logar ou reconectar, enviamos as pendentes ao servidor com o ts original.

const SYNCED_KEY = "study_completions_synced";

function getSyncedTs(): number[] {
  try {
    const raw = localStorage.getItem(SYNCED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function markAsSynced(tsList: number[]): void {
  try {
    const cutoff = Date.now() - NINETY_DAYS_MS;
    const merged = Array.from(new Set([...getSyncedTs(), ...tsList])).filter((t) => t > cutoff);
    localStorage.setItem(SYNCED_KEY, JSON.stringify(merged));
  } catch {
    /* noop */
  }
}

let migrateInFlight = false;

/**
 * Migra o progresso de lições feito sem login (associado ao deviceId) para a
 * conta do usuário autenticado. Idempotente e seguro chamar várias vezes.
 */
export async function migrateDeviceStudyProgressToAccount(): Promise<void> {
  if (migrateInFlight) return;
  const token = localStorage.getItem("authToken");
  if (!token) return;

  migrateInFlight = true;
  try {
    const res = await apiRequest("POST", "/api/study/progress/migrate");
    const data = await res.json().catch(() => null);
    if (data && (data.migrated > 0 || data.merged > 0)) {
      // Atualiza listas de módulos/trilhas para refletir o progresso migrado
      queryClient.invalidateQueries({ queryKey: ["/api/study/modules"] });
      queryClient.invalidateQueries({ queryKey: ["/api/study/tracks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/study/lessons"] });
    }
  } catch {
    /* offline ou erro — tenta novamente no próximo login/reconexão */
  } finally {
    migrateInFlight = false;
  }
}

let syncInFlight = false;

/**
 * Envia ao servidor as conclusões locais que ainda não foram sincronizadas.
 * Deduplica por timestamp: compara com o que já existe no servidor (tolerância
 * de 1s) e com o registro local de ts já enviados. Seguro chamar várias vezes.
 */
export async function syncLocalCompletionsToServer(): Promise<void> {
  if (syncInFlight) return;
  const token = localStorage.getItem("authToken");
  if (!token) return;

  const cutoff = Date.now() - NINETY_DAYS_MS;
  const syncedSet = new Set(getSyncedTs());
  const candidates = getLocalCompletions().filter((c) => {
    const t = entryTs(c);
    return t > cutoff && !syncedSet.has(t);
  });
  if (candidates.length === 0) return;

  syncInFlight = true;
  try {
    // Busca o que já existe no servidor para deduplicar
    const res = await apiRequest("GET", "/api/study/completions");
    const server: { ts: number }[] = await res.json();
    const serverTs = server.map((s) => s.ts).sort((a, b) => a - b);
    const existsOnServer = (t: number) =>
      serverTs.some((s) => Math.abs(s - t) < 1000);

    const alreadyThere: number[] = [];
    const pending: CompletionEntry[] = [];
    for (const c of candidates) {
      if (existsOnServer(entryTs(c))) alreadyThere.push(entryTs(c));
      else pending.push(c);
    }
    if (alreadyThere.length > 0) markAsSynced(alreadyThere);

    if (pending.length > 0) {
      const sent: number[] = [];
      for (const c of pending) {
        const ts = entryTs(c);
        const type = entryType(c);
        try {
          await apiRequest("POST", "/api/study/completions", { ts, ...(type ? { type } : {}) });
          sent.push(ts);
        } catch {
          break; // provavelmente offline — tenta de novo na próxima chamada
        }
      }
      if (sent.length > 0) {
        markAsSynced(sent);
        queryClient.invalidateQueries({ queryKey: ["/api/study/completions"] });
      }
    }
  } catch {
    /* offline ou erro — tenta novamente no próximo login/reconexão */
  } finally {
    syncInFlight = false;
  }
}
