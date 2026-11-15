-- Verification badges and listing views.
-- Run in the Supabase SQL editor. Storage encryption at rest is provided by Supabase.
-- Manual: create a PRIVATE bucket named verification-private (the API also tries to create it).
-- Manual: set profiles.role = 'admin' for reviewers. The API checks that role on every admin route.
-- Documents are deleted DOC_RETENTION_DAYS after a decision (default 30). Never store a full ID number.

alter table public.profiles
  add column if not exists is_verified boolean not null default false,
  add column if not exists verified_type text,
  add column if not exists verified_at timestamptz,
  add column if not exists verified_by uuid,
  add column if not exists verified_name text,
  add column if not exists revoked_at timestamptz,
  add column if not exists revoked_reason text,
  add column if not exists avatar_url text;

alter table public.listings
  add column if not exists views_count integer not null default 0;

create table if not exists public.listing_views (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null,
  viewer_key text not null,
  day date not null,
  created_at timestamptz not null default now(),
  unique (listing_id, viewer_key, day)
);

create index if not exists listing_views_listing_day_idx
  on public.listing_views (listing_id, day);

create table if not exists public.verification_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  type text not null,
  legal_name text not null,
  doc_type text not null,
  fingerprint text,
  front_key text,
  back_key text,
  selfie_key text,
  business_doc_key text,
  shop_key text,
  status text not null default 'pending',
  reason_code text,
  reviewer_note text,
  reviewer uuid,
  flagged boolean not null default false,
  submitted_at timestamptz not null default now(),
  decided_at timestamptz,
  delete_after timestamptz
);

create index if not exists verification_requests_status_idx
  on public.verification_requests (status, submitted_at);

create index if not exists verification_requests_fingerprint_idx
  on public.verification_requests (fingerprint);

create table if not exists public.verification_audit (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  user_id uuid,
  request_id uuid,
  action text not null,
  reason_code text,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid,
  target_type text not null,
  target_id text not null,
  reason_code text not null,
  note text,
  created_at timestamptz not null default now()
);

-- Atomic view: insert the daily row, then increment only when that insert is new.
create or replace function public.record_listing_view(p_listing uuid, p_viewer text, p_day date)
returns table(counted boolean, views_count integer)
language plpgsql
as $$
declare
  inserted integer;
  total integer;
begin
  insert into public.listing_views (listing_id, viewer_key, day)
  values (p_listing, p_viewer, p_day)
  on conflict (listing_id, viewer_key, day) do nothing;
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
