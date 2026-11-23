-- Per-user preferences. Safe to re-run.
alter table public.profiles
  add column if not exists preferences jsonb not null default '{}'::jsonb;

-- Homes that already have a rent period stay rent. Sale is opt-in.
update public.listings
set attributes = coalesce(attributes, '{}'::jsonb) || '{"listing_type":"rent"}'::jsonb
where category in (
  'rooms-houses', 'chumba_nyumba', 'rooms', 'room', 'houses', 'house',
  'nyumba', 'chumba', 'vyumba', 'vyumba_na_nyumba'
)
  and coalesce(period, '') <> ''
  and coalesce(attributes->>'listing_type', '') = '';
