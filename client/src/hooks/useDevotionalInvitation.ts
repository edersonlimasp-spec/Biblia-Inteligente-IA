import { useSyncExternalStore } from "react";
import type { DevotionalRoutine } from "@shared/devotional";

const listeners = new Set<() => void>();
const temporaryClosures = new Map<string, string>();
const storageKey = (userId?: string) => `devotional-invitation:${userId ?? "guest"}`;
const periodKey = (date: string, routine: DevotionalRoutine) => `${date}:${routine}`;

export function isDevotionalInvitationClosed(userId: string | undefined, date: string, routine: DevotionalRoutine) {
  if (typeof window === "undefined") return false;
  const key = storageKey(userId);
  let period: string | null | undefined;
  try {
    period = window.localStorage.getItem(key);
  } catch {
    // A visual dismissal still works for this session if device storage is blocked.
    period = temporaryClosures.get(key);
  }
  return period === periodKey(date, routine);
}

export function closeDevotionalInvitation(userId: string | undefined, date: string, routine: DevotionalRoutine) {
  const key = storageKey(userId);
  const period = periodKey(date, routine);
  temporaryClosures.set(key, period);
  try {
    window.localStorage.setItem(key, period);
  } catch {
    // No diary, completion or Mel activity is written by this visual preference.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

export function useDevotionalInvitation(userId: string | undefined, date: string, routine: DevotionalRoutine) {
  const closed = useSyncExternalStore(
    subscribe,
    () => isDevotionalInvitationClosed(userId, date, routine),
    () => false,
  );
  return { closed, close: () => closeDevotionalInvitation(userId, date, routine) };
}