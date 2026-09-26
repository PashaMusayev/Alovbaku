"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { formatPrice } from "@/lib/money";
import type { OrderRecord } from "@/lib/orders/types";
import { formatPhone } from "@/lib/phone";
import { timeInBaku } from "./order-card";

export function KitchenTicket({ order }: { order: OrderRecord }) {
  const t = useTranslations("admin.ticket");
  const tStaff = useTranslations("staff");
  const tOrders = useTranslations("admin.orders");

  useEffect(() => {
    const timer = setTimeout(() => window.print(), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-dvh bg-white p-4 text-black print:p-0">
      <style>{`@page { size: 80mm auto; margin: 4mm; } body { background: #fff !important; }`}</style>
      <div className="mx-auto max-w-[80mm] font-mono text-[13px] leading-snug">
        <p className="text-center text-lg font-bold">ALOV BAKU</p>
        <p className="text-center text-2xl font-bold">{t("title", { number: order.number })}</p>
        <p className="text-center">
          {order.fulfillment === "delivery" ? tStaff("delivery") : tStaff("pickup")} · {timeInBaku(order.createdAt, true)}
        </p>
        {order.scheduledFor && <p className="mt-1 text-center font-bold">{tOrders("scheduled", { time: timeInBaku(order.scheduledFor, true) })}</p>}
        <hr className="my-2 border-dashed border-black" />
        {order.items.map((i, idx) => (
          <div key={idx} className="mb-1">
            <p className="text-[15px] font-bold">
              {i.quantity} × {i.itemName}
            </p>
            {i.variantLabel && <p className="pl-4">{i.variantLabel}</p>}
            {i.addons.map((a) => (
              <p key={a} className="pl-4">
                + {a}
              </p>
            ))}
          </div>
        ))}
        {order.notes && (
          <>
            <hr className="my-2 border-dashed border-black" />
            <p className="font-bold">📝 {order.notes}</p>
          </>
        )}
        <hr className="my-2 border-dashed border-black" />
        <p className="flex justify-between font-bold">
          <span>{t("total")}</span>
          <span>{formatPrice(order.total)}</span>
        </p>
        <p>{tStaff(`payment.${order.paymentMethod}`)}</p>
        <hr className="my-2 border-dashed border-black" />
        <p>{order.customerName}</p>
        <p>{formatPhone(order.phone)}</p>
        {order.address && <p>{order.address}</p>}
        {order.addressNotes && <p>{order.addressNotes}</p>}
        <p className="mt-3 text-center text-[11px]">{t("printed", { time: timeInBaku(new Date().toISOString(), true) })}</p>
        <button type="button" onClick={() => window.print()} className="mt-4 w-full rounded border border-black py-2 print:hidden">
          {t("print")}
        </button>
      </div>
    </div>
  );
}
