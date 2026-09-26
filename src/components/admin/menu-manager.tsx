"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { DndContext, KeyboardSensor, PointerSensor, TouchSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  reorderAction,
  saveAddonOptionsAction,
  saveCategoryAction,
  setComboStatusAction,
  setItemFlagsAction,
} from "@/app/admin/actions";
import type { MenuWarning } from "@/lib/admin/validation";
import { formatPrice, parsePriceInput } from "@/lib/money";
import type { Category, ComboStatus, MenuData, MenuItem } from "@/lib/types";
import { Card, Toggle, adminInput } from "./ui";
import { useWarningText } from "./warning-text";

function priceRange(item: MenuItem): string {
  const prices = item.variants.map((v) => v.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return min === max ? formatPrice(min) : `${formatPrice(min)} – ${formatPrice(max)}`;
}

export function MenuManager({ menu, warnings }: { menu: MenuData; warnings: MenuWarning[] }) {
  const t = useTranslations("admin.menu");
  const tc = useTranslations("admin.common");
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [categories, setCategories] = useState(() => [...menu.categories].sort((a, b) => a.sortOrder - b.sortOrder));
  const [items, setItems] = useState(menu.items);
  const [open, setOpen] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const warningText = useWarningText();

  const itemsById = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
  const warningsByItem = useMemo(() => {
    const map = new Map<string, MenuWarning[]>();
    for (const w of warnings) map.set(w.itemId, [...(map.get(w.itemId) ?? []), w]);
    return map;
  }, [warnings]);

  const notify = (ok: boolean) => {
    setMessage(ok ? tc("saved") : tc("error"));
    setTimeout(() => setMessage(null), 2000);
    if (ok) startTransition(() => router.refresh());
  };

  const moveCategory = async (from: number, to: number) => {
    if (to < 0 || to >= categories.length) return;
    const next = arrayMove(categories, from, to);
    setCategories(next);
    notify((await reorderAction("categories", next.map((c) => c.id))).ok);
  };

  const setFlag = async (item: MenuItem, flags: { inStock?: boolean; isHidden?: boolean; needsReview?: boolean }) => {
    setItems((cur) => cur.map((i) => (i.id === item.id ? { ...i, ...flags } : i)));
    notify((await setItemFlagsAction(item.id, flags)).ok);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const from = categories.findIndex((c) => c.id === e.active.id);
    const to = categories.findIndex((c) => c.id === e.over!.id);
    void moveCategory(from, to);
  };

  const flaggedItems = [...warningsByItem.keys()].map((id) => itemsById.get(id)).filter((i): i is MenuItem => Boolean(i));

  return (
    <div className="space-y-5">
      <h1 className="font-heading text-3xl font-bold text-cream-50">{t("title")}</h1>

      <details className="rounded-2xl bg-coal-900 ring-1 ring-gold-400/40" open={flaggedItems.length > 0 && flaggedItems.length < 8}>
        <summary className="cursor-pointer list-none p-4 font-heading text-xl font-bold text-cream-50">
          ⚠️ {t("checksTitle")}:{" "}
          <span className={flaggedItems.length ? "text-gold-400" : "text-emerald-400"}>
            {flaggedItems.length ? t("checksCount", { count: warnings.length }) : t("checksNone")}
          </span>
        </summary>
        <ul className="divide-y divide-coal-700 border-t border-coal-700">
          {flaggedItems.map((item) => (
            <li key={item.id} className="space-y-1 p-3">
              <div className="flex items-center justify-between gap-2">
                <Link href={`/admin/menu/${item.id}`} className="font-semibold text-cream-50 underline-offset-4 hover:underline">
                  {item.name.az}
                </Link>
                {item.needsReview && (
                  <button
                    type="button"
                    onClick={() => setFlag(item, { needsReview: false })}
                    className="h-9 shrink-0 rounded-full bg-emerald-500 px-3 text-xs font-bold text-coal-950"
                  >
                    ✓ {t("markReviewed")}
                  </button>
                )}
              </div>
              <ul className="list-disc pl-5 text-sm text-gold-400">
                {warningsByItem.get(item.id)!.map((w, i) => (
                  <li key={i}>{warningText(w)}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </details>

      <Card title={t("categories")} actions={<NewCategory onSaved={(ok) => notify(ok)} />}>
        <p className="text-xs text-cream-500">{t("dragHint")}</p>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={categories.map((c) => c.id)} strategy={verticalListSortingStrategy}>
            <ul className="space-y-2">
              {categories.map((c, index) => (
                <SortableCategory
                  key={c.id}
                  category={c}
                  index={index}
                  last={index === categories.length - 1}
                  items={items.filter((i) => i.categoryId === c.id).sort((a, b) => a.sortOrder - b.sortOrder)}
                  open={open === c.id}
                  onToggle={() => setOpen(open === c.id ? null : c.id)}
                  onMove={moveCategory}
                  onFlag={setFlag}
                  warningsByItem={warningsByItem}
                  onSaved={notify}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      </Card>

      <CombosCard menu={menu} itemsById={itemsById} onSaved={notify} />
      <AddonsCard menu={menu} onSaved={notify} />

      <p role="status" aria-live="polite" className="fixed inset-x-0 bottom-20 z-50 mx-auto w-fit rounded-full bg-cream-100 px-4 py-2 text-sm font-bold text-coal-950 shadow-lg empty:hidden md:bottom-6">
        {message ?? ""}
      </p>
    </div>
  );
}

function SortableCategory(props: {
  category: Category;
  index: number;
  last: boolean;
  items: MenuItem[];
  open: boolean;
  onToggle: () => void;
  onMove: (from: number, to: number) => void;
  onFlag: (item: MenuItem, flags: { inStock?: boolean; isHidden?: boolean }) => void;
  warningsByItem: Map<string, MenuWarning[]>;
  onSaved: (ok: boolean) => void;
}) {
  const t = useTranslations("admin.menu");
  const { category: c, index, items } = props;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: c.id });
  const [editing, setEditing] = useState(false);

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`rounded-xl bg-coal-800 ring-1 ring-coal-600 ${isDragging ? "z-10 opacity-80 shadow-xl" : ""}`}
    >
      <div className="flex items-center gap-2 p-2">
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label={`${c.name.az} — ${t("dragHint")}`}
          className="grid h-11 w-9 shrink-0 cursor-grab touch-none place-items-center rounded-lg text-xl text-cream-500 active:cursor-grabbing"
        >
          ⠿
        </button>
        <button type="button" onClick={props.onToggle} aria-expanded={props.open} className="flex min-h-11 flex-1 items-center gap-2 text-left">
          <span aria-hidden className="text-xl">
            {c.icon}
          </span>
          <span className="font-semibold text-cream-50">{c.name.az}</span>
          <span className="text-xs text-cream-500">{t("items", { count: items.length })}</span>
          {!c.isVisible && <span className="rounded-full bg-coal-600 px-2 text-xs">{t("hidden")}</span>}
        </button>
        <button type="button" aria-label={t("moveUp")} disabled={index === 0} onClick={() => props.onMove(index, index - 1)} className="h-11 w-9 rounded-lg disabled:opacity-30">
          ↑
        </button>
        <button type="button" aria-label={t("moveDown")} disabled={props.last} onClick={() => props.onMove(index, index + 1)} className="h-11 w-9 rounded-lg disabled:opacity-30">
          ↓
        </button>
      </div>

      {props.open && (
        <div className="space-y-2 border-t border-coal-600 p-2">
          {editing ? (
            <CategoryForm
              category={c}
              onDone={(ok) => {
                setEditing(false);
                if (ok !== undefined) props.onSaved(ok);
              }}
            />
          ) : (
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setEditing(true)} className="h-10 rounded-full bg-coal-700 px-4 text-sm font-semibold">
                ✏️ {c.name.az}
              </button>
              <Link href={`/admin/menu/new?category=${c.id}`} className="inline-flex h-10 items-center rounded-full bg-flame-500 px-4 text-sm font-bold text-coal-950">
                + {t("newItem")}
              </Link>
            </div>
          )}
          <ul className="divide-y divide-coal-700">
            {items.map((item) => {
              const warn = props.warningsByItem.get(item.id)?.length ?? 0;
              return (
                <li key={item.id} className="flex flex-wrap items-center gap-3 py-2">
                  <Link href={`/admin/menu/${item.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                    <span className="relative h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-coal-700">
                      {item.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element -- small admin thumbnail (may be a data URL in demo mode)
                        <img src={item.imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
                      ) : (
                        <span className="grid h-full place-items-center text-lg">{c.icon}</span>
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className={`block truncate font-semibold ${item.inStock ? "text-cream-50" : "text-cream-500 line-through"}`}>
                        {item.name.az}
                      </span>
                      <span className="block text-xs text-cream-300">
                        {priceRange(item)}
                        {warn > 0 && <span className="ml-2 font-bold text-gold-400">⚠️ {warn}</span>}
                        {!item.imageUrl && <span className="ml-2 text-cream-500">· {t("noPhoto")}</span>}
                      </span>
                    </span>
                  </Link>
                  <div className="flex items-center gap-4">
                    <label className="flex flex-col items-center gap-0.5 text-[0.65rem] text-cream-300">
                      <Toggle checked={item.inStock} onChange={(v) => props.onFlag(item, { inStock: v })} label={`${item.name.az}: ${t("inStock")}`} />
                      {item.inStock ? t("inStock") : t("outOfStock")}
                    </label>
                    <label className="flex flex-col items-center gap-0.5 text-[0.65rem] text-cream-300">
                      <Toggle checked={!item.isHidden} onChange={(v) => props.onFlag(item, { isHidden: !v })} label={`${item.name.az}: ${t("visible")}`} />
                      {item.isHidden ? t("hidden") : t("visible")}
                    </label>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </li>
  );
}

function CategoryForm({ category, onDone }: { category?: Category; onDone: (ok?: boolean) => void }) {
  const t = useTranslations("admin.menu");
  const tc = useTranslations("admin.common");
  const tItem = useTranslations("admin.item");
  const [name, setName] = useState(category?.name ?? { az: "", ru: "", en: "" });
  const [icon, setIcon] = useState(category?.icon ?? "🍽️");
  const [visible, setVisible] = useState(category?.isVisible ?? true);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    const res = await saveCategoryAction({ id: category?.id, name, icon, isVisible: visible });
    setBusy(false);
    onDone(res.ok);
  };

  return (
    <div className="space-y-2 rounded-xl bg-coal-900 p-3">
      <div className="grid gap-2 sm:grid-cols-[5rem_1fr]">
        <input aria-label={t("categoryIcon")} value={icon} onChange={(e) => setIcon(e.target.value)} className={`${adminInput} text-center text-xl`} />
        <input aria-label={`${t("categoryName")} (${tItem("langAz")})`} placeholder={`${t("categoryName")} — ${tItem("langAz")}`} value={name.az} onChange={(e) => setName({ ...name, az: e.target.value })} className={adminInput} />
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <input aria-label={tItem("langRu")} placeholder={tItem("langRu")} value={name.ru ?? ""} onChange={(e) => setName({ ...name, ru: e.target.value })} className={adminInput} />
        <input aria-label={tItem("langEn")} placeholder={tItem("langEn")} value={name.en ?? ""} onChange={(e) => setName({ ...name, en: e.target.value })} className={adminInput} />
      </div>
      <label className="flex items-center justify-between text-sm">
        {t("categoryVisible")}
        <Toggle checked={visible} onChange={setVisible} label={t("categoryVisible")} />
      </label>
      <div className="flex gap-2">
        <button type="button" disabled={busy || !name.az.trim()} onClick={save} className="h-10 rounded-full bg-flame-500 px-4 text-sm font-bold text-coal-950 disabled:opacity-50">
          {busy ? tc("saving") : tc("save")}
        </button>
        <button type="button" onClick={() => onDone()} className="h-10 rounded-full bg-coal-700 px-4 text-sm">
          {tc("cancel")}
        </button>
      </div>
    </div>
  );
}

function NewCategory({ onSaved }: { onSaved: (ok: boolean) => void }) {
  const t = useTranslations("admin.menu");
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="h-10 rounded-full bg-coal-800 px-4 text-sm font-semibold ring-1 ring-coal-600">
        + {t("newCategory")}
      </button>
    );
  }
  return (
    <div className="w-full">
      <CategoryForm
        onDone={(ok) => {
          setOpen(false);
          if (ok !== undefined) onSaved(ok);
        }}
      />
    </div>
  );
}

function CombosCard({ menu, itemsById, onSaved }: { menu: MenuData; itemsById: Map<string, MenuItem>; onSaved: (ok: boolean) => void }) {
  const t = useTranslations("admin.menu");
  const [statuses, setStatuses] = useState(() => new Map(menu.combos.map((c) => [c.id, c.status])));
  return (
    <Card title={t("combos")}>
      <ul className="divide-y divide-coal-700">
        {menu.combos.map((combo) => {
          const item = itemsById.get(combo.itemId);
          if (!item) return null;
          return (
            <li key={combo.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <Link href={`/admin/menu/${item.id}`} className="min-w-0 flex-1">
                <span className="block font-semibold text-cream-50">{item.name.az}</span>
                <span className="text-xs text-cream-300">{priceRange(item)}</span>
              </Link>
              <select
                aria-label={`${item.name.az}: ${t("combos")}`}
                value={statuses.get(combo.id)}
                onChange={async (e) => {
                  const status = e.target.value as ComboStatus;
                  setStatuses(new Map(statuses).set(combo.id, status));
                  onSaved((await setComboStatusAction(combo.id, status)).ok);
                }}
                className="h-10 rounded-xl bg-coal-800 px-3 text-sm ring-1 ring-coal-600"
              >
                {(["active", "draft", "archived"] as const).map((s) => (
                  <option key={s} value={s}>
                    {t(`comboStatus.${s}`)}
                  </option>
                ))}
              </select>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

function AddonsCard({ menu, onSaved }: { menu: MenuData; onSaved: (ok: boolean) => void }) {
  const t = useTranslations("admin.menu");
  const tc = useTranslations("admin.common");
  const tItem = useTranslations("admin.item");
  const [options, setOptions] = useState(() =>
    menu.addonGroups.flatMap((g) => g.options.map((o) => ({ ...o, group: g.name.az, priceText: (o.price / 100).toFixed(2).replace(".", ",") }))),
  );
  const [busy, setBusy] = useState(false);
  const invalid = options.some((o) => parsePriceInput(o.priceText) === null);

  const save = async () => {
    setBusy(true);
    const res = await saveAddonOptionsAction(
      options.map((o) => ({ id: o.id, name: o.name, price: parsePriceInput(o.priceText) ?? 0, isAvailable: o.isAvailable })),
    );
    setBusy(false);
    onSaved(res.ok);
  };

  return (
    <Card title={t("addons")}>
      <p className="text-xs text-cream-500">{t("addonsHint")}</p>
      <ul className="space-y-2">
        {options.map((o, i) => {
          const header = i === 0 || options[i - 1].group !== o.group ? o.group : null;
          return (
            <li key={o.id}>
              {header && <p className="pt-2 text-sm font-bold text-cream-300">{header}</p>}
              <div className="grid grid-cols-[1fr_6rem_auto] items-center gap-2">
                <input
                  aria-label={tItem("name")}
                  value={o.name.az}
                  onChange={(e) => setOptions(options.map((x, j) => (j === i ? { ...x, name: { ...x.name, az: e.target.value } } : x)))}
                  className={adminInput}
                />
                <input
                  aria-label={`${o.name.az}: ${tItem("price")}`}
                  inputMode="decimal"
                  value={o.priceText}
                  aria-invalid={parsePriceInput(o.priceText) === null}
                  onChange={(e) => setOptions(options.map((x, j) => (j === i ? { ...x, priceText: e.target.value } : x)))}
                  className={`${adminInput} text-right`}
                  disabled={o.linkedVariantId !== null}
                />
                <Toggle
                  checked={o.isAvailable}
                  onChange={(v) => setOptions(options.map((x, j) => (j === i ? { ...x, isAvailable: v } : x)))}
                  label={`${o.name.az}: ${t("available")}`}
                />
              </div>
            </li>
          );
        })}
      </ul>
      <button type="button" onClick={save} disabled={busy || invalid} className="h-11 rounded-full bg-flame-500 px-5 font-bold text-coal-950 disabled:opacity-50">
        {busy ? tc("saving") : tc("save")}
      </button>
    </Card>
  );
}
