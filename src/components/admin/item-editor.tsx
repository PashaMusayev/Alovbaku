"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { deleteItemAction, saveItemAction } from "@/app/admin/actions";
import type { MenuWarning } from "@/lib/admin/validation";
import { parsePriceInput } from "@/lib/money";
import { ITEM_TAGS, type AddonGroup, type Category, type ItemTag, type LocalizedText, type MenuItem } from "@/lib/types";
import { ImageCropper } from "./image-cropper";
import { Card, Field, LabeledToggle, adminInput } from "./ui";
import { useWarningText } from "./warning-text";

interface VariantRow {
  key: string;
  id?: string;
  label: LocalizedText;
  priceText: string;
  isAvailable: boolean;
}

const toText = (qepik: number) => (qepik / 100).toFixed(2).replace(".", ",");
let keySeq = 0;
const newKey = () => `v${++keySeq}`;

function LocalizedInputs({
  label,
  value,
  onChange,
  multiline,
  required,
}: {
  label: string;
  value: LocalizedText;
  onChange: (v: LocalizedText) => void;
  multiline?: boolean;
  required?: boolean;
}) {
  const t = useTranslations("admin.item");
  const langs = [
    ["az", t("langAz")],
    ["ru", t("langRu")],
    ["en", t("langEn")],
  ] as const;
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-semibold text-cream-100">{label}</legend>
      {langs.map(([lang, langLabel]) =>
        multiline ? (
          <textarea
            key={lang}
            aria-label={`${label} — ${langLabel}`}
            placeholder={langLabel}
            rows={2}
            value={value[lang] ?? ""}
            onChange={(e) => onChange({ ...value, [lang]: e.target.value })}
            className="w-full rounded-xl bg-coal-800 px-3 py-2 text-base text-cream-50 ring-1 ring-coal-600 placeholder:text-cream-500 focus:outline-none focus:ring-2 focus:ring-flame-500"
          />
        ) : (
          <input
            key={lang}
            aria-label={`${label} — ${langLabel}`}
            placeholder={langLabel}
            required={required && lang === "az"}
            aria-invalid={required && lang === "az" && !value.az.trim()}
            value={value[lang] ?? ""}
            onChange={(e) => onChange({ ...value, [lang]: e.target.value })}
            className={adminInput}
          />
        ),
      )}
    </fieldset>
  );
}

