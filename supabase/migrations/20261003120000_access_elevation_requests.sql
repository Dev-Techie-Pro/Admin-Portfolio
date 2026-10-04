-- Temporary CMS access requests (3h elevation on admin approve; role unchanged)

create table if not exists public.access_elevation_requests (
  id              uuid primary key default gen_random_uuid(),
  site_id         uuid not null references public.sites (id) on delete cascade,
  user_id         uuid not null references public.profiles (id) on delete cascade,
  contact_email   text not null,
  message         text not null,
  status          text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  created_at      timestamptz not null default timezone('utc', now()),
  reviewed_by     uuid references public.profiles (id) on delete set null,
  reviewed_at     timestamptz,
  rejection_note  text,
  elevated_until  timestamptz
);

create unique index if not exists access_elevation_requests_one_pending_per_user_idx
  on public.access_elevation_requests (user_id)
  where status = 'pending';

create index if not exists access_elevation_requests_status_created_idx
  on public.access_elevation_requests (status, created_at desc);

create index if not exists access_elevation_requests_user_active_idx
  on public.access_elevation_requests (user_id, elevated_until desc)
  where status = 'approved' and elevated_until is not null;

alter table public.access_elevation_requests enable row level security;
