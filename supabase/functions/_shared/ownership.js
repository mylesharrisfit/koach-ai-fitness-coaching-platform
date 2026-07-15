/**
 * Ownership checks (Step 5d: split out of edgeClients.js so modules that need
 * them — assistantTools, entity handlers, rehearsal harnesses — don't drag in
 * the jsr: supabase-js import, which only resolves under Deno).
 */

/**
 * Verify a client row belongs to the caller (owning coach). Base44 checked
 * Client.created_by_id === user.id; the ported schema's owning-coach field is
 * clients.user_id (created_by is the creator) — accept either, via service role.
 * Returns the client row or null.
 */
export async function ownsClient(svc, userId, clientId) {
  if (!clientId) return null;
  const { data: client } = await svc.from('clients').select('*').eq('id', clientId).maybeSingle();
  if (!client) return null;
  if (client.user_id !== userId && client.created_by !== userId) return null;
  return client;
}
