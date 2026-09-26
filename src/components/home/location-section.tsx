import { useTranslations } from "next-intl";
import { formatPrice } from "@/lib/money";
import { instagramHref, whatsappHref } from "@/lib/phone";
import type { PublicSettings } from "@/lib/types";
import { BikeIcon, ClockIcon, InstagramIcon, MapPinIcon, WhatsAppIcon } from "@/components/ui/icons";
import { MapFacade } from "./map-facade";

const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

export function LocationSection({ settings }: { settings: PublicSettings }) {
  const t = useTranslations();
  return (
    <section aria-labelledby="location-heading" className="mx-auto mt-10 max-w-6xl px-4">
      <h2 id="location-heading" className="font-heading text-3xl font-bold text-cream-50">
        {t("home.location")}
      </h2>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <MapFacade lat={settings.lat} lng={settings.lng} />
        <div className="space-y-4">
          <p className="flex items-start gap-2 text-cream-100">
            <MapPinIcon className="mt-0.5 shrink-0 text-flame-400" />
            <span>
              <span className="sr-only">{t("info.address")}: </span>
              {settings.address}
              <a href={settings.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="mt-1 block text-sm font-semibold text-flame-400 underline-offset-4 hover:underline">
                {t("home.openInMaps")}
              </a>
            </span>
          </p>

          <div className="rounded-2xl bg-coal-900 p-4 ring-1 ring-coal-700">
            <h3 className="mb-2 flex items-center gap-2 font-semibold">
              <ClockIcon className="text-flame-400" /> {t("info.hours")}
            </h3>
            <dl className="grid grid-cols-[1fr_auto] gap-y-1 text-sm">
              {WEEK_ORDER.map((day) => {
                const h = settings.openingHours.find((x) => x.day === day);
                return (
                  <div key={day} className="contents">
                    <dt className="capitalize text-cream-300">{t(`days.${day}` as "days.0")}</dt>
                    <dd className="text-right tabular-nums text-cream-50">
                      {!h || h.closed ? t("status.closedToday") : `${h.open}–${h.close}`}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </div>

          <div id="delivery" className="scroll-mt-20 rounded-2xl bg-coal-900 p-4 ring-1 ring-coal-700">
            <h3 className="mb-2 flex items-center gap-2 font-semibold">
              <BikeIcon className="text-flame-400" /> {t("info.deliveryTerms")}
            </h3>
            <ul className="space-y-1.5 text-sm">
              {settings.zones.map((z) => (
                <li key={z.id} className="flex flex-wrap justify-between gap-x-3">
                  <span className="text-cream-300">{z.name}</span>
                  <span className="tabular-nums text-cream-50">
                    {t("info.zoneRow", { fee: formatPrice(z.fee), min: formatPrice(z.minOrder), eta: z.etaMinutes })}
                  </span>
                </li>
              ))}
              {settings.pickupEnabled && <li className="text-cream-300">{t("info.pickup")}</li>}
            </ul>
          </div>

          <div className="flex flex-wrap gap-2">
            <a
              href={instagramHref(settings.instagram)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center gap-2 rounded-full bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] px-5 font-bold text-white"
            >
              <InstagramIcon /> {t("home.instagram")}
            </a>
            <a
              href={whatsappHref(settings.whatsapp)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center gap-2 rounded-full bg-[#17703d] px-5 font-bold text-white"
            >
              <WhatsAppIcon /> {t("home.whatsapp")}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
