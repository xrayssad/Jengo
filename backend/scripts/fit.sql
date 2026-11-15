-- Additive listing facts. Safe to run more than once.
-- Old rows stay visible: last_confirmed_at stays null until the owner confirms.

alter table listings add column if not exists attributes jsonb not null default '{}'::jsonb;
alter table listings add column if not exists poster_role text;
alter table listings add column if not exists free_viewing boolean;
alter table listings add column if not exists direct_owner boolean;
alter table listings add column if not exists costs_confirmed boolean;
alter table listings add column if not exists last_confirmed_at timestamptz;

create table if not exists viewing_requests (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null,
  user_id uuid not null,
  visit_date date not null,
  slot text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists stays (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null,
  user_id uuid not null,
  start_date date not null,
  end_date date not null,
  guests int not null,
  total numeric not null,
  status text not null,
  created_at timestamptz not null default now(),
  constraint stays_range check (end_date > start_date)
);

create table if not exists listing_reviews (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null,
  user_id uuid not null,
  interaction_id uuid not null,
  interaction_kind text not null,
  ratings jsonb not null default '{}'::jsonb,
  body text not null default '',
  owner_reply text,
  created_at timestamptz not null default now(),
  unique (interaction_id, user_id)
);

create table if not exists storage_requests (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null,
  user_id uuid not null,
  goods text not null,
  notes text not null default '',
  start_date date not null,
  months int not null default 1,
  business text not null default '',
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid,
  user_id uuid,
  provider text not null,
  provider_ref text not null,
  amount numeric not null,
  status text not null,
  created_at timestamptz not null default now()
);

-- Overlap is also checked in the API before insert.
create extension if not exists btree_gist;
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'stays_no_overlap') then
    alter table stays add constraint stays_no_overlap
      exclude using gist (
        listing_id with =,
        daterange(start_date, end_date, '[)') with &&
      )
      where (status in ('pending', 'confirmed'));
  end if;
end $$;
