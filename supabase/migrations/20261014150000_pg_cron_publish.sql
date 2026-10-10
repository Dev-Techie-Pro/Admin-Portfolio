-- Optional: run scheduled blog publish in Postgres (reduces reliance on Vercel cron frequency).
-- Requires pg_cron extension (Supabase: Database → Extensions).

do $cron$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule(jobid)
    from cron.job
    where jobname = 'pa_publish_scheduled_blog_posts';

    perform cron.schedule(
      'pa_publish_scheduled_blog_posts',
      '*/10 * * * *',
      $$
      update public.blog_posts
      set status = 'Published'
      where status = 'Draft'
        and published_at is not null
        and published_at <= now()
        and deleted_at is null;
      $$
    );
  end if;
exception
  when undefined_table or undefined_function then
    null;
end;
$cron$;
