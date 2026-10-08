#!/usr/bin/env node
/**
 * Payment links (fix pass 1, item 8): generic links (no client_id) work end
 * to end through the REAL stripeClientProxy (Deno) and REAL PostgREST, with
 * Stripe faked by intercepting api.stripe.com so every Stripe call and its
 * metadata are recorded.
 *
 * Proves: a coach (including one with zero clients) creates a generic link:
 * product -> price -> payment link, all tagged coach_user_id, URL returned in
 * the shape the PaymentLinksPanel reads; client-tagged links still verify
 * ownership; portal clients, lapsed coaches and bad amounts are refused; the
 * coach's product list only shows their own products.
 *
 * Usage (fresh database: auth-shim.sql + all migrations):
 *   POSTGRES_URL=postgresql://postgres@127.0.0.1:55432/plinks \
 *   POSTGREST_BIN=/path/to/postgrest DENO_BIN=/path/to/deno \
 *     node scripts/verify-payment-links.mjs
 */
import pg from 'pg';
import { startEdgeHarness, userToken } from './lib/edgeHarness.mjs';

const POSTGRES_URL = process.env.POSTGRES_URL;
if (!POSTGRES_URL) { console.error('Set POSTGRES_URL'); process.exit(1); }
const db = new pg.Client({ connectionString: POSTGRES_URL });
await db.connect();

let failures = 0;
const check = (label, cond, extra = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}${extra ? `  (${extra})` : ''}`);
  if (!cond) failures++;
};

const id = (n) => `91000000-0000-0000-0000-${String(n).padStart(12, '0')}`;
const U = { NEW: id(1), A: id(2), B: id(3), PORTAL: id(4), LAPSED: id(5) };
if ((await db.query('select 1 from auth.users where id=$1', [U.NEW])).rowCount) {
  console.error('verify-payment-links needs a FRESH migrated database.');
  process.exit(1);
}
for (const [k, v] of Object.entries(U)) await db.query('insert into auth.users (id, email) values ($1, $2)', [v, `${k.toLowerCase()}@links.test`]);
await db.query(`update public.profiles set billing_status='active', subscription_tier='pro' where id = any($1)`, [[U.NEW, U.A, U.B]]);
await db.query(`update public.profiles set billing_status='canceled' where id=$1`, [U.LAPSED]);
const one = async (sql, v) => (await db.query(sql, v)).rows[0];
const aClient = (await one(`insert into public.clients (name, email, user_id, created_by, portal_user_id) values ('A1','a1@links.test',$1,$1,$2) returning id`, [U.A, U.PORTAL])).id;
const bClient = (await one(`insert into public.clients (name, email, user_id, created_by) values ('B1','b1@links.test',$1,$1) returning id`, [U.B])).id;
await db.query(`insert into public.clients (name, email, user_id, created_by) values ('L1','l1@links.test',$1,$1)`, [U.LAPSED]);

// ── fake Stripe ─────────────────────────────────────────────────────────────
const calls = [];
const products = [];
let n = 0;
const meta = (form) => Object.fromEntries([...form.entries()].filter(([k]) => k.startsWith('metadata[')).map(([k, v]) => [k.slice(9, -1), v]));
function fakeStripe({ method, path, query, body }) {
  const form = new URLSearchParams(body || '');
  calls.push({ method, path, form: Object.fromEntries(form), meta: meta(form) });
  if (path === '/v1/products' && method === 'POST') {
    const p = { id: `prod_${++n}`, object: 'product', name: form.get('name'), active: true, metadata: meta(form) };
    products.push(p);
    return { status: 200, body: p };
  }
  if (path === '/v1/products' && method === 'GET') return { status: 200, body: { object: 'list', data: products, has_more: false, url: '/v1/products' } };
  if (path === '/v1/prices' && method === 'POST') return { status: 200, body: { id: `price_${++n}`, object: 'price', product: form.get('product'), unit_amount: Number(form.get('unit_amount')) } };
  if (path === '/v1/prices' && method === 'GET') return { status: 200, body: { object: 'list', data: [{ id: 'price_x', product: query.get('product'), unit_amount: 1000 }], has_more: false, url: '/v1/prices' } };
  if (path === '/v1/payment_links' && method === 'POST') {
    const lid = `plink_${++n}`;
    return { status: 200, body: { id: lid, object: 'payment_link', url: `https://buy.stripe.test/${lid}`, metadata: meta(form) } };
  }
  return { status: 400, body: { error: { type: 'invalid_request_error', message: `fake stripe: ${method} ${path}` } } };
}

