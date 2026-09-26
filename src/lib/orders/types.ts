import type { Locale } from "@/lib/types";
import type { Fulfillment, OrderStatus, PaymentMethod } from "./status";

export interface OrderItemRecord {
  itemId: string | null;
  variantId: string | null;
  /** Snapshots (Azerbaijani) taken at order time. */
  itemName: string;
  variantLabel: string | null;
  addons: string[];
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface OrderRecord {
  id: string;
  number: number;
  token: string;
  status: OrderStatus;
  fulfillment: Fulfillment;
  customerName: string;
  phone: string;
  address: string | null;
  addressNotes: string | null;
  lat: number | null;
  lng: number | null;
  zoneId: string | null;
  paymentMethod: PaymentMethod;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  notes: string | null;
  scheduledFor: string | null;
  locale: Locale;
  createdAt: string;
  items: OrderItemRecord[];
  events: { status: OrderStatus; at: string }[];
}

export type NewOrder = Omit<OrderRecord, "id" | "number" | "token" | "status" | "createdAt" | "events">;
