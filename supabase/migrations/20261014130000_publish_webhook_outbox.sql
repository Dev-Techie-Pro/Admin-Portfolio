create table if not exists public.publish_webhook_outbox (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  payload jsonb not null,
  attempts int not null default 0,
  next_attempt_at timestamptz not null default now(),
  last_error text,
  delivered_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists publish_webhook_outbox_pending_idx
  on public.publish_webhook_outbox (next_attempt_at)
  where delivered_at is null;

alter table public.publish_webhook_outbox enable row level security;

create policy "Service role manages webhook outbox"
  on public.publish_webhook_outbox
  for all
  using (false)
  with check (false);
