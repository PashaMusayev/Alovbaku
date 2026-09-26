import "server-only";
import type { OrderRecord } from "@/lib/orders/types";

/**
 * Pluggable online payment. No provider is enabled: orders are paid in cash or by
 * card on delivery. To add a local gateway (e.g. an Azerbaijani bank's e-commerce
 * API), implement PaymentProvider, register it below, set PAYMENT_PROVIDER to its id
 * and enable "online payment" in the settings. Ask the owner first — gateways charge fees.
 */
export interface PaymentProvider {
  id: string;
  /** Creates a payment session and returns the URL to redirect the customer to. */
  createPayment(order: OrderRecord, returnUrl: string): Promise<{ redirectUrl: string; reference: string }>;
  /** Verifies a gateway callback; returns the order id and whether it was paid. */
  verifyCallback(request: Request): Promise<{ orderId: string; paid: boolean }>;
}

const providers: Record<string, PaymentProvider> = {};

export function getOnlinePaymentProvider(): PaymentProvider | null {
  const id = process.env.PAYMENT_PROVIDER;
  return id ? (providers[id] ?? null) : null;
}
