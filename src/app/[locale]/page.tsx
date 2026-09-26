import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { localize } from "@/lib/i18n-text";
import { buildPublicMenu, buildPublicSettings, compareWithWolt, shouldShowWoltBanner } from "@/lib/menu/public-menu";
import { getDeliveryZones, getMenuData, getSettings } from "@/lib/menu/repository";
import type { Locale } from "@/lib/types";
import { Hero } from "@/components/home/hero";
import { ItemRow } from "@/components/home/item-row";
import { LocationSection } from "@/components/home/location-section";
import { WoltBanner } from "@/components/home/wolt-banner";
import { ArrowRightIcon } from "@/components/ui/icons";

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = (await params) as { locale: Locale };
  setRequestLocale(locale);
  const [data, settings, zones, t] = await Promise.all([getMenuData(), getSettings(), getDeliveryZones(), getTranslations()]);
  const menu = buildPublicMenu(data, locale);
  const publicSettings = buildPublicSettings(settings, zones, locale);
  const wolt = compareWithWolt(data);
  const comboIds = Object.values(menu.items).filter((i) => i.isCombo).map((i) => i.id);

  return (
    <>
      <Hero settings={publicSettings} />

      {shouldShowWoltBanner(settings, wolt) && (
        <WoltBanner text={localize(settings.woltBannerText, locale)} maxSaving={wolt.maxSaving} />
      )}

      <section aria-labelledby="bestsellers-heading" className="mx-auto mt-8 max-w-6xl px-4">
        <div className="mb-3 flex items-end justify-between gap-3">
          <h2 id="bestsellers-heading" className="font-heading text-3xl font-bold text-cream-50">
            🔥 {t("home.bestsellers")}
          </h2>
          <Link href="/menu" className="shrink-0 text-sm font-semibold text-flame-400">
            {t("home.seeAll")}
          </Link>
        </div>
        <ItemRow itemIds={menu.bestsellerIds} priority />
      </section>

      {comboIds.length > 0 && (
        <section aria-labelledby="combos-heading" className="mx-auto mt-8 max-w-6xl px-4">
          <h2 id="combos-heading" className="mb-3 font-heading text-3xl font-bold text-cream-50">
            🎁 {t("home.combos")}
          </h2>
          <ItemRow itemIds={comboIds} />
        </section>
      )}

      <section aria-labelledby="categories-heading" className="mx-auto mt-8 max-w-6xl px-4">
        <h2 id="categories-heading" className="mb-3 font-heading text-3xl font-bold text-cream-50">
          {t("home.categories")}
        </h2>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {menu.categories.map((c) => (
            <li key={c.id}>
              <Link
                href={{ pathname: "/menu", hash: `section-${c.slug}` }}
                className="flex h-16 items-center gap-3 rounded-2xl bg-coal-900 px-4 font-semibold text-cream-50 ring-1 ring-coal-700 transition hover:ring-flame-500"
              >
                <span className="text-2xl" aria-hidden>
                  {c.icon}
                </span>
                <span className="leading-tight">{c.name}</span>
              </Link>
            </li>
          ))}
        </ul>
        <Link
          href="/menu"
          className="mt-4 flex h-14 items-center justify-center gap-2 rounded-full bg-flame-500 text-lg font-bold text-coal-950 shadow-glow"
        >
          {t("hero.cta")} <ArrowRightIcon />
        </Link>
      </section>

      <LocationSection settings={publicSettings} />
    </>
  );
}
