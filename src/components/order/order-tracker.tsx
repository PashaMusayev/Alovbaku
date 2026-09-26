"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { loadWhatsappText } from "@/lib/checkout/saved";
import { formatPrice } from "@/lib/money";
import type { PublicOrderView } from "@/lib/orders/public-view";
import { isFinalStatus, timelineFor, type OrderStatus } from "@/lib/orders/status";
import { formatPhone, telHref, whatsappHref } from "@/lib/phone";
import { supabaseAnonKey, supabaseUrl } from "@/lib/supabase/config";
import { useHydrated } from "@/lib/use-hydrated";
import { useAppData } from "@/components/providers/app-provider";
import { PhoneIcon, WhatsAppIcon } from "@/components/ui/icons";

const POLL_MS = 15_000;

/** Live order status: Supabase Realtime broadcast when configured, polling as a fallback. */
function useLiveOrder(initial: PublicOrderView) {
  const [order, setOrder] = useState(initial);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/orders/${initial.token}`, { cache: "no-store" });
      if (res.ok) setOrder(await res.json());
    } catch {
      /* offline — try again on the next tick */
    }
  }, [initial.token]);

  const final = isFinalStatus(order.status);

  useEffect(() => {
    if (final) return;
    const timer = setInterval(refresh, POLL_MS);
    const onVisible = () => document.visibilityState === "visible" && refresh();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [final, refresh]);

  useEffect(() => {
    if (final || !supabaseUrl || !supabaseAnonKey) return;
    let cleanup = () => {};
    let cancelled = false;
    void import("@supabase/supabase-js").then(({ createClient }) => {
      if (cancelled) return;
      const client = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
      const channel = client
        .channel(`order:${initial.token}`)
        .on("broadcast", { event: "status" }, () => void refresh())
        .subscribe();
      cleanup = () => void client.removeChannel(channel);
    });
    return () => {
      cancelled = true;
      cleanup();
    };
  }, [final, initial.token, refresh]);

  return order;
}

export function OrderTracker({ initial }: { initial: PublicOrderView }) {
  const t = useTranslations("order");
  const locale = useLocale();
  const { menu, settings } = useAppData();
  const order = useLiveOrder(initial);
  const hydrated = useHydrated();
  const [copied, setCopied] = useState(false);
  // Staff-formatted order text saved at checkout (this device only).
  const wa = hydrated ? loadWhatsappText(order.token) : null;

  const steps = timelineFor(order.fulfillment);
  const currentIndex = steps.indexOf(order.status);
  const problem = order.status === "rejected" || order.status === "cancelled";
  const whatsappText = wa?.text ?? t("title", { number: order.number });

  const time = (iso: string) =>
    new Intl.DateTimeFormat(locale === "az" ? "az-Latn-AZ" : locale, {
      timeZone: settings.timezone,
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).format(new Date(iso));
  const dateTime = (iso: string) =>
    new Intl.DateTimeFormat(locale === "az" ? "az-Latn-AZ" : locale, {
      timeZone: settings.timezone,
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).format(new Date(iso));
  const eventAt = (s: OrderStatus) => order.events.find((e) => e.status === s)?.at;
  const stepLabel = (s: OrderStatus) =>
    s === "delivered" && order.fulfillment === "pickup" ? t("timeline.pickedUp") : t(`timeline.${s}` as "timeline.accepted");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
    } catch {
      /* clipboard blocked */
    }
  };

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h1 className="font-heading text-4xl font-bold text-cream-50">{t("title", { number: order.number })}</h1>
        <p className="text-lg text-cream-100">{t("thanks", { name: order.customerName })}</p>
        {order.scheduledFor && <p className="text-sm font-semibold text-gold-400">⏰ {t("scheduled", { time: dateTime(order.scheduledFor) })}</p>}
      </header>

      <section
        aria-live="polite"
        className={`rounded-2xl p-4 ring-1 ${problem ? "bg-ember-700/30 ring-ember-500" : "bg-coal-900 ring-coal-700"}`}
      >
        <p className="font-heading text-2xl font-bold text-cream-50">{t(`status.${order.status}`)}</p>
        {order.status === "new" && <p className="mt-1 text-sm text-cream-300">{t("received")}</p>}
        {problem && <p className="mt-1 text-sm text-cream-100">{t("problemHelp", { phone: formatPhone(settings.phone) })}</p>}
        {!isFinalStatus(order.status) && (
          <p className="mt-2 flex items-center gap-2 text-xs text-cream-500">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" aria-hidden /> {t("live")}
          </p>
        )}
      </section>

      {!problem && (
        <ol aria-label={t("timelineLabel")} className="space-y-0 rounded-2xl bg-coal-900 p-4 ring-1 ring-coal-700">
          {steps.map((s, i) => {
            const done = currentIndex >= i;
            const current = currentIndex === i;
            const at = eventAt(s);
            return (
              <li key={s} className="relative flex gap-3 pb-5 last:pb-0" aria-current={current ? "step" : undefined}>
                {i < steps.length - 1 && (
                  <span aria-hidden className={`absolute left-[15px] top-8 h-[calc(100%-1.5rem)] w-0.5 ${currentIndex > i ? "bg-flame-500" : "bg-coal-600"}`} />
                )}
                <span
                  aria-hidden
                  className={`z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold ${
                    done ? "bg-flame-500 text-coal-950" : "bg-coal-700 text-cream-500"
                  } ${current ? "ring-4 ring-flame-500/30" : ""}`}
                >
                  {done ? "✓" : i + 1}
                </span>
                <div className="pt-1">
                  <p className={`font-semibold ${done ? "text-cream-50" : "text-cream-500"}`}>
                    {stepLabel(s)}
                    {current && <span className="sr-only"> — {t("current")}</span>}
                  </p>
                  {at && <p className="text-xs text-cream-500">{time(at)}</p>}
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <div className="space-y-2">
        {wa && !wa.notified && <p className="rounded-xl bg-gold-400/15 p-3 text-sm text-gold-400 ring-1 ring-gold-400/40">{t("whatsappRequired")}</p>}
        <a
          href={whatsappHref(settings.whatsapp, whatsappText)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-12 items-center justify-center gap-2 rounded-full bg-[#17703d] font-bold text-white"
        >
          <WhatsAppIcon /> {t("whatsapp")}
        </a>
        <a href={telHref(settings.phone)} className="flex h-12 items-center justify-center gap-2 rounded-full bg-coal-800 font-semibold ring-1 ring-coal-600">
          <PhoneIcon /> {t("call")}
        </a>
      </div>

      <section aria-labelledby="order-details" className="space-y-2 rounded-2xl bg-coal-900 p-4 ring-1 ring-coal-700">
        <h2 id="order-details" className="font-heading text-xl font-bold text-cream-50">
          {t("details")}
        </h2>
        <ul className="space-y-1 text-sm">
          {order.items.map((i, idx) => {
            const item = i.itemId ? menu.items[i.itemId] : undefined;
            const variant = item?.variants.find((v) => v.id === i.variantId);
            const label = item && item.variants.length > 1 ? variant?.label : null;
            return (
              <li key={idx} className="flex justify-between gap-3">
                <span className="text-cream-100">
                  {i.quantity} × {item?.name ?? i.name}
                  {(label ?? i.variant) ? ` (${label ?? i.variant})` : ""}
                  {i.addons.length > 0 && <span className="text-cream-500"> + {i.addons.join(", ")}</span>}
                </span>
                <span className="tabular-nums">{formatPrice(i.lineTotal)}</span>
              </li>
            );
          })}
        </ul>
        <p className="flex justify-between border-t border-coal-700 pt-2 font-extrabold text-cream-50">
          <span>{t(`payment.${order.paymentMethod}`)}</span>
          <span className="tabular-nums">{formatPrice(order.total)}</span>
        </p>
        <p className="text-sm text-cream-300">{order.fulfillment === "delivery" && order.address ? t("deliveryTo", { address: order.address }) : t("pickupNote")}</p>
      </section>

      <div className="space-y-2 text-center">
        <p className="text-sm text-cream-500">{t("saveLink")}</p>
        <button type="button" onClick={copy} className="h-11 rounded-full bg-coal-800 px-5 text-sm font-semibold ring-1 ring-coal-600">
          {copied ? t("copied") : t("copyLink")}
        </button>
        <div>
          <Link href="/menu" className="inline-block pt-2 text-sm font-semibold text-flame-400">
            {t("newOrder")}
          </Link>
        </div>
      </div>
    </div>
  );
}
