import { useSyncExternalStore } from "react";

export const MEL_VISIBILITY_KEY = "mel-show-on-screen";
const CHANGE_EVENT = "mel:visibility-change";
export const MEL_INTERACTION_EVENT = "mel:open";
export const MEL_CELEBRATION_EVENT = "mel:celebrate";
let fallbackVisibility = true;
let storageInitialized = false;

function readVisibility(): boolean {
  if (typeof window === "undefined") return true;
  if (!storageInitialized) {
    storageInitialized = true;
    try {
      const stored = window.localStorage.getItem(MEL_VISIBILITY_KEY);
      if (stored === "true") fallbackVisibility = true;
      else if (stored === "false") fallbackVisibility = false;
    } catch {
      // Use the in-memory value when local storage is unavailable.
    }
  }
  return fallbackVisibility;
}

function notifySameTab(): void {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(listener: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  const onChange = () => listener();
  const onStorage = (event: StorageEvent) => {
    if (event.key !== MEL_VISIBILITY_KEY && event.key !== null) return;
    storageInitialized = true;
    if (event.newValue === "true") fallbackVisibility = true;
    else if (event.newValue === "false") fallbackVisibility = false;
    else fallbackVisibility = true;
    listener();
  };
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

export function setMelVisibility(visible: boolean): void {
  fallbackVisibility = visible;
  storageInitialized = true;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(MEL_VISIBILITY_KEY, String(visible));
    } catch {
      // The current page still honors the toggle through the in-memory snapshot.
    }
    notifySameTab();
  }
}

export function requestMelInteraction(): void {
  if (typeof window !== "undefined" && readVisibility()) {
    window.dispatchEvent(new CustomEvent(MEL_INTERACTION_EVENT));
  }
}

export function dispatchMelCelebration(message: string, streak?: number): void {
  if (typeof window !== "undefined" && readVisibility()) {
    window.dispatchEvent(new CustomEvent(MEL_CELEBRATION_EVENT, { detail: { message, streak } }));
  }
}

export function useMelVisibility(): {
  enabled: boolean;
  setEnabled: (visible: boolean) => void;
  isMelVisible: boolean;
  setMelVisible: (visible: boolean) => void;
} {
  const enabled = useSyncExternalStore(subscribe, readVisibility, () => true);
  return {
    enabled,
    setEnabled: setMelVisibility,
    isMelVisible: enabled,
    setMelVisible: setMelVisibility,
  };
}