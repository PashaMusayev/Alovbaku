import { NextResponse } from "next/server";
import { toPublicOrderView } from "@/lib/orders/public-view";
import { getOrderByToken } from "@/lib/orders/store";

export const dynamic = "force-dynamic";

/** Polling fallback for the tracking page (Realtime pushes updates when available). */
export async function GET(_req: Request, ctx: RouteContext<"/api/orders/[token]">) {
  const { token } = await ctx.params;
  const order = await getOrderByToken(token);
  if (!order) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json(toPublicOrderView(order), { headers: { "cache-control": "no-store" } });
}
