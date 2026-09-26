import type { OpeningHoursDay } from "./types";

export const RESTAURANT_TIMEZONE = "Asia/Baku";

export interface ZonedTime {
  /** 0 = Sunday … 6 = Saturday */
  day: number;
  /** Minutes since local midnight. */
  minutes: number;
}

export interface NextOpening {
  day: number;
  time: string;
  /** 0 = later today, 1 = tomorrow, … */
  daysFromNow: number;
}

export interface OpenState {
  isOpen: boolean;
  /** Today's configured hours (in restaurant time), even if we are closed now. */
  today: OpeningHoursDay | null;
  /** When open: the time the current shift ends ("01:00"). */
  closesAt: string | null;
  /** When closed: the next opening. Null if the restaurant has no open days at all. */
  nextOpening: NextOpening | null;
}

const WEEKDAYS: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

export function parseTime(hhmm: string): number {
  const match = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!match) throw new Error(`Invalid time "${hhmm}"`);
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h > 24 || m > 59 || (h === 24 && m !== 0)) throw new Error(`Invalid time "${hhmm}"`);
  return h * 60 + m;
}

/** Current weekday and minute-of-day in the given IANA timezone. */
export function zonedTime(date: Date, timeZone: string = RESTAURANT_TIMEZONE): ZonedTime {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return {
    day: WEEKDAYS[get("weekday")] ?? 0,
    minutes: (Number(get("hour")) % 24) * 60 + Number(get("minute")),
  };
}

function findDay(hours: OpeningHoursDay[], day: number): OpeningHoursDay | null {
  return hours.find((h) => h.day === day) ?? null;
}

/** A shift whose close time is not after its open time runs past midnight. */
function isOvernight(shift: OpeningHoursDay): boolean {
  return parseTime(shift.close) <= parseTime(shift.open);
}

export function getOpenStateAt(hours: OpeningHoursDay[], now: ZonedTime): OpenState {
  const today = findDay(hours, now.day);
  const yesterday = findDay(hours, (now.day + 6) % 7);
  const m = now.minutes;

  // Tail of yesterday's overnight shift (e.g. 00:30 when yesterday was 11:00–01:00).
  if (yesterday && !yesterday.closed && isOvernight(yesterday) && m < parseTime(yesterday.close)) {
    return { isOpen: true, today, closesAt: yesterday.close, nextOpening: null };
  }

  if (today && !today.closed) {
    const open = parseTime(today.open);
    const close = parseTime(today.close);
    const inShift = isOvernight(today) ? m >= open : m >= open && m < close;
    if (inShift) return { isOpen: true, today, closesAt: today.close, nextOpening: null };
    if (m < open) {
      return { isOpen: false, today, closesAt: null, nextOpening: { day: now.day, time: today.open, daysFromNow: 0 } };
    }
  }

  for (let offset = 1; offset <= 7; offset++) {
    const day = (now.day + offset) % 7;
    const shift = findDay(hours, day);
    if (shift && !shift.closed) {
      return { isOpen: false, today, closesAt: null, nextOpening: { day, time: shift.open, daysFromNow: offset } };
    }
  }
  return { isOpen: false, today, closesAt: null, nextOpening: null };
}

export function getOpenState(
  hours: OpeningHoursDay[],
  date: Date = new Date(),
  timeZone: string = RESTAURANT_TIMEZONE,
): OpenState {
  return getOpenStateAt(hours, zonedTime(date, timeZone));
}
