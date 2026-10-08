-- Local-rehearsal shim for the parts of Supabase Storage's `storage` schema the
-- migrations use (buckets, objects, storage.foldername). With it in place the
-- storage migrations install their REAL RLS policies on storage.objects, so a
-- harness can check upload access by querying storage.objects as the
-- `authenticated` role — which is how the Storage API enforces them.
-- NOT for production: Supabase provides the real schema.
create schema if not exists storage;

create table if not exists storage.buckets (
  id text primary key,
  name text not null,
  owner uuid,
  public boolean default false,
  file_size_limit bigint,
  allowed_mime_types text[],
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists storage.objects (
  id uuid primary key default gen_random_uuid(),
  bucket_id text references storage.buckets (id),
  name text,
  owner uuid,
  metadata jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table storage.objects enable row level security;

-- Same semantics as Supabase's storage.foldername(): the path's folder parts.
create or replace function storage.foldername(name text)
returns text[] language plpgsql immutable as $$
declare _parts text[];
begin
  select string_to_array(name, '/') into _parts;
  return _parts[1:array_length(_parts, 1) - 1];
end $$;

grant usage on schema storage to anon, authenticated, service_role;
grant all on storage.buckets, storage.objects to anon, authenticated, service_role;
grant execute on function storage.foldername(text) to anon, authenticated, service_role;
