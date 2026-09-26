import { useTranslations } from "next-intl";
import type { PublicItem } from "@/lib/types";

export function ItemBadges({ item }: { item: PublicItem }) {
  const t = useTranslations("menu");
  const badges: { key: string; label: string; className: string }[] = [];
  if (!item.inStock) badges.push({ key: "stock", label: t("outOfStock"), className: "bg-cream-100 text-coal-950" });
  if (item.isPopular) badges.push({ key: "popular", label: `🔥 ${t("badge.popular")}`, className: "bg-flame-500 text-coal-950" });
  if (item.isNew) badges.push({ key: "new", label: t("badge.new"), className: "bg-gold-400 text-coal-950" });
  if (item.tags.includes("spicy")) badges.push({ key: "spicy", label: `🌶 ${t("badge.spicy")}`, className: "bg-ember-600 text-cream-50" });
  if (badges.length === 0) return null;
  return (
    <ul className="pointer-events-none absolute left-2 top-2 flex flex-wrap gap-1">
      {badges.map((b) => (
        <li key={b.key} className={`rounded-full px-2 py-0.5 text-[0.7rem] font-bold shadow ${b.className}`}>
          {b.label}
        </li>
      ))}
    </ul>
  );
}
