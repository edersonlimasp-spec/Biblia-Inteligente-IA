export const MEL_TIME_ZONE = "America/Sao_Paulo";

export function getMelDate(value: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: MEL_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(value);
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function nextCalendarDate(day: string) {
  const date = new Date(`${day}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

/** Milliseconds until the next São Paulo midnight, including DST transitions. */
export function millisecondsUntilMelMidnight(now: Date = new Date()): number {
  const start = now.getTime();
  const nextDate = nextCalendarDate(getMelDate(now));
  let low = start;
  let high = start + 36 * 60 * 60 * 1000;

  while (getMelDate(new Date(high)) < nextDate) high += 12 * 60 * 60 * 1000;
  for (let iteration = 0; iteration < 42; iteration++) {
    const midpoint = Math.floor((low + high) / 2);
    if (getMelDate(new Date(midpoint)) < nextDate) low = midpoint;
    else high = midpoint;
  }

  return Math.max(1, high - start);
}