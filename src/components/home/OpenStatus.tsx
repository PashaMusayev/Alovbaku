"use client";

import clsx from "clsx";
import { useI18n } from "@/i18n/client";
import { getOpenStatus, todayHours, zonedNow } from "@/lib/hours";
import { useNow } from "@/lib/use-now";
import type { WeekdayHours } from "@/lib/types";

/** Live open/closed pill + today's hours, computed in the browser in Baku time. */
export function OpenStatus({
  hours,
  timezone,
  className,
}: {
  hours: WeekdayHours[];
  timezone: string;
  className?: string;
}) {
  const { dict, f } = useI18n();
  const nowMs = useNow();

  if (nowMs === null) {
    // Same two-row footprint as the real content to avoid layout shift.
    return (
      <span className={clsx("flex flex-col gap-1", className)} aria-hidden="true">
        <span className="h-7 w-32 animate-pulse rounded-full bg-coal-700" />
        <span className="h-5 w-40 animate-pulse rounded bg-coal-700" />
      </span>
    );
  }

  const now = zonedNow(new Date(nowMs), timezone);
  const status = getOpenStatus(hours, now);
  const today = todayHours(hours, now);
  const todayText =
    today && !today.isClosed
      ? f(dict.info.todayHours, { hours: `${today.open}–${today.close}` })
      : dict.info.closedToday;

  let detail: string;
  if (status.isOpen) detail = f(dict.info.closesAt, { time: status.closesAt });
  else if (!status.nextOpen) detail = "";
  else if (status.nextOpen.inDays === 0) detail = f(dict.info.opensAt, { time: status.nextOpen.time });
  else
    detail = f(dict.info.opensAtDay, {
      day: status.nextOpen.inDays === 1 ? dict.hours.tomorrow : dict.hours.weekdays[status.nextOpen.day],
      time: status.nextOpen.time,
    });

  return (
    <span className={clsx("flex flex-col gap-1 text-sm", className)} role="status">
      <span className="flex flex-wrap items-center gap-x-2">
        <span
          className={clsx(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-semibold",
            status.isOpen ? "bg-ok-500/15 text-ok-500" : "bg-ember-500/20 text-flame-300",
          )}
        >
          <span className={clsx("h-2 w-2 rounded-full", status.isOpen ? "animate-pulse bg-ok-500" : "bg-ember-500")} />
          {status.isOpen ? dict.info.open : dict.info.closed}
        </span>
        <span className="text-cream-200">{detail}</span>
      </span>
      <span className="leading-5 text-cream-400">{todayText}</span>
    </span>
  );
}
