-- Email opt-outs (fix pass 1, item 6).
--
-- The /unsubscribe page only acknowledged requests; nothing was recorded or
-- honored. supabase/functions/unsubscribe now writes the recipient's address
-- here from a signed link (or a mailbox provider's RFC 8058 one-click POST),
-- and _shared/resendEmail.js skips non-transactional mail (check-in
-- reminders, weekly digest, welcome) to suppressed addresses.
--
-- Addresses are stored normalized (trimmed, lower-case). Service-role only:
-- RLS on with no policies, no grants to browser roles.

create table if not exists public.email_suppressions (
  email      text primary key check (email = lower(btrim(email)) and email like '%@%'),
  source     text not null default 'link' check (source in ('link', 'one_click', 'admin')),
  created_at timestamptz not null default now()
);

alter table public.email_suppressions enable row level security;
revoke all on public.email_suppressions from public, anon, authenticated;
grant all on public.email_suppressions to service_role;
