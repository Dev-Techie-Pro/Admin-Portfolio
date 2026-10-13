-- Optional: frequent publish-webhook retries without Vercel sub-daily cron (Hobby-friendly).
-- Requires: pg_cron, pg_net (enable in Dashboard → Database → Extensions).
-- Configure credentials via private.pa_cron_invoke_config (SQL Editor) OR Vault secrets (see supabase/README.md).

create schema if not exists private;

create table if not exists private.pa_cron_invoke_config (
  id smallint primary key default 1 check (id = 1),
  base_url text not null,
  bearer_secret text not null,
  updated_at timestamptz not null default now()
);

comment on table private.pa_cron_invoke_config is
  'Singleton row: admin base URL + CRON_SECRET for pg_net cron HTTP invoke. Not exposed via API.';

revoke all on schema private from public, anon, authenticated;
revoke all on private.pa_cron_invoke_config from public, anon, authenticated;

create or replace function public.pa_cron_deliver_webhooks()
returns void
language plpgsql
security definer
set search_path = public, private, pg_catalog
as $fn$
declare
  base_url text;
  cron_secret text;
  target_url text;
begin
  if not exists (select 1 from pg_extension where extname = 'pg_net') then
    return;
  end if;

  begin
    select ds.decrypted_secret into base_url
    from vault.decrypted_secrets ds
    where ds.name = 'portfolio_admin_url'
    limit 1;

    select ds.decrypted_secret into cron_secret
    from vault.decrypted_secrets ds
    where ds.name = 'portfolio_cron_secret'
    limit 1;
  exception
    when undefined_table or invalid_schema_name or undefined_object then
      base_url := null;
      cron_secret := null;
  end;

  if base_url is null or cron_secret is null then
    select c.base_url, c.bearer_secret
    into base_url, cron_secret
    from private.pa_cron_invoke_config c
    where c.id = 1;
  end if;

  if base_url is null or cron_secret is null then
    return;
  end if;

  base_url := trim(both from base_url);
  cron_secret := trim(both from cron_secret);
  if base_url = '' or cron_secret = '' then
    return;
  end if;

  target_url := rtrim(base_url, '/') || '/api/cron/deliver-webhooks';

  perform net.http_get(
    url := target_url,
    headers := jsonb_build_object('Authorization', 'Bearer ' || cron_secret),
    timeout_milliseconds := 20000
  );
end;
$fn$;

revoke all on function public.pa_cron_deliver_webhooks() from public;
revoke all on function public.pa_cron_deliver_webhooks() from anon, authenticated;

comment on function public.pa_cron_deliver_webhooks() is
  'Invokes GET /api/cron/deliver-webhooks via pg_net. Set private.pa_cron_invoke_config or Vault secrets portfolio_admin_url + portfolio_cron_secret.';

do $cron$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule(jobid)
    from cron.job
    where jobname = 'pa_deliver_publish_webhooks';

    perform cron.schedule(
      'pa_deliver_publish_webhooks',
      '*/15 * * * *',
      $$select public.pa_cron_deliver_webhooks();$$
    );
  end if;
exception
  when undefined_table or undefined_function then
    null;
end;
$cron$;
