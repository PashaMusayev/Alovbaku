import Link from "next/link";
import { notFound } from "next/navigation";
import { format, getDictionary } from "@/i18n";
import { isLocale, localePath } from "@/i18n/config";
import { getDeliveryZones, getPromotions, getPublicMenu, getSettings } from "@/lib/data/menu";
import { bestsellers, countCheaperThanWolt } from "@/lib/data/public-menu";
import { tr } from "@/lib/localize";
import { formatPrice } from "@/lib/money";
import { formatPhone } from "@/lib/phone";
import { HeroArt } from "@/components/home/HeroArt";
import { OpenStatus } from "@/components/home/OpenStatus";
import { ItemRail } from "@/components/home/ItemRail";
import { FoodArt } from "@/components/menu/FoodArt";
import { MenuProvider } from "@/components/menu/MenuProvider";
import { ClockIcon, FlameIcon, InstagramIcon, PhoneIcon, PinIcon, TruckIcon } from "@/components/ui/icons";

export const revalidate = 300;

export default async function HomePage({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = getDictionary(lang);
  const [menu, settings, zones, promotions] = await Promise.all([
    getPublicMenu(),
    getSettings(),
    getDeliveryZones(),
    getPromotions(),
  ]);

  const top = bestsellers(menu.items);
  const combos = menu.items.filter((i) => i.isCombo);
  const cheaperCount = countCheaperThanWolt(menu.items);
  const showWoltBanner = settings.woltBanner.enabled && cheaperCount > 0;
  const minFee = zones.length ? Math.min(...zones.map((z) => z.fee)) : null;
  const minOrder = zones.length ? Math.min(...zones.map((z) => z.minOrder)) : null;
  const freeFrom = zones.map((z) => z.freeFrom).filter((x): x is number => x !== null);
  const menuHref = localePath(lang, "/menu");
  const mapQuery = `${settings.location.lat},${settings.location.lng}`;

  return (
    <MenuProvider groups={menu.optionGroups}>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden">
        <HeroArt />
        <div className="relative mx-auto flex min-h-[21rem] max-w-6xl flex-col justify-center px-4 py-10 sm:min-h-[28rem]">
          <p className="mb-2 inline-flex w-fit items-center gap-1.5 rounded-full bg-flame-500/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-flame-300">
            <FlameIcon width={14} height={14} /> {dict.hero.directBenefit}
          </p>
          <h1 className="font-display text-6xl font-bold uppercase leading-[0.9] text-cream-50 sm:text-8xl">
            Alov <span className="text-flame-500">Baku</span>
          </h1>
          <p className="mt-3 font-display text-2xl font-semibold uppercase text-gold-400 sm:text-3xl">{dict.brand.slogan}</p>
          <p className="mt-2 max-w-md text-cream-200">{dict.brand.tagline}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={menuHref} className="btn-primary px-8 text-lg">
              {dict.hero.cta}
            </Link>
            <a href={`tel:${settings.phone}`} className="btn-ghost">
              <PhoneIcon /> {formatPhone(settings.phone)}
            </a>
          </div>
        </div>
      </section>

      {/* ── Key info (above the fold on phones) ──────────────── */}
      <section className="relative z-10 mx-auto -mt-4 max-w-6xl px-4" aria-label={dict.info.hours}>
        <div className="card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-start gap-3">
            <ClockIcon className="mt-1 shrink-0 text-flame-400" />
            <OpenStatus hours={settings.hours} timezone={settings.timezone} />
          </div>
          <a href={`tel:${settings.phone}`} className="flex items-center gap-3 font-semibold text-cream-50 hover:text-flame-300">
            <PhoneIcon className="shrink-0 text-flame-400" />
            {formatPhone(settings.phone)}
          </a>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-3 text-sm text-cream-200 hover:text-flame-300"
          >
            <PinIcon className="mt-0.5 shrink-0 text-flame-400" />
            {tr(settings.address, lang)}
          </a>
          {minFee !== null && minOrder !== null && (
            <p className="flex items-start gap-3 text-sm text-cream-200">
              <TruckIcon className="mt-0.5 shrink-0 text-flame-400" />
              <span>
                {format(dict.info.deliveryTerms, { fee: formatPrice(minFee), min: formatPrice(minOrder) })}
                {freeFrom.length > 0 && (
                  <span className="block text-cream-400">
                    {format(dict.info.freeDeliveryFrom, { amount: formatPrice(Math.min(...freeFrom)) })}
                  </span>
                )}
              </span>
            </p>
          )}
        </div>
      </section>

      {/* ── Wolt-dan ucuz ───────────────────────────────────── */}
      {showWoltBanner && (
        <section className="mx-auto mt-6 max-w-6xl px-4">
          <Link
            href={menuHref}
            className="flex items-center gap-4 rounded-[var(--radius-card)] bg-gradient-to-r from-ember-600 to-flame-500 p-4 text-cream-50"
          >
            <span className="text-3xl" aria-hidden="true">💸</span>
            <span>
              <span className="block font-display text-xl font-bold uppercase">
                {tr(settings.woltBanner.title, lang) || dict.wolt.bannerTitle}
              </span>
              <span className="text-sm opacity-90">
                {tr(settings.woltBanner.body, lang) || format(dict.wolt.bannerBody, { count: cheaperCount })}
              </span>
            </span>
          </Link>
        </section>
      )}

      {/* ── Bestsellers ─────────────────────────────────────── */}
      <section className="mx-auto mt-10 max-w-6xl px-4" aria-labelledby="bestsellers">
        <div className="mb-4 flex items-end justify-between">
          <h2 id="bestsellers" className="section-title">
            {dict.home.bestsellers}
          </h2>
          <Link href={menuHref} className="text-sm font-semibold text-flame-400 hover:text-flame-300">
            {dict.home.seeAll} →
          </Link>
        </div>
        <ItemRail items={top} priorityFirst />
      </section>

      {/* ── Promotions & combos ─────────────────────────────── */}
      {(promotions.length > 0 || combos.length > 0) && (
        <section className="mx-auto mt-10 max-w-6xl px-4" aria-labelledby="promos">
          <h2 id="promos" className="section-title mb-4">
            {dict.home.promos}
          </h2>
          {promotions.length > 0 && (
            <div className="mb-4 grid gap-3 sm:grid-cols-2">
              {promotions.map((p) => (
                <Link key={p.id} href={p.href ?? menuHref} className="card block p-5 hover:border-flame-500">
                  <p className="font-display text-xl font-bold uppercase text-flame-400">{tr(p.title, lang)}</p>
                  {p.body && <p className="mt-1 text-sm text-cream-200">{tr(p.body, lang)}</p>}
                </Link>
              ))}
            </div>
          )}
          <ItemRail items={combos} />
        </section>
      )}

      {/* ── Categories ──────────────────────────────────────── */}
      <section className="mx-auto mt-10 max-w-6xl px-4" aria-labelledby="categories">
        <h2 id="categories" className="section-title mb-4">
          {dict.home.categories}
        </h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {menu.categories.map((c) => (
            <li key={c.id}>
              <Link href={`${menuHref}#cat-${c.id}`} className="card group block overflow-hidden hover:border-flame-500">
                <FoodArt kind={c.art} className="aspect-[4/3] w-full transition group-hover:scale-105" />
                <span className="block px-3 py-2.5 font-display text-base font-semibold uppercase text-cream-50">
                  {tr(c.name, lang)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* ── Find us ─────────────────────────────────────────── */}
      <section className="mx-auto mt-10 max-w-6xl px-4 pb-10" aria-labelledby="find-us">
        <h2 id="find-us" className="section-title mb-4">
          {dict.home.findUs}
        </h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="card space-y-4 p-5">
            <p className="flex items-start gap-3 text-cream-100">
              <PinIcon className="mt-0.5 shrink-0 text-flame-400" /> {tr(settings.address, lang)}
            </p>
            <div>
              <h3 className="mb-2 flex items-center gap-2 font-semibold text-cream-50">
                <ClockIcon className="text-flame-400" /> {dict.info.hours}
              </h3>
              <table className="w-full text-sm">
                <tbody>
                  {[1, 2, 3, 4, 5, 6, 0].map((day) => {
                    const h = settings.hours.find((x) => x.day === day);
                    return (
                      <tr key={day} className="border-b border-coal-700 last:border-0">
                        <th scope="row" className="py-1.5 text-left font-normal text-cream-400">
                          {dict.hours.weekdays[day]}
                        </th>
                        <td className="py-1.5 text-right text-cream-100">
                          {!h || h.isClosed ? dict.hours.closedDay : `${h.open}–${h.close}`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap gap-3">
              <a href={`tel:${settings.phone}`} className="btn-primary">
                <PhoneIcon /> {dict.nav.call}
              </a>
              <a
                href={`https://instagram.com/${settings.instagram}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost"
              >
                <InstagramIcon /> @{settings.instagram}
              </a>
            </div>
          </div>
          <div className="card overflow-hidden">
            <iframe
              title={dict.home.mapTitle}
              src={`https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=15&output=embed`}
              className="h-80 w-full border-0 lg:h-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>
    </MenuProvider>
  );
}
