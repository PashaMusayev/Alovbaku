"use client";

import type { ReactNode } from "react";

export const adminInput =
  "h-11 w-full rounded-xl bg-coal-800 px-3 text-base text-cream-50 ring-1 ring-coal-600 placeholder:text-cream-500 focus:outline-none focus:ring-2 focus:ring-flame-500 aria-[invalid=true]:ring-ember-500";

export function Card({ title, children, actions }: { title?: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <section className="space-y-3 rounded-2xl bg-coal-900 p-4 ring-1 ring-coal-700">
      {(title || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          {title && <h2 className="font-heading text-xl font-bold text-cream-50">{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

/** Large, thumb-friendly on/off switch. */
export function Toggle({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full transition disabled:opacity-50 ${checked ? "bg-emerald-500" : "bg-coal-600"}`}
    >
      <span className={`inline-block h-6 w-6 rounded-full bg-cream-50 shadow transition ${checked ? "translate-x-7" : "translate-x-1"}`} />
    </button>
  );
}

export function LabeledToggle(props: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <label className="flex min-h-11 items-center justify-between gap-3">
      <span className="text-sm font-semibold text-cream-100">{props.label}</span>
      <Toggle {...props} />
    </label>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-semibold text-cream-100">{label}</span>
      {children}
      {hint && <span className="block text-xs text-cream-500">{hint}</span>}
    </label>
  );
}
