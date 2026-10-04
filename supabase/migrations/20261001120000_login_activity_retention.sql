-- Retention for login_activity (Settings → Security recent login feed).

create or replace function public.pa_prune_login_activity(p_keep_days int default 90)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted bigint;
begin
  delete from public.login_activity
  where created_at < timezone('utc', now()) - make_interval(days => p_keep_days);
  get diagnostics deleted = row_count;
  return deleted;
end;
$$;

comment on function public.pa_prune_login_activity(int) is
  'Deletes login_activity rows older than p_keep_days. Used by app cron and optional pg_cron.';

create or replace function public.pa_prune_login_activity_user_cap(p_max_per_user int default 100)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted bigint;
begin
  delete from public.login_activity la
  using (
    select id
    from (
      select
        id,
        row_number() over (
          partition by user_id
          order by created_at desc
        ) as rn
      from public.login_activity
    ) ranked
    where ranked.rn > p_max_per_user
  ) excess
  where la.id = excess.id;
  get diagnostics deleted = row_count;
  return deleted;
end;
$$;

comment on function public.pa_prune_login_activity_user_cap(int) is
  'Keeps at most p_max_per_user login_activity rows per user (newest first).';

revoke all on function public.pa_prune_login_activity(int) from public;
revoke all on function public.pa_prune_login_activity_user_cap(int) from public;
grant execute on function public.pa_prune_login_activity(int) to service_role;
grant execute on function public.pa_prune_login_activity_user_cap(int) to service_role;

-- Schedule daily cleanup when pg_cron is available.
do $schedule$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule(jobid)
    from cron.job
    where jobname = 'prune-login-activity';

    perform cron.schedule(
      'prune-login-activity',
      '15 3 * * *',
      $$select public.pa_prune_login_activity(90); select public.pa_prune_login_activity_user_cap(100);$$
    );
  end if;
end;
$schedule$;
