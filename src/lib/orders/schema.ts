import { z } from "zod";
import { LOCALES } from "@/lib/types";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((v) => (v ? v : null));

/** Shape of the order request. Prices are deliberately absent: the server computes them. */
export const orderRequestSchema = z.object({
  locale: z.enum(LOCALES),
  customerName: z.string().trim().min(2).max(60),
  phone: z.string().trim().min(7).max(30),
  fulfillment: z.enum(["delivery", "pickup"]),
  address: optionalText(200),
  addressNotes: optionalText(200),
  lat: z.number().min(-90).max(90).nullish(),
  lng: z.number().min(-180).max(180).nullish(),
  notes: optionalText(300),
  paymentMethod: z.enum(["cash", "card_on_delivery", "online"]),
  scheduledFor: z.iso.datetime({ offset: true }).nullish(),
  lines: z
    .array(
      z.object({
        itemId: z.uuid(),
        variantId: z.uuid(),
        addonIds: z.array(z.uuid()).max(12),
        quantity: z.number().int().min(1).max(50),
      }),
    )
    .min(1)
    .max(40),
  /** Honeypot: hidden field that humans leave empty. */
  website: z.string().max(0).optional(),
});

export type OrderRequest = z.infer<typeof orderRequestSchema>;
