"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { matchesQuery } from "@/lib/search";
import { FILTER_TAGS, type FilterTag, type PublicItem } from "@/lib/types";
import { useAppData } from "@/components/providers/app-provider";
import { CloseIcon, SearchIcon } from "@/components/ui/icons";
import { ItemCard } from "./item-card";

const BESTSELLERS_ID = "bestsellers";

interface Section {
  id: string;
  name: string;
  icon: string;
  items: PublicItem[];
}

export function MenuBrowser() {
  const t = useTranslations();
  const { menu } = useAppData();
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<FilterTag[]>([]);
  const [active, setActive] = useState<string>(BESTSELLERS_ID);
  const tabsRef = useRef<HTMLDivElement>(null);
  const isFiltering = query.trim() !== "" || filters.length > 0;

  const sections = useMemo<Section[]>(() => {
    const match = (item: PublicItem) =>
      filters.every((f) => item.tags.includes(f)) &&
      matchesQuery(`${item.name} ${item.description} ${item.slug}`, query);

    const categorySections = menu.categories.map((c) => ({
      id: c.slug,
      name: c.name,
      icon: c.icon,
      items: c.itemIds.map((id) => menu.items[id]).filter(match),
    }));
    const bestsellers: Section = {
      id: BESTSELLERS_ID,
      name: t("home.bestsellers"),
      icon: "🔥",
      items: menu.bestsellerIds.map((id) => menu.items[id]).filter(Boolean),
    };
    return (isFiltering ? categorySections : [bestsellers, ...categorySections]).filter((s) => s.items.length > 0);
  }, [menu, filters, query, isFiltering, t]);

  // Scroll-spy: highlight the tab of the section currently under the sticky bars.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id.replace(/^section-/, ""));
      },
      { rootMargin: "-130px 0px -65% 0px" },
    );
    sections.forEach((s) => {
      const el = document.getElementById(`section-${s.id}`);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [sections]);


  // When search/filters remove the active section, fall back to the first visible one.
  const activeId = sections.some((s) => s.id === active) ? active : sections[0]?.id;

  // Keep the active tab visible in the horizontal tab strip.
  useEffect(() => {
    const strip = tabsRef.current;
    const tab = strip?.querySelector<HTMLElement>(`[data-tab="${activeId}"]`);
    if (strip && tab) strip.scrollTo({ left: tab.offsetLeft - 16, behavior: "smooth" });
  }, [activeId]);

  const toggleFilter = (f: FilterTag) =>
    setFilters((cur) => (cur.includes(f) ? cur.filter((x) => x !== f) : [...cur, f]));

  return (
    <div>
      <div className="mx-auto max-w-6xl space-y-3 px-4 pt-4">
        <div className="relative">
          <label htmlFor="menu-search" className="sr-only">
            {t("menu.searchLabel")}
          </label>
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-cream-500" />
          <input
            id="menu-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("menu.searchPlaceholder")}
            autoComplete="off"
            enterKeyHint="search"
            className="h-12 w-full rounded-full bg-coal-800 pl-11 [&::-webkit-search-cancel-button]:hidden pr-12 text-base text-cream-50 ring-1 ring-coal-600 placeholder:text-cream-500 focus:outline-none focus:ring-2 focus:ring-flame-500"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label={t("menu.clearSearch")}
              className="absolute right-1.5 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full text-cream-300"
            >
              <CloseIcon width={18} height={18} />
            </button>
          )}
        </div>
        <div role="group" aria-label={t("menu.filtersLabel")} className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          {FILTER_TAGS.map((f) => {
            const on = filters.includes(f);
            return (
              <button
                key={f}
                type="button"
                aria-pressed={on}
                onClick={() => toggleFilter(f)}
                className={`h-9 shrink-0 rounded-full px-4 text-sm font-semibold ring-1 transition ${
                  on ? "bg-cream-100 text-coal-950 ring-cream-100" : "bg-coal-900 text-cream-100 ring-coal-600"
                }`}
              >
                {t(`menu.filter.${f}`)}
              </button>
            );
          })}
        </div>
      </div>

      <nav
        aria-label={t("menu.categoriesLabel")}
        className="sticky top-14 z-30 mt-3 border-b border-coal-700/60 bg-coal-950/95 backdrop-blur"
      >
        <div ref={tabsRef} className="no-scrollbar mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 py-2">
          {sections.map((s) => (
            <a
              key={s.id}
              href={`#section-${s.id}`}
              data-tab={s.id}
              aria-current={activeId === s.id ? "true" : undefined}
              className={`flex h-10 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold whitespace-nowrap transition ${
                activeId === s.id ? "bg-flame-500 text-coal-950" : "text-cream-300 hover:bg-coal-800"
              }`}
            >
              <span aria-hidden>{s.icon}</span>
              {s.name}
            </a>
          ))}
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-4 pb-8">
        {sections.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-cream-300">{t("menu.noResults")}</p>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setFilters([]);
              }}
              className="mt-4 h-11 rounded-full bg-coal-800 px-5 font-semibold ring-1 ring-coal-600"
            >
              {t("menu.resetFilters")}
            </button>
          </div>
        )}
        {sections.map((s, si) => (
          <section key={s.id} id={`section-${s.id}`} aria-labelledby={`heading-${s.id}`} className="pt-6">
            <h2 id={`heading-${s.id}`} className="mb-3 flex items-center gap-2 font-heading text-2xl font-bold text-cream-50">
              <span aria-hidden>{s.icon}</span>
              {s.name}
            </h2>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {s.items.map((item, i) => (
                <li key={item.id}>
                  <ItemCard item={item} priority={si === 0 && i < 2} />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
