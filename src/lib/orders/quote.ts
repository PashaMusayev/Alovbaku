import { getOpenState } from "@/lib/hours";
import { priceSelection } from "@/lib/menu/pricing";
import type { PublicDeliveryZone, PublicMenu, PublicSettings } from "@/lib/types";
import type { Fulfillment } from "./status";

/**
 * Order pricing and rule checks. Pure and shared: the checkout page uses it for
 * display, the order API runs the exact same code on fresh server-side data and
 * never trusts totals sent by the browser.
 */

export interface OrderLineInput {
  itemId: string;
  variantId: string;
  addonIds: string[];
  quantity: number;
}

export interface QuoteInput {
  fulfillment: Fulfillment;
  lines: OrderLineInput[];
  lat?: number | null;
  lng?: number | null;
  /** ISO timestamp for a pre-order, null/undefined = as soon as possible. */
  scheduledFor?: string | null;
}

export type QuoteError =
  | "empty_cart"
  | "invalid_lines"
  | "ordering_disabled"
  | "delivery_disabled"
  | "pickup_disabled"
  | "closed"
  | "preorder_disabled"
  | "invalid_schedule"
  | "out_of_zone"
  | "below_minimum";

export interface QuotedLine extends OrderLineInput {
  unitPrice: number;
  lineTotal: number;
}

export interface Quote {
  lines: QuotedLine[];
  /** Indexes of input lines that are no longer orderable (removed item, out of stock…). */
  invalidLines: number[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  zone: PublicDeliveryZone | null;
  minOrder: number;
  errors: QuoteError[];
}

/** Earliest pre-order: now + this many minutes. Latest: MAX_PREORDER_DAYS ahead. */
export const MIN_PREORDER_LEAD_MINUTES = 30;
export const MAX_PREORDER_DAYS = 7;
export const MAX_LINES = 40;

export function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(bLat - aLat);
  const dLng = rad(bLng - aLng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

/**
 * Smallest zone containing the pin. Without a pin we charge the most expensive
 * zone, so the restaurant is never undercharged (currently all zones are free).
 */
export function pickZone(
  zones: PublicDeliveryZone[],
  restaurant: { lat: number; lng: number },
  lat?: number | null,
  lng?: number | null,
): PublicDeliveryZone | null {
  if (zones.length === 0) return null;
  const sorted = [...zones].sort((a, b) => a.radiusKm - b.radiusKm);
  if (lat == null || lng == null) {
    return sorted.reduce((worst, z) => (z.fee > worst.fee || (z.fee === worst.fee && z.minOrder > worst.minOrder) ? z : worst));
  }
  const d = distanceKm(restaurant.lat, restaurant.lng, lat, lng);
  return sorted.find((z) => d <= z.radiusKm) ?? null;
}

export function validateSchedule(settings: PublicSettings, scheduledFor: string, now: Date): boolean {
  const at = new Date(scheduledFor);
  if (Number.isNaN(at.getTime())) return false;
  const lead = (at.getTime() - now.getTime()) / 60_000;
  if (lead < MIN_PREORDER_LEAD_MINUTES - 1 || lead > MAX_PREORDER_DAYS * 24 * 60) return false;
  return getOpenState(settings.openingHours, at, settings.timezone).isOpen;
}

export function computeQuote(menu: PublicMenu, settings: PublicSettings, input: QuoteInput, now: Date = new Date()): Quote {
  const errors: QuoteError[] = [];
  const lines: QuotedLine[] = [];
  const invalidLines: number[] = [];

  input.lines.slice(0, MAX_LINES).forEach((line, index) => {
    const priced = priceSelection(line, menu.items, menu.addonGroups);
    if ("error" in priced) invalidLines.push(index);
    else lines.push({ ...line, quantity: Math.max(1, Math.floor(line.quantity)), ...priced });
  });
  if (input.lines.length > MAX_LINES) invalidLines.push(...input.lines.slice(MAX_LINES).map((_, i) => MAX_LINES + i));

  if (lines.length === 0) errors.push("empty_cart");
  if (invalidLines.length > 0) errors.push("invalid_lines");
  if (!settings.orderingEnabled) errors.push("ordering_disabled");
  if (input.fulfillment === "delivery" && !settings.deliveryEnabled) errors.push("delivery_disabled");
  if (input.fulfillment === "pickup" && !settings.pickupEnabled) errors.push("pickup_disabled");

  if (input.scheduledFor) {
    if (!settings.preorderEnabled) errors.push("preorder_disabled");
    else if (!validateSchedule(settings, input.scheduledFor, now)) errors.push("invalid_schedule");
  } else if (!getOpenState(settings.openingHours, now, settings.timezone).isOpen) {
    errors.push("closed");
  }

  const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
  let zone: PublicDeliveryZone | null = null;
  let deliveryFee = 0;
  let minOrder = 0;
  if (input.fulfillment === "delivery") {
    zone = pickZone(settings.zones, settings, input.lat, input.lng);
    if (!zone) errors.push("out_of_zone");
    else {
      deliveryFee = zone.fee;
      minOrder = zone.minOrder;
      if (subtotal < zone.minOrder) errors.push("below_minimum");
    }
  }

  const discount = 0; // promo codes and loyalty points arrive in phase 4
  return {
    lines,
    invalidLines,
    subtotal,
    deliveryFee,
    discount,
    total: Math.max(0, subtotal + deliveryFee - discount),
    zone,
    minOrder,
    errors,
  };
}

/**
 * Pre-order time slots (every `stepMinutes`) during opening hours, as ISO strings.
 * Works on absolute instants, so it is correct whatever the device timezone is.
 */
export function preorderSlots(settings: PublicSettings, now: Date = new Date(), days = 3, stepMinutes = 30): string[] {
  const step = stepMinutes * 60_000;
  const start = Math.ceil((now.getTime() + MIN_PREORDER_LEAD_MINUTES * 60_000) / step) * step;
  const end = now.getTime() + days * 24 * 60 * 60_000;
  const slots: string[] = [];
  for (let t = start; t <= end; t += step) {
    const at = new Date(t);
    if (getOpenState(settings.openingHours, at, settings.timezone).isOpen) slots.push(at.toISOString());
  }
  return slots;
}
