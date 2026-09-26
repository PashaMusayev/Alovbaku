import { NextResponse, type NextRequest } from "next/server";
import { orderRequestSchema } from "@/lib/orders/schema";
import { placeOrder } from "@/lib/orders/place-order";
import { OrderBackendError } from "@/lib/orders/store";

export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 20_000;

function clientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}

export async function POST(req: NextRequest) {
  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) return NextResponse.json({ error: "too_large" }, { status: 413 });

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  const parsed = orderRequestSchema.safeParse(json);
  if (!parsed.success) {
    const fields = [...new Set(parsed.error.issues.map((i) => String(i.path[0] ?? "")))];
    // A filled honeypot is a bot: answer like a normal validation error.
    return NextResponse.json({ error: "invalid_input", fields }, { status: 400 });
  }

  try {
    const result = await placeOrder(parsed.data, clientIp(req));
    if (!result.ok) {
      const { status, ...body } = result;
      return NextResponse.json(body, { status });
    }
    return NextResponse.json(
      { number: result.order.number, token: result.order.token, notified: result.notified, whatsappText: result.whatsappText },
      { status: 201 },
    );
  } catch (error) {
    console.error("[api/orders] failed", error);
    const status = error instanceof OrderBackendError ? 503 : 500;
    return NextResponse.json({ error: "server_error" }, { status });
  }
}
