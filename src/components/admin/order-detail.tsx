"use client";

import { useRouter } from "next/navigation";
import { useNow } from "@/lib/use-now";
import { useTranslations } from "next-intl";
import type { OrderRecord } from "@/lib/orders/types";
import { OrderCard, timeInBaku } from "./order-card";

export function OrderDetail({ order }: { order: OrderRecord }) {
  const t = useTranslations("admin.orders");
  const tStaff = useTranslations("staff");
  const router = useRouter();
  const now = useNow();
  return (
    <div className="space-y-4">
      <OrderCard order={order} now={now} expanded onChanged={() => router.refresh()} />
      <section className="rounded-2xl bg-coal-900 p-4 ring-1 ring-coal-700">
        <h2 className="mb-2 font-semibold">{t("history")}</h2>
        <ol className="space-y-1 text-sm">
          {order.events.map((e, i) => (
            <li key={i} className="flex justify-between">
              <span>{tStaff(`status.${e.status}`)}</span>
              <span className="tabular-nums text-cream-500">{timeInBaku(e.at, true)}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
