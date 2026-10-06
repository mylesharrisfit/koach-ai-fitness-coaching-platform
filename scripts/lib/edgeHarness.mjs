/**
 * Local end-to-end harness for the Supabase edge functions.
 *
 * Runs the REAL edge function code (Deno) against the REAL schema + RLS
 * (local Postgres with the migrations applied) through REAL PostgREST, using
 * the real supabase-js the functions import. Only GoTrue is faked: a tiny
 * gateway answers `GET /auth/v1/user` by verifying the bearer JWT with the
 * test secret — the same check GoTrue does for an access token.
 *
 *   caller ──► gateway :G ── /rest/v1/*      ──► PostgREST ──► Postgres (RLS)
 *                         ├─ /auth/v1/user    ──► (JWT verify, fake GoTrue)
 *                         └─ /functions/v1/x  ──► Deno router ──► functions/x/index.ts
 *
 * Requirements: a migrated database (scripts/fixtures/auth-shim.sql + all
 * migrations), a `postgrest` binary (v12) and a `deno` binary (v2). Point at
 * them with POSTGREST_BIN / DENO_BIN if they are not on PATH.
 *
 * NOT for production. The JWT secret below is a throwaway test value.
 */
import { spawn } from 'node:child_process';
import { createHmac } from 'node:crypto';
import http from 'node:http';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

export const JWT_SECRET = 'edge-harness-test-secret-at-least-32-characters-long';
const FUNCTIONS_DIR = fileURLToPath(new URL('../../supabase/functions/', import.meta.url));

const b64url = (v) => Buffer.from(typeof v === 'string' ? v : JSON.stringify(v)).toString('base64url');

/** HS256 JWT signed with the harness secret (what GoTrue would issue). */
export function signJwt(claims, ttlSeconds = 3600) {
  const now = Math.floor(Date.now() / 1000);
  const head = b64url({ alg: 'HS256', typ: 'JWT' });
  const body = b64url({ aud: 'authenticated', iat: now, exp: now + ttlSeconds, ...claims });
  const sig = createHmac('sha256', JWT_SECRET).update(`${head}.${body}`).digest('base64url');
  return `${head}.${body}.${sig}`;
}

function verifyJwt(token) {
  const [head, body, sig] = String(token).split('.');
  if (!sig) return null;
  const want = createHmac('sha256', JWT_SECRET).update(`${head}.${body}`).digest('base64url');
  if (want !== sig) return null;
  const claims = JSON.parse(Buffer.from(body, 'base64url').toString());
  if (claims.exp && claims.exp < Date.now() / 1000) return null;
  return claims;
}

export const ANON_KEY = signJwt({ role: 'anon' }, 86400);
export const SERVICE_KEY = signJwt({ role: 'service_role' }, 86400);
/** Access token for a signed-in user (coach, team member or linked portal user). */
export const userToken = (sub, email = `${sub}@harness.test`) => signJwt({ sub, email, role: 'authenticated' });

