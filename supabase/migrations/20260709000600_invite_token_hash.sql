-- ============================================================================
-- Migration 6 (Step 1.5, Fix 1) — store a hash of the client invite token,
-- never the plaintext.
--
-- Approach: RENAME rather than add-a-new-column. No data has been migrated
-- yet (Step 1 was schema-only), so there are no plaintext tokens to
-- preserve or backfill, and a rename avoids carrying a dead plaintext
-- column through the rest of the migration series. Reversal is the mirror
-- rename.
--
-- Column contract (binds the Step 4/5 function re-platform):
--   * invite_token_hash stores lower-case hex sha256 of the raw token:
--       encode(digest(<raw token>, 'sha256'), 'hex')   -- 64 hex chars
--   * sendClientInvite (re-platformed): generate the 32-byte random token,
--     email the PLAINTEXT token in the /client-setup/<token> link, store
--     ONLY sha256(token) here.
--   * validateInviteToken (re-platformed): hash the incoming token with
--     sha256 BEFORE the service-role lookup against invite_token_hash,
--     then check invite_token_expires. The plaintext token must never be
--     compared, stored, or logged server-side.
--   * No RLS policy reads this column (verified); portal access only ever
--     routes through app.is_portal_client(). The column stays reachable by
--     the service role alone for the exchange lookup.
-- ============================================================================

alter table public.clients rename column invite_token to invite_token_hash;

-- keep the constraint name in sync with the column
alter table public.clients
  rename constraint clients_invite_token_key to clients_invite_token_hash_key;

comment on column public.clients.invite_token_hash is
  'sha256 hex digest of the portal invite token. Plaintext token exists only in the emailed invite link; the Step 4/5 token-exchange function hashes incoming tokens before comparing. Never read by RLS policies.';
