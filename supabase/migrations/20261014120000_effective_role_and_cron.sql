-- Effective role (elevation-aware) for RLS + scheduled elevation revert

-- DEFAULT cannot use a subquery; NULL means "current user" via auth.uid() inside the body.
create or replace function public.effective_role(p_user_id uuid default null)
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select 'editor'::public.app_role
      from public.access_elevation_requests aer
      where aer.user_id = coalesce(p_user_id, auth.uid())
        and aer.status = 'approved'
        and aer.elevated_until is not null
        and aer.elevated_until > now()
      order by aer.elevated_until desc
      limit 1
    ),
    (
      select p.role
      from public.profiles p
      where p.id = coalesce(p_user_id, auth.uid())
    )
  );
$$;

create or replace function public.get_user_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select public.effective_role((select auth.uid()));
$$;

create or replace function public.is_authenticated_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.effective_role((select auth.uid())) in ('super_admin', 'admin', 'editor');
$$;

create or replace function public.is_authenticated_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.effective_role((select auth.uid())) in ('super_admin', 'admin');
$$;

-- Revert expired temporary editor elevations (profiles.role + mark restored)
create or replace function public.pa_revert_expired_elevations()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer := 0;
  rec record;
begin
  for rec in
    select aer.id, aer.user_id, aer.role_before_elevation
    from public.access_elevation_requests aer
    where aer.status = 'approved'
      and aer.role_before_elevation is not null
      and aer.role_restored_at is null
      and aer.elevated_until is not null
      and aer.elevated_until <= now()
  loop
    update public.profiles p
    set role = rec.role_before_elevation
    where p.id = rec.user_id
      and rec.role_before_elevation = 'viewer'
      and p.role = 'editor';

    update public.access_elevation_requests
    set role_restored_at = now()
    where id = rec.id;

    n := n + 1;
  end loop;
  return n;
end;
$$;

-- pg_cron (enable in Supabase dashboard if not already)
do $cron$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule(jobid)
    from cron.job
    where jobname = 'pa_revert_expired_elevations';

    perform cron.schedule(
      'pa_revert_expired_elevations',
      '*/15 * * * *',
      $$select public.pa_revert_expired_elevations();$$
    );
  end if;
exception
  when undefined_table or undefined_function then
    null;
end;
$cron$;
