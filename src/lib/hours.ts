import type { WeekdayHours } from "./types";

export const DEFAULT_TIMEZONE = "Asia/Baku";

export interface ZonedNow {
  /** 0 = Sunday … 6 = Saturday */
  day: number;
  /** Minutes since local midnight. */
  minutes: number;
}

export type OpenStatus =
  | { isOpen: true; closesAt: string }
  | {
      isOpen: false;
      /** Null when every day is marked closed. */
      nextOpen: { day: number; time: string; inDays: number } | null;
    };

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + (m || 0);
}

/** Local weekday and time-of-day in the restaurant's timezone. */
export function zonedNow(date: Date, timeZone = DEFAULT_TIMEZONE): ZonedNow {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return {
    day: WEEKDAY_INDEX[get("weekday")] ?? 0,
    minutes: Number(get("hour")) * 60 + Number(get("minute")),
  };
}

function hoursFor(hours: WeekdayHours[], day: number): WeekdayHours | undefined {
  return hours.find((h) => h.day === day);
}

/** True when the shift closes after midnight (e.g. 11:00–02:00). */
function isOvernight(h: WeekdayHours): boolean {
  return toMinutes(h.close) <= toMinutes(h.open);
}

/**
 * Computes whether the restaurant is open at `now` given weekly hours.
 * Handles shifts that cross midnight: Friday 11:00–02:00 means it is still
 * open at 01:30 on Saturday.
 */
export function getOpenStatus(hours: WeekdayHours[], now: ZonedNow): OpenStatus {
  const yesterday = hoursFor(hours, (now.day + 6) % 7);
  if (
    yesterday &&
    !yesterday.isClosed &&
    isOvernight(yesterday) &&
    now.minutes < toMinutes(yesterday.close)
  ) {
    return { isOpen: true, closesAt: yesterday.close };
  }

  const today = hoursFor(hours, now.day);
  if (today && !today.isClosed) {
    const open = toMinutes(today.open);
    const close = toMinutes(today.close);
    const openNow = isOvernight(today)
      ? now.minutes >= open
      : now.minutes >= open && now.minutes < close;
    if (openNow) return { isOpen: true, closesAt: today.close };
  }

  for (let inDays = 0; inDays <= 7; inDays++) {
    const day = (now.day + inDays) % 7;
    const h = hoursFor(hours, day);
    if (!h || h.isClosed) continue;
    if (inDays === 0 && toMinutes(h.open) <= now.minutes) continue;
    return { isOpen: false, nextOpen: { day, time: h.open, inDays } };
  }
  return { isOpen: false, nextOpen: null };
}

export function todayHours(hours: WeekdayHours[], now: ZonedNow): WeekdayHours | undefined {
  return hoursFor(hours, now.day);
}
