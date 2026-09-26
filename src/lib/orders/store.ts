import "server-only";
import { randomBytes, randomUUID } from "node:crypto";
import { getServiceClient, isServiceRoleConfigured } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Locale } from "@/lib/types";
import { canTransition, type Fulfillment, type OrderStatus, type PaymentMethod } from "./status";
import { memoryDb } from "@/lib/data/memory-db";
import type { CustomerRecord, NewOrder, OrderRecord } from "./types";

/**
 * Order persistence. Uses Supabase (service role) when configured; otherwise an
 * in-memory store so the whole flow works locally without a backend.
 */

export class OrderBackendError extends Error {}

function assertBackend() {
  if (isSupabaseConfigured() && !isServiceRoleConfigured()) {
    throw new OrderBackendError("Supabase is configured but SUPABASE_SERVICE_ROLE_KEY is missing");
  }
  // On Vercel, serverless instances don't share memory: demo mode would lose orders.
  if (process.env.VERCEL && !isServiceRoleConfigured()) {
    throw new OrderBackendError("Supabase must be configured on Vercel (orders would be lost in memory)");
  }
}

const supabaseBacked = () => isServiceRoleConfigured();

/* ------------------------------ in-memory ------------------------------ */

const memory = globalThis as unknown as {
  __alovOrders?: Map<string, OrderRecord>;
  __alovOrderSeq?: number;
  __alovRateHits?: Map<string, number[]>;
};
const memOrders = () => (memory.__alovOrders ??= new Map<string, OrderRecord>());

/* ------------------------------- mapping ------------------------------- */

interface OrderRow {
  id: string;
  number: number;
  public_token: string;
  status: OrderStatus;
  fulfillment: Fulfillment;
  customer_name: string;
  phone: string;
  address: string | null;
  address_notes: string | null;
  lat: number | null;
  lng: number | null;
  zone_id: string | null;
  payment_method: PaymentMethod;
  subtotal: number;
  delivery_fee: number;
  discount: number;
  total: number;
  notes: string | null;
  scheduled_for: string | null;
  locale: Locale;
  created_at: string;
  telegram_chat_id: string | null;
  telegram_message_id: number | null;
  order_items: {
    item_id: string | null;
    variant_id: string | null;
    item_name: string;
    variant_label: string | null;
    addons: string[];
    unit_price: number;
    quantity: number;
    line_total: number;
  }[];
  order_status_events: { status: OrderStatus; created_at: string }[];
}

const ORDER_SELECT = "*, order_items(*), order_status_events(status, created_at)";

function mapOrder(r: OrderRow): OrderRecord {
  return {
    id: r.id,
    number: r.number,
    token: r.public_token,
    status: r.status,
    fulfillment: r.fulfillment,
    customerName: r.customer_name,
    phone: r.phone,
    address: r.address,
    addressNotes: r.address_notes,
    lat: r.lat,
    lng: r.lng,
    zoneId: r.zone_id,
    paymentMethod: r.payment_method,
    subtotal: r.subtotal,
    deliveryFee: r.delivery_fee,
    discount: r.discount,
    total: r.total,
    notes: r.notes,
    scheduledFor: r.scheduled_for,
    locale: r.locale,
    createdAt: r.created_at,
    telegramChatId: r.telegram_chat_id ?? null,
    telegramMessageId: r.telegram_message_id ?? null,
    items: r.order_items.map((i) => ({
      itemId: i.item_id,
      variantId: i.variant_id,
      itemName: i.item_name,
      variantLabel: i.variant_label,
      addons: i.addons ?? [],
      unitPrice: i.unit_price,
      quantity: i.quantity,
      lineTotal: i.line_total,
    })),
    events: [...r.order_status_events]
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .map((e) => ({ status: e.status, at: e.created_at })),
  };
}

/* ------------------------------- public API ------------------------------ */

