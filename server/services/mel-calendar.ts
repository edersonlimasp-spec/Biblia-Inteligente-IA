export const MEL_TIME_ZONE = "America/Sao_Paulo";

/** Get a stable YYYY-MM-DD calendar date in the Mel timezone. */
export function melDate(value: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: MEL_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(value);
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

/** Find the exact UTC instant when a Sao Paulo calendar date begins. */
export function melStartOfDayUtc(day: string): Date {
  const targetMidnight = Date.parse(`${day}T00:00:00.000Z`);
  let low = targetMidnight - 36 * 60 * 60 * 1000;
  let high = targetMidnight + 36 * 60 * 60 * 1000;
  while (high - low > 1) {
    const middle = Math.floor((low + high) / 2);
    if (melDate(new Date(middle)) < day) low = middle;
    else high = middle;
  }
  return new Date(high);
}

/** Calendar arithmetic on UTC date-only values avoids DST-dependent durations. */
export function addCalendarDays(day: string, amount: number): string {
  const date = new Date(`${day}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

/** Monday-based week key for a date-only value. */
export function mondayWeekKey(day: string): string {
  const date = new Date(`${day}T00:00:00.000Z`);
  const daysSinceMonday = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - daysSinceMonday);
  return date.toISOString().slice(0, 10);
}

/**
 * Streaks count actual study dates only. A single missing date per Monday-based
 * week may be crossed (except today, which is not granted as a grace day).
 */
export function calculateMelStreaks(activityDates: Iterable<string>, today: string): {
  streak: number;
  bestStreak: number;
  lastActivityDate: string | null;
} {
  const dates = Array.from(new Set(Array.from(activityDates).filter((date) => date <= today))).sort();
  if (dates.length === 0) return { streak: 0, bestStreak: 0, lastActivityDate: null };

  const dateSet = new Set(dates);
  const lastActivityDate = dates[dates.length - 1];
  const validWindowCounts = (endDay: string): { suffix: number; longest: number } => {
    const window: { day: string; active: boolean }[] = [];
    const missedByWeek = new Map<string, number>();
    let activeDays = 0;
    let longest = 0;
    let overLimitWeeks = 0;
    for (let day = dates[0]; day <= endDay; day = addCalendarDays(day, 1)) {
      const active = dateSet.has(day);
      window.push({ day, active });
      if (active) activeDays++;
      else {
        const week = mondayWeekKey(day);
        const previousMisses = missedByWeek.get(week) ?? 0;
        if (previousMisses === 1) overLimitWeeks++;
        missedByWeek.set(week, previousMisses + 1);
      }

      // Slide the start forward instead of dropping the whole run when a
      // second absence lands in the same week. This preserves valid suffixes.
      while (overLimitWeeks > 0) {
        const removed = window.shift()!;
        if (removed.active) activeDays--;
        else {
          const week = mondayWeekKey(removed.day);
          const previousMisses = missedByWeek.get(week) ?? 1;
          const remaining = previousMisses - 1;
          if (previousMisses > 1 && remaining === 1) overLimitWeeks--;
          if (remaining === 0) missedByWeek.delete(week);
          else missedByWeek.set(week, remaining);
        }
      }
      longest = Math.max(longest, activeDays);
    }
    return { suffix: activeDays, longest };
  };

  // Today cannot be spent as a grace day. If it has no activity, keep current
  // streak anchored to yesterday while still permitting one gap in each week.
  const currentAnchor = dateSet.has(today) ? today : addCalendarDays(today, -1);
  const currentStreak = validWindowCounts(currentAnchor).suffix;
  const bestStreak = validWindowCounts(lastActivityDate).longest;
  return { streak: currentStreak, bestStreak, lastActivityDate };
}

export function melStreakMilestone(streak: number): number | null {
  const milestones = [7, 30, 100, 365];
  return milestones.includes(streak) ? streak : null;
}