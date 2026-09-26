"use client";

import dynamic from "next/dynamic";
import { useId, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useCart } from "@/lib/cart/store";
import { computeCart } from "@/lib/cart/totals";
import { loadDetails, saveDetails, saveLastOrder, saveWhatsappText } from "@/lib/checkout/saved";
import { formatPrice } from "@/lib/money";
import { computeQuote, preorderSlots, type QuoteError } from "@/lib/orders/quote";
import type { Fulfillment, PaymentMethod } from "@/lib/orders/status";
import { formatNationalInput, formatPhone, normalizeAzPhone, telHref } from "@/lib/phone";
import { useHydrated } from "@/lib/use-hydrated";
import { useOpenState } from "@/lib/use-open-state";
import { useAppData } from "@/components/providers/app-provider";
import { MapPinIcon } from "@/components/ui/icons";

const MapPicker = dynamic(() => import("./map-picker"), {
  ssr: false,
  loading: () => <div className="h-64 animate-pulse rounded-2xl bg-coal-800" />,
});

type When = "asap" | "later";
type ServerError = QuoteError | "invalid_phone" | "address_required" | "payment_unavailable" | "rate_limited" | "server_error" | "invalid_input" | "network";

const inputClass =
  "h-12 w-full rounded-xl bg-coal-800 px-4 text-base text-cream-50 ring-1 ring-coal-600 placeholder:text-cream-500 focus:outline-none focus:ring-2 focus:ring-flame-500 aria-[invalid=true]:ring-ember-500";

