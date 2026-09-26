# Alov Baku — direct online ordering

Mobile-first ordering site for **Alov Baku** (köz dönər, kabab, pizza, şaurma…).
Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Supabase · next-intl (az / ru / en).

> Fərqimiz Keyfiyyətimizdir 🔥

## Status

| Phase | Scope | State |
| --- | --- | --- |
| 1 | Setup, DB schema, seed, public menu with variants, i18n, design system | ✅ |
| 2 | Checkout, delivery zones, working hours, Telegram, order tracking, upsell & combo switch | ✅ |
| 3 | Admin panel | ⏳ |
| 4 | Loyalty, promo codes, reorder, reviews, AI assistant, SEO, PWA | ⏳ |
| 5 | Tests, accessibility, deploy guide | ⏳ |

## Quick start

```bash
npm install
cp .env.example .env.local   # optional — without Supabase the app serves the seed menu
npm run dev                  # http://localhost:3000  (ru: /ru, en: /en)
```

Without Supabase credentials the site runs on the in-memory seed menu and keeps orders in memory
(lost on restart), so the whole ordering flow can be tried without any backend.

## Supabase setup

1. Create a project at supabase.com (the free tier is enough to start).
2. SQL editor → run every file in `supabase/migrations/` in name order, then `supabase/seed.sql`
   (the seed upserts, so it can be re-run before launch — it overwrites edits to seeded rows)
   (or `supabase db push` + `psql -f supabase/seed.sql` with the Supabase CLI).
   Paste each **whole file** (GitHub → “Copy raw file” button) into a new query with nothing selected —
   the SQL editor runs only the selected text if there is a selection.
   If a run failed halfway, run `supabase/scripts/reset.sql` first, then start again (pre-launch only: it deletes all data).
3. Copy the project URL + anon key (and service-role key) into `.env.local`.

## Telegram order notifications

1. Telegram → **@BotFather** → `/newbot`, copy the token → `TELEGRAM_BOT_TOKEN`.
2. Add the bot to the staff group and send any message there.
3. `TELEGRAM_BOT_TOKEN=… node scripts/telegram-setup.mjs` → prints the group id → `TELEGRAM_CHAT_ID`.
4. Choose a long random `TELEGRAM_WEBHOOK_SECRET`, deploy, then
   `TELEGRAM_BOT_TOKEN=… TELEGRAM_WEBHOOK_SECRET=… node scripts/telegram-setup.mjs https://your-domain`
   so the ✅ Qəbul et / ❌ İmtina et / 🔥 Hazırlanır / 🛵 Yoldadır / 🏁 Çatdırıldı buttons update the order
   (and the customer's tracking page, live).

If Telegram is not configured or fails, the order is still saved and the customer is asked to also send it via WhatsApp.

## Ordering flow

- `POST /api/orders` validates input (zod), the +994 phone, a honeypot, and rate limits (6 per IP, 4 per phone / 10 min),
  then **recomputes every price from the database** (`src/lib/orders/quote.ts`, shared with the checkout UI) and checks
  opening hours, pre-order slots and delivery zones before saving via the `create_order` SQL function.
- Tracking page `/order/<token>`: unguessable token, live via Supabase Realtime broadcast (`order:<token>`) with polling fallback.
- Online payment is a pluggable module (`src/lib/payments`), disabled by default.
- Delivery pin uses OpenStreetMap + Leaflet (free, no API key).

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` / `build` / `start` | Next.js |
| `npm run lint` · `npm run typecheck` · `npm test` | ESLint · tsc · Vitest |
| `npm run db:seed-sql` | Regenerates `supabase/seed.sql` from `src/data/seed-*.ts` |
| `npm run db:check` | Applies migrations + seed to a throwaway local Postgres (`DATABASE_URL`) |
| `node scripts/telegram-setup.mjs [url]` | Lists the bot's chats / sets the Telegram webhook |
| `node scripts/split-sql.mjs <dir> <files…>` | Splits SQL into ≤7 KB parts for pasting |

## Key decisions

- **Money is integer qəpik**, formatted everywhere as `8,70 ₼` (`src/lib/money.ts`).
- **One price per variant**: every item has ≥1 variant with its own `price`. The site has no third-party
  delivery-platform prices or references (owner's decision).
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
