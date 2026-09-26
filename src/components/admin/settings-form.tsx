"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { logoutAction, saveAllSettingsAction } from "@/app/admin/actions";
import type { PrivateSettings } from "@/lib/data/memory-db";
import { parsePriceInput } from "@/lib/money";
import { normalizeAzPhone } from "@/lib/phone";
import type { DeliveryZone, RestaurantSettings } from "@/lib/types";
import { Card, Field, LabeledToggle, Toggle, adminInput } from "./ui";

const WEEK = [1, 2, 3, 4, 5, 6, 0];
const toText = (q: number) => (q / 100).toFixed(2).replace(".", ",");

interface ZoneRow {
  key: string;
  id?: string;
  nameAz: string;
  radius: string;
  fee: string;
  minOrder: string;
  eta: string;
  isActive: boolean;
}

let seq = 0;

export function SettingsForm({
  settings,
  zones,
  privateSettings,
  telegramChatFromEnv,
}: {
  settings: RestaurantSettings;
  zones: DeliveryZone[];
  privateSettings: PrivateSettings;
  telegramChatFromEnv: boolean;
}) {
  const t = useTranslations("admin.settings");
  const tc = useTranslations("admin.common");
  const tNav = useTranslations("admin.nav");
  const tDays = useTranslations("staff");
  const router = useRouter();
  const [s, setS] = useState(settings);
  const [phone, setPhone] = useState(settings.phone);
  const [whatsapp, setWhatsapp] = useState(settings.whatsapp);
  const [cashback, setCashback] = useState(String(settings.cashbackPercent));
  const [lat, setLat] = useState(String(settings.lat));
  const [lng, setLng] = useState(String(settings.lng));
  const [zoneRows, setZoneRows] = useState<ZoneRow[]>(() =>
    zones.map((z) => ({
      key: `z${++seq}`,
      id: z.id,
      nameAz: z.name.az,
      radius: String(z.radiusKm),
      fee: toText(z.fee),
      minOrder: toText(z.minOrder),
      eta: String(z.etaMinutes),
      isActive: z.isActive,
    })),
  );
  const [chatId, setChatId] = useState(privateSettings.telegramChatId ?? "");
  const [factor, setFactor] = useState(String(privateSettings.priceOutlierFactor));
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  const set = <K extends keyof RestaurantSettings>(key: K, value: RestaurantSettings[K]) => setS((cur) => ({ ...cur, [key]: value }));
  const setDay = (day: number, patch: Partial<RestaurantSettings["openingHours"][number]>) =>
    set(
      "openingHours",
      s.openingHours.map((h) => (h.day === day ? { ...h, ...patch } : h)),
    );
  const num = (v: string) => Number(v.replace(",", "."));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setResult(null);
    const res = await saveAllSettingsAction({
      settings: {
        ...s,
        phone: normalizeAzPhone(phone) ?? phone,
        whatsapp: normalizeAzPhone(whatsapp) ?? whatsapp,
        cashbackPercent: num(cashback),
        lat: num(lat),
        lng: num(lng),
        mapEmbedQuery: `${num(lat)},${num(lng)}`,
      },
      zones: zoneRows.map((z, i) => ({
        id: z.id,
        name: { ...(zones.find((x) => x.id === z.id)?.name ?? {}), az: z.nameAz },
        radiusKm: num(z.radius),
        fee: parsePriceInput(z.fee) ?? -1,
        minOrder: parsePriceInput(z.minOrder) ?? -1,
        etaMinutes: Math.round(num(z.eta)),
        sortOrder: i + 1,
        isActive: z.isActive,
      })),
      privateSettings: { telegramChatId: chatId.trim() || null, priceOutlierFactor: num(factor) },
    });
    setBusy(false);
    if (res.ok) {
      setResult({ ok: true, text: tc("saved") });
      router.refresh();
    } else {
      setResult({ ok: false, text: res.fields ? t("invalid", { fields: res.fields.join(", ") }) : tc("error") });
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <h1 className="font-heading text-3xl font-bold text-cream-50">{t("title")}</h1>

      <Card title={t("ordering")}>
        <LabeledToggle label={t("orderingEnabled")} checked={s.orderingEnabled} onChange={(v) => set("orderingEnabled", v)} />
        <LabeledToggle label={t("deliveryEnabled")} checked={s.deliveryEnabled} onChange={(v) => set("deliveryEnabled", v)} />
        <LabeledToggle label={t("pickupEnabled")} checked={s.pickupEnabled} onChange={(v) => set("pickupEnabled", v)} />
        <LabeledToggle label={t("preorderEnabled")} checked={s.preorderEnabled} onChange={(v) => set("preorderEnabled", v)} />
      </Card>

      <Card title={t("hours")}>
        <p className="text-xs text-cream-500">{t("hoursHint")}</p>
        <ul className="space-y-2">
          {WEEK.map((day) => {
            const h = s.openingHours.find((x) => x.day === day)!;
            return (
              <li key={day} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-x-2 gap-y-1 sm:grid-cols-[8rem_minmax(0,1fr)_minmax(0,1fr)_auto]">
                <span className="col-span-3 text-sm font-semibold first-letter:uppercase sm:col-span-1">{tDays(`days.${day}` as "days.0")}</span>
                <input type="time" aria-label={`${day} ${t("open")}`} value={h.open} disabled={h.closed} onChange={(e) => setDay(day, { open: e.target.value })} className={`${adminInput} min-w-0`} />
                <input type="time" aria-label={`${day} ${t("close")}`} value={h.close} disabled={h.closed} onChange={(e) => setDay(day, { close: e.target.value })} className={`${adminInput} min-w-0`} />
                <label className="flex flex-col items-center text-[0.65rem] text-cream-300">
                  <Toggle checked={h.closed} onChange={(v) => setDay(day, { closed: v })} label={t("closedDay")} />
                  {t("closedDay")}
                </label>
              </li>
            );
          })}
        </ul>
      </Card>

      <Card title={t("zones")}>
        <p className="text-xs text-cream-500">{t("zonesHint")}</p>
        <ul className="space-y-3">
          {zoneRows.map((z) => {
            const upd = (patch: Partial<ZoneRow>) => setZoneRows(zoneRows.map((x) => (x.key === z.key ? { ...x, ...patch } : x)));
            return (
              <li key={z.key} className="space-y-2 rounded-xl bg-coal-800 p-3 ring-1 ring-coal-600">
                <Field label={t("zoneName")}>
                  <input value={z.nameAz} onChange={(e) => upd({ nameAz: e.target.value })} className={adminInput} />
                </Field>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <Field label={t("radius")}>
                    <input inputMode="decimal" value={z.radius} onChange={(e) => upd({ radius: e.target.value })} className={adminInput} />
                  </Field>
                  <Field label={t("fee")}>
                    <input inputMode="decimal" value={z.fee} onChange={(e) => upd({ fee: e.target.value })} className={adminInput} />
                  </Field>
                  <Field label={t("minOrder")}>
                    <input inputMode="decimal" value={z.minOrder} onChange={(e) => upd({ minOrder: e.target.value })} className={adminInput} />
                  </Field>
                  <Field label={t("eta")}>
                    <input inputMode="numeric" value={z.eta} onChange={(e) => upd({ eta: e.target.value })} className={adminInput} />
                  </Field>
                </div>
                <div className="flex items-center justify-between">
                  <LabeledToggle label={t("active")} checked={z.isActive} onChange={(v) => upd({ isActive: v })} />
                  <button type="button" onClick={() => setZoneRows(zoneRows.filter((x) => x.key !== z.key))} className="text-sm font-semibold text-ember-500">
                    {tc("delete")}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
        <button
          type="button"
          onClick={() => setZoneRows([...zoneRows, { key: `z${++seq}`, nameAz: "", radius: "5", fee: "0,00", minOrder: "0,00", eta: "45", isActive: true }])}
          className="h-10 rounded-full bg-coal-800 px-4 text-sm font-semibold ring-1 ring-coal-600"
        >
          + {t("addZone")}
        </button>
      </Card>

      <Card title={t("contact")}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t("phone")}>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={adminInput} />
          </Field>
          <Field label={t("whatsapp")}>
            <input type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className={adminInput} />
          </Field>
          <Field label={t("instagram")}>
            <input value={s.instagram} onChange={(e) => set("instagram", e.target.value.replace(/^@/, ""))} className={adminInput} />
          </Field>
          <Field label={t("googleReviewUrl")}>
            <input type="url" value={s.googleReviewUrl} onChange={(e) => set("googleReviewUrl", e.target.value)} className={adminInput} />
          </Field>
        </div>
        <Field label={`${t("address")} (AZ)`}>
          <input value={s.address.az} onChange={(e) => set("address", { ...s.address, az: e.target.value })} className={adminInput} />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={`${t("address")} (RU)`}>
            <input value={s.address.ru ?? ""} onChange={(e) => set("address", { ...s.address, ru: e.target.value })} className={adminInput} />
          </Field>
          <Field label={`${t("address")} (EN)`}>
            <input value={s.address.en ?? ""} onChange={(e) => set("address", { ...s.address, en: e.target.value })} className={adminInput} />
          </Field>
          <Field label={t("lat")}>
            <input inputMode="decimal" value={lat} onChange={(e) => setLat(e.target.value)} className={adminInput} />
          </Field>
          <Field label={t("lng")}>
            <input inputMode="decimal" value={lng} onChange={(e) => setLng(e.target.value)} className={adminInput} />
          </Field>
        </div>
        <Field label={t("googleMapsUrl")}>
          <input type="url" value={s.googleMapsUrl} onChange={(e) => set("googleMapsUrl", e.target.value)} className={adminInput} />
        </Field>
      </Card>

      <Card title={t("loyalty")}>
        <Field label={t("cashbackPercent")}>
          <input inputMode="decimal" value={cashback} onChange={(e) => setCashback(e.target.value)} className={adminInput} />
        </Field>
      </Card>

      <Card title={t("telegram")}>
        <Field label={t("telegramChatId")} hint={telegramChatFromEnv ? t("telegramEnvNote") : undefined}>
          <input inputMode="numeric" value={chatId} onChange={(e) => setChatId(e.target.value)} className={adminInput} />
        </Field>
      </Card>

      <Card title={t("checks")}>
        <Field label={t("outlierFactor")} hint={t("outlierHint")}>
          <input inputMode="decimal" value={factor} onChange={(e) => setFactor(e.target.value)} className={adminInput} />
        </Field>
      </Card>

      {result && (
        <p role="status" className={`rounded-xl p-3 text-sm ring-1 ${result.ok ? "bg-emerald-500/15 ring-emerald-500" : "bg-ember-700/30 ring-ember-500"}`}>
          {result.text}
        </p>
      )}

      <div className="sticky bottom-20 z-30 rounded-2xl bg-coal-950/95 p-3 ring-1 ring-coal-700 backdrop-blur md:bottom-4">
        <button type="submit" disabled={busy} className="h-12 w-full rounded-full bg-flame-500 font-bold text-coal-950 disabled:opacity-50">
          {busy ? tc("saving") : tc("save")}
        </button>
      </div>

      <div className="flex justify-between pt-4 md:hidden">
        <a href="/" target="_blank" className="text-sm font-semibold text-cream-300">
          {tNav("site")} ↗
        </a>
        <button type="submit" formAction={logoutAction} formNoValidate className="text-sm font-semibold text-ember-500">
          {tNav("logout")}
        </button>
      </div>
    </form>
  );
}
