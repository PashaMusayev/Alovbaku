import { describe, expect, it } from "vitest";
import { getOpenState, getOpenStateAt } from "@/lib/hours";
import type { OpeningHoursDay } from "@/lib/types";

const daily = (open: string, close: string): OpeningHoursDay[] =>
  [0, 1, 2, 3, 4, 5, 6].map((day) => ({ day, open, close, closed: false }));
const at = (day: number, hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return { day, minutes: h * 60 + m };
};

describe("getOpenStateAt", () => {
  const hours = daily("11:00", "01:00");

  it("is closed before opening and reports today's opening time", () => {
    const s = getOpenStateAt(hours, at(2, "09:30"));
    expect(s.isOpen).toBe(false);
    expect(s.nextOpening).toEqual({ day: 2, time: "11:00", daysFromNow: 0 });
  });

  it("is open during the shift", () => {
    expect(getOpenStateAt(hours, at(2, "11:00")).isOpen).toBe(true);
    expect(getOpenStateAt(hours, at(2, "23:59")).closesAt).toBe("01:00");
  });

  it("stays open after midnight on the previous day's overnight shift", () => {
    const s = getOpenStateAt(hours, at(3, "00:30"));
    expect(s.isOpen).toBe(true);
    expect(s.closesAt).toBe("01:00");
    expect(getOpenStateAt(hours, at(3, "01:00")).isOpen).toBe(false);
  });

  it("skips closed days when finding the next opening", () => {
    const h = daily("11:00", "22:00").map((d) => (d.day === 1 ? { ...d, closed: true } : d));
    const s = getOpenStateAt(h, at(0, "23:00"));
    expect(s.isOpen).toBe(false);
    expect(s.nextOpening).toEqual({ day: 2, time: "11:00", daysFromNow: 2 });
  });

  it("does not open late-night on a closed day's overnight tail", () => {
    const h = daily("11:00", "01:00").map((d) => (d.day === 1 ? { ...d, closed: true } : d));
    expect(getOpenStateAt(h, at(2, "00:30")).isOpen).toBe(false);
  });

  it("uses Baku time regardless of the server timezone", () => {
    // 2026-09-26 07:30 UTC = 11:30 in Baku (UTC+4), a Saturday.
    const s = getOpenState(hours, new Date("2026-09-26T07:30:00Z"), "Asia/Baku");
    expect(s.isOpen).toBe(true);
    expect(s.today?.day).toBe(6);
  });
});
