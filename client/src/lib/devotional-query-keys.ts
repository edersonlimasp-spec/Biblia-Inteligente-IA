import type { DevotionalRoutine } from "@shared/devotional";

export const devotionalJournalKey = (
  date: string,
  routine: DevotionalRoutine,
  userId: string,
  sessionGeneration: number,
) => ["/api/devotionals/journal", date, routine, userId, sessionGeneration] as const;