async function freePort() {
  return new Promise((resolve) => {
    const srv = http.createServer().listen(0, '127.0.0.1', () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });
}

async function waitFor(url, { tries = 100, ok = (r) => r.status < 500 } = {}) {
  for (let i = 0; i < tries; i++) {
    try { if (ok(await fetch(url))) return; } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(`edgeHarness: ${url} did not come up`);
}

// The Deno side: stub Deno.serve so importing a function registers its handler
// instead of binding a port, then serve every function from one router.
const ROUTER_TS = `
const realServe = Deno.serve.bind(Deno);
const handlers = new Map();
let registering = null;
// deno-lint-ignore no-explicit-any
(Deno as any).serve = (a: any, b?: any) => {
  const h = typeof a === 'function' ? a : (b ?? a.handler);
  handlers.set(registering, h);
  return { finished: Promise.resolve(), shutdown: async () => {}, ref() {}, unref() {} };
};
const dir = Deno.env.get('HARNESS_FUNCTIONS_DIR')!;
for (const name of (Deno.env.get('HARNESS_FUNCTIONS') ?? '').split(',').filter(Boolean)) {
  registering = name;
  await import('file://' + dir + name + '/index.ts');
}
realServe({ port: Number(Deno.env.get('HARNESS_PORT')), hostname: '127.0.0.1', onListen() {} }, (req: Request) => {
  const name = new URL(req.url).pathname.split('/').filter(Boolean)[0];
  if (name === '__ready') return new Response('ok');
  const h = handlers.get(name);
  return h ? h(req) : new Response('no such function: ' + name, { status: 404 });
});
`;

/**
 * Start PostgREST + gateway + Deno router for the given functions.
 * Returns { url, callFunction(name, { token, body, method }), rest(path, opts), stop() }.
 */
export async function startEdgeHarness({ postgresUrl, functions = [], env = {} }) {
  const postgrestBin = process.env.POSTGREST_BIN || 'postgrest';
  const denoBin = process.env.DENO_BIN || 'deno';
  const dbUrl = new URL(postgresUrl);

  // Supabase-like roles + defaults the migrations assume.
  const admin = new pg.Client({ connectionString: postgresUrl });
  await admin.connect();
  await admin.query(`
    do $$ begin create role authenticator login noinherit; exception when duplicate_object then null; end $$;
    grant anon, authenticated, service_role to authenticator;
    grant usage on schema public to anon, authenticated, service_role;
    grant all on all tables in schema public to anon, authenticated, service_role;
    grant all on all sequences in schema public to anon, authenticated, service_role;
    create schema if not exists harness;
    grant usage on schema harness to anon, authenticated, service_role;
    -- Real Supabase's auth.uid() also reads the JSON claims; the shim reads the
    -- legacy per-claim setting, so mirror sub into it for every request.
    create or replace function harness.pre_request() returns void language sql as $f$
      select set_config('request.jwt.claim.sub',
        coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub', ''), true);
    $f$;
    grant execute on function harness.pre_request() to anon, authenticated, service_role;
  `);
  await admin.end();

  const [restPort, gwPort, denoPort] = [await freePort(), await freePort(), await freePort()];
  const work = mkdtempSync(join(tmpdir(), 'edge-harness-'));
  const conf = join(work, 'postgrest.conf');
  const authUri = `postgres://authenticator@${dbUrl.hostname}:${dbUrl.port || 5432}${dbUrl.pathname}`;
  writeFileSync(conf, [
    `db-uri = "${authUri}"`,
    'db-schemas = "public"',
    'db-anon-role = "anon"',
    'db-pre-request = "harness.pre_request"',
    `jwt-secret = "${JWT_SECRET}"`,
    `server-port = ${restPort}`,
    'server-host = "127.0.0.1"',
    'log-level = "crit"',
  ].join('\n'));
  const procs = [];
  const postgrest = spawn(postgrestBin, [conf], { stdio: ['ignore', 'ignore', 'inherit'] });
  procs.push(postgrest);
  await waitFor(`http://127.0.0.1:${restPort}/`);

  const routerFile = join(work, 'router.ts');
  writeFileSync(routerFile, ROUTER_TS);
  const gatewayUrl = `http://127.0.0.1:${gwPort}`;
  const deno = spawn(denoBin, ['run', '-A', '--quiet', '--no-lock', `--config=${join(FUNCTIONS_DIR, 'deno.json')}`, routerFile], {
    stdio: ['ignore', 'inherit', 'inherit'],
    env: {
      ...process.env,
      SUPABASE_URL: gatewayUrl,
      SUPABASE_ANON_KEY: ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: SERVICE_KEY,
      SUPABASE_JWT_SECRET: JWT_SECRET,
      APP_URL: 'http://app.harness.test',
      ...env,
      HARNESS_FUNCTIONS_DIR: FUNCTIONS_DIR,
      HARNESS_FUNCTIONS: functions.join(','),
      HARNESS_PORT: String(denoPort),
    },
  });
  procs.push(deno);

  // Gateway: the single SUPABASE_URL the functions and tests talk to.
  const proxy = (req, res, port, path) => {
    const up = http.request({ host: '127.0.0.1', port, path, method: req.method, headers: { ...req.headers, host: `127.0.0.1:${port}` } }, (r) => {
      res.writeHead(r.statusCode, r.headers);
      r.pipe(res);
    });
    up.on('error', (e) => { res.writeHead(502); res.end(String(e)); });
    req.pipe(up);
  };
  const gateway = http.createServer((req, res) => {
    const u = new URL(req.url, gatewayUrl);
    if (u.pathname.startsWith('/rest/v1')) return proxy(req, res, restPort, req.url.slice('/rest/v1'.length) || '/');
    if (u.pathname.startsWith('/functions/v1/')) return proxy(req, res, denoPort, req.url.slice('/functions/v1'.length));
    if (u.pathname === '/auth/v1/user') {
      const claims = verifyJwt((req.headers.authorization || '').replace(/^Bearer\s+/i, ''));
      if (!claims?.sub) { res.writeHead(401, { 'content-type': 'application/json' }); return res.end('{"msg":"invalid JWT"}'); }
      res.writeHead(200, { 'content-type': 'application/json' });
      return res.end(JSON.stringify({ id: claims.sub, aud: 'authenticated', role: 'authenticated', email: claims.email, user_metadata: {}, app_metadata: {} }));
    }
    res.writeHead(404); res.end();
  });
  await new Promise((r) => gateway.listen(gwPort, '127.0.0.1', r));
  await waitFor(`http://127.0.0.1:${denoPort}/__ready`, { tries: 1200, ok: (r) => r.ok });

  return {
    url: gatewayUrl,
    /** POST a JSON body to an edge function as `token` (a user token, ANON_KEY or SERVICE_KEY). */
    async callFunction(name, { token, body = {}, method = 'POST' } = {}) {
      const r = await fetch(`${gatewayUrl}/functions/v1/${name}`, {
        method,
        headers: { 'content-type': 'application/json', apikey: ANON_KEY, ...(token ? { authorization: `Bearer ${token}` } : {}) },
        body: method === 'GET' ? undefined : JSON.stringify(body),
      });
      const text = await r.text();
      let json = null;
      try { json = JSON.parse(text); } catch { /* non-JSON body */ }
      return { status: r.status, body: json ?? text };
    },
    /** Raw PostgREST call through the gateway, e.g. rest('/clients?select=id', { token }). */
    async rest(path, { token, method = 'GET', body, headers = {} } = {}) {
      const r = await fetch(`${gatewayUrl}/rest/v1${path}`, {
        method,
        headers: { 'content-type': 'application/json', apikey: ANON_KEY, authorization: `Bearer ${token ?? ANON_KEY}`, ...headers },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      const text = await r.text();
      let json = null;
      try { json = JSON.parse(text); } catch { /* empty body */ }
      return { status: r.status, body: json ?? text };
    },
    async stop() {
      await new Promise((r) => gateway.close(r));
      for (const p of procs) p.kill('SIGTERM');
    },
  };
}