export async function createOrder(order: NewOrder): Promise<OrderRecord> {
  assertBackend();
  if (!supabaseBacked()) {
    const now = new Date().toISOString();
    memory.__alovOrderSeq = (memory.__alovOrderSeq ?? 1000) + 1;
    const record: OrderRecord = {
      ...order,
      id: randomUUID(),
      number: memory.__alovOrderSeq,
      token: randomBytes(16).toString("hex"),
      status: "new",
      createdAt: now,
      telegramChatId: null,
      telegramMessageId: null,
      events: [{ status: "new", at: now }],
    };
    memOrders().set(record.id, record);
    return record;
  }

  const db = getServiceClient();
  const { data, error } = await db.rpc("create_order", {
    p: {
      customer_name: order.customerName,
      phone: order.phone,
      fulfillment: order.fulfillment,
      address: order.address,
      address_notes: order.addressNotes,
      lat: order.lat,
      lng: order.lng,
      zone_id: order.zoneId,
      payment_method: order.paymentMethod,
      subtotal: order.subtotal,
      delivery_fee: order.deliveryFee,
      discount: order.discount,
      total: order.total,
      notes: order.notes,
      scheduled_for: order.scheduledFor,
      locale: order.locale,
      items: order.items.map((i) => ({
        item_id: i.itemId,
        variant_id: i.variantId,
        item_name: i.itemName,
        variant_label: i.variantLabel,
        addons: i.addons,
        unit_price: i.unitPrice,
        quantity: i.quantity,
        line_total: i.lineTotal,
      })),
    },
  });
  if (error) throw new OrderBackendError(`create_order failed: ${error.message}`);
  const row = (data as { out_id: string }[])[0];
  const created = await getOrderById(row.out_id);
  if (!created) throw new OrderBackendError("Order created but could not be read back");
  return created;
}

export async function getOrderById(id: string): Promise<OrderRecord | null> {
  if (!supabaseBacked()) return memOrders().get(id) ?? null;
  const { data, error } = await getServiceClient().from("orders").select(ORDER_SELECT).eq("id", id).maybeSingle();
  if (error) throw new OrderBackendError(error.message);
  return data ? mapOrder(data as OrderRow) : null;
}

export async function getOrderByToken(token: string): Promise<OrderRecord | null> {
  if (!/^[a-f0-9]{32}$/.test(token)) return null;
  if (!supabaseBacked()) return [...memOrders().values()].find((o) => o.token === token) ?? null;
  const { data, error } = await getServiceClient()
    .from("orders")
    .select(ORDER_SELECT)
    .eq("public_token", token)
    .maybeSingle();
  if (error) throw new OrderBackendError(error.message);
  return data ? mapOrder(data as OrderRow) : null;
}

export type StatusUpdateResult = { ok: true; order: OrderRecord } | { ok: false; reason: "not_found" | "invalid_transition" };

/** Moves an order to a new status if the transition is allowed. */
export async function updateOrderStatus(id: string, status: OrderStatus): Promise<StatusUpdateResult> {
  const order = await getOrderById(id);
  if (!order) return { ok: false, reason: "not_found" };
  if (!canTransition(order.status, status, order.fulfillment)) return { ok: false, reason: "invalid_transition" };

  if (!supabaseBacked()) {
    const updated = { ...order, status, events: [...order.events, { status, at: new Date().toISOString() }] };
    memOrders().set(id, updated);
    return { ok: true, order: updated };
  }
  // Conditional update guards against two staff members changing the same order at once.
  const { data, error } = await getServiceClient()
    .from("orders")
    .update({ status })
    .eq("id", id)
    .eq("status", order.status)
    .select("id");
  if (error) throw new OrderBackendError(error.message);
  if (!data || data.length === 0) return { ok: false, reason: "invalid_transition" };
  const updated = await getOrderById(id);
  return updated ? { ok: true, order: updated } : { ok: false, reason: "not_found" };
}

