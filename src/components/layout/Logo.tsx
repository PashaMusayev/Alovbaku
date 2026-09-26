import clsx from "clsx";

/** Flame mark + condensed wordmark. Sized to stay legible on phones. */
export function Logo({ className, subtitle }: { className?: string; subtitle?: string }) {
  return (
    <span className={clsx("inline-flex items-center gap-2", className)}>
      <svg viewBox="0 0 40 48" className="h-9 w-auto shrink-0 sm:h-10" aria-hidden="true">
        <defs>
          <linearGradient id="logo-flame" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#d7261e" />
            <stop offset="55%" stopColor="#ff5a1f" />
            <stop offset="100%" stopColor="#ffc15a" />
          </linearGradient>
        </defs>
        <path
          d="M20 2c3 8 12 13 12 25a12 12 0 0 1-24 0c0-6 3-9 5-12 0 4 2 7 4 8-1-8 1-15 3-21z"
          fill="url(#logo-flame)"
        />
        <path d="M20 26c2 3 5 5 5 9a5 5 0 0 1-10 0c0-3 3-5 5-9z" fill="#fff1e0" />
      </svg>
      <span className="flex flex-col leading-none">
        <span className="font-display text-xl font-bold sm:text-2xl uppercase tracking-wide text-cream-50">
          Alov <span className="text-flame-500">Baku</span>
        </span>
        {subtitle && (
          <span className="mt-0.5 hidden text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-cream-400 sm:block">
            {subtitle}
          </span>
        )}
      </span>
    </span>
  );
}
