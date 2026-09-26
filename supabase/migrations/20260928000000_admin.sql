-- Phase 3: admin panel.
-- Admin writes go through server code that first verifies the signed-in user is an admin,
-- then calls these functions with the service role. They are not callable by anon/authenticated.

-- Link each order to its Telegram message so status changes made in the admin panel
-- also update the message (and its buttons) in the staff group.
alter table public.orders
  add column if not exists telegram_chat_id text,
  add column if not exists telegram_message_id bigint;

-- Saves a menu item with its variants and add-on groups atomically.
-- p: { id?, slug, category_id, name, description, image_url, tags[], is_popular, is_new, is_hidden,
--      in_stock, featured_rank, sort_order?, needs_review, review_note, is_combo,
--      variants: [{ id?, label, price, is_available }], addon_group_ids: [uuid] }
create or replace function public.admin_save_item(p jsonb)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid := coalesce(nullif(p ->> 'id', '')::uuid, gen_random_uuid());
  v_category uuid := (p ->> 'category_id')::uuid;
  v_keep uuid[];
begin
  insert into public.menu_items as m (
    id, slug, category_id, name, description, image_url, tags, is_popular, is_new, is_hidden,
    in_stock, featured_rank, sort_order, needs_review, review_note, is_combo
  ) values (
    v_id, p ->> 'slug', v_category, p -> 'name', coalesce(p -> 'description', '{"az": ""}'::jsonb),
    nullif(p ->> 'image_url', ''),
    coalesce(array(select jsonb_array_elements_text(p -> 'tags')), '{}'),
    coalesce((p ->> 'is_popular')::boolean, false), coalesce((p ->> 'is_new')::boolean, false),
    coalesce((p ->> 'is_hidden')::boolean, false), coalesce((p ->> 'in_stock')::boolean, true),
    (p ->> 'featured_rank')::int,
    coalesce((p ->> 'sort_order')::int,
             (select coalesce(max(sort_order), 0) + 1 from public.menu_items where category_id = v_category)),
    coalesce((p ->> 'needs_review')::boolean, false), nullif(p ->> 'review_note', ''),
    coalesce((p ->> 'is_combo')::boolean, false)
  )
  on conflict (id) do update set
    slug = excluded.slug,
    category_id = excluded.category_id,
    name = excluded.name,
    description = excluded.description,
    image_url = excluded.image_url,
    tags = excluded.tags,
    is_popular = excluded.is_popular,
    is_new = excluded.is_new,
    is_hidden = excluded.is_hidden,
    in_stock = excluded.in_stock,
    featured_rank = excluded.featured_rank,
    sort_order = case when p ? 'sort_order' then excluded.sort_order else m.sort_order end,
    needs_review = excluded.needs_review,
    review_note = excluded.review_note,
    is_combo = excluded.is_combo;

  select array_agg((v ->> 'id')::uuid) into v_keep
    from jsonb_array_elements(p -> 'variants') v
   where nullif(v ->> 'id', '') is not null;

  delete from public.item_variants
   where item_id = v_id and (v_keep is null or id <> all (v_keep));

  insert into public.item_variants as iv (id, item_id, label, price, sort_order, is_available)
  select coalesce(nullif(v ->> 'id', '')::uuid, gen_random_uuid()), v_id,
         nullif(v -> 'label', 'null'::jsonb), (v ->> 'price')::int, t.ord::int,
         coalesce((v ->> 'is_available')::boolean, true)
    from jsonb_array_elements(p -> 'variants') with ordinality as t(v, ord)
  on conflict (id) do update set
    label = excluded.label, price = excluded.price, sort_order = excluded.sort_order,
    is_available = excluded.is_available
  where iv.item_id = v_id;

  delete from public.item_addon_groups where item_id = v_id;
  insert into public.item_addon_groups (item_id, group_id, sort_order)
  select v_id, g::uuid, t.ord::int
    from jsonb_array_elements_text(coalesce(p -> 'addon_group_ids', '[]'::jsonb)) with ordinality as t(g, ord);

  return v_id;
end $$;

-- Sets sort_order = position in p_ids for categories or menu items (drag & drop).
create or replace function public.admin_reorder(p_table text, p_ids uuid[])
returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_table = 'categories' then
    update public.categories c set sort_order = t.ord
      from unnest(p_ids) with ordinality as t(id, ord) where c.id = t.id;
  elsif p_table = 'menu_items' then
    update public.menu_items m set sort_order = t.ord
      from unnest(p_ids) with ordinality as t(id, ord) where m.id = t.id;
  else
    raise exception 'unsupported table %', p_table;
  end if;
end $$;

revoke all on function public.admin_save_item(jsonb) from public, anon, authenticated;
revoke all on function public.admin_reorder(text, uuid[]) from public, anon, authenticated;
grant execute on function public.admin_save_item(jsonb) to service_role;
grant execute on function public.admin_reorder(text, uuid[]) to service_role;

-- Price check compares each item with the median of the other items in its category.
alter table public.private_settings alter column price_outlier_factor set default 1.9;
update public.private_settings set price_outlier_factor = 1.9 where price_outlier_factor = 2.5;