const h = await startEdgeHarness({
  postgresUrl: POSTGRES_URL,
  functions: ['stripeClientProxy'],
  env: { STRIPE_SECRET_KEY: 'sk_test_harness' },
  intercept: { 'api.stripe.com': fakeStripe },
});
const T = Object.fromEntries(Object.entries(U).map(([k, v]) => [k, userToken(v, `${k.toLowerCase()}@links.test`)]));
const proxy = (who, action, payload) => h.callFunction('stripeClientProxy', { token: T[who], body: { action, payload } });

try {
  calls.length = 0;
  const g = await proxy('NEW', 'createPaymentLink', { name: 'Single coaching call', amount: 75, description: 'One 60-minute call' });
  const prod = calls.find((c) => c.path === '/v1/products' && c.method === 'POST');
  const price = calls.find((c) => c.path === '/v1/prices' && c.method === 'POST');
  const link = calls.find((c) => c.path === '/v1/payment_links');
  check('generic link: a coach with ZERO clients can create one', g.status === 200 && /^https:\/\/buy\.stripe\.test\//.test(g.body.url), `${g.status} ${JSON.stringify(g.body)}`);
  check('generic link: product, price ($75.00 in cents) and link are created in that order',
    !!prod && !!price && !!link && price.form.unit_amount === '7500' && price.form.currency === 'usd' && link.form['line_items[0][price]']?.startsWith('price_'));
  check('generic link: product and link are tagged coach_user_id, no client_id',
    prod?.meta.coach_user_id === U.NEW && !('client_id' in prod.meta) && link?.meta.coach_user_id === U.NEW && !('client_id' in link.meta), JSON.stringify({ p: prod?.meta, l: link?.meta }));
  check('generic link: response has the { url, id } the panel reads', typeof g.body.url === 'string' && typeof g.body.id === 'string');

  const ga = await proxy('A', 'createPaymentLink', { name: 'Check-in add-on', amount: 20 });
  check('generic link: a coach with clients can create one too', ga.status === 200 && !!ga.body.url);
  calls.length = 0;
  const ca = await proxy('A', 'createPaymentLink', { name: 'Package', amount: 300, client_id: aClient });
  check('client link: tagged with the owned client_id', ca.status === 200 && calls.find((c) => c.path === '/v1/payment_links')?.meta.client_id === aClient);
  calls.length = 0;
  const cb = await proxy('A', 'createPaymentLink', { name: 'Package', amount: 300, client_id: bClient });
  check("client link: another coach's client is refused before any Stripe call", cb.status === 403 && calls.length === 0, `${cb.status}`);

  calls.length = 0;
  const portal = await proxy('PORTAL', 'createPaymentLink', { name: 'x', amount: 10 });
  check('portal client: refused, no Stripe call', portal.status === 403 && calls.length === 0, `${portal.status}`);
  const lapsed = await proxy('LAPSED', 'createPaymentLink', { name: 'x', amount: 10 });
  check('lapsed coach: refused (needs an active subscription)', lapsed.status === 403, `${lapsed.status}`);
  for (const [label, payload] of [['zero amount', { name: 'x', amount: 0 }], ['negative amount', { name: 'x', amount: -5 }], ['no name', { amount: 10 }]]) {
    check(`validation: ${label} refused`, (await proxy('NEW', 'createPaymentLink', payload)).status === 400);
  }

  const listed = await proxy('NEW', 'listProducts', {});
  const names = (listed.body.products ?? []).map((p) => p.metadata?.coach_user_id);
  check("listProducts: only the caller's own products", listed.status === 200 && names.length >= 1 && names.every((c) => c === U.NEW), JSON.stringify(names));
} finally {
  await h.stop();
}

console.log(failures ? `\n${failures} FAILURE(S)` : '\nALL CHECKS PASSED');
await db.end();
process.exit(failures ? 1 : 0);
