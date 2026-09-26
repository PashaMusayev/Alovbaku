-- Alov Baku — initial schema
-- Money is stored as integer qəpik (1 ₼ = 100). Translatable text is jsonb {"az": "...", "ru": "...", "en": "..."}.

create extension if not exists pgcrypto;

-- ─── Admins ────────────────────────────────────────────────────────────────
create table public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- ─── Menu ──────────────────────────────────────────────────────────────────
create table public.categories (
  id text primary key default gen_random_uuid()::text,
  slug text not null unique,
  name jsonb not null,
  role text not null default 'main' check (role in ('main', 'side', 'drink', 'combo')),
  art text not null default 'doner',
  sort_order int not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.items (
  id text primary key default gen_random_uuid()::text,
  category_id text not null references public.categories (id) on delete restrict,
  slug text not null unique,
  name jsonb not null,
  description jsonb,
  image_url text,
  art text not null default 'doner',
  variant_label jsonb,
  available_site boolean not null default true,
  available_wolt boolean not null default true,
  in_stock boolean not null default true,
  is_hidden boolean not null default false,
  is_draft boolean not null default false,
  is_popular boolean not null default false,
  is_new boolean not null default false,
  is_spicy boolean not null default false,
  diet_tags text[] not null default '{}',
  bestseller_rank int,
  sort_order int not null default 0,
  needs_review boolean not null default false,
  review_note text,
  is_combo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index items_category_idx on public.items (category_id, sort_order);

-- Every item has at least one variant; single-price items have one unlabeled variant.
create table public.item_variants (
  id text primary key default gen_random_uuid()::text,
  item_id text not null references public.items (id) on delete cascade,
  label jsonb not null default '{"az": ""}',
  price_site int not null check (price_site >= 0),
  price_wolt int check (price_wolt >= 0),
  available_site boolean not null default true,
  available_wolt boolean not null default true,
  sort_order int not null default 0,
  needs_review boolean not null default false,
  review_note text
);
create index item_variants_item_idx on public.item_variants (item_id, sort_order);

create table public.option_groups (
  id text primary key default gen_random_uuid()::text,
  name jsonb not null,
  min_select int not null default 0,
  max_select int not null default 1,
  sort_order int not null default 0,
  needs_review boolean not null default false
);

create table public.options (
  id text primary key default gen_random_uuid()::text,
  group_id text not null references public.option_groups (id) on delete cascade,
  name jsonb not null,
  price_delta int not null default 0,
  is_available boolean not null default true,
  sort_order int not null default 0
);

create table public.item_option_groups (
  item_id text not null references public.items (id) on delete cascade,
  group_id text not null references public.option_groups (id) on delete cascade,
  sort_order int not null default 0,
  primary key (item_id, group_id)
);

create table public.combo_components (
  id text primary key default gen_random_uuid()::text,
  combo_item_id text not null references public.items (id) on delete cascade,
  component_item_id text references public.items (id) on delete set null,
  component_variant_id text references public.item_variants (id) on delete set null,
  quantity int not null default 1 check (quantity > 0),
  label jsonb not null,
  sort_order int not null default 0
);

-- ─── Settings / delivery / promotions ─────────────────────────────────────
create table public.settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table public.delivery_zones (
  id text primary key default gen_random_uuid()::text,
  name jsonb not null,
  radius_km numeric(5, 2) not null,
  fee int not null default 0,
  min_order int not null default 0,
  free_from int,
  sort_order int not null default 0,
  is_active boolean not null default true
);

create table public.promotions (
  id text primary key default gen_random_uuid()::text,
  title jsonb not null,
  body jsonb,
  image_url text,
  href text,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true,
  sort_order int not null default 0
);

create table public.promo_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  kind text not null check (kind in ('percent', 'fixed')),
  value int not null check (value > 0), -- percent (1–100) or qəpik
  min_order int not null default 0,
  starts_at timestamptz,
  expires_at timestamptz,
  first_order_only boolean not null default false,
  max_uses int,
  used_count int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ─── Customers & orders (server-side access only, via service role) ───────
create table public.customers (
  phone text primary key, -- E.164, e.g. +994552437999
  name text,
  first_order_at timestamptz,
  last_order_at timestamptz,
  order_count int not null default 0,
  total_spent int not null default 0,
  points_balance int not null default 0, -- qəpik
  created_at timestamptz not null default now()
);

create type public.order_status as enum (
  'pending', 'accepted', 'preparing', 'on_the_way', 'ready', 'delivered', 'rejected', 'cancelled'
);

create sequence public.order_number_seq start 1001;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  number int not null unique default nextval('public.order_number_seq'),
  tracking_token text not null unique default encode(gen_random_bytes(12), 'hex'),
  status public.order_status not null default 'pending',
  fulfillment text not null check (fulfillment in ('delivery', 'pickup')),
  customer_phone text not null references public.customers (phone),
  customer_name text not null,
  address text,
  address_notes text,
  lat double precision,
  lng double precision,
  zone_id text references public.delivery_zones (id),
  subtotal int not null,
  delivery_fee int not null default 0,
  discount int not null default 0,
  points_redeemed int not null default 0,
  total int not null,
  points_earned int not null default 0,
  payment_method text not null check (payment_method in ('cash', 'card_on_delivery', 'online')),
  payment_status text not null default 'unpaid',
  promo_code text,
  notes text,
  scheduled_for timestamptz,
  locale text not null default 'az',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index orders_created_idx on public.orders (created_at desc);
create index orders_phone_idx on public.orders (customer_phone, created_at desc);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  item_id text references public.items (id) on delete set null,
  variant_id text references public.item_variants (id) on delete set null,
  name jsonb not null,          -- snapshot at order time
  variant_label jsonb,
  options jsonb not null default '[]', -- [{id, name, price_delta}]
  unit_price int not null,
  quantity int not null check (quantity > 0),
  line_total int not null
);

create table public.order_status_events (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders (id) on delete cascade,
  status public.order_status not null,
  created_at timestamptz not null default now()
);

-- Public, PII-free mirror of order status for the tracking page (Realtime).
create table public.order_tracking (
  token text primary key,
  order_number int not null,
  status public.order_status not null,
  fulfillment text not null,
  updated_at timestamptz not null default now()
);

create table public.loyalty_transactions (
  id bigint generated always as identity primary key,
  phone text not null references public.customers (phone),
  order_id uuid references public.orders (id) on delete set null,
  kind text not null check (kind in ('earn', 'redeem', 'adjust')),
  points int not null, -- qəpik, negative for redeem
  created_at timestamptz not null default now()
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders (id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text,
  sent_to_google boolean not null default false,
  created_at timestamptz not null default now()
);

-- Fixed-window rate limiting for order submission (keyed by IP / phone).
create table public.rate_limits (
  key text primary key,
  window_start timestamptz not null,
  count int not null
);

-- ─── Triggers ──────────────────────────────────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger items_touch before update on public.items
  for each row execute function public.touch_updated_at();
create trigger orders_touch before update on public.orders
  for each row execute function public.touch_updated_at();

-- Keep the public tracking mirror + status history in sync with orders.
create or replace function public.sync_order_tracking()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.order_tracking (token, order_number, status, fulfillment, updated_at)
  values (new.tracking_token, new.number, new.status, new.fulfillment, now())
  on conflict (token) do update set status = excluded.status, updated_at = now();

  if tg_op = 'INSERT' or new.status is distinct from old.status then
    insert into public.order_status_events (order_id, status) values (new.id, new.status);
  end if;
  return new;
end;
$$;

create trigger orders_tracking after insert or update of status on public.orders
  for each row execute function public.sync_order_tracking();

-- ─── Row level security ────────────────────────────────────────────────────
alter table public.admins enable row level security;
alter table public.categories enable row level security;
alter table public.items enable row level security;
alter table public.item_variants enable row level security;
alter table public.option_groups enable row level security;
alter table public.options enable row level security;
alter table public.item_option_groups enable row level security;
alter table public.combo_components enable row level security;
alter table public.settings enable row level security;
alter table public.delivery_zones enable row level security;
alter table public.promotions enable row level security;
alter table public.promo_codes enable row level security;
alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_status_events enable row level security;
alter table public.order_tracking enable row level security;
alter table public.loyalty_transactions enable row level security;
alter table public.reviews enable row level security;
alter table public.rate_limits enable row level security;

-- Public read: published menu + public settings.
create policy "public read categories" on public.categories for select using (is_visible or public.is_admin());
create policy "public read items" on public.items for select using ((not is_hidden and not is_draft and available_site) or public.is_admin());
create policy "public read variants" on public.item_variants for select using (true);
create policy "public read option groups" on public.option_groups for select using (true);
create policy "public read options" on public.options for select using (true);
create policy "public read item option groups" on public.item_option_groups for select using (true);
create policy "public read combo components" on public.combo_components for select using (true);
create policy "public read settings" on public.settings for select using (key not like 'private.%' or public.is_admin());
create policy "public read zones" on public.delivery_zones for select using (is_active or public.is_admin());
create policy "public read promotions" on public.promotions for select using (is_active or public.is_admin());
-- Tracking rows hold no PII; the token is unguessable (96 bits).
create policy "public read tracking" on public.order_tracking for select using (true);

-- Admin full access.
create policy "admin all categories" on public.categories for all using (public.is_admin()) with check (public.is_admin());
create policy "admin all items" on public.items for all using (public.is_admin()) with check (public.is_admin());
create policy "admin all variants" on public.item_variants for all using (public.is_admin()) with check (public.is_admin());
create policy "admin all option groups" on public.option_groups for all using (public.is_admin()) with check (public.is_admin());
create policy "admin all options" on public.options for all using (public.is_admin()) with check (public.is_admin());
create policy "admin all item option groups" on public.item_option_groups for all using (public.is_admin()) with check (public.is_admin());
create policy "admin all combo components" on public.combo_components for all using (public.is_admin()) with check (public.is_admin());
create policy "admin all settings" on public.settings for all using (public.is_admin()) with check (public.is_admin());
create policy "admin all zones" on public.delivery_zones for all using (public.is_admin()) with check (public.is_admin());
create policy "admin all promotions" on public.promotions for all using (public.is_admin()) with check (public.is_admin());
create policy "admin all promo codes" on public.promo_codes for all using (public.is_admin()) with check (public.is_admin());
create policy "admin all customers" on public.customers for all using (public.is_admin()) with check (public.is_admin());
create policy "admin all orders" on public.orders for all using (public.is_admin()) with check (public.is_admin());
create policy "admin all order items" on public.order_items for all using (public.is_admin()) with check (public.is_admin());
create policy "admin read status events" on public.order_status_events for select using (public.is_admin());
create policy "admin read loyalty" on public.loyalty_transactions for select using (public.is_admin());
create policy "admin all reviews" on public.reviews for all using (public.is_admin()) with check (public.is_admin());
create policy "admin read admins" on public.admins for select using (public.is_admin());
-- rate_limits: no policies → only the service role can touch it.

-- ─── Realtime ──────────────────────────────────────────────────────────────
alter publication supabase_realtime add table public.order_tracking;
alter publication supabase_realtime add table public.orders;

-- ─── Storage (menu photos) ─────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('menu-images', 'menu-images', true)
on conflict (id) do nothing;

create policy "public read menu images" on storage.objects for select
  using (bucket_id = 'menu-images');
create policy "admin write menu images" on storage.objects for insert
  with check (bucket_id = 'menu-images' and public.is_admin());
create policy "admin update menu images" on storage.objects for update
  using (bucket_id = 'menu-images' and public.is_admin());
create policy "admin delete menu images" on storage.objects for delete
  using (bucket_id = 'menu-images' and public.is_admin());