/** Sliding-window rate limit. Returns true when allowed. */
export async function hitRateLimit(bucket: string, windowSeconds: number, max: number): Promise<boolean> {
  if (!supabaseBacked()) {
    const hits = (memory.__alovRateHits ??= new Map<string, number[]>());
    const now = Date.now();
    const recent = (hits.get(bucket) ?? []).filter((t) => now - t < windowSeconds * 1000);
    if (recent.length >= max) {
      hits.set(bucket, recent);
      return false;
    }
    hits.set(bucket, [...recent, now]);
    return true;
  }
  const { data, error } = await getServiceClient().rpc("hit_rate_limit", {
    p_bucket: bucket,
    p_window_seconds: windowSeconds,
    p_max: max,
  });
  if (error) throw new OrderBackendError(error.message);
  return data === true;
}

/** Telegram chat: env var wins, otherwise the admin-configured value. */
export async function getTelegramChatId(): Promise<string | null> {
  const fromEnv = process.env.TELEGRAM_CHAT_ID?.trim();
  if (fromEnv) return fromEnv;
  if (!supabaseBacked()) return memoryDb().privateSettings.telegramChatId;
  const { data } = await getServiceClient().from("private_settings").select("telegram_chat_id").eq("id", 1).maybeSingle();
  return (data as { telegram_chat_id: string | null } | null)?.telegram_chat_id ?? null;
}

/** Remembers which Telegram message announced the order. */
export async function setTelegramMessage(orderId: string, chatId: string, messageId: number): Promise<void> {
  if (!supabaseBacked()) {
    const order = memOrders().get(orderId);
    if (order) memOrders().set(orderId, { ...order, telegramChatId: chatId, telegramMessageId: messageId });
    return;
  }
  const { error } = await getServiceClient()
    .from("orders")
    .update({ telegram_chat_id: chatId, telegram_message_id: messageId })
    .eq("id", orderId);
  if (error) throw new OrderBackendError(error.message);
}

/** Orders created at or after `since`, newest first (admin board, analytics). */
export async function listOrders(since: Date, limit = 2000): Promise<OrderRecord[]> {
  if (!supabaseBacked()) {
    return [...memOrders().values()]
      .filter((o) => new Date(o.createdAt) >= since)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit);
  }
  const { data, error } = await getServiceClient()
    .from("orders")
    .select(ORDER_SELECT)
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new OrderBackendError(error.message);
  return (data as OrderRow[]).map(mapOrder);
}

/** Customer list for marketing (phone is the identity). */
export async function listCustomers(): Promise<CustomerRecord[]> {
  if (!supabaseBacked()) {
    const byPhone = new Map<string, CustomerRecord>();
    for (const o of [...memOrders().values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt))) {
      const c = byPhone.get(o.phone) ?? { phone: o.phone, name: null, orderCount: 0, totalSpent: 0, firstOrderAt: o.createdAt, lastOrderAt: null };
      byPhone.set(o.phone, { ...c, name: o.customerName, orderCount: c.orderCount + 1, totalSpent: c.totalSpent + o.total, lastOrderAt: o.createdAt });
    }
    return [...byPhone.values()].sort((a, b) => (b.lastOrderAt ?? "").localeCompare(a.lastOrderAt ?? ""));
  }
  const { data, error } = await getServiceClient()
    .from("customers")
    .select("phone, name, order_count, total_spent, first_order_at, last_order_at")
    .order("last_order_at", { ascending: false, nullsFirst: false })
    .limit(5000);
  if (error) throw new OrderBackendError(error.message);
  return (
    data as { phone: string; name: string | null; order_count: number; total_spent: number; first_order_at: string | null; last_order_at: string | null }[]
  ).map((c) => ({
    phone: c.phone,
    name: c.name,
    orderCount: c.order_count,
    totalSpent: c.total_spent,
    firstOrderAt: c.first_order_at,
    lastOrderAt: c.last_order_at,
  }));
}

/** Admin board feed: everything from the last 36 hours (open orders, today's finished ones). */
export function listBoardOrders(): Promise<OrderRecord[]> {
  return listOrders(new Date(Date.now() - 36 * 60 * 60 * 1000), 300);
}
