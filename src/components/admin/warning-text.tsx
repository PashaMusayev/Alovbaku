"use client";

import { useTranslations } from "next-intl";
import type { MenuWarning } from "@/lib/admin/validation";
import { formatPrice } from "@/lib/money";

export function useWarningText() {
  const t = useTranslations("admin.menu.warning");
  return (w: MenuWarning) =>
    w.kind === "price_outlier"
      ? t("price_outlier", { price: formatPrice(Number(w.params.price)), median: formatPrice(Number(w.params.median)), ratio: w.params.ratio })
      : t(w.kind, w.params as Record<string, string>);
}
