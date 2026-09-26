"use client";

import { useTranslations } from "next-intl";
import { MAX_LINE_QUANTITY } from "@/lib/cart/store";
import { MinusIcon, PlusIcon, TrashIcon } from "./icons";

interface Props {
  value: number;
  onChange: (value: number) => void;
  /** 0 allows removing (shows a trash icon at 1). */
  min?: number;
  label: string;
  size?: "md" | "sm";
}

export function QuantityStepper({ value, onChange, min = 1, label, size = "md" }: Props) {
  const t = useTranslations("item");
  const btn = size === "md" ? "h-12 w-12" : "h-9 w-9";
  const showTrash = min === 0 && value === 1;
  return (
    <div role="group" aria-label={label} className="flex items-center rounded-full bg-coal-800 ring-1 ring-coal-600">
      <button
        type="button"
        className={`${btn} grid place-items-center rounded-full text-cream-100 disabled:opacity-40`}
        onClick={() => onChange(value - 1)}
        disabled={value <= min}
        aria-label={t("decrease")}
      >
        {showTrash ? <TrashIcon width={18} height={18} /> : <MinusIcon />}
      </button>
      <output aria-live="polite" className="min-w-6 text-center font-bold tabular-nums">
        {value}
      </output>
      <button
        type="button"
        className={`${btn} grid place-items-center rounded-full text-cream-100 disabled:opacity-40`}
        onClick={() => onChange(value + 1)}
        disabled={value >= MAX_LINE_QUANTITY}
        aria-label={t("increase")}
      >
        <PlusIcon />
      </button>
    </div>
  );
}
