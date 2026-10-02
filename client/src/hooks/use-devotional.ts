import { useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/queryClient";
import type {
  DevotionalContent,
  DevotionalJournal,
  DevotionalJournalInput,
  DevotionalMoment,
  DevotionalRoutine,
} from "@shared/devotional";
import { getMelDate } from "@/lib/mel-date";
import { melStatusQueryKey, useMel } from "@/hooks/useMel";
import { devotionalJournalKey } from "@/lib/devotional-query-keys";

export { devotionalJournalKey } from "@/lib/devotional-query-keys";

export const devotionalMomentKey = (date: string, routine: DevotionalRoutine, version: string) =>
  ["/api/devotionals/today", date, routine, version] as const;
export const devotionalAdminKey = (from: string) => ["/api/admin/devotionals", from] as const;

export function useDevotionalMoment(date: string, routine: DevotionalRoutine, version: string) {
  return useQuery<DevotionalMoment>({
    queryKey: devotionalMomentKey(date, routine, version),
    queryFn: async () => (await apiRequest(
      "GET",
      `/api/devotionals/today?date=${encodeURIComponent(date)}&routine=${routine}&version=${encodeURIComponent(version)}`,
    )).json(),
    staleTime: 60_000,
    retry: 1,
  });
}

export function useDevotionalJournal(date: string, routine: DevotionalRoutine) {
  const { user } = useAuth();
  const { sessionGeneration } = useMel();
  return useQuery<DevotionalJournal>({
    queryKey: devotionalJournalKey(date, routine, user?.id ?? "guest", sessionGeneration),
    enabled: !!user,
    queryFn: async () => (await apiRequest(
      "GET",
      `/api/devotionals/journal?date=${encodeURIComponent(date)}&routine=${routine}`,
    )).json(),
    staleTime: 15_000,
  });
}

export function useSaveDevotionalJournal(date: string, routine: DevotionalRoutine) {
  const { user } = useAuth();
  const { sessionGeneration } = useMel();
  const client = useQueryClient();
  const identity = `${user?.id ?? "guest"}:${sessionGeneration}`;
  const currentIdentity = useRef(identity);
  currentIdentity.current = identity;
  return useMutation({
    mutationFn: async (input: DevotionalJournalInput) => {
      if (!user?.id || currentIdentity.current !== identity) throw new Error("Sua sessão mudou. Entre novamente para salvar.");
      return (await apiRequest(
        "PUT",
        `/api/devotionals/journal?date=${encodeURIComponent(date)}&routine=${routine}`,
        input,
      )).json() as Promise<DevotionalJournal>;
    },
    onSuccess: (journal) => {
      if (currentIdentity.current === identity && user?.id) {
        client.setQueryData(devotionalJournalKey(date, routine, user.id, sessionGeneration), journal);
      }
    },
  });
}

export function useCompleteDevotional(date: string, routine: DevotionalRoutine) {
  const { user } = useAuth();
  const { sessionGeneration } = useMel();
  const client = useQueryClient();
  const identity = `${user?.id ?? "guest"}:${sessionGeneration}`;
  const currentIdentity = useRef(identity);
  currentIdentity.current = identity;
  return useMutation({
    mutationFn: async () => {
      if (!user?.id || currentIdentity.current !== identity) throw new Error("Sua sessão mudou. Entre novamente para concluir.");
      return (await apiRequest("POST", "/api/devotionals/complete", { date, routine })).json() as Promise<{ completed: true; status: import("@shared/mel").MelStatus }>;
    },
    onSuccess: () => {
      if (currentIdentity.current !== identity || !user?.id) return;
      void client.invalidateQueries({ queryKey: melStatusQueryKey(user.id) });
      void client.invalidateQueries({ queryKey: devotionalJournalKey(date, routine, user.id, sessionGeneration) });
    },
  });
}

export function useCreateDevotionalPrayer() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ date, routine }: { date: string; routine: DevotionalRoutine }) =>
      (await apiRequest("POST", "/api/devotionals/prayer", { date, routine })).json() as Promise<{ listId: string; requestId: string }>,
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["/api/prayer/lists"] });
      void client.invalidateQueries({ queryKey: ["/api/prayer/requests"] });
    },
  });
}

export type AdminDevotionalRow = DevotionalContent & { id: string };
export function useAdminDevotionals(from: string) {
  return useQuery<AdminDevotionalRow[]>({
    queryKey: devotionalAdminKey(from),
    queryFn: async () => (await apiRequest("GET", `/api/admin/devotionals?from=${encodeURIComponent(from)}`)).json(),
  });
}

export function useGenerateDevotionals(from: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async () => (await apiRequest("POST", "/api/admin/devotionals/generate", { startDate: from, days: 30 })).json() as Promise<{ created: number; skipped: number; failed: number; message: string }>,
    onSuccess: () => client.invalidateQueries({ queryKey: devotionalAdminKey(from) }),
  });
}

export function useUpdateAdminDevotional(from: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, content }: { id: string; content: DevotionalContent }) =>
      (await apiRequest("PUT", `/api/admin/devotionals/${encodeURIComponent(id)}`, content)).json() as Promise<AdminDevotionalRow>,
    onSuccess: () => client.invalidateQueries({ queryKey: devotionalAdminKey(from) }),
  });
}

export function getDevotionalToday() {
  return getMelDate();
}