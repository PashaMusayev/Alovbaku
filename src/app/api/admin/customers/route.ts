import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/auth";
import { toCsv } from "@/lib/admin/csv";
import { listCustomers } from "@/lib/orders/store";

export const dynamic = "force-dynamic";

/** Customer list for marketing (Excel-friendly CSV). */
export async function GET() {
  if (!(await getAdminSession())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const customers = await listCustomers();
  const csv = toCsv(
    ["phone", "name", "orders", "total_azn", "first_order", "last_order"],
    customers.map((c) => [c.phone, c.name, c.orderCount, (c.totalSpent / 100).toFixed(2), c.firstOrderAt?.slice(0, 10), c.lastOrderAt?.slice(0, 10)]),
  );
  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="alov-baku-musteriler-${date}.csv"`,
      "cache-control": "no-store",
    },
  });
}
