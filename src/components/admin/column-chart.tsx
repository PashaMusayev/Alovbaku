"use client";

import { useState } from "react";

export interface ColumnDatum {
  key: string;
  /** Short axis label (shown sparsely). */
  label: string;
  value: number;
  /** Formatted value for tooltip / table. */
  display: string;
}

/** Rounded axis maximum whose half is also a clean number (2, 4, 10, 20, 40, 100…). */
function niceMax(v: number): number {
  if (v <= 2) return 2;
  const pow = 10 ** Math.floor(Math.log10(v));
  const n = v / pow;
  return (n <= 2 ? 2 : n <= 4 ? 4 : 10) * pow;
}

/**
 * Single-series column chart (one hue, so no legend — the title names it).
 * Thin columns (≤ 24px) with 4px rounded tops, hairline grid, hover tooltip,
 * the peak value labelled, and a table view for screen readers / exact numbers.
 */
export function ColumnChart({
  data,
  title,
  tableLabel,
  formatTick,
  labelEvery = 1,
}: {
  data: ColumnDatum[];
  title: string;
  tableLabel: string;
  formatTick: (v: number) => string;
  labelEvery?: number;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const max = niceMax(Math.max(0, ...data.map((d) => d.value)));
  const peak = data.reduce((best, d, i) => (d.value > data[best].value ? i : best), 0);

  return (
    <figure className="min-w-0 space-y-2">
      <figcaption className="font-semibold text-cream-100">{title}</figcaption>
      <div className="relative flex h-44 gap-2" aria-hidden>
        <div className="flex w-12 shrink-0 flex-col justify-between text-right text-[0.65rem] tabular-nums text-cream-500">
          <span>{formatTick(max)}</span>
          <span>{formatTick(max / 2)}</span>
          <span>0</span>
        </div>
        <div className="relative flex-1">
          {[0, 0.5, 1].map((f) => (
            <div key={f} className="absolute inset-x-0 border-t border-coal-700" style={{ top: `${f * 100}%` }} />
          ))}
          <div className="absolute inset-0 flex items-end gap-[2px]">
            {data.map((d, i) => (
              <div
                key={d.key}
                className="relative flex h-full min-w-0 flex-1 items-end justify-center"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                onTouchStart={() => setHover(i)}
              >
                <div
                  className={`w-full max-w-6 rounded-t-[4px] transition-colors ${hover === i ? "bg-flame-300" : "bg-flame-500"}`}
                  style={{ height: `${(d.value / max) * 100}%`, minHeight: d.value > 0 ? 2 : 0 }}
                />
                {i === peak && d.value > 0 && hover === null && (
                  <span className="absolute text-[0.65rem] font-bold text-cream-100" style={{ bottom: `calc(${(d.value / max) * 100}% + 2px)` }}>
                    {d.display}
                  </span>
                )}
                {hover === i && (
                  <span className="pointer-events-none absolute bottom-full z-10 mb-1 whitespace-nowrap rounded-lg bg-cream-100 px-2 py-1 text-xs font-bold text-coal-950 shadow">
                    {d.label}: {d.display}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex gap-2 pl-14 text-[0.6rem] text-cream-500" aria-hidden>
        {data.map((d, i) => (
          <span key={d.key} className="w-0 min-w-0 flex-1 overflow-visible whitespace-nowrap text-center">
            {i % labelEvery === 0 ? d.label : ""}
          </span>
        ))}
      </div>
      <details className="text-sm">
        <summary className="cursor-pointer text-xs text-cream-500">{tableLabel}</summary>
        <table className="mt-2 w-full text-left text-xs">
          <tbody>
            {data.map((d) => (
              <tr key={d.key} className="border-t border-coal-700">
                <th scope="row" className="py-1 font-normal text-cream-300">
                  {d.label}
                </th>
                <td className="py-1 text-right tabular-nums">{d.display}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
