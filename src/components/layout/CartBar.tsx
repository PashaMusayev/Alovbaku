"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useI18n } from "@/i18n/client";
import { cartCount, cartSubtotal, useCart } from "@/lib/cart-store";
import { formatPrice } from "@/lib/money";
import { BagIcon, ChevronRightIcon } from "@/components/ui/icons";

/** Sticky bottom bar — the primary thumb-reachable path to checkout. */
export function CartBar() {
  const { dict, f, href } = useI18n();
  const lines = useCart((s) => s.lines);

  useEffect(() => {
    void useCart.persist.rehydrate();
  }, []);

  const count = cartCount(lines);
  if (count === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <Link
        href={href("/cart")}
        className="mx-auto flex h-16 max-w-xl items-center gap-3 rounded-2xl bg-flame-500 px-4 text-coal-950 shadow-[0_10px_40px_-8px_rgba(255,90,31,0.7)] transition active:scale-[0.98]"
      >
        <span className="relative">
          <BagIcon width={26} height={26} />
          <span className="absolute -right-2 -top-2 grid h-5 min-w-5 place-items-center rounded-full bg-coal-950 px-1 text-[0.7rem] font-bold text-cream-50">
            {count}
          </span>
        </span>
        <span className="flex flex-col leading-tight">
          <span className="font-bold">{dict.cart.viewCart}</span>
          <span className="text-xs font-medium opacity-80">{f(dict.cart.itemsCount, { count })}</span>
        </span>
        <span className="ml-auto flex items-center gap-1 text-lg font-bold">
          {formatPrice(cartSubtotal(lines))}
          <ChevronRightIcon />
        </span>
      </Link>
    </div>
  );
}
