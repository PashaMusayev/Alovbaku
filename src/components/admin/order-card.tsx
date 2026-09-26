"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { setOrderStatusAction } from "@/app/admin/actions";
import { formatPrice } from "@/lib/money";
import { nextStatuses, type OrderStatus } from "@/lib/orders/status";
import type { OrderRecord } from "@/lib/orders/types";
import { formatPhone, telHref } from "@/lib/phone";

const BUTTON_STYLE: Partial<Record<OrderStatus, string>> = {
  accepted: "bg-emerald-500 text-coal-950",
  preparing: "bg-flame-500 text-coal-950",
  on_the_way: "bg-sky-400 text-coal-950",
  ready: "bg-sky-400 text-coal-950",
  delivered: "bg-cream-100 text-coal-950",
  rejected: "bg-coal-700 text-cream-100 ring-1 ring-ember-500",
  cancelled: "bg-coal-700 text-cream-100 ring-1 ring-ember-500",
};
const EMOJI: Partial<Record<OrderStatus, string>> = {
  accepted: "✅",
  rejected: "❌",
  preparing: "🔥",
  on_the_way: "🛵",
  ready: "📦",
  delivered: "🏁",
  cancelled: "🚫",
};

export function timeInBaku(iso: string, withDate = false): string {
  // en-GB gives plain "dd/mm, hh:mm" digits identically on server and client.
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Baku",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    ...(withDate ? { day: "2-digit", month: "2-digit" } : {}),
  }).format(new Date(iso));
}

export function OrderCard({
  order,
  now,
  onChanged,
  expanded,
}: {
  order: OrderRecord;
  now: number;
  onChanged: (message?: string) => void;
  expanded?: boolean;
}) {
  const t = useTranslations("admin.orders");
  const tStaff = useTranslations("staff");
  const [busy, setBusy] = useState<OrderStatus | null>(null);
  const minutes = Math.max(0, Math.round((now - new Date(order.createdAt).getTime()) / 60_000));
  const isNew = order.status === "new";

  const change = async (status: OrderStatus) => {
    const danger = status === "rejected" || status === "cancelled";
    if (danger && !window.confirm(`#${order.number}: ${tStaff(`action.${status}`)}?`)) return;
    setBusy(status);
    const res = await setOrderStatusAction(order.id, status);
    setBusy(null);
    onChanged(res.ok ? t("statusChanged", { number: order.number, status: tStaff(`status.${status}`) }) : t("invalidTransition"));
  };

  return (
    <article
      className={`space-y-3 rounded-2xl bg-coal-900 p-4 ring-1 ${isNew ? "ring-2 ring-flame-500 shadow-glow" : "ring-coal-700"}`}
      aria-label={`#${order.number}`}
    >
      <header className="flex items-start justify-between gap-2">
        <div>
          <p className="font-heading text-2xl font-bold text-cream-50">
            #{order.number} <span className="text-base">{order.fulfillment === "delivery" ? "🛵" : "🏃"}</span>
          </p>
          <p className="text-xs text-cream-500">
            {timeInBaku(order.createdAt)}
            {now > 0 && <> · {minutes < 1 ? t("justNow") : t("minutesAgo", { minutes })}</>}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-extrabold tabular-nums text-cream-50">{formatPrice(order.total)}</p>
          <p className="text-xs text-cream-300">{tStaff(`payment.${order.paymentMethod}`)}</p>
        </div>
      </header>

      {order.scheduledFor && (
        <p className="rounded-lg bg-gold-400/15 px-3 py-1.5 text-sm font-bold text-gold-400">{t("scheduled", { time: timeInBaku(order.scheduledFor, true) })}</p>
      )}

      <ul className="space-y-0.5 text-sm">
        {order.items.map((i, idx) => (
          <li key={idx}>
            <b>{i.quantity} ×</b> {i.itemName}
            {i.variantLabel && <span className="text-cream-300"> ({i.variantLabel})</span>}
            {i.addons.length > 0 && <span className="text-cream-500"> + {i.addons.join(", ")}</span>}
          </li>
        ))}
      </ul>

      <div className="space-y-1 border-t border-coal-700 pt-2 text-sm">
        <p className="font-semibold text-cream-50">👤 {order.customerName}</p>
        <a href={telHref(order.phone)} className="block font-semibold text-flame-400">
          📞 {formatPhone(order.phone)}
        </a>
        {order.fulfillment === "delivery" && order.address && (
          <p>
            📍 {order.address}
            {order.addressNotes && <span className="text-cream-300"> — {order.addressNotes}</span>}
            {order.lat != null && order.lng != null && (
              <a
                href={`https://maps.google.com/?q=${order.lat},${order.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 font-semibold text-flame-400 underline"
              >
                {t("map")}
              </a>
            )}
          </p>
        )}
        {order.notes && <p className="rounded-lg bg-coal-800 px-2 py-1">📝 {order.notes}</p>}
      </div>

      {nextStatuses(order.status, order.fulfillment).length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {nextStatuses(order.status, order.fulfillment).map((s) => (
            <button
              key={s}
              type="button"
              disabled={busy !== null}
              onClick={() => change(s)}
              className={`min-h-12 rounded-xl px-2 text-sm font-bold transition active:scale-[0.98] disabled:opacity-50 ${BUTTON_STYLE[s] ?? ""}`}
            >
              {busy === s ? "…" : `${EMOJI[s] ?? ""} ${tStaff(`action.${s}`)}`}
            </button>
          ))}
        </div>
      )}

      <footer className="flex gap-4 text-xs font-semibold text-cream-300">
        {!expanded && <Link href={`/admin/orders/${order.id}`}>{t("details")} →</Link>}
        <a href={`/admin/print/${order.id}`} target="_blank" rel="noopener">
          🖨 {t("print")}
        </a>
        {expanded && <span>{tStaff(`status.${order.status}`)}</span>}
      </footer>
    </article>
  );
}
