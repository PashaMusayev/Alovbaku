"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "@/i18n/client";
import { normalizeSearch } from "@/lib/search";
import type { Category, MenuItem } from "@/lib/types";
import { CloseIcon, SearchIcon } from "@/components/ui/icons";
import { MenuItemCard } from "./MenuItemCard";
import { useMenuActions } from "./MenuProvider";

type Filter = "spicy" | "chicken" | "meat" | "vegetarian";
const FILTERS: Filter[] = ["spicy", "chicken", "meat", "vegetarian"];

function matchesFilter(item: MenuItem, filter: Filter): boolean {
  return filter === "spicy" ? item.isSpicy : item.dietTags.includes(filter);
}

function searchableText(item: MenuItem): string {
  const parts = [
    ...Object.values(item.name),
    ...Object.values(item.description ?? {}),
    ...item.variants.flatMap((v) => Object.values(v.label)),
  ];
  return normalizeSearch(parts.filter(Boolean).join(" "));
}

export function MenuBrowser({ categories, items }: { categories: Category[]; items: MenuItem[] }) {
  const { dict, f, l } = useI18n();
  const { openItem } = useMenuActions();
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Filter[]>([]);
  const [active, setActive] = useState(categories[0]?.id ?? "");
  const tabsRef = useRef<HTMLDivElement>(null);
  const clickScrolling = useRef(false);

  const index = useMemo(() => new Map(items.map((i) => [i.id, searchableText(i)])), [items]);

  const sections = useMemo(() => {
    const q = normalizeSearch(query);
    const visible = items.filter(
      (i) =>
        (!q || (index.get(i.id) ?? "").includes(q)) && filters.every((flt) => matchesFilter(i, flt)),
    );
    return categories
      .map((c) => ({ category: c, items: visible.filter((i) => i.categoryId === c.id) }))
      .filter((s) => s.items.length > 0);
  }, [categories, items, index, query, filters]);

  const resultCount = sections.reduce((n, s) => n + s.items.length, 0);
  const isFiltering = query.trim() !== "" || filters.length > 0;

  // Scroll-spy: highlight the category whose section is under the sticky tabs.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (clickScrolling.current) return;
        const top = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (top) setActive(top.target.id.replace(/^cat-/, ""));
      },
      { rootMargin: "-140px 0px -55% 0px", threshold: 0 },
    );
    sections.forEach((s) => {
      const el = document.getElementById(`cat-${s.category.id}`);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [sections]);

  // Keep the active tab visible in the horizontal strip.
  useEffect(() => {
    const tab = tabsRef.current?.querySelector<HTMLElement>(`[data-cat="${active}"]`);
    tab?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [active]);

  function jumpTo(id: string) {
    setActive(id);
    clickScrolling.current = true;
    document.getElementById(`cat-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => (clickScrolling.current = false), 700);
  }

  function toggleFilter(flt: Filter) {
    setFilters((prev) => (prev.includes(flt) ? prev.filter((x) => x !== flt) : [...prev, flt]));
  }

  return (
    <div>
      <div className="mx-auto max-w-6xl space-y-3 px-4 pt-4">
        <label className="relative block">
          <span className="sr-only">{dict.menu.searchLabel}</span>
          <SearchIcon className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-cream-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={dict.menu.searchPlaceholder}
            className="h-12 w-full rounded-full border border-coal-600 bg-coal-800 pl-12 pr-12 text-base text-cream-50 placeholder:text-cream-500 focus:border-flame-500 focus:outline-none"
            enterKeyHint="search"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full text-cream-400 hover:text-cream-50"
              aria-label={dict.menu.clearSearch}
            >
              <CloseIcon />
            </button>
          )}
        </label>
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4" role="group" aria-label={dict.menu.filters}>
          {FILTERS.map((flt) => (
            <button key={flt} type="button" className="chip" aria-pressed={filters.includes(flt)} onClick={() => toggleFilter(flt)}>
              {flt === "spicy" && "🌶"} {dict.filters[flt]}
            </button>
          ))}
        </div>
        {isFiltering && (
          <p className="text-sm text-cream-400" aria-live="polite">
            {f(dict.menu.resultsCount, { count: resultCount })}
          </p>
        )}
      </div>

      <nav
        aria-label={dict.menu.categoriesNav}
        className="sticky top-16 z-30 mt-3 border-y border-coal-700 bg-coal-900/95 backdrop-blur"
      >
        <div ref={tabsRef} className="no-scrollbar mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 py-2.5">
          {sections.map(({ category }) => (
            <button
              key={category.id}
              type="button"
              data-cat={category.id}
              aria-current={active === category.id ? "true" : undefined}
              onClick={() => jumpTo(category.id)}
              className={
                active === category.id
                  ? "chip border-flame-500 bg-flame-500 font-bold text-coal-950"
                  : "chip"
              }
            >
              {l(category.name)}
            </button>
          ))}
        </div>
      </nav>

      <div className="mx-auto max-w-6xl space-y-10 px-4 pb-32 pt-6">
        {sections.length === 0 && <p className="py-16 text-center text-cream-400">{dict.menu.noResults}</p>}
        {sections.map(({ category, items: catItems }, sIdx) => (
          <section key={category.id} id={`cat-${category.id}`} aria-labelledby={`h-${category.id}`} className="scroll-mt-36">
            <h2 id={`h-${category.id}`} className="section-title mb-4">
              {l(category.name)}
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {catItems.map((item, i) => (
                <MenuItemCard key={item.id} item={item} onSelect={openItem} priority={sIdx === 0 && i < 2} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
