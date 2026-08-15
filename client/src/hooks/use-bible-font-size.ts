import { useEffect, useState } from "react";

export type BibleFontSize = "small" | "medium" | "large" | "xlarge";

const STORAGE_KEY = "bible-font-size";
const EVENT_NAME = "bible-font-size-change";

function readFontSize(): BibleFontSize {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (value === "small" || value === "medium" || value === "large" || value === "xlarge") {
      return value;
    }
  } catch {}
  return "medium";
}

export function setBibleFontSize(size: BibleFontSize) {
  try {
    localStorage.setItem(STORAGE_KEY, size);
  } catch {}
  try {
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: size }));
  } catch {}
}

export function useBibleFontSize(): BibleFontSize {
  const [size, setSize] = useState<BibleFontSize>(() => readFontSize());

  useEffect(() => {
    const handleCustom = (e: Event) => {
      const detail = (e as CustomEvent<BibleFontSize>).detail;
      if (detail === "small" || detail === "medium" || detail === "large" || detail === "xlarge") {
        setSize(detail);
      } else {
        setSize(readFontSize());
      }
    };
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setSize(readFontSize());
    };

    window.addEventListener(EVENT_NAME, handleCustom as EventListener);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(EVENT_NAME, handleCustom as EventListener);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  return size;
}

export function bibleFontSizeClass(size: BibleFontSize): string {
  switch (size) {
    case "small":   return "bible-font-small";
    case "large":   return "bible-font-large";
    case "xlarge":  return "bible-font-xlarge";
    case "medium":
    default:        return "bible-font-medium";
  }
}
