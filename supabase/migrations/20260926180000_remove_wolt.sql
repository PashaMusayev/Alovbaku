-- Owner's decision (2026-09-26): the project keeps no Wolt data at all — neither on the
-- public site nor in the admin panel. One price per variant / add-on.

alter table public.menu_items
  drop column if exists available_site,
  drop column if exists available_wolt;

alter table public.item_variants drop column if exists price_wolt;
alter table public.addon_options drop column if exists price_wolt;

do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'item_variants' and column_name = 'price_site') then
    alter table public.item_variants rename column price_site to price;
  end if;
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'addon_options' and column_name = 'price_site') then
    alter table public.addon_options rename column price_site to price;
  end if;
end $$;

alter table public.private_settings
  drop column if exists wolt_commission_percent,
  drop column if exists price_diff_alert_percent;

alter table public.orders drop column if exists channel;

-- Exact map pin: 40°23'06.3"N 49°58'45.9"E
update public.restaurant_settings
   set lat = 40.385083, lng = 49.979417, map_embed_query = '40.385083,49.979417'
 where id = 1;
