-- Alov Baku — initial schema
-- Money is stored as integer qəpik (1 ₼ = 100 qəpik).
-- Localized text is jsonb: {"az": "...", "ru": "...", "en": "..."}; "az" is required.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- Admin staff = Supabase Auth users listed here. Customers never log in.
create table public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid());
$$;

create or replace function public.is_localized(value jsonb)
returns boolean language sql immutable as $$
  select jsonb_typeof(value) = 'object' and coalesce(value ->> 'az', '') <> '';
$$;

-- ---------------------------------------------------------------------------
-- Menu
-- ---------------------------------------------------------------------------

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name jsonb not null check (public.is_localized(name)),
  icon text not null default '🍽️',
  sort_order int not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  category_id uuid not null references public.categories (id) on delete restrict,
  name jsonb not null check (public.is_localized(name)),
  description jsonb not null default '{"az": ""}'::jsonb,
  image_url text,
  tags text[] not null default '{}'
    check (tags <@ array['spicy', 'chicken', 'meat', 'vegetarian', 'seafood']),
  is_popular boolean not null default false,
  is_new boolean not null default false,
  is_hidden boolean not null default false,
  in_stock boolean not null default true,
  available_site boolean not null default true,
  available_wolt boolean not null default true,
  featured_rank int,
  sort_order int not null default 0,
  needs_review boolean not null default false,
  review_note text,
  is_combo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index menu_items_category_idx on public.menu_items (category_id, sort_order);

