# Alov Baku — direct ordering website

Mobile-first ordering site for **Alov Baku** (köz dönər, kabab, pizza, şaurma…), built to move customers
from Wolt to commission-free direct orders.

> **Status:** Phase 1 of 5 — project setup, DB schema, seed data, public menu with variants, i18n, design system.
> The full deploy guide lands in Phase 5.

## Stack

- Next.js 16 (App Router, Turbopack) + TypeScript + Tailwind CSS v4
- Supabase (Postgres, Auth for admins, Storage for photos, Realtime for order tracking)
- Zustand (cart, persisted to `localStorage`)
- Vitest (unit tests)

## Quick start

```bash
npm install
cp .env.example .env.local   # optional — without Supabase the site runs in demo mode
npm run dev                  # http://localhost:3000
```

**Demo mode:** when `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` are empty, the menu and settings
are served from the typed seed in `src/data/seed/`, so the site can be previewed with no backend.

## Supabase setup

1. Create a project at [supabase.com](https://supabase.com) (free tier is enough).
2. SQL editor → run `supabase/migrations/0001_init.sql`.
3. SQL editor → run `supabase/seed.sql` (regenerate with `npm run db:seed:generate` after editing `src/data/seed`).
4. Copy the project URL + anon key + service role key into `.env.local`.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` / `npm start` | Production build / serve |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript |
| `npm test` | Unit tests (pricing, hours, seed integrity, money formatting) |
| `npm run db:seed:generate` | Regenerate `supabase/seed.sql` from `src/data/seed` |

## Project layout

```
src/
  app/[lang]/          public pages (az at "/", ru at "/ru", en at "/en" — see src/proxy.ts)
  components/          UI (layout, home, menu, cart)
  data/seed/           typed seed menu + default settings (single source for seed.sql and demo mode)
  i18n/                dictionaries (az/ru/en) — every UI string lives here
  lib/                 domain types, money, hours, pricing, data access
supabase/              SQL migrations + generated seed
scripts/               seed generator
```

## Conventions

- **Money** is integer qəpik everywhere (`870` = `8,70 ₼`); always format with `formatPrice()`.
- **Every item has ≥1 variant.** Single-price items have one unlabeled variant; pizzas have Kiçik/Orta/Böyük.
- **Channel pricing:** each variant has `price_site` and optional `price_wolt`; the public site always shows the site price.
- **Translatable DB text** is `{ az, ru?, en? }` and falls back to Azerbaijani.
- Items/variants flagged `needs_review` came from suspicious source data and appear in the admin validation list.
