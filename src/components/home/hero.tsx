import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { deliverySummary } from "@/lib/delivery";
import { formatPrice } from "@/lib/money";
import { formatPhone, telHref } from "@/lib/phone";
import type { PublicSettings } from "@/lib/types";
import { ArrowRightIcon, BikeIcon, MapPinIcon, PhoneIcon } from "@/components/ui/icons";
import { FireArt } from "./fire-art";
import { OpenStatus } from "./open-status";

export function Hero({ settings }: { settings: PublicSettings }) {
  const t = useTranslations();
  const delivery = deliverySummary(settings.zones);

  return (
    <section className="relative isolate overflow-hidden border-b border-coal-800 bg-coal-950">
      {settings.heroImageUrl ? (
        <>
          <Image src={settings.heroImageUrl} alt={t("hero.imageAlt")} fill priority sizes="100vw" className="-z-20 object-cover" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-t from-coal-950 via-coal-950/70 to-coal-950/30" />
        </>
      ) : (
        <>
          <div className="absolute inset-0 -z-20 bg-[radial-gradient(90%_60%_at_80%_20%,#8c1a1455,transparent_70%)]" />
          <FireArt className="absolute -right-16 top-0 -z-10 h-[290px] w-auto opacity-70 sm:right-4 sm:h-[440px] sm:opacity-100" />
        </>
      )}

      <div className="mx-auto max-w-6xl px-4 pb-5 pt-5 sm:pb-12 sm:pt-12">
        <OpenStatus />
        <p className="mt-4 text-sm font-semibold uppercase tracking-[0.2em] text-flame-400">{t("hero.kicker")}</p>
        <h1 className="font-heading text-[clamp(3.4rem,17vw,6.5rem)] font-bold text-cream-50" translate="no">
          Alov <span className="text-flame-500">Baku</span>
        </h1>
        <p className="mt-1 font-heading text-xl font-semibold text-gold-400 sm:text-2xl">{t("brand.slogan")}</p>

        <div className="mt-5 flex gap-3">
          <Link
            href="/menu"
            className="inline-flex h-14 flex-1 items-center justify-center gap-2 rounded-full bg-flame-500 px-6 text-lg font-bold text-coal-950 shadow-glow transition active:scale-[0.98] sm:flex-none"
          >
            {t("hero.cta")} <ArrowRightIcon />
          </Link>
          <a
            href={telHref(settings.phone)}
            className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-coal-800/90 px-5 font-semibold text-cream-50 ring-1 ring-coal-600"
          >
            <PhoneIcon /> <span className="sr-only sm:not-sr-only">{t("nav.call")}</span>
          </a>
        </div>

        <ul className="mt-5 grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
          <li>
            <a
              href={telHref(settings.phone)}
              className="flex h-full items-center gap-2.5 rounded-xl bg-coal-900/85 px-3 py-2.5 ring-1 ring-coal-700 backdrop-blur"
            >
              <PhoneIcon width={18} height={18} className="shrink-0 text-flame-400" />
              <span>
                <span className="sr-only">{t("info.phone")}: </span>
                <span className="font-semibold text-cream-50">{formatPhone(settings.phone)}</span>
              </span>
            </a>
          </li>
          <li>
            <a
              href={settings.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-full items-center gap-2.5 rounded-xl bg-coal-900/85 px-3 py-2.5 ring-1 ring-coal-700 backdrop-blur"
            >
              <MapPinIcon width={18} height={18} className="shrink-0 text-flame-400" />
              <span>
                <span className="sr-only">{t("info.address")}: </span>
                <span className="text-cream-100">{settings.address}</span>
              </span>
            </a>
          </li>
          {delivery && (
            <li>
              <a
                href="#delivery"
                className="flex h-full items-center gap-2.5 rounded-xl bg-coal-900/85 px-3 py-2.5 ring-1 ring-coal-700 backdrop-blur"
              >
                <BikeIcon width={18} height={18} className="shrink-0 text-flame-400" />
                <span className="text-cream-100">
                  {t("info.delivery", { fee: formatPrice(delivery.minFee), min: formatPrice(delivery.minOrder) })}
                </span>
              </a>
            </li>
          )}
        </ul>
      </div>
    </section>
  );
}
