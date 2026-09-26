-- Removes everything the Alov Baku migrations create, so they can be run again
-- from scratch. Use ONLY before launch: it deletes all menu, order and customer data.
drop policy if exists "public read menu images" on storage.objects;
drop policy if exists "admin write menu images" on storage.objects;
drop policy if exists "admin update menu images" on storage.objects;
drop policy if exists "admin delete menu images" on storage.objects;

drop table if exists
  public.rate_limit_hits, public.reviews, public.loyalty_transactions,
  public.order_status_events, public.order_items, public.orders, public.promo_codes,
  public.customers, public.delivery_zones, public.private_settings, public.restaurant_settings,
  public.combo_components, public.combos, public.item_addon_groups, public.addon_options,
  public.addon_groups, public.item_variants, public.menu_items, public.categories,
  public.admin_users
  cascade;

drop sequence if exists public.order_number_seq;
drop function if exists public.is_admin(), public.is_localized(jsonb), public.set_updated_at(), public.log_order_status() cascade;
