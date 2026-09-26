"use client";

import clsx from "clsx";
import { useI18n } from "@/i18n/client";
import type { MenuItem } from "@/lib/types";

export function Badges({ item, className }: { item: MenuItem; className?: string }) {
  const { dict } = useI18n();
  const badges: { key: string; label: string; cls: string }[] = [];
  if (item.isPopular) badges.push({ key: "popular", label: `🔥 ${dict.badges.popular}`, cls: "bg-flame-500 text-coal-950" });
  if (item.isNew) badges.push({ key: "new", label: dict.badges.new, cls: "bg-gold-400 text-coal-950" });
  if (item.isSpicy) badges.push({ key: "spicy", label: `🌶 ${dict.badges.spicy}`, cls: "bg-ember-500 text-cream-50" });
  if (item.isCombo) badges.push({ key: "combo", label: dict.badges.combo, cls: "bg-cream-100 text-coal-950" });
  if (badges.length === 0) return null;
  return (
    <div className={clsx("flex flex-wrap gap-1.5", className)}>
      {badges.map((b) => (
        <span key={b.key} className={clsx("rounded-full px-2.5 py-1 text-[0.7rem] font-bold uppercase tracking-wide", b.cls)}>
          {b.label}
        </span>
      ))}
    </div>
  );
}
