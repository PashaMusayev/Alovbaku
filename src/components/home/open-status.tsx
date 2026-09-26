"use client";

import { useTranslations } from "next-intl";
import { useOpenState } from "@/lib/use-open-state";
import { useAppData } from "@/components/providers/app-provider";

/** Live open/closed pill. Computed on the client so cached pages never show a stale status. */
export function OpenStatus({ withHours = true }: { withHours?: boolean }) {
  const t = useTranslations();
  const { settings } = useAppData();
  const state = useOpenState(settings.openingHours, settings.timezone);

  if (!state) {
    return (
      <span className="inline-flex h-8 items-center rounded-full bg-coal-800/80 px-3 text-sm text-cream-300" aria-busy="true">
        {t("status.checking")}
      </span>
    );
  }

  let detail = "";
  if (state.isOpen && state.closesAt) detail = t("status.closesAt", { time: state.closesAt });
  else if (state.nextOpening) {
    const { daysFromNow, time, day } = state.nextOpening;
    detail =
      daysFromNow === 0
        ? t("status.opensAt", { time })
        : daysFromNow === 1
          ? t("status.opensTomorrow", { time })
          : t("status.opensOn", { day: t(`days.${day}` as "days.0"), time });
  }
  const todayText =
    withHours && state.today
      ? state.today.closed
        ? t("status.closedToday")
        : t("status.todayHours", { open: state.today.open, close: state.today.close })
      : null;

  return (
    <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 rounded-full bg-coal-900/85 px-3 py-1.5 text-sm ring-1 ring-coal-600 backdrop-blur">
      <span className="inline-flex items-center gap-1.5 font-bold">
        <span
          className={`h-2.5 w-2.5 rounded-full ${state.isOpen ? "bg-emerald-400 shadow-[0_0_10px] shadow-emerald-400" : "bg-ember-500"}`}
          aria-hidden
        />
        <span className={state.isOpen ? "text-emerald-300" : "text-flame-300"}>
          {state.isOpen ? t("status.open") : t("status.closed")}
        </span>
      </span>
      {detail && <span className="text-cream-300">· {detail}</span>}
      {todayText && !state.isOpen && <span className="sr-only">{todayText}</span>}
    </span>
  );
}
