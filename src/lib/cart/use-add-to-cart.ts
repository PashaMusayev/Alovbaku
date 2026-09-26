"use client";

import { useTranslations } from "next-intl";
import { useAppData } from "@/components/providers/app-provider";
import { useCart, type CartLine } from "./store";
import { useUi } from "./ui-store";
import { pickUpsell } from "./upsell";

/** Adds a line, confirms with a toast and, for main dishes, offers a drink/side. */
export function useAddToCart() {
  const t = useTranslations("item");
  const { menu } = useAppData();
  const add = useCart((s) => s.add);
  const showToast = useUi((s) => s.showToast);
  const showUpsell = useUi((s) => s.showUpsell);

  return (line: Omit<CartLine, "key">, { upsell = true }: { upsell?: boolean } = {}) => {
    add(line);
    const item = menu.items[line.itemId];
    if (item) showToast(t("added", { name: item.name }));
    const suggestion = upsell ? pickUpsell(line.itemId, useCart.getState().lines, menu) : null;
    showUpsell(suggestion?.id ?? null);
  };
}
