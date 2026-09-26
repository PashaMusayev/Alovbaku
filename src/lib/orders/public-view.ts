import type { Locale } from "@/lib/types";
import type { Fulfillment, OrderStatus, PaymentMethod } from "./status";
import type { OrderRecord } from "./types";

/** What the customer's tracking page may see (no phone, no coordinates). */
export interface PublicOrderView {
  number: number;
  token: string;
  status: OrderStatus;
  fulfillment: Fulfillment;
  customerName: string;
  address: string | null;
  paymentMethod: PaymentMethod;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  scheduledFor: string | null;
  createdAt: string;
  locale: Locale;
  items: { itemId: string | null; variantId: string | null; name: string; variant: string | null; addons: string[]; quantity: number; lineTotal: number }[];
  events: { status: OrderStatus; at: string }[];
}

export function toPublicOrderView(o: OrderRecord): PublicOrderView {
  return {
    number: o.number,
    token: o.token,
    status: o.status,
    fulfillment: o.fulfillment,
    customerName: o.customerName,
    address: o.address,
    paymentMethod: o.paymentMethod,
    subtotal: o.subtotal,
    deliveryFee: o.deliveryFee,
    discount: o.discount,
    total: o.total,
    scheduledFor: o.scheduledFor,
    createdAt: o.createdAt,
    locale: o.locale,
    items: o.items.map((i) => ({
      itemId: i.itemId,
      variantId: i.variantId,
      name: i.itemName,
      variant: i.variantLabel,
      addons: i.addons,
      quantity: i.quantity,
      lineTotal: i.lineTotal,
    })),
    events: o.events,
  };
}
