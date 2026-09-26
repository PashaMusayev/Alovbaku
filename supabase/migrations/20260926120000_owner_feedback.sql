-- Restaurant feedback (2026-09-26):
--   * The public site must not show anything about the delivery platform → drop the banner settings.
--   * Map embed uses a search query until exact coordinates are set.

alter table public.restaurant_settings
  drop column if exists wolt_banner_enabled,
  drop column if exists wolt_banner_text,
  add column if not exists map_embed_query text not null default 'Alov Baku, Bakı';
