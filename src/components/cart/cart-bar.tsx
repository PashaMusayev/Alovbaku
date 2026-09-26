"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { useCart } from "@/lib/cart/store";
import { computeCart } from "@/lib/cart/totals";
import { useUi } from "@/lib/cart/ui-store";
import { formatPrice } from "@/lib/money";
import { useAppData } from "@/components/providers/app-provider";
import { CartIcon } from "@/components/ui/icons";
import { UpsellBar } from "./upsell-bar";

/** Sticky bottom bar: always one thumb-tap away from the cart. */
export function CartBar() {
  const t = useTranslations("cart");
  const { menu } = useAppData();
  const lines = useCart((s) => s.lines);
  const toast = useUi((s) => s.toast);
  const pathname = usePathname();
  const { count, subtotal } = computeCart(lines, menu);
  const onCartFlow = pathname === "/cart" || pathname === "/checkout" || pathname.startsWith("/order/");
  const showBar = count > 0 && !onCartFlow;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex flex-col items-center gap-2 px-3 pb-safe">
      <p
        role="status"
        aria-live="polite"
        className={`rounded-full bg-cream-100 px-4 py-2 text-sm font-semibold text-coal-950 shadow-lg transition ${
          toast ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
        }`}
      >
        {toast ?? ""}
      </p>
      {!onCartFlow && <UpsellBar />}
      {showBar && (
        <Link
          href="/cart"
          className="pointer-events-auto flex h-14 w-full max-w-lg items-center gap-3 rounded-full bg-flame-500 pl-2 pr-5 text-coal-950 shadow-glow transition active:scale-[0.99]"
        >
          <span className="grid h-10 w-10 place-items-center rounded-full bg-coal-950 text-flame-400">
            <CartIcon />
          </span>
          <span className="flex-1 text-left">
            <span className="block text-base font-bold leading-tight">{t("view")}</span>
            <span className="block text-xs font-semibold leading-tight opacity-80">{t("items", { count })}</span>
          </span>
          <span className="text-lg font-extrabold tabular-nums">{formatPrice(subtotal)}</span>
        </Link>
      )}
    </div>
  );
}
