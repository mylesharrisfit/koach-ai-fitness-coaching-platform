-- Step 7 (frontend cutover): Storage bucket for user uploads.
--
-- Base44's `integrations.Core.UploadFile` is replaced by a Supabase Storage
-- upload in src/api/supabaseClient.js (the `uploads` bucket). This migration
-- provisions that bucket and its RLS policies on the real Supabase project.
--
-- Guarded on the `storage` schema so the local rehearsal Postgres (which has no
-- Supabase Storage stack) applies this as a no-op, exactly like the pg_cron /
-- pg_net degradation used by the automation/entity-event migrations.
do $$
begin
  if exists (select 1 from information_schema.schemata where schema_name = 'storage') then
    -- Public bucket: objects are served via getPublicUrl(); reads are public,
    -- writes require an authenticated session (coach OR portal client).
    insert into storage.buckets (id, name, public)
      values ('uploads', 'uploads', true)
      on conflict (id) do nothing;

    -- Any authenticated user (coach session or portal-client JWT) may upload.
    if not exists (
      select 1 from pg_policies
      where schemaname = 'storage' and tablename = 'objects'
        and policyname = 'uploads_insert_authenticated'
    ) then
      execute $p$
        create policy uploads_insert_authenticated on storage.objects
          for insert to authenticated
          with check (bucket_id = 'uploads')
      $p$;
    end if;

    -- Public read (the bucket is public; avatars/photos/media are shown in-app).
    if not exists (
      select 1 from pg_policies
      where schemaname = 'storage' and tablename = 'objects'
        and policyname = 'uploads_read_public'
    ) then
      execute $p$
        create policy uploads_read_public on storage.objects
          for select
          using (bucket_id = 'uploads')
      $p$;
    end if;

    -- Uploaders may update/delete only their own objects.
    if not exists (
      select 1 from pg_policies
      where schemaname = 'storage' and tablename = 'objects'
        and policyname = 'uploads_modify_own'
    ) then
      execute $p$
        create policy uploads_modify_own on storage.objects
          for update to authenticated
          using (bucket_id = 'uploads' and owner = auth.uid())
      $p$;
    end if;
    if not exists (
      select 1 from pg_policies
      where schemaname = 'storage' and tablename = 'objects'
        and policyname = 'uploads_delete_own'
    ) then
      execute $p$
        create policy uploads_delete_own on storage.objects
          for delete to authenticated
          using (bucket_id = 'uploads' and owner = auth.uid())
      $p$;
    end if;
  end if;
end $$;
