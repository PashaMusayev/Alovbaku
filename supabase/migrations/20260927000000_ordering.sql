-- Phase 2: ordering.
-- Orders are created only by the server (service role) after it has recomputed
-- every price; these functions are not callable by anon/authenticated users.

-- Atomically upserts the customer and inserts the order with its lines.
-- p: { customer_name, phone, fulfillment, address, address_notes, lat, lng, zone_id,
--      payment_method, subtotal, delivery_fee, discount, total, notes, scheduled_for,
--      locale, items: [{ item_id, variant_id, item_name, variant_label, addons, unit_price, quantity, line_total }] }
create or replace function public.create_order(p jsonb)
returns table (out_id uuid, out_number int, out_token text)
language plpgsql security definer set search_path = public as $$
declare
  v_customer uuid;
  v_order public.orders%rowtype;
begin
  insert into public.customers as c (phone, name, first_order_at, last_order_at, order_count, total_spent)
  values (p ->> 'phone', p ->> 'customer_name', now(), now(), 1, (p ->> 'total')::int)
  on conflict (phone) do update
    set name = excluded.name,
        last_order_at = now(),
        order_count = c.order_count + 1,
        total_spent = c.total_spent + excluded.total_spent
  returning c.id into v_customer;

  insert into public.orders (
    customer_id, customer_name, phone, fulfillment, address, address_notes, lat, lng, zone_id,
    payment_method, subtotal, delivery_fee, discount, total, notes, scheduled_for, locale
  ) values (
    v_customer, p ->> 'customer_name', p ->> 'phone', p ->> 'fulfillment', p ->> 'address',
    p ->> 'address_notes', (p ->> 'lat')::double precision, (p ->> 'lng')::double precision,
    (p ->> 'zone_id')::uuid, p ->> 'payment_method', (p ->> 'subtotal')::int,
    (p ->> 'delivery_fee')::int, (p ->> 'discount')::int, (p ->> 'total')::int, p ->> 'notes',
    (p ->> 'scheduled_for')::timestamptz, coalesce(p ->> 'locale', 'az')
  )
  returning * into v_order;

  insert into public.order_items (order_id, item_id, variant_id, item_name, variant_label, addons, unit_price, quantity, line_total)
  select v_order.id, (x ->> 'item_id')::uuid, (x ->> 'variant_id')::uuid, x ->> 'item_name', x ->> 'variant_label',
         coalesce(x -> 'addons', '[]'::jsonb), (x ->> 'unit_price')::int, (x ->> 'quantity')::int, (x ->> 'line_total')::int
  from jsonb_array_elements(p -> 'items') as x;

  return query select v_order.id, v_order.number, v_order.public_token;
end $$;

-- Sliding-window rate limit. Returns true when the call is allowed (and records it).
create or replace function public.hit_rate_limit(p_bucket text, p_window_seconds int, p_max int)
returns boolean
language plpgsql security definer set search_path = public as $$
declare v_count int;
begin
  perform pg_advisory_xact_lock(hashtext(p_bucket));
  delete from public.rate_limit_hits where created_at < now() - interval '1 day';
  select count(*) into v_count from public.rate_limit_hits
   where bucket = p_bucket and created_at > now() - make_interval(secs => p_window_seconds);
  if v_count >= p_max then
    return false;
  end if;
  insert into public.rate_limit_hits (bucket) values (p_bucket);
  return true;
end $$;

revoke all on function public.create_order(jsonb) from public, anon, authenticated;
revoke all on function public.hit_rate_limit(text, int, int) from public, anon, authenticated;
grant execute on function public.create_order(jsonb) to service_role;
grant execute on function public.hit_rate_limit(text, int, int) to service_role;

-- Live tracking: broadcast status changes on a public Realtime topic named after the
-- order's unguessable token. Customers never get read access to the orders table.
create or replace function public.broadcast_order_status()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  begin
    perform realtime.send(
      jsonb_build_object('status', new.status, 'updated_at', new.updated_at),
      'status',
      'order:' || new.public_token,
      false
    );
  exception when others then
    -- Tracking falls back to polling; never block a status change.
    null;
  end;
  return new;
end $$;

drop trigger if exists orders_broadcast_status on public.orders;
create trigger orders_broadcast_status after update of status on public.orders
  for each row execute function public.broadcast_order_status();
