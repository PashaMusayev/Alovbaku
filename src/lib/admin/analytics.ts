import { zonedTime } from "@/lib/hours";
import type { OrderRecord } from "@/lib/orders/types";

export interface Analytics {
  days: { date: string; orders: number; revenue: number }[];
  totals: { orders: number; revenue: number; averageOrder: number };
  topItems: { name: string; quantity: number; revenue: number }[];
  /** Orders per hour of day (restaurant time), index 0–23. */
  hours: number[];
  customers: { new: number; returning: number };
  fulfillment: { delivery: number; pickup: number };
}

const COUNTED = (o: OrderRecord) => o.status !== "rejected" && o.status !== "cancelled";

/** YYYY-MM-DD of an instant in the restaurant timezone. */
export function localDate(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));
}

/**
 * @param orders orders from at least `lookbackDays` ago (older ones are only used to tell
 *               new customers from returning ones)
 */
export function computeAnalytics(orders: OrderRecord[], now: Date, days: number, timeZone: string): Analytics {
  const from = now.getTime() - days * 86_400_000;
  const counted = orders.filter(COUNTED);
  const inRange = counted.filter((o) => new Date(o.createdAt).getTime() >= from);

  const dayKeys: string[] = [];
  for (let i = days - 1; i >= 0; i--) dayKeys.push(localDate(new Date(now.getTime() - i * 86_400_000).toISOString(), timeZone));
  const perDay = new Map(dayKeys.map((d) => [d, { date: d, orders: 0, revenue: 0 }]));
  const hours = Array.from({ length: 24 }, () => 0);
  const items = new Map<string, { name: string; quantity: number; revenue: number }>();

  for (const o of inRange) {
    const d = perDay.get(localDate(o.createdAt, timeZone));
    if (d) {
      d.orders++;
      d.revenue += o.total;
    }
    hours[Math.floor(zonedTime(new Date(o.createdAt), timeZone).minutes / 60)]++;
    for (const it of o.items) {
      const key = it.variantLabel ? `${it.itemName} (${it.variantLabel})` : it.itemName;
      const cur = items.get(key) ?? { name: key, quantity: 0, revenue: 0 };
      items.set(key, { name: key, quantity: cur.quantity + it.quantity, revenue: cur.revenue + it.lineTotal });
    }
  }

  // New = first ever (known) order falls inside the range.
  const firstOrder = new Map<string, number>();
  for (const o of counted) {
    const t = new Date(o.createdAt).getTime();
    firstOrder.set(o.phone, Math.min(firstOrder.get(o.phone) ?? t, t));
  }
  const phonesInRange = new Set(inRange.map((o) => o.phone));
  let newCustomers = 0;
  for (const p of phonesInRange) if ((firstOrder.get(p) ?? 0) >= from) newCustomers++;

  const revenue = inRange.reduce((s, o) => s + o.total, 0);
  return {
    days: dayKeys.map((d) => perDay.get(d)!),
    totals: { orders: inRange.length, revenue, averageOrder: inRange.length ? Math.round(revenue / inRange.length) : 0 },
    topItems: [...items.values()].sort((a, b) => b.quantity - a.quantity || b.revenue - a.revenue).slice(0, 10),
    hours,
    customers: { new: newCustomers, returning: phonesInRange.size - newCustomers },
    fulfillment: {
      delivery: inRange.filter((o) => o.fulfillment === "delivery").length,
      pickup: inRange.filter((o) => o.fulfillment === "pickup").length,
    },
  };
}
