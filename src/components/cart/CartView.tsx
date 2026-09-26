"use client";

import Link from "next/link";
import { useI18n } from "@/i18n/client";
import { cartSubtotal, useCart } from "@/lib/cart-store";
import { formatPrice } from "@/lib/money";
import { FoodImage } from "@/components/menu/FoodImage";
import { MinusIcon, PlusIcon } from "@/components/ui/icons";

export function CartView({ whatsapp }: { whatsapp: string }) {
  const { dict, l, href } = useI18n();
  const lines = useCart((s) => s.lines);
  const setQuantity = useCart((s) => s.setQuantity);
  const subtotal = cartSubtotal(lines);

  const waText = [
    dict.cart.whatsappGreeting,
    ...lines.map(
      (line) =>
        `• ${line.quantity} × ${l(line.name)}${line.variantLabel ? ` (${l(line.variantLabel)})` : ""}${
          line.optionNames.length ? ` + ${line.optionNames.map(l).join(", ")}` : ""
        } — ${formatPrice(line.unitPrice * line.quantity)}`,
    ),
    `${dict.cart.subtotal}: ${formatPrice(subtotal)}`,
  ].join("\n");

  return (
    <div className="mx-auto max-w-2xl px-4 pb-40 pt-6">
      <h1 className="section-title mb-5">{dict.cart.title}</h1>
      {lines.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="mb-4 text-cream-400">{dict.cart.empty}</p>
          <Link href={href("/menu")} className="btn-primary">
            {dict.cart.continueShopping}
          </Link>
        </div>
      ) : (
        <>
          <ul className="space-y-3">
            {lines.map((line) => (
              <li key={line.key} className="card flex gap-3 p-3">
                <FoodImage src={line.imageUrl} art={line.art} alt={l(line.name)} sizes="96px" className="w-24 shrink-0 rounded-xl" />
                <div className="flex min-w-0 flex-1 flex-col">
                  <p className="font-semibold text-cream-50">{l(line.name)}</p>
                  {line.variantLabel && <p className="text-sm text-cream-400">{l(line.variantLabel)}</p>}
                  {line.optionNames.length > 0 && (
                    <p className="text-xs text-cream-500">+ {line.optionNames.map(l).join(", ")}</p>
                  )}
                  <div className="mt-auto flex items-center justify-between pt-2">
                    <div className="flex items-center rounded-full border border-coal-500" role="group" aria-label={dict.item.quantity}>
                      <button
                        type="button"
                        className="grid h-10 w-10 place-items-center"
                        onClick={() => setQuantity(line.key, line.quantity - 1)}
                        aria-label={line.quantity === 1 ? dict.cart.remove : dict.item.decrease}
                      >
                        <MinusIcon />
                      </button>
                      <span className="w-6 text-center font-bold">{line.quantity}</span>
                      <button
                        type="button"
                        className="grid h-10 w-10 place-items-center"
                        onClick={() => setQuantity(line.key, line.quantity + 1)}
                        aria-label={dict.item.increase}
                      >
                        <PlusIcon />
                      </button>
                    </div>
                    <span className="font-bold text-flame-400">{formatPrice(line.unitPrice * line.quantity)}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <div className="card mt-5 flex items-center justify-between p-4 text-lg">
            <span className="text-cream-200">{dict.cart.subtotal}</span>
            <span className="font-bold text-cream-50">{formatPrice(subtotal)}</span>
          </div>
          <a
            href={`https://wa.me/${whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(waText)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary mt-5 w-full"
          >
            {dict.cart.orderViaWhatsapp}
          </a>
        </>
      )}
    </div>
  );
}
