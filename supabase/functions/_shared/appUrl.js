/**
 * Single source of truth for the app's base URL.
 *
 * Previously six Edge Functions each hardcoded their own APP_URL fallback and
 * they disagreed — the correct koachai.net alongside two stale domains. That
 * drift is exactly how a wrong domain silently ships in a payment-failure
 * email. Everything now reads the base URL through this one helper, so there is
 * one fallback value defined in one place.
 *
 * In production the APP_URL secret is set explicitly (see AUTOMATION_MIGRATION.md
 * Step 7 — `supabase secrets set APP_URL=https://app.koachai.net`); the fallback
 * exists only to keep local/rehearsal runs working when the secret is unset.
 */

/** Base URL for the app: the APP_URL env var, or the single koachai.net fallback. */
export function getAppUrl() {
  return Deno.env.get('APP_URL') || 'https://koachai.net';
}