-- Every item has at least one variant; single-price items have one variant with a null label.
create table public.item_variants (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.menu_items (id) on delete cascade,
  label jsonb,
  price_site int not null check (price_site >= 0),
  price_wolt int check (price_wolt >= 0),
  sort_order int not null default 0,
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index item_variants_item_idx on public.item_variants (item_id, sort_order);

create table public.addon_groups (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name jsonb not null check (public.is_localized(name)),
  min_select int not null default 0 check (min_select >= 0),
  max_select int not null default 1 check (max_select >= 1),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  check (max_select >= min_select)
);

create table public.addon_options (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.addon_groups (id) on delete cascade,
  name jsonb not null check (public.is_localized(name)),
  price_site int not null default 0 check (price_site >= 0),
  price_wolt int check (price_wolt >= 0),
  -- When set, the option is a menu product (e.g. a drink) and its price follows that variant.
  linked_variant_id uuid references public.item_variants (id) on delete set null,
  sort_order int not null default 0,
  is_available boolean not null default true,
  created_at timestamptz not null default now()
);
create index addon_options_group_idx on public.addon_options (group_id, sort_order);

create table public.item_addon_groups (
  item_id uuid not null references public.menu_items (id) on delete cascade,
  group_id uuid not null references public.addon_groups (id) on delete cascade,
  sort_order int not null default 0,
  primary key (item_id, group_id)
);

create table public.combos (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null unique references public.menu_items (id) on delete cascade,
  status text not null default 'draft' check (status in ('active', 'draft', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.combo_components (
  id uuid primary key default gen_random_uuid(),
  combo_id uuid not null references public.combos (id) on delete cascade,
  item_id uuid not null references public.menu_items (id) on delete cascade,
  variant_id uuid references public.item_variants (id) on delete cascade,
  quantity int not null default 1 check (quantity > 0)
);
create index combo_components_combo_idx on public.combo_components (combo_id);

-- ---------------------------------------------------------------------------
-- Settings
-- ---------------------------------------------------------------------------

-- Public settings (single row, readable by anyone).
create table public.restaurant_settings (
  id int primary key default 1 check (id = 1),
  name text not null default 'Alov Baku',
  phone text not null,
  whatsapp text not null,
  instagram text not null,
  address jsonb not null check (public.is_localized(address)),
  lat double precision not null,
  lng double precision not null,
  google_maps_url text not null default '',
  google_review_url text not null default '',
  timezone text not null default 'Asia/Baku',
  -- [{"day": 0-6, "open": "11:00", "close": "01:00", "closed": false}]
  opening_hours jsonb not null,
  pickup_enabled boolean not null default true,
  delivery_enabled boolean not null default true,
  preorder_enabled boolean not null default true,
  ordering_enabled boolean not null default true,
  cashback_percent numeric(5, 2) not null default 5 check (cashback_percent between 0 and 100),
  wolt_banner_enabled boolean not null default true,
  wolt_banner_text jsonb not null default '{"az": ""}'::jsonb,
  hero_image_url text,
  ai_assistant_enabled boolean not null default false,
  online_payment_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

-- Admin-only settings (single row).
create table public.private_settings (
  id int primary key default 1 check (id = 1),
  telegram_chat_id text,
  wolt_commission_percent numeric(5, 2) not null default 30 check (wolt_commission_percent between 0 and 100),
  -- Warn when site and Wolt prices differ by more than this percentage.
  price_diff_alert_percent numeric(5, 2) not null default 25 check (price_diff_alert_percent >= 0),
  -- Warn when a price is this many times above/below the category average.
  price_outlier_factor numeric(5, 2) not null default 2.5 check (price_outlier_factor > 1),
  updated_at timestamptz not null default now()
);

create table public.delivery_zones (
  id uuid primary key default gen_random_uuid(),
  name jsonb not null check (public.is_localized(name)),
  radius_km numeric(6, 2) not null check (radius_km > 0),
  -- Optional GeoJSON polygon; when set it takes precedence over radius_km.
  polygon jsonb,
  fee int not null default 0 check (fee >= 0),
  min_order int not null default 0 check (min_order >= 0),
  eta_minutes int not null default 45 check (eta_minutes > 0),
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Customers, promos, orders
-- ---------------------------------------------------------------------------

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  -- E.164, e.g. +994552437999. The phone number is the customer identity.
  phone text not null unique check (phone ~ '^\+994\d{9}$'),
  name text,
  points_balance int not null default 0 check (points_balance >= 0),
  order_count int not null default 0,
  total_spent int not null default 0,
  first_order_at timestamptz,
  last_order_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.promo_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code = upper(code) and length(code) between 3 and 32),
  description text,
  kind text not null check (kind in ('percent', 'fixed')),
  -- percent: 1-100; fixed: qəpik
  value int not null check (value > 0),
  min_order int not null default 0,
  max_discount int,
  starts_at timestamptz,
  expires_at timestamptz,
  first_order_only boolean not null default false,
  max_uses int,
  max_uses_per_phone int,
  used_count int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  check (kind <> 'percent' or value <= 100)
);

create sequence public.order_number_seq start 1001;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  number int not null unique default nextval('public.order_number_seq'),
  -- Unguessable token used in the public tracking link.
  public_token text not null unique default encode(gen_random_bytes(16), 'hex'),
  customer_id uuid references public.customers (id) on delete set null,
  customer_name text not null,
  phone text not null check (phone ~ '^\+994\d{9}$'),
  fulfillment text not null check (fulfillment in ('delivery', 'pickup')),
  address text,
  address_notes text,
  lat double precision,
  lng double precision,
  zone_id uuid references public.delivery_zones (id) on delete set null,
  status text not null default 'new'
    check (status in ('new', 'accepted', 'preparing', 'on_the_way', 'ready', 'delivered', 'rejected', 'cancelled')),
  payment_method text not null check (payment_method in ('cash', 'card_on_delivery', 'online')),
  payment_status text not null default 'pending' check (payment_status in ('pending', 'paid', 'failed', 'refunded')),
  subtotal int not null check (subtotal >= 0),
  delivery_fee int not null default 0 check (delivery_fee >= 0),
  discount int not null default 0 check (discount >= 0),
  points_redeemed int not null default 0 check (points_redeemed >= 0),
  points_earned int not null default 0 check (points_earned >= 0),
  total int not null check (total >= 0),
  promo_code_id uuid references public.promo_codes (id) on delete set null,
  notes text,
  scheduled_for timestamptz,
  locale text not null default 'az' check (locale in ('az', 'ru', 'en')),
  channel text not null default 'site',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index orders_created_idx on public.orders (created_at desc);
create index orders_status_idx on public.orders (status);
create index orders_phone_idx on public.orders (phone, created_at desc);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  item_id uuid references public.menu_items (id) on delete set null,
  variant_id uuid references public.item_variants (id) on delete set null,
  -- Snapshots so old orders stay readable after menu edits.
  item_name text not null,
  variant_label text,
  addons jsonb not null default '[]'::jsonb,
  unit_price int not null check (unit_price >= 0),
  quantity int not null check (quantity > 0),
  line_total int not null check (line_total >= 0)
);
create index order_items_order_idx on public.order_items (order_id);

create table public.order_status_events (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders (id) on delete cascade,
  status text not null,
  created_at timestamptz not null default now()
);
create index order_status_events_order_idx on public.order_status_events (order_id, created_at);

create table public.loyalty_transactions (
  id bigint generated always as identity primary key,
  customer_id uuid not null references public.customers (id) on delete cascade,
  order_id uuid references public.orders (id) on delete set null,
  points int not null,
  kind text not null check (kind in ('earn', 'redeem', 'adjust', 'reverse')),
  created_at timestamptz not null default now()
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders (id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text,
  redirected_to_google boolean not null default false,
  created_at timestamptz not null default now()
);

-- Used by the order endpoint for rate limiting (per IP hash / phone).
create table public.rate_limit_hits (
  id bigint generated always as identity primary key,
  bucket text not null,
  created_at timestamptz not null default now()
);
create index rate_limit_hits_bucket_idx on public.rate_limit_hits (bucket, created_at desc);

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

create trigger categories_updated before update on public.categories
  for each row execute function public.set_updated_at();
create trigger menu_items_updated before update on public.menu_items
  for each row execute function public.set_updated_at();
create trigger item_variants_updated before update on public.item_variants
  for each row execute function public.set_updated_at();
create trigger combos_updated before update on public.combos
  for each row execute function public.set_updated_at();
create trigger orders_updated before update on public.orders
  for each row execute function public.set_updated_at();
create trigger restaurant_settings_updated before update on public.restaurant_settings
  for each row execute function public.set_updated_at();
create trigger private_settings_updated before update on public.private_settings
  for each row execute function public.set_updated_at();

create or replace function public.log_order_status()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    insert into public.order_status_events (order_id, status) values (new.id, new.status);
  end if;
  return new;
end $$;

create trigger orders_status_log after insert or update of status on public.orders
  for each row execute function public.log_order_status();

-- ---------------------------------------------------------------------------
-- Row level security
--   * Menu, zones and public settings: readable by everyone, writable by admins.
--   * Orders, customers, promos, reviews, private settings: admins only.
--     Customer-facing writes go through server routes using the service role,
--     which recomputes all prices server-side.
-- ---------------------------------------------------------------------------

alter table public.admin_users enable row level security;
alter table public.categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.item_variants enable row level security;
alter table public.addon_groups enable row level security;
alter table public.addon_options enable row level security;
alter table public.item_addon_groups enable row level security;
alter table public.combos enable row level security;
alter table public.combo_components enable row level security;
alter table public.restaurant_settings enable row level security;
alter table public.private_settings enable row level security;
alter table public.delivery_zones enable row level security;
alter table public.customers enable row level security;
alter table public.promo_codes enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_status_events enable row level security;
alter table public.loyalty_transactions enable row level security;
alter table public.reviews enable row level security;
alter table public.rate_limit_hits enable row level security;

create policy "admins read admin list" on public.admin_users
  for select to authenticated using (public.is_admin());

-- Public read (menu & public settings)
create policy "public read categories" on public.categories for select using (true);
create policy "public read items" on public.menu_items for select using (true);
create policy "public read variants" on public.item_variants for select using (true);
create policy "public read addon groups" on public.addon_groups for select using (true);
create policy "public read addon options" on public.addon_options for select using (true);
create policy "public read item addon groups" on public.item_addon_groups for select using (true);
create policy "public read combos" on public.combos for select using (true);
create policy "public read combo components" on public.combo_components for select using (true);
create policy "public read settings" on public.restaurant_settings for select using (true);
create policy "public read zones" on public.delivery_zones for select using (true);

-- Admin full access
do $$
declare t text;
begin
  foreach t in array array[
    'categories', 'menu_items', 'item_variants', 'addon_groups', 'addon_options',
    'item_addon_groups', 'combos', 'combo_components', 'restaurant_settings',
    'private_settings', 'delivery_zones', 'customers', 'promo_codes', 'orders',
    'order_items', 'order_status_events', 'loyalty_transactions', 'reviews'
  ] loop
    execute format(
      'create policy "admin all %1$s" on public.%1$I for all to authenticated using (public.is_admin()) with check (public.is_admin())',
      t
    );
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Realtime: admin orders board listens to inserts/updates on orders.
-- ---------------------------------------------------------------------------
alter publication supabase_realtime add table public.orders;

-- ---------------------------------------------------------------------------
-- Storage bucket for menu photos (public read, admin write).
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('menu-images', 'menu-images', true)
on conflict (id) do nothing;

create policy "public read menu images" on storage.objects
  for select using (bucket_id = 'menu-images');
create policy "admin write menu images" on storage.objects
  for insert to authenticated with check (bucket_id = 'menu-images' and public.is_admin());
create policy "admin update menu images" on storage.objects
  for update to authenticated using (bucket_id = 'menu-images' and public.is_admin());
create policy "admin delete menu images" on storage.objects
  for delete to authenticated using (bucket_id = 'menu-images' and public.is_admin());
