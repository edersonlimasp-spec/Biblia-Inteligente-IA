import type { MelStatus } from "@shared/mel";

export type MelVisualScene =
  | "idle"
  | "welcome"
  | "morning"
  | "continue"
  | "reading"
  | "complete"
  | "milestone"
  | "saudade"
  | "sleeping"
  | "praying"
  | "peeking";

export const MEL_VISUAL_SESSION_KEY = "mel-visual-startup-opening";
const SAO_PAULO_TIME_ZONE = "America/Sao_Paulo";

export function getSaoPauloHour(date = new Date()): number {
  const hour = new Intl.DateTimeFormat("pt-BR", {
    timeZone: SAO_PAULO_TIME_ZONE,
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date).find((part) => part.type === "hour")?.value;
  return Number(hour ?? 0);
}

export function isMelSleepingHour(hour: number): boolean {
  return hour >= 22 || hour < 7;
}

export function getActivityGapDays(lastActivityDate: string | null | undefined, today: string): number {
  if (!lastActivityDate || !/^\d{4}-\d{2}-\d{2}$/.test(lastActivityDate) || !/^\d{4}-\d{2}-\d{2}$/.test(today)) {
    return 0;
  }
  const last = Date.parse(`${lastActivityDate}T00:00:00Z`);
  const current = Date.parse(`${today}T00:00:00Z`);
  if (!Number.isFinite(last) || !Number.isFinite(current)) return 0;
  return Math.max(0, Math.floor((current - last) / 86_400_000));
}

export function getMelStartupScene(
  status: MelStatus | undefined,
  today: string,
  hour: number,
): MelVisualScene {
  // Startup precedence is intentional: sleeping > saudade > morning > continue > welcome.
  if (isMelSleepingHour(hour)) return "sleeping";
  if (status?.mood === "saudade" && getActivityGapDays(status.lastActivityDate, today) >= 2) return "saudade";
  if (hour >= 7 && hour < 12 && !status?.completedToday) return "morning";
  if (status?.position) return "continue";
  return "welcome";
}

export function getMelContextScene(currentScreen: string): MelVisualScene | null {
  const screen = currentScreen.toLowerCase();
  if (
    /login|register|sign-in|sign-up|forgot|reset|subscription|billing|payment|pagamento|checkout|admin|splash|privacy|terms|legal/.test(screen)
  ) {
    return null;
  }

  switch (screen) {
    case "dashboard":
      return "peeking";
    case "bible":
      return "reading";
    case "prayer":
    case "mel-devotional":
      return "praying";
    case "lesson":
    case "module-detail":
    case "professor-premium":
    case "professor":
    case "ai-modes":
    case "plan-day":
    case "plans-progress":
    case "recordings":
    case "atlas":
    case "history":
    case "hymns":
    case "bookmarks":
    case "calendar":
    case "settings":
    case "library":
    case "library-book":
    case "library-reader":
    case "study":
    case "install":
      return "peeking";
    default:
      return null;
  }
}

export function isMelMilestone(streak: number | undefined): boolean {
  return streak !== undefined && [7, 30, 100, 365].includes(streak);
}

export function createMelStartupGate() {
  let claimedInThisModule = false;
  return {
    claim(storage: Pick<Storage, "getItem" | "setItem"> | null, openingId: string): boolean {
      if (claimedInThisModule) return false;
      try {
        if (storage?.getItem(MEL_VISUAL_SESSION_KEY) === openingId) {
          claimedInThisModule = true;
          return false;
        }
        storage?.setItem(MEL_VISUAL_SESSION_KEY, openingId);
      } catch {
        // A denied storage permission must not prevent a one-time entrance this page load.
      }
      claimedInThisModule = true;
      return true;
    },
  };
}

const melStartupGate = createMelStartupGate();
const openingId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

export function claimMelStartupEntrance(): boolean {
  let storage: Storage | null = null;
  try {
    storage = typeof window === "undefined" ? null : window.sessionStorage;
  } catch {
    // claim() still enforces the per-module guard when storage is unavailable.
  }
  return melStartupGate.claim(storage, openingId);
}