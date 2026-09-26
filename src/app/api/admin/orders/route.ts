import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/auth";
import { listBoardOrders } from "@/lib/orders/store";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await getAdminSession())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json(await listBoardOrders(), { headers: { "cache-control": "no-store" } });
}