export function ItemEditor({
  item,
  categories,
  addonGroups,
  defaultCategoryId,
  warnings,
}: {
  item: MenuItem | null;
  categories: Category[];
  addonGroups: AddonGroup[];
  defaultCategoryId?: string;
  warnings: MenuWarning[];
}) {
  const t = useTranslations("admin.item");
  const tc = useTranslations("admin.common");
  const router = useRouter();
  const warningText = useWarningText();

  const [name, setName] = useState<LocalizedText>(item?.name ?? { az: "", ru: "", en: "" });
  const [description, setDescription] = useState<LocalizedText>(item?.description ?? { az: "", ru: "", en: "" });
  const [categoryId, setCategoryId] = useState(item?.categoryId ?? defaultCategoryId ?? categories[0]?.id ?? "");
  const [imageUrl, setImageUrl] = useState<string | null>(item?.imageUrl ?? null);
  const [tags, setTags] = useState<ItemTag[]>(item?.tags ?? []);
  const [isPopular, setPopular] = useState(item?.isPopular ?? false);
  const [isNew, setNew] = useState(item?.isNew ?? !item);
  const [isHidden, setHidden] = useState(item?.isHidden ?? false);
  const [inStock, setInStock] = useState(item?.inStock ?? true);
  const [isCombo, setCombo] = useState(item?.isCombo ?? false);
  const [featuredText, setFeaturedText] = useState(item?.featuredRank ? String(item.featuredRank) : "");
  const [needsReview, setNeedsReview] = useState(item?.needsReview ?? false);
  const [reviewNote, setReviewNote] = useState(item?.reviewNote ?? "");
  const [addonGroupIds, setAddonGroupIds] = useState<string[]>(item?.addonGroupIds ?? []);
  const [variants, setVariants] = useState<VariantRow[]>(() =>
    item?.variants.length
      ? item.variants.map((v) => ({ key: newKey(), id: v.id, label: v.label ?? { az: "", ru: "", en: "" }, priceText: toText(v.price), isAvailable: v.isAvailable }))
      : [{ key: newKey(), label: { az: "", ru: "", en: "" }, priceText: "", isAvailable: true }],
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const priceErrors = variants.map((v) => parsePriceInput(v.priceText) === null);
  const updateVariant = (key: string, patch: Partial<VariantRow>) => setVariants((vs) => vs.map((v) => (v.key === key ? { ...v, ...patch } : v)));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.az.trim()) return setError(t("nameRequired"));
    if (priceErrors.some(Boolean)) return setError(t("priceInvalid"));
    setBusy(true);
    const featured = Number(featuredText);
    const res = await saveItemAction({
      id: item?.id,
      categoryId,
      name,
      description,
      imageUrl,
      tags,
      isPopular,
      isNew,
      isHidden,
      inStock,
      featuredRank: featuredText && featured >= 1 ? Math.floor(featured) : null,
      needsReview,
      reviewNote: needsReview ? reviewNote || null : null,
      isCombo,
      variants: variants.map((v) => ({ id: v.id, label: v.label, price: parsePriceInput(v.priceText) ?? 0, isAvailable: v.isAvailable })),
      addonGroupIds,
    });
    setBusy(false);
    if (!res.ok) return setError(res.error === "invalid" ? `${tc("error")} (${res.fields?.join(", ")})` : tc("error"));
    router.push("/admin/menu");
    router.refresh();
  };

  const remove = async () => {
    if (!item || !window.confirm(tc("confirmDelete"))) return;
    setBusy(true);
    const res = await deleteItemAction(item.id);
    setBusy(false);
    if (!res.ok) return setError(tc("error"));
    router.push("/admin/menu");
    router.refresh();
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Link href="/admin/menu" className="text-sm font-semibold text-cream-300">
          ← {tc("back")}
        </Link>
        <h1 className="font-heading text-2xl font-bold text-cream-50">{item ? t("titleEdit") : t("titleNew")}</h1>
      </div>

      {warnings.length > 0 && (
        <ul className="list-disc space-y-1 rounded-2xl bg-gold-400/10 p-4 pl-8 text-sm text-gold-400 ring-1 ring-gold-400/40">
          {warnings.map((w, i) => (
            <li key={i}>{warningText(w)}</li>
          ))}
        </ul>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <Card title={t("photo")}>
            <ImageCropper value={imageUrl} onChange={setImageUrl} />
          </Card>
          <Card>
            <LocalizedInputs label={t("name")} value={name} onChange={setName} required />
            <LocalizedInputs label={t("description")} value={description} onChange={setDescription} multiline />
            <Field label={t("category")}>
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={adminInput}>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.name.az}
                  </option>
                ))}
              </select>
            </Field>
          </Card>
        </div>

        <div className="space-y-4">
          <Card title={t("variants")}>
            <p className="text-xs text-cream-500">{t("variantsHint")}</p>
            <ul className="space-y-3">
              {variants.map((v, i) => (
                <li key={v.key} className="space-y-2 rounded-xl bg-coal-800 p-3 ring-1 ring-coal-600">
                  <div className="grid grid-cols-[1fr_7rem] gap-2">
                    <input
                      aria-label={`${t("variantLabel")} ${i + 1} — ${t("langAz")}`}
                      placeholder={`${t("variantLabel")} (${t("langAz")})`}
                      value={v.label.az}
                      onChange={(e) => updateVariant(v.key, { label: { ...v.label, az: e.target.value } })}
                      className={adminInput}
                    />
                    <input
                      aria-label={`${t("price")} ${i + 1}`}
                      placeholder="0,00"
                      inputMode="decimal"
                      value={v.priceText}
                      aria-invalid={priceErrors[i]}
                      onChange={(e) => updateVariant(v.key, { priceText: e.target.value })}
                      className={`${adminInput} text-right font-bold`}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      aria-label={`${t("variantLabel")} ${i + 1} — ${t("langRu")}`}
                      placeholder={t("langRu")}
                      value={v.label.ru ?? ""}
                      onChange={(e) => updateVariant(v.key, { label: { ...v.label, ru: e.target.value } })}
                      className={adminInput}
                    />
                    <input
                      aria-label={`${t("variantLabel")} ${i + 1} — ${t("langEn")}`}
                      placeholder={t("langEn")}
                      value={v.label.en ?? ""}
                      onChange={(e) => updateVariant(v.key, { label: { ...v.label, en: e.target.value } })}
                      className={adminInput}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <LabeledToggle label={t("variantAvailable")} checked={v.isAvailable} onChange={(on) => updateVariant(v.key, { isAvailable: on })} />
                    {variants.length > 1 && (
                      <button type="button" onClick={() => setVariants(variants.filter((x) => x.key !== v.key))} className="text-sm font-semibold text-ember-500">
                        {t("removeVariant")}
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => setVariants([...variants, { key: newKey(), label: { az: "", ru: "", en: "" }, priceText: "", isAvailable: true }])}
              className="h-10 rounded-full bg-coal-800 px-4 text-sm font-semibold ring-1 ring-coal-600"
            >
              + {t("addVariant")}
            </button>
          </Card>

          <Card title={t("status")}>
            <LabeledToggle label={t("inStock")} checked={inStock} onChange={setInStock} />
            <LabeledToggle label={t("hidden")} checked={isHidden} onChange={setHidden} />
            <LabeledToggle label={t("popular")} checked={isPopular} onChange={setPopular} />
            <LabeledToggle label={t("new")} checked={isNew} onChange={setNew} />
            <LabeledToggle label={t("combo")} checked={isCombo} onChange={setCombo} />
            <Field label={t("featuredRank")}>
              <input inputMode="numeric" value={featuredText} onChange={(e) => setFeaturedText(e.target.value.replace(/\D/g, ""))} className={adminInput} />
            </Field>
            <LabeledToggle label={t("needsReview")} checked={needsReview} onChange={setNeedsReview} />
            {needsReview && (
              <Field label={t("reviewNote")}>
                <input value={reviewNote} onChange={(e) => setReviewNote(e.target.value)} className={adminInput} />
              </Field>
            )}
          </Card>

          <Card title={t("tags")}>
            <div className="flex flex-wrap gap-2">
              {ITEM_TAGS.map((tag) => (
                <label
                  key={tag}
                  className="cursor-pointer rounded-full px-3 py-2 text-sm ring-1 ring-coal-600 has-[:checked]:bg-cream-100 has-[:checked]:text-coal-950"
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={tags.includes(tag)}
                    onChange={(e) => setTags(e.target.checked ? [...tags, tag] : tags.filter((x) => x !== tag))}
                  />
                  {t(`tag.${tag}`)}
                </label>
              ))}
            </div>
          </Card>

          <Card title={t("addonGroups")}>
            <div className="flex flex-wrap gap-2">
              {addonGroups.map((g) => (
                <label
                  key={g.id}
                  className="cursor-pointer rounded-full px-3 py-2 text-sm ring-1 ring-coal-600 has-[:checked]:bg-cream-100 has-[:checked]:text-coal-950"
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={addonGroupIds.includes(g.id)}
                    onChange={(e) => setAddonGroupIds(e.target.checked ? [...addonGroupIds, g.id] : addonGroupIds.filter((x) => x !== g.id))}
                  />
                  {g.name.az}
                </label>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-xl bg-ember-700/30 p-3 text-sm ring-1 ring-ember-500">
          {error}
        </p>
      )}

      <div className="sticky bottom-20 z-30 flex flex-wrap items-center gap-3 rounded-2xl bg-coal-950/95 p-3 ring-1 ring-coal-700 backdrop-blur md:bottom-4">
        <button type="submit" disabled={busy} className="h-12 flex-1 rounded-full bg-flame-500 px-6 font-bold text-coal-950 disabled:opacity-50">
          {busy ? tc("saving") : tc("save")}
        </button>
        {item && (
          <button type="button" onClick={remove} disabled={busy} className="h-12 rounded-full px-4 text-sm font-semibold text-ember-500 ring-1 ring-ember-500">
            {t("deleteItem")}
          </button>
        )}
      </div>
    </form>
  );
}
