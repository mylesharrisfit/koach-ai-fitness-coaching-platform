/**
 * Auth provider feature flag (Migration Step 3a).
 *
 * 'supabase' — real Supabase Auth session (login/signup pages in this repo).
 *              This is the DEFAULT and the live path: the data layer (272
 *              modules) always talks to the Supabase facade, so auth must too.
 * 'base44'   — legacy hosted-redirect auth. DEPRECATED and retained only as an
 *              explicit opt-out. It is a broken hybrid post-migration: it
 *              redirects to `${VITE_BASE44_APP_BASE_URL}/login` (the retired
 *              Base44 hosted app — or `undefined/login` when that var is unset)
 *              while data still comes from Supabase, so sign-in cannot complete.
 *
 * The default was 'base44'; leaving VITE_AUTH_PROVIDER unset therefore sent
 * users to the dead Base44 login. It now defaults to 'supabase'; set
 * VITE_AUTH_PROVIDER=base44 explicitly only if you truly need the legacy path.
 * Auth is app-wide (one session for the whole shell) — see
 * src/api/base44Client.js, which delegates `.auth` accordingly.
 */
export const AUTH_PROVIDER =
  (import.meta.env?.VITE_AUTH_PROVIDER || 'supabase').toLowerCase() === 'base44'
    ? 'base44'
    : 'supabase';

export const isSupabaseAuth = () => AUTH_PROVIDER === 'supabase';