function Section({ title, children }: { title: string; children: ReactNode }) {
  const id = useId();
  return (
    <section role="group" aria-labelledby={id} className="space-y-3 rounded-2xl bg-coal-900 p-4 ring-1 ring-coal-700">
      <h2 id={id} className="font-heading text-xl font-bold text-cream-50">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Choice({ name, value, checked, onChange, children }: { name: string; value: string; checked: boolean; onChange: () => void; children: ReactNode }) {
  return (
    <label className="flex min-h-12 flex-1 cursor-pointer items-center gap-3 rounded-xl px-3 ring-1 ring-coal-600 transition has-[:checked]:bg-flame-500/15 has-[:checked]:ring-2 has-[:checked]:ring-flame-500">
      <input type="radio" name={name} value={value} checked={checked} onChange={onChange} className="h-5 w-5 accent-flame-500" />
      <span className="font-semibold">{children}</span>
    </label>
  );
}

/** Rendered only after hydration, so saved details can be read synchronously from localStorage. */
export function CheckoutForm() {
  const hydrated = useHydrated();
  return hydrated ? <CheckoutFormInner /> : <div className="h-96" aria-busy="true" />;
}

function CheckoutFormInner() {
  const t = useTranslations("checkout");
  const locale = useLocale();
  const router = useRouter();
  const { menu, settings } = useAppData();
  const lines = useCart((s) => s.lines);
  const clearCart = useCart((s) => s.clear);
  const openState = useOpenState(settings.openingHours, settings.timezone);

  const [fulfillment, setFulfillment] = useState<Fulfillment>(settings.deliveryEnabled ? "delivery" : "pickup");
  // Prefilled from the previous order on this device.
  const [saved] = useState(loadDetails);
  const [name, setName] = useState(saved?.name ?? "");
  const [phone, setPhone] = useState(formatNationalInput(saved?.phone ?? ""));
  const [address, setAddress] = useState(saved?.address ?? "");
  const [addressNotes, setAddressNotes] = useState(saved?.addressNotes ?? "");
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(
    saved?.lat != null && saved.lng != null ? { lat: saved.lat, lng: saved.lng } : null,
  );
  const [showMap, setShowMap] = useState(false);
  const [locating, setLocating] = useState<"idle" | "busy" | "failed">("idle");
  const [when, setWhen] = useState<When>("asap");
  const [slot, setSlot] = useState("");
  const [payment, setPayment] = useState<PaymentMethod>("cash");
  const [notes, setNotes] = useState("");
  const [website, setWebsite] = useState("");
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState<ServerError[]>([]);

  const closed = openState !== null && !openState.isOpen;
  // Outside opening hours only a pre-order is possible.
  const effectiveWhen: When = closed && settings.preorderEnabled ? "later" : when;
  const slots = useMemo(() => (settings.preorderEnabled ? preorderSlots(settings) : []), [settings]);
  const selectedSlot = effectiveWhen === "later" ? slot || slots[0] || "" : "";

  const { views } = computeCart(lines, menu);
  const quote = computeQuote(menu, settings, {
    fulfillment,
    lines: views.filter((v) => v.valid).map((v) => v.line),
    lat: pin?.lat,
    lng: pin?.lng,
    scheduledFor: selectedSlot || null,
  });

  const e164 = normalizeAzPhone(phone);
  const fieldErrors = {
    name: name.trim().length < 2,
    phone: !e164,
    address: fulfillment === "delivery" && address.trim().length < 5,
  };
  const hasFieldErrors = Object.values(fieldErrors).some(Boolean);
  const blocking = quote.errors.filter((e) => e !== "invalid_lines");

  const slotLabel = (iso: string) =>
    new Intl.DateTimeFormat(locale === "az" ? "az-Latn-AZ" : locale, {
      timeZone: settings.timezone,
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).format(new Date(iso));

  const locate = () => {
    if (!navigator.geolocation) return setLocating("failed");
    setLocating("busy");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPin({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setShowMap(true);
        setLocating("idle");
      },
      () => setLocating("failed"),
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  };

  const errorText = (code: ServerError) =>
    code === "below_minimum"
      ? t("errors.below_minimum", { min: formatPrice(quote.minOrder) })
      : code === "server_error"
        ? t("errors.server_error", { phone: formatPhone(settings.phone) })
        : t(`errors.${code}`);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setTouched(true);
    setServerErrors([]);
    if (hasFieldErrors || blocking.length > 0 || submitting || !e164) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          locale,
          customerName: name.trim(),
          phone: e164,
          fulfillment,
          address: fulfillment === "delivery" ? address.trim() : null,
          addressNotes: fulfillment === "delivery" ? addressNotes.trim() : null,
          lat: fulfillment === "delivery" ? (pin?.lat ?? null) : null,
          lng: fulfillment === "delivery" ? (pin?.lng ?? null) : null,
          notes: notes.trim() || null,
          paymentMethod: payment,
          scheduledFor: selectedSlot || null,
          lines: quote.lines.map(({ itemId, variantId, addonIds, quantity }) => ({ itemId, variantId, addonIds, quantity })),
          website,
        }),
      });
      const body = await res.json();
      if (res.status === 201) {
        saveDetails({ name: name.trim(), phone: e164.slice(4), address, addressNotes, lat: pin?.lat ?? null, lng: pin?.lng ?? null });
        saveLastOrder({
          number: body.number,
          token: body.token,
          createdAt: new Date().toISOString(),
          lines: quote.lines.map(({ itemId, variantId, addonIds, quantity }) => ({ itemId, variantId, addonIds, quantity })),
        });
        saveWhatsappText(body.token, body.whatsappText, body.notified);
        clearCart();
        router.push(`/order/${body.token}`);
        return;
      }
      setServerErrors(body.error === "quote" ? body.codes : [body.error ?? "server_error"]);
    } catch {
      setServerErrors(["network"]);
    }
    setSubmitting(false);
  };

  if (quote.lines.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="font-heading text-2xl text-cream-50">{t("emptyCart")}</p>
        <Link href="/menu" className="mt-6 inline-flex h-12 items-center rounded-full bg-flame-500 px-6 font-bold text-coal-950">
          {t("edit")}
        </Link>
      </div>
    );
  }

  if (!settings.orderingEnabled) {
    return (
      <p className="rounded-2xl bg-coal-900 p-4 ring-1 ring-ember-600">
        {t("orderingDisabled", { phone: formatPhone(settings.phone) })}{" "}
        <a href={telHref(settings.phone)} className="font-bold text-flame-400 underline">
          {formatPhone(settings.phone)}
        </a>
      </p>
    );
  }

  const visibleErrors = [...new Set<ServerError>([...(touched ? blocking : []), ...serverErrors])];

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      {closed && openState?.nextOpening && (
        <div role="status" className="rounded-2xl bg-ember-700/40 p-4 ring-1 ring-ember-500">
          <p className="font-bold text-cream-50">
            {openState.nextOpening.daysFromNow === 1
              ? t("closedNowTomorrow", { time: openState.nextOpening.time })
              : t("closedNow", { time: openState.nextOpening.time })}
          </p>
          <p className="text-sm text-cream-100">{settings.preorderEnabled ? t("closedPreorder") : t("closedNoPreorder")}</p>
        </div>
      )}

      {settings.deliveryEnabled && settings.pickupEnabled && (
        <Section title={t("fulfillment")}>
          <div role="radiogroup" aria-label={t("fulfillment")} className="flex gap-2">
            <Choice name="fulfillment" value="delivery" checked={fulfillment === "delivery"} onChange={() => setFulfillment("delivery")}>
              🛵 {t("delivery")}
            </Choice>
            <Choice name="fulfillment" value="pickup" checked={fulfillment === "pickup"} onChange={() => setFulfillment("pickup")}>
              🏃 {t("pickup")}
            </Choice>
          </div>
          {fulfillment === "pickup" && <p className="text-sm text-cream-300">{t("pickupFrom", { address: settings.address })}</p>}
        </Section>
      )}

      <Section title={t("contact")}>
        <div className="space-y-1">
          <label htmlFor="co-name" className="text-sm font-semibold">
            {t("name")}
          </label>
          <input
            id="co-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="given-name"
            placeholder={t("namePlaceholder")}
            maxLength={60}
            aria-invalid={touched && fieldErrors.name}
            aria-describedby={touched && fieldErrors.name ? "co-name-err" : undefined}
            className={inputClass}
          />
          {touched && fieldErrors.name && (
            <p id="co-name-err" className="text-sm text-ember-500">
              {t("nameRequired")}
            </p>
          )}
        </div>
        <div className="space-y-1">
          <label htmlFor="co-phone" className="text-sm font-semibold">
            {t("phone")}
          </label>
          <div className="flex items-stretch overflow-hidden rounded-xl ring-1 ring-coal-600 focus-within:ring-2 focus-within:ring-flame-500">
            <span className="grid place-items-center bg-coal-700 px-3 font-semibold text-cream-100" aria-hidden>
              +994
            </span>
            <input
              id="co-phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              value={phone}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "").replace(/^994/, "").replace(/^0/, "");
                setPhone(formatNationalInput(digits));
              }}
              placeholder="55 243 79 99"
              aria-invalid={touched && fieldErrors.phone}
              aria-describedby="co-phone-hint"
              className="h-12 w-full bg-coal-800 px-3 text-base tracking-wide text-cream-50 placeholder:text-cream-500 focus:outline-none"
            />
          </div>
          <p id="co-phone-hint" className={`text-sm ${touched && fieldErrors.phone ? "text-ember-500" : "text-cream-500"}`}>
            {touched && fieldErrors.phone ? t("phoneInvalid") : t("phoneHint")}
          </p>
        </div>
      </Section>

      {fulfillment === "delivery" && (
        <Section title={t("addressSection")}>
          <div className="space-y-1">
            <label htmlFor="co-address" className="text-sm font-semibold">
              {t("address")}
            </label>
            <input
              id="co-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              autoComplete="street-address"
              placeholder={t("addressPlaceholder")}
              maxLength={200}
              aria-invalid={touched && fieldErrors.address}
              className={inputClass}
            />
            {touched && fieldErrors.address && <p className="text-sm text-ember-500">{t("addressRequired")}</p>}
          </div>
          <div className="space-y-1">
            <label htmlFor="co-notes-addr" className="text-sm font-semibold">
              {t("addressNotes")}
            </label>
            <input
              id="co-notes-addr"
              value={addressNotes}
              onChange={(e) => setAddressNotes(e.target.value)}
              placeholder={t("addressNotesPlaceholder")}
              maxLength={200}
              className={inputClass}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={locate} className="inline-flex h-11 items-center gap-2 rounded-full bg-coal-800 px-4 text-sm font-semibold ring-1 ring-coal-600">
              <MapPinIcon width={18} height={18} /> {locating === "busy" ? t("locating") : t("locate")}
            </button>
            <button
              type="button"
              onClick={() => setShowMap((s) => !s)}
              aria-expanded={showMap}
              className="inline-flex h-11 items-center rounded-full bg-coal-800 px-4 text-sm font-semibold ring-1 ring-coal-600"
            >
              {showMap ? t("hideMap") : t("pickOnMap")}
            </button>
            {pin && (
              <button type="button" onClick={() => setPin(null)} className="inline-flex h-11 items-center rounded-full px-3 text-sm text-cream-300 underline">
                {t("removePin")}
              </button>
            )}
          </div>
          {locating === "failed" && <p className="text-sm text-ember-500">{t("locateFailed")}</p>}
          {pin && !showMap && <p className="text-sm text-emerald-300">✓ {t("pinSet")}</p>}
          {showMap && (
            <div className="space-y-1">
              <MapPicker center={{ lat: settings.lat, lng: settings.lng }} value={pin} onChange={setPin} label={t("mapLabel")} />
              <p className="text-xs text-cream-500">{t("mapHint")}</p>
            </div>
          )}
        </Section>
      )}

      {settings.preorderEnabled && (
        <Section title={t("when")}>
          <div role="radiogroup" aria-label={t("when")} className="flex flex-col gap-2 sm:flex-row">
            {!closed && (
              <Choice name="when" value="asap" checked={effectiveWhen === "asap"} onChange={() => setWhen("asap")}>
                ⚡ {t("asap")}
              </Choice>
            )}
            <Choice name="when" value="later" checked={effectiveWhen === "later"} onChange={() => setWhen("later")}>
              🕒 {t("later")}
            </Choice>
          </div>
          {effectiveWhen === "later" && (
            <div className="space-y-1">
              <label htmlFor="co-slot" className="text-sm font-semibold">
                {t("chooseTime")}
              </label>
              <select id="co-slot" value={selectedSlot} onChange={(e) => setSlot(e.target.value)} className={inputClass}>
                {slots.map((s) => (
                  <option key={s} value={s}>
                    {slotLabel(s)}
                  </option>
                ))}
              </select>
            </div>
          )}
        </Section>
      )}

      <Section title={t("payment")}>
        <div role="radiogroup" aria-label={t("payment")} className="flex flex-col gap-2">
          <Choice name="payment" value="cash" checked={payment === "cash"} onChange={() => setPayment("cash")}>
            💵 {t("cash")}
          </Choice>
          <Choice name="payment" value="card_on_delivery" checked={payment === "card_on_delivery"} onChange={() => setPayment("card_on_delivery")}>
            💳 {t("card")}
          </Choice>
          {settings.onlinePaymentEnabled && (
            <Choice name="payment" value="online" checked={payment === "online"} onChange={() => setPayment("online")}>
              🌐 {t("online")}
            </Choice>
          )}
        </div>
        <div className="space-y-1">
          <label htmlFor="co-notes" className="text-sm font-semibold">
            {t("notes")}
          </label>
          <textarea
            id="co-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t("notesPlaceholder")}
            maxLength={300}
            rows={2}
            className="w-full rounded-xl bg-coal-800 px-4 py-3 text-base text-cream-50 ring-1 ring-coal-600 placeholder:text-cream-500 focus:outline-none focus:ring-2 focus:ring-flame-500"
          />
        </div>
        {/* Honeypot: invisible to people, bots tend to fill it. */}
        <input
          type="text"
          name="website"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden
          className="absolute -left-[9999px] h-px w-px opacity-0"
        />
      </Section>

      <section aria-labelledby="co-summary" className="space-y-2 rounded-2xl bg-coal-900 p-4 ring-1 ring-coal-700">
        <div className="flex items-center justify-between">
          <h2 id="co-summary" className="font-heading text-xl font-bold text-cream-50">
            {t("summary")}
          </h2>
          <Link href="/cart" className="text-sm font-semibold text-flame-400">
            {t("edit")}
          </Link>
        </div>
        <ul className="space-y-1 text-sm">
          {quote.lines.map((l) => {
            const item = menu.items[l.itemId];
            const variant = item.variants.find((v) => v.id === l.variantId);
            return (
              <li key={`${l.itemId}-${l.variantId}-${l.addonIds.join()}`} className="flex justify-between gap-3">
                <span className="text-cream-100">
                  {l.quantity} × {item.name}
                  {item.variants.length > 1 && variant?.label ? ` (${variant.label})` : ""}
                </span>
                <span className="tabular-nums">{formatPrice(l.lineTotal)}</span>
              </li>
            );
          })}
        </ul>
        <dl className="space-y-1 border-t border-coal-700 pt-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-cream-300">{t("items")}</dt>
            <dd className="tabular-nums">{formatPrice(quote.subtotal)}</dd>
          </div>
          {fulfillment === "delivery" && (
            <div className="flex justify-between">
              <dt className="text-cream-300">{t("deliveryFee")}</dt>
              <dd className="tabular-nums">{quote.deliveryFee === 0 ? t("free") : formatPrice(quote.deliveryFee)}</dd>
            </div>
          )}
          <div className="flex justify-between text-lg font-extrabold text-cream-50">
            <dt>{t("total")}</dt>
            <dd className="tabular-nums">{formatPrice(quote.total)}</dd>
          </div>
        </dl>
      </section>

      {visibleErrors.length > 0 && (
        <ul role="alert" className="space-y-1 rounded-2xl bg-ember-700/30 p-4 text-sm text-cream-50 ring-1 ring-ember-500">
          {visibleErrors.map((code) => (
            <li key={code}>{errorText(code)}</li>
          ))}
        </ul>
      )}

      <div className="sticky bottom-0 -mx-4 bg-gradient-to-t from-coal-950 via-coal-950 to-transparent px-4 pb-safe pt-4">
        <button
          type="submit"
          disabled={submitting}
          className="h-14 w-full rounded-full bg-flame-500 text-lg font-bold text-coal-950 shadow-glow transition active:scale-[0.99] disabled:opacity-60"
        >
          {submitting ? t("submitting") : t("submit", { total: formatPrice(quote.total) })}
        </button>
      </div>
    </form>
  );
}
