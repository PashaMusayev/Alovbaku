"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type { OrderStatus } from "@/lib/orders/status";
import type { OrderRecord } from "@/lib/orders/types";
import { useNow } from "@/lib/use-now";
import { OrderCard } from "./order-card";

const POLL_MS = 5000;
/** Keep ringing while an order waits for acceptance. */
const REMIND_MS = 20_000;

type Tab = "new" | "active" | "out" | "done";
const TAB_STATUSES: Record<Tab, OrderStatus[]> = {
  new: ["new"],
  active: ["accepted", "preparing"],
  out: ["on_the_way", "ready"],
  done: ["delivered", "rejected", "cancelled"],
};
const TABS = Object.keys(TAB_STATUSES) as Tab[];

let audioCtx: AudioContext | null = null;
function ring() {
  if (!audioCtx) return;
  const t0 = audioCtx.currentTime;
  [0, 0.25, 0.5].forEach((offset, i) => {
    const osc = audioCtx!.createOscillator();
    const gain = audioCtx!.createGain();
    osc.type = "square";
    osc.frequency.value = i === 2 ? 1320 : 880;
    gain.gain.setValueAtTime(0.0001, t0 + offset);
    gain.gain.exponentialRampToValueAtTime(0.35, t0 + offset + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + offset + 0.2);
    osc.connect(gain).connect(audioCtx!.destination);
    osc.start(t0 + offset);
    osc.stop(t0 + offset + 0.22);
  });
  navigator.vibrate?.([200, 100, 200]);
}

export function OrdersBoard({ initial }: { initial: OrderRecord[] }) {
  const t = useTranslations("admin.orders");
  const [orders, setOrders] = useState(initial);
  const [tab, setTab] = useState<Tab>("new");
  const now = useNow();
  const [offline, setOffline] = useState(false);
  const [sound, setSound] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const router = useRouter();
  const seen = useRef(new Set(initial.map((o) => o.id)));

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/orders", { cache: "no-store" });
      if (res.status === 401) return router.push("/admin/login");
      const next = (await res.json()) as OrderRecord[];
      const fresh = next.filter((o) => !seen.current.has(o.id));
      fresh.forEach((o) => seen.current.add(o.id));
      if (fresh.some((o) => o.status === "new")) {
        ring();
        setTab("new");
      }
      setOrders(next);
      setOffline(false);
    } catch {
      setOffline(true);
    }
  }, [router]);

  useEffect(() => {
    const timer = setInterval(refresh, POLL_MS);
    return () => clearInterval(timer);
  }, [refresh]);

  const waiting = orders.filter((o) => o.status === "new").length;

  // Remind with sound while orders wait; show the count in the browser tab.
  useEffect(() => {
    document.title = waiting > 0 ? t("newOrderTitle", { count: waiting }) : t("title");
    if (!sound || waiting === 0) return;
    const timer = setInterval(ring, REMIND_MS);
    return () => clearInterval(timer);
  }, [waiting, sound, t]);

  // Browsers only allow audio after a user gesture, so staff tap this once per session.
  const toggleSound = () => {
    audioCtx ??= new AudioContext();
    void audioCtx.resume();
    const next = !sound;
    setSound(next);
    if (next) ring();
  };

  const onChanged = (message?: string) => {
    setFlash(message ?? null);
    setTimeout(() => setFlash(null), 2500);
    void refresh();
  };

  const byTab = (tb: Tab) =>
    orders
      .filter((o) => TAB_STATUSES[tb].includes(o.status))
      .sort((a, b) => (tb === "done" ? b.createdAt.localeCompare(a.createdAt) : a.createdAt.localeCompare(b.createdAt)));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-heading text-3xl font-bold text-cream-50">{t("title")}</h1>
        <button
          type="button"
          onClick={toggleSound}
          aria-pressed={sound}
          title={t("soundHint")}
          className={`h-11 rounded-full px-4 text-sm font-bold ${sound ? "bg-emerald-500 text-coal-950" : "bg-gold-400 text-coal-950 animate-pulse"}`}
        >
          {sound ? t("soundOn") : t("soundOff")}
        </button>
      </div>
      {!sound && <p className="text-xs text-cream-500">{t("soundHint")}</p>}
      {offline && (
        <p role="alert" className="rounded-xl bg-ember-700/40 p-3 text-sm">
          {t("offline")}
        </p>
      )}

      {/* Phones: tabs. Desktop: four columns. */}
      <div role="tablist" className="no-scrollbar flex gap-2 overflow-x-auto md:hidden">
        {TABS.map((tb) => (
          <button
            key={tb}
            role="tab"
            type="button"
            aria-selected={tab === tb}
            onClick={() => setTab(tb)}
            className={`h-11 shrink-0 rounded-full px-4 text-sm font-bold ${tab === tb ? "bg-flame-500 text-coal-950" : "bg-coal-800 text-cream-100"}`}
          >
            {t(`tabs.${tb}`)} ({byTab(tb).length})
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {TABS.map((tb) => (
          <section key={tb} className={`space-y-3 ${tab === tb ? "" : "hidden md:block"}`} aria-label={t(`tabs.${tb}`)}>
            <h2 className="hidden font-heading text-lg font-bold text-cream-300 md:block">
              {t(`tabs.${tb}`)} ({byTab(tb).length})
            </h2>
            {byTab(tb).length === 0 && <p className="rounded-2xl bg-coal-900 p-4 text-sm text-cream-500">{t("empty")}</p>}
            {byTab(tb).map((o) => (
              <OrderCard key={o.id} order={o} now={now} onChanged={onChanged} />
            ))}
          </section>
        ))}
      </div>

      <p role="status" aria-live="polite" className="fixed inset-x-0 bottom-20 z-50 mx-auto w-fit rounded-full bg-cream-100 px-4 py-2 text-sm font-bold text-coal-950 shadow-lg empty:hidden md:bottom-6">
        {flash ?? ""}
      </p>
    </div>
  );
}
