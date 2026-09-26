"use client";

import { useEffect, useState } from "react";
import { getOpenState, type OpenState } from "./hours";
import type { OpeningHoursDay } from "./types";

/** Live open/closed state in restaurant time; null until mounted (avoids SSR mismatch). */
export function useOpenState(hours: OpeningHoursDay[], timeZone: string): OpenState | null {
  const [state, setState] = useState<OpenState | null>(null);
  useEffect(() => {
    const update = () => setState(getOpenState(hours, new Date(), timeZone));
    update();
    const timer = setInterval(update, 60_000);
    return () => clearInterval(timer);
  }, [hours, timeZone]);
  return state;
}
