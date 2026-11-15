-- View dedupe is a time window, not one row per calendar day.
-- Safe to run more than once. Creates the table when trust.sql has not been applied.

create table if not exists public.listing_views (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null,
  viewer_key text not null,
  day date not null,
  window_start timestamptz,
  created_at timestamptz not null default now()
);

alter table public.listings
  add column if not exists views_count integer not null default 0;

alter table public.listing_views
  add column if not exists window_start timestamptz;

do $$
declare
  name text;
begin
  for name in
    select con.conname
    from pg_constraint con
    where con.conrelid = 'public.listing_views'::regclass
      and con.contype = 'u'
      and pg_get_constraintdef(con.oid) ilike '%viewer_key%'
      and pg_get_constraintdef(con.oid) ilike '%day%'
  loop
    execute format('alter table public.listing_views drop constraint %I', name);
  end loop;
end $$;

create unique index if not exists listing_views_window_uidx
  on public.listing_views (listing_id, viewer_key, window_start);

drop function if exists public.record_listing_view(uuid, text, date);

create or replace function public.record_listing_view(
  p_listing uuid,
  p_viewer text,
  p_window_minutes int default 30
)
returns table(counted boolean, views_count integer)
language plpgsql
as $$
#variable_conflict use_column
declare
  inserted integer;
  total integer;
  mins integer := greatest(1, least(coalesce(p_window_minutes, 30), 1440));
  start_at timestamptz := to_timestamp(floor(extract(epoch from now()) / (mins * 60)) * (mins * 60));
begin
  insert into public.listing_views (listing_id, viewer_key, day, window_start)
  values (p_listing, p_viewer, start_at::date, start_at)
  on conflict (listing_id, viewer_key, window_start) do nothing;
  get diagnostics inserted = row_count;
  if inserted = 1 then
    update public.listings
      set views_count = coalesce(views_count, 0) + 1
      where id = p_listing
      returning listings.views_count into total;
    return query select true, coalesce(total, 0);
  else
    select coalesce(l.views_count, 0) into total from public.listings l where l.id = p_listing;
    return query select false, coalesce(total, 0);
  end if;
end $$;

grant execute on function public.record_listing_view(uuid, text, int) to service_role;
