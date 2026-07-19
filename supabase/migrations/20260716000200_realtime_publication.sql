-- Step 7 follow-up: enable Supabase Realtime for the tables the frontend
-- subscribes to via the facade's entity.subscribe() (now a real
-- postgres_changes subscription, previously a no-op stub).
--
-- Call sites (grep "\.subscribe(" in src/): notifications, check_ins, messages,
-- clients, leads, community_posts, food_logs.
--
-- Realtime respects RLS, so each subscriber only receives rows their existing
-- SELECT policies already expose. Guarded on the `supabase_realtime`
-- publication (present on real Supabase projects, absent on the local rehearsal
-- Postgres) so this applies as a no-op locally — same degradation pattern as
-- the pg_cron/pg_net and storage migrations.
do $$
declare
  t text;
  wanted text[] := array[
    'notifications', 'check_ins', 'messages', 'clients',
    'leads', 'community_posts', 'food_logs'
  ];
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    return;  -- local rehearsal: no Realtime stack, nothing to do
  end if;

  foreach t in array wanted loop
    if to_regclass('public.' || t) is not null
       and not exists (
         select 1 from pg_publication_tables
         where pubname = 'supabase_realtime'
           and schemaname = 'public'
           and tablename = t
       ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
