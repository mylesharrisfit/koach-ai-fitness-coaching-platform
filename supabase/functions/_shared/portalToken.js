/**
 * Portable invite-token + portal-JWT utilities (Migration Step 3b).
 *
 * Uses only Web Crypto + standard globals, so the SAME code runs unmodified
 * in a Supabase Edge Function (Deno) and in the Node verification harness.
 * No secrets are hard-coded — the JWT secret is passed in by the caller.
 *
 * Security contract (SCHEMA_MIGRATION.md, Step 1.5):
 *   - The plaintext invite token exists ONLY inside the emailed /client-setup
 *     link. Everywhere server-side it is immediately sha256-hashed; the hash
 *     is what lands in clients.invite_token_hash and what lookups compare.
 *   - generateInviteToken() is the ONLY place a new token is minted; it
 *     returns { token (plaintext, email only), tokenHash (store this) }.
 *   - hashInviteToken() must produce the exact same lower-case hex sha256 as
 *     the Step 1.5 migration contract, so validate and generate agree.
 */

const enc = new TextEncoder();

function toHex(bytes) {
  return Array.from(new Uint8Array(bytes))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** lower-case hex sha256 — matches invite_token_hash's stored form exactly. */
export async function hashInviteToken(token) {
  const digest = await crypto.subtle.digest('SHA-256', enc.encode(token));
  return toHex(digest);
}

/** Mint a fresh invite token. Plaintext goes in the email link ONLY; the
 *  caller stores tokenHash in clients.invite_token_hash. */
export async function generateInviteToken() {
  const bytes = new Uint8Array(32); // 256 bits
  crypto.getRandomValues(bytes);
  const token = toHex(bytes); // 64 hex chars, same shape as the old system
  const tokenHash = await hashInviteToken(token);
  return { token, tokenHash };
}

// --- base64url helpers (JWT) -----------------------------------------------
function base64url(input) {
  const bytes = typeof input === 'string' ? enc.encode(input) : new Uint8Array(input);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Mint a short-lived portal JWT (HS256), signed with the project's JWT
 * secret so Supabase/PostgREST accepts it and RLS sees the claims.
 *
 * Claims match what app.portal_client_id() reads (top-level portal_client_id)
 * and what PostgREST requires (role, sub, aud, exp, iat). Default TTL 1h,
 * per the Step 1 report's own flagged recommendation (unrevocable → keep short).
 *
 * @returns { access_token, expires_in, expires_at, payload }
 */
export async function mintPortalJwt({ clientId, jwtSecret, now = Math.floor(Date.now() / 1000), ttlSeconds = 3600 }) {
  if (!clientId) throw new Error('mintPortalJwt: clientId required');
  if (!jwtSecret) throw new Error('mintPortalJwt: jwtSecret required');

  const header = { alg: 'HS256', typ: 'JWT' };
  const exp = now + ttlSeconds;
  const payload = {
    // PostgREST / GoTrue standard claims
    role: 'authenticated',
    aud: 'authenticated',
    // `sub` intentionally omitted: a portal token has no auth.users row in the
    // link-based bootstrap path, so auth.uid() stays null and access is granted
    // solely via the portal_client_id claim → app.is_portal_client().
    iat: now,
    exp,
    // custom claim consumed by app.portal_client_id()
    portal_client_id: clientId,
    // marks this as a scoped portal token, not a full user session
    portal: true,
  };

  const signingInput = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(payload))}`;
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(jwtSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(signingInput));
  const access_token = `${signingInput}.${base64url(sig)}`;
  return { access_token, expires_in: ttlSeconds, expires_at: exp, payload };
}

/** Decode a JWT payload without verifying (harness/debug use only). */
export function decodeJwtPayload(jwt) {
  const part = jwt.split('.')[1];
  const b64 = part.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64.padEnd(Math.ceil(b64.length / 4) * 4, '='));
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

/** Is the invite still valid? (null/expired → false) */
export function isTokenLive(expiresIso, now = new Date()) {
  if (!expiresIso) return false;
  return new Date(expiresIso) >= now;
}
