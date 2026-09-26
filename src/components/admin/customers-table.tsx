"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { localDate } from "@/lib/admin/analytics";
import { formatPrice } from "@/lib/money";
import type { CustomerRecord } from "@/lib/orders/types";
import { formatPhone, telHref } from "@/lib/phone";
import { matchesQuery } from "@/lib/search";
import { adminInput } from "./ui";

/** "26.09.2026" in Baku time — deterministic on server and client. */
const date = (iso: string | null) => (iso ? localDate(iso, "Asia/Baku").split("-").reverse().join(".") : "—");

export function CustomersTable({ customers }: { customers: CustomerRecord[] }) {
  const t = useTranslations("admin.customers");
  const tc = useTranslations("admin.common");
  const [q, setQ] = useState("");
  const shown = customers.filter((c) => matchesQuery(`${c.name ?? ""} ${c.phone} ${c.phone.replace("+994", "0")}`, q));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-heading text-3xl font-bold text-cream-50">{t("title")}</h1>
        <a href="/api/admin/customers" download className="inline-flex h-11 items-center rounded-full bg-flame-500 px-5 font-bold text-coal-950">
          ⬇ {t("export")}
        </a>
      </div>
      <input type="search" aria-label={t("searchLabel")} placeholder={tc("search")} value={q} onChange={(e) => setQ(e.target.value)} className={adminInput} />
      <p className="text-sm text-cream-300">{t("count", { count: shown.length })}</p>
      {customers.length === 0 ? (
        <p className="rounded-2xl bg-coal-900 p-4 text-sm text-cream-500">{t("empty")}</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl ring-1 ring-coal-700">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead className="bg-coal-900 text-xs text-cream-300">
              <tr>
                <th className="p-3">{t("name")}</th>
                <th className="p-3">{t("phone")}</th>
                <th className="p-3 text-right">{t("orders")}</th>
                <th className="p-3 text-right">{t("total")}</th>
                <th className="p-3">{t("lastOrder")}</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((c) => (
                <tr key={c.phone} className="border-t border-coal-700">
                  <td className="p-3 text-cream-50">{c.name ?? "—"}</td>
                  <td className="p-3">
                    <a href={telHref(c.phone)} className="font-semibold text-flame-400">
                      {formatPhone(c.phone)}
                    </a>
                  </td>
                  <td className="p-3 text-right tabular-nums">{c.orderCount}</td>
                  <td className="p-3 text-right tabular-nums">{formatPrice(c.totalSpent)}</td>
                  <td className="p-3 tabular-nums text-cream-300">{date(c.lastOrderAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
