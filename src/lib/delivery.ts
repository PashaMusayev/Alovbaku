import type { PublicDeliveryZone } from "./types";

/** Cheapest fee and lowest minimum across zones — the "from" values shown on the home page. */
export function deliverySummary(zones: PublicDeliveryZone[]): { minFee: number; minOrder: number } | null {
  if (zones.length === 0) return null;
  return {
    minFee: Math.min(...zones.map((z) => z.fee)),
    minOrder: Math.min(...zones.map((z) => z.minOrder)),
  };
}
