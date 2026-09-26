"use client";

import { useTranslations } from "next-intl";
import type { Analytics } from "@/lib/admin/analytics";
import { formatPrice } from "@/lib/money";
import { ColumnChart } from "./column-chart";
import { Card } from "./ui";

function StatTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl bg-coal-900 p-4 ring-1 ring-coal-700">
      <p className="text-sm text-cream-300">{label}</p>
      <p className="mt-1 text-3xl font-bold tabular-nums text-cream-50">{value}</p>
      {sub && <p className="text-xs text-cream-500">{sub}</p>}
    </div>
  );
}

const dayLabel = (iso: string) => `${iso.slice(8, 10)}.${iso.slice(5, 7)}`;
const manat = (q: number) => `${Math.round(q / 100)} ₼`;

export function AnalyticsView({ data, days }: { data: Analytics; days: number }) {
  const t = useTranslations("admin.analytics");
  const maxItem = Math.max(1, ...data.topItems.map((i) => i.quantity));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="font-heading text-3xl font-bold text-cream-50">{t("title")}</h1>
        <p className="text-sm text-cream-300">{t("range", { days })}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label={t("orders")} value={String(data.totals.orders)} />
        <StatTile label={t("revenue")} value={formatPrice(data.totals.revenue)} />
        <StatTile label={t("averageOrder")} value={formatPrice(data.totals.averageOrder)} />
        <StatTile
          label={t("customers")}
          value={String(data.customers.new + data.customers.returning)}
          sub={`${t("newCustomers")}: ${data.customers.new} · ${t("returningCustomers")}: ${data.customers.returning}`}
        />
      </div>

      {data.totals.orders === 0 && <p className="rounded-2xl bg-coal-900 p-4 text-sm text-cream-300">{t("empty")}</p>}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <ColumnChart
            title={t("perDay")}
            tableLabel={t("table", { chart: t("perDay") })}
            formatTick={(v) => String(Math.round(v))}
            labelEvery={Math.ceil(days / 6)}
            data={data.days.map((d) => ({ key: d.date, label: dayLabel(d.date), value: d.orders, display: String(d.orders) }))}
          />
        </Card>
        <Card>
          <ColumnChart
            title={t("perDayRevenue")}
            tableLabel={t("table", { chart: t("perDayRevenue") })}
            formatTick={manat}
            labelEvery={Math.ceil(days / 6)}
            data={data.days.map((d) => ({ key: d.date, label: dayLabel(d.date), value: d.revenue, display: formatPrice(d.revenue) }))}
          />
        </Card>
        <Card>
          <ColumnChart
            title={t("peakHours")}
            tableLabel={t("table", { chart: t("peakHours") })}
            formatTick={(v) => String(Math.round(v))}
            labelEvery={3}
            data={data.hours.map((count, h) => ({ key: String(h), label: t("hour", { hour: String(h).padStart(2, "0") }), value: count, display: String(count) }))}
          />
        </Card>
        <Card title={t("topItems")}>
          <ol className="space-y-2">
            {data.topItems.map((item) => (
              <li key={item.name} className="space-y-1">
                <div className="flex justify-between gap-2 text-sm">
                  <span className="truncate text-cream-100">{item.name}</span>
                  <span className="shrink-0 tabular-nums text-cream-300">
                    {item.quantity} · {formatPrice(item.revenue)}
                  </span>
                </div>
                <div className="h-2 rounded-r-[4px] bg-flame-500" style={{ width: `${(item.quantity / maxItem) * 100}%` }} />
              </li>
            ))}
            {data.topItems.length === 0 && <li className="text-sm text-cream-500">—</li>}
          </ol>
          <p className="text-xs text-cream-500">
            🛵 {t("delivery")}: {data.fulfillment.delivery} · 🏃 {t("pickup")}: {data.fulfillment.pickup}
          </p>
        </Card>
      </div>
    </div>
  );
}
