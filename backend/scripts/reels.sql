create table if not exists public.reels (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  caption text not null default '',
  video_url text not null,
  thumb_url text not null default '',
  public_id text not null default '',
  likes_count integer not null default 0,
  status text not null default 'active',
  created_at timestamptz not null default now()
);
create index if not exists reels_created_at_idx on public.reels (created_at desc);
create index if not exists reels_owner_idx on public.reels (owner_id);
create index if not exists reels_status_idx on public.reels (status);
