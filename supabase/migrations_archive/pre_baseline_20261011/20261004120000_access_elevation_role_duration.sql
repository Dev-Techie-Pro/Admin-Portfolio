-- Temporary profile role change on approve (viewer → editor until elevated_until)

comment on table public.access_elevation_requests is
  'Staff access requests; on approve sets profiles.role to editor until elevated_until, then lazy revert.';

alter table public.access_elevation_requests
  add column if not exists role_before_elevation text,
  add column if not exists duration_hours integer,
  add column if not exists role_restored_at timestamptz;
