/**
 * Resolve the `clients` row for a logged-in portal user.
 *
 * A portal login's auth id is stored on `clients.portal_user_id` (set by the
 * setupPortalAccount edge function), and RLS scopes a portal user to exactly
 * that row — so `portal_user_id` is the canonical, robust key. We fall back to
 * matching `email` for any legacy row created before portal linking.
 *
 * This replaces a per-page mix of lookups that had drifted out of sync:
 *   - `{ email: user.email }`  — fragile: breaks if the client's email differs
 *     from their auth email.
 *   - `{ user_id: user.id }`   — outright wrong: `clients.user_id` is the OWNING
 *     COACH, never the portal user, so those pages resolved no client at all.
 *
 * The caller passes its OWN entities client (`supabasePortal` on portal pages,
 * `supabase` on the coach app) so the request keeps that page's auth session.
 * Returns an array of 0 or 1 clients so it stays drop-in with the existing
 * `const myClient = clients[0]` call sites.
 *
 * @param {{ entities: { Client: { filter: Function } } }} client  The page's base44/supabase facade.
 * @param {{ id?: string, email?: string }} user  The result of auth `me()`.
 * @returns {Promise<object[]>}
 */
export async function resolvePortalClient(client, user) {
  if (!client || !user?.id) return [];
  const byPortal = await client.entities.Client.filter({ portal_user_id: user.id }, '-created_date', 1);
  if (byPortal?.length) return byPortal;
  if (user?.email) {
    const byEmail = await client.entities.Client.filter({ email: user.email }, '-created_date', 1);
    if (byEmail?.length) return byEmail;
  }
  return [];
}
