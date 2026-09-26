import { describe, expect, it } from "vitest";
import { getOpenStatus, zonedNow } from "./hours";
import type { WeekdayHours } from "./types";

const week = (open: string, close: string, closedDays: number[] = []): WeekdayHours[] =>
  [0, 1, 2, 3, 4, 5, 6].map((day) => ({ day, open, close, isClosed: closedDays.includes(day) }));
const at = (day: number, hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return { day, minutes: h * 60 + m };
};

describe("getOpenStatus", () => {
  it("is open during a same-day shift", () => {
    expect(getOpenStatus(week("11:00", "23:00"), at(1, "12:00"))).toEqual({ isOpen: true, closesAt: "23:00" });
  });
  it("is closed before opening and reports today's opening time", () => {
    expect(getOpenStatus(week("11:00", "23:00"), at(1, "09:30"))).toEqual({
      isOpen: false,
      nextOpen: { day: 1, time: "11:00", inDays: 0 },
    });
  });
  it("handles shifts past midnight (11:00–01:00)", () => {
    const hours = week("11:00", "01:00");
    expect(getOpenStatus(hours, at(5, "23:59")).isOpen).toBe(true);
    expect(getOpenStatus(hours, at(6, "00:30"))).toEqual({ isOpen: true, closesAt: "01:00" });
    expect(getOpenStatus(hours, at(6, "01:00")).isOpen).toBe(false);
  });
  it("uses yesterday's overnight shift even if today is a day off", () => {
    const hours = week("11:00", "02:00", [1]);
    expect(getOpenStatus(hours, at(1, "01:30")).isOpen).toBe(true);
    expect(getOpenStatus(hours, at(1, "12:00"))).toEqual({
      isOpen: false,
      nextOpen: { day: 2, time: "11:00", inDays: 1 },
    });
  });
  it("returns null nextOpen when every day is closed", () => {
    expect(getOpenStatus(week("11:00", "23:00", [0, 1, 2, 3, 4, 5, 6]), at(3, "12:00"))).toEqual({
      isOpen: false,
      nextOpen: null,
    });
  });
});

describe("zonedNow", () => {
  it("converts UTC to Baku time (UTC+4)", () => {
    // 2026-09-26 is a Saturday; 20:30 UTC = 00:30 Sunday in Baku.
    expect(zonedNow(new Date("2026-09-26T20:30:00Z"), "Asia/Baku")).toEqual({ day: 0, minutes: 30 });
  });
});
