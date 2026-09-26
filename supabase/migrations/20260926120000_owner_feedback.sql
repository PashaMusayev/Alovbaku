-- Restaurant feedback (2026-09-26):
--   * The public site must not show anything about Wolt → drop the "Wolt-dan ucuz" banner settings.
--     (Wolt prices stay on menu variants for internal use only.)
--   * Map embed uses a search query until exact coordinates are set.

alter table public.restaurant_settings
  drop column if exists wolt_banner_enabled,
  drop column if exists wolt_banner_text,
  add column if not exists map_embed_query text not null default 'Alov Baku, Bakı';
