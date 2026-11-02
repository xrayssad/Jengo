create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  title text not null,
  description text not null default '',
  location text not null default '',
  city text not null default '',
  budget numeric not null default 0,
  deadline text not null default '',
  status text not null default 'open',
  images jsonb not null default '[]'::jsonb,
  connection_fee numeric,
  fee_status text not null default 'none',
  awarded_offer_id uuid,
  created_at timestamptz not null default now()
);
create index if not exists jobs_created_at_idx on public.jobs (created_at desc);
create index if not exists jobs_owner_idx on public.jobs (owner_id);
create index if not exists jobs_status_idx on public.jobs (status);

create table if not exists public.job_offers (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs (id) on delete cascade,
  worker_name text not null,
  contact text not null default '',
  amount numeric not null default 0,
  message text not null default '',
  status text not null default 'submitted',
  created_at timestamptz not null default now()
);
create index if not exists job_offers_job_idx on public.job_offers (job_id);
create index if not exists job_offers_created_at_idx on public.job_offers (created_at desc);
