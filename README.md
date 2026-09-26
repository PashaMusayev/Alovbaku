# Alov Baku — direct online ordering

Mobile-first ordering site for **Alov Baku** (köz dönər, kabab, pizza, şaurma…).
Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Supabase · next-intl (az / ru / en).

> Fərqimiz Keyfiyyətimizdir 🔥

## Status

| Phase | Scope | State |
| --- | --- | --- |
| 1 | Setup, DB schema, seed, public menu with variants, i18n, design system | ✅ |
| 2 | Checkout, delivery zones, working hours, Telegram, order tracking | ⏳ |
| 3 | Admin panel | ⏳ |
| 4 | Loyalty, promo codes, reorder, reviews, AI assistant, SEO, PWA | ⏳ |
| 5 | Tests, accessibility, deploy guide | ⏳ |

## Quick start

```bash
npm install
cp .env.example .env.local   # optional — without Supabase the app serves the seed menu
npm run dev                  # http://localhost:3000  (ru: /ru, en: /en)
```

Without Supabase credentials the site runs on the in-memory seed menu, so design and menu work need no backend.

## Supabase setup

1. Create a project at supabase.com (the free tier is enough to start).
2. SQL editor → run every file in `supabase/migrations/` in name order, then `supabase/seed.sql`
   (the seed upserts, so it can be re-run before launch — it overwrites edits to seeded rows)
   (or `supabase db push` + `psql -f supabase/seed.sql` with the Supabase CLI).
3. Copy the project URL + anon key (and service-role key) into `.env.local`.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` / `build` / `start` | Next.js |
| `npm run lint` · `npm run typecheck` · `npm test` | ESLint · tsc · Vitest |
| `npm run db:seed-sql` | Regenerates `supabase/seed.sql` from `src/data/seed-*.ts` |
| `npm run db:check` | Applies migrations + seed to a throwaway local Postgres (`DATABASE_URL`) |

## Key decisions

- **Money is integer qəpik**, formatted everywhere as `8,70 ₼` (`src/lib/money.ts`).
- **One source of truth for prices**: every item has ≥1 variant with a `price_site` and an optional `price_wolt`,
  plus `available_site` / `available_wolt` flags. Wolt data is **internal only** (admin tools): the public site shows
  site prices and never mentions Wolt. Wolt prices being higher than site prices is expected (commission).
- **Variants, never duplicate items** — pizza sizes, dönər bread types, drink sizes are chips inside one item.
- **Localized DB text** is `jsonb {az, ru, en}`, falling back to Azerbaijani. All UI strings live in `messages/*.json`.
- **Seed data flags** suspicious source data with `needs_review` + a note (e.g. kartof fri 12,10 ₼) for the admin validation list.
- **Brand assets**: `node scripts/build-brand-assets.mjs` crops the logo photo into the circular badge, favicon and app icons.
- **Images** are always 4:3 `object-cover`; items without a photo get a branded placeholder.
- **Open/closed status** is computed in the browser in Asia/Baku time, so statically cached pages never show a stale status.
- **Security**: RLS — public can read the menu only; orders/customers are written by server routes with the service role, which recompute prices.

## Project layout

```
messages/               UI strings (az, ru, en)
supabase/migrations/    schema + RLS
supabase/seed.sql       generated seed
src/data/               seed menu/settings (single source for seed.sql and demo mode)
src/lib/                money, hours, pricing, menu repository, cart store
src/components/         UI (home, menu, cart, layout)
src/app/[locale]/       pages (/, /menu, /cart)
tests/                  Vitest unit tests
```
