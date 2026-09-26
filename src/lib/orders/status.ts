export const ORDER_STATUSES = [
  "new",
  "accepted",
  "preparing",
  "on_the_way",
  "ready",
  "delivered",
  "rejected",
  "cancelled",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type Fulfillment = "delivery" | "pickup";
export type PaymentMethod = "cash" | "card_on_delivery" | "online";

/** Customer-facing timeline (spec: Qəbul edildi → Hazırlanır → Yoldadır → Çatdırıldı). */
export function timelineFor(fulfillment: Fulfillment): OrderStatus[] {
  return fulfillment === "delivery"
    ? ["accepted", "preparing", "on_the_way", "delivered"]
    : ["accepted", "preparing", "ready", "delivered"];
}

/** Allowed next statuses — used by Telegram buttons and the admin board. */
export function nextStatuses(status: OrderStatus, fulfillment: Fulfillment): OrderStatus[] {
  switch (status) {
    case "new":
      return ["accepted", "rejected"];
    case "accepted":
      return ["preparing", "cancelled"];
    case "preparing":
      return [fulfillment === "delivery" ? "on_the_way" : "ready", "cancelled"];
    case "on_the_way":
    case "ready":
      return ["delivered"];
    default:
      return [];
  }
}

export function canTransition(from: OrderStatus, to: OrderStatus, fulfillment: Fulfillment): boolean {
  return nextStatuses(from, fulfillment).includes(to);
}

export const isFinalStatus = (s: OrderStatus) => s === "delivered" || s === "rejected" || s === "cancelled";
