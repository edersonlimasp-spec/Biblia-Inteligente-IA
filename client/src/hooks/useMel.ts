import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { MelPosition, MelPreferences as SharedMelPreferences, MelStatus as SharedMelStatus } from "@shared/mel";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getMelDate, millisecondsUntilMelMidnight } from "@/lib/mel-date";
import { createMelPositionSaveQueue, type MelPositionSaveTicket } from "@/lib/mel-position-queue";

export type MelStatus = SharedMelStatus;
export type MelPreferences = SharedMelPreferences;
export type MelMood = MelStatus["mood"];
export type MelReminderPeriod = MelPreferences["reminderPeriod"];
export type MelDailyGoalMinutes = MelPreferences["dailyGoalMinutes"];

export type MelActivity =
  | { kind: "bible"; book: string; chapter: number }
  | { kind: "devotional"; devotionalDate: string };

export const melStatusQueryKey = (userId?: string) => ["/api/mel", userId ?? "guest"] as const;
export const melPreferencesQueryKey = (userId?: string) => ["/api/mel/preferences", userId ?? "guest"] as const;

let activeMelUserId: string | undefined;
let activeMelToken: string | null = null;
let melSessionGeneration = 0;

function registerMelSession(userId: string | undefined, token: string | null) {
  if (activeMelUserId !== userId || activeMelToken !== token) {
    activeMelUserId = userId;
    activeMelToken = token;
    melSessionGeneration += 1;
  }
  return melSessionGeneration;
}

function isCurrentMelSession(userId: string, generation: number) {
  return activeMelUserId === userId && melSessionGeneration === generation;
}

function invalidateMelStatus(userId?: string) {
  if (!userId) return;
  return queryClient.invalidateQueries({ queryKey: melStatusQueryKey(userId) });
}

const melPositionSaveQueue = createMelPositionSaveQueue<MelPosition, unknown>(
  isCurrentMelSession,
  async (ticket) => {
    // Lesson metadata is looked up and verified canonically by the server.
    // Its current route accepts only the stable lesson id and optional media time.
    const payload = ticket.position.kind === "lesson"
      ? {
          kind: ticket.position.kind,
          lessonId: ticket.position.lessonId,
          ...(ticket.position.videoSeconds !== undefined ? { videoSeconds: ticket.position.videoSeconds } : {}),
        }
      : ticket.position;
    const response = await apiRequest("POST", "/api/mel/position", payload);
    const result = await response.json().catch(() => null);
    if (isCurrentMelSession(ticket.userId, ticket.sessionGeneration)) {
      void invalidateMelStatus(ticket.userId);
    }
    return result;
  },
);

export function useMelCalendarToday() {
  const [today, setToday] = useState(() => getMelDate());

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const updateAndSchedule = () => {
      const now = new Date();
      const currentDate = getMelDate(now);
      setToday((previousDate) => previousDate === currentDate ? previousDate : currentDate);
      timer = setTimeout(updateAndSchedule, millisecondsUntilMelMidnight(now) + 50);
    };
    const syncWhenVisible = () => {
      if (document.visibilityState !== "visible") return;
      if (timer) clearTimeout(timer);
      updateAndSchedule();
    };

    timer = setTimeout(updateAndSchedule, millisecondsUntilMelMidnight() + 50);
    document.addEventListener("visibilitychange", syncWhenVisible);
    window.addEventListener("focus", syncWhenVisible);
    return () => {
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", syncWhenVisible);
      window.removeEventListener("focus", syncWhenVisible);
    };
  }, []);

  return today;
}

export function useMel() {
  const { user, token } = useAuth();
  const userId = user?.id;
  const sessionGeneration = registerMelSession(userId, token);
  const today = useMelCalendarToday();
  const statusQuery = useQuery<MelStatus>({
    queryKey: melStatusQueryKey(userId),
    enabled: !!userId,
    queryFn: async () => {
      if (!userId || !isCurrentMelSession(userId, sessionGeneration)) {
        throw new Error("A sessão mudou antes de carregar o status Mel.");
      }
      return (await apiRequest("GET", "/api/mel")).json();
    },
    staleTime: 30_000,
  });

  const previousDateRef = useRef(today);
  useEffect(() => {
    if (previousDateRef.current === today) return;
    previousDateRef.current = today;
    if (userId && isCurrentMelSession(userId, sessionGeneration)) {
      void invalidateMelStatus(userId);
    }
  }, [sessionGeneration, today, userId]);

  const createPositionTicket = useCallback(
    (position: MelPosition) => melPositionSaveQueue.reserve(userId, sessionGeneration, position),
    [sessionGeneration, userId],
  );

  const savePositionTicket = useCallback(
    (ticket: MelPositionSaveTicket<MelPosition> | null) => melPositionSaveQueue.save(ticket),
    [],
  );

  const savePosition = useCallback(
    (position: MelPosition) => savePositionTicket(createPositionTicket(position)),
    [createPositionTicket, savePositionTicket],
  );

  const activityMutation = useMutation({
    mutationFn: async (activity: MelActivity) => {
      if (!userId || !isCurrentMelSession(userId, sessionGeneration)) {
        throw new Error("A sessão mudou antes de registrar a atividade Mel.");
      }
      const response = await apiRequest("POST", "/api/mel/activity", activity);
      return response.json().catch(() => null);
    },
    onSuccess: () => {
      if (userId && isCurrentMelSession(userId, sessionGeneration)) {
        void invalidateMelStatus(userId);
      }
    },
  });

  const recordActivity = useCallback(
    (activity: MelActivity) => {
      if (!userId) return Promise.reject(new Error("Entre na sua conta para salvar sua atividade da Mel."));
      if (!isCurrentMelSession(userId, sessionGeneration)) {
        return Promise.reject(new Error("Sua sessão mudou. Entre novamente antes de registrar a atividade."));
      }
      return activityMutation.mutateAsync(activity);
    },
    [activityMutation.mutateAsync, sessionGeneration, userId],
  );

  const refresh = useCallback(
    () => userId && isCurrentMelSession(userId, sessionGeneration)
      ? invalidateMelStatus(userId)
      : Promise.resolve(),
    [sessionGeneration, userId],
  );

  return {
    status: statusQuery.data,
    isLoading: statusQuery.isLoading,
    error: statusQuery.error,
    today,
    sessionGeneration,
    savePosition,
    createPositionTicket,
    savePositionTicket,
    recordActivity,
    isRecordingActivity: activityMutation.isPending,
    refresh,
    userId,
  };
}

export function useMelPreferences() {
  const { user, token } = useAuth();
  const userId = user?.id;
  const sessionGeneration = registerMelSession(userId, token);
  const preferencesQuery = useQuery<MelPreferences>({
    queryKey: melPreferencesQueryKey(userId),
    enabled: !!userId,
    queryFn: async () => {
      if (!userId || !isCurrentMelSession(userId, sessionGeneration)) {
        throw new Error("A sessão mudou antes de carregar as preferências da Mel.");
      }
      return (await apiRequest("GET", "/api/mel/preferences")).json();
    },
    staleTime: 60_000,
  });

  const updateMutation = useMutation({
    mutationFn: async (preferences: MelPreferences) => {
      if (!userId || !isCurrentMelSession(userId, sessionGeneration)) {
        throw new Error("A sessão mudou antes de salvar as preferências da Mel.");
      }
      const response = await apiRequest("PUT", "/api/mel/preferences", preferences);
      return response.json().catch(() => null);
    },
    onSuccess: () => {
      if (userId && isCurrentMelSession(userId, sessionGeneration)) {
        queryClient.invalidateQueries({ queryKey: melPreferencesQueryKey(userId) });
      }
    },
  });

  return {
    preferences: preferencesQuery.data,
    isLoading: preferencesQuery.isLoading,
    error: preferencesQuery.error,
    savePreferences: updateMutation.mutateAsync,
    isSaving: updateMutation.isPending,
    saveError: updateMutation.error,
    userId,
  };
}