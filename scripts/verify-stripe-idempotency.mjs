#!/usr/bin/env node
/**
 * Step 5a idempotency + payload-shape rehearsal. Replays the webhook's
 * claim-then-process logic against real Postgres to prove a redelivered event
 * is processed exactly once, for BOTH Stripe payload shapes:
 *   - pre-basil: subscription.current_period_end at top level
 *     (what the pinned stripe@14.21.0 SDK returns on its own requests), and
 *   - post-2025-03-31.basil: current_period_end on items.data[] (what a newly
 *     created webhook endpoint delivers for customer.subscription.* events —
 *     validated against the connected test-mode Stripe account + API docs).
 * The "process" step uses the REAL _shared/stripePeriod.js helper the fixed
 * webhook uses, with a real subscription-sync write to profiles, so we can
 * assert it happened exactly once and wrote the right renewal date.
 * (Signature verification itself still needs a deployed endpoint — it can't
 * be exercised from this harness.)
 *
 * Usage: POSTGRES_URL=postgresql://postgres@127.0.0.1:55432/striptest \
 *          node scripts/verify-stripe-idempotency.mjs
 */
import pg from 'pg';
// Return DATE/TIMESTAMP columns as strings (as PostgREST would) — same as the
// other harnesses.
pg.types.setTypeParser(1082, (v) => v);
pg.types.setTypeParser(1184, (v) => v);
pg.types.setTypeParser(1114, (v) => v);
import { readFileSync } from 'node:fs';
import { renewalDateFromSubscription, subscriptionPeriodEnd } from '../supabase/functions/_shared/stripePeriod.js';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const POSTGRES_URL = process.env.POSTGRES_URL;
if (!POSTGRES_URL) { console.error('Set POSTGRES_URL'); process.exit(1); }

const db = new pg.Client({ connectionString: POSTGRES_URL });
await db.connect();

let failures = 0;
const check = (label, cond, extra = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}${extra ? `  (${extra})` : ''}`);
  if (!cond) failures++;
};

// A fixture "checkout.session.completed"-style event carrying a subscription
// whose metadata.user_id names the owner (as Stripe would).
const fixture = JSON.parse(readFileSync(path.join(__dirname, 'fixtures', 'stripe-event.json'), 'utf8'));

// seed a coach profile the event provisions
const userId = fixture.subscription.metadata.user_id;
await db.query('delete from public.processed_stripe_events');
await db.query('delete from public.profiles where id=$1', [userId]);
await db.query('delete from auth.users where id=$1', [userId]);
await db.query(`insert into auth.users (id, email) values ($1,'coach@stripe.io')`, [userId]);
// handle_new_user trigger already created the profile row; normalize its state.
await db.query(
  `update public.profiles set subscription_tier='starter', billing_status='active' where id=$1`,
  [userId],
);

// Mirror of the webhook's process step (syncSubscriptionToUser): idempotent
// state write, but ALSO bump a counter table so we can detect double-processing.
await db.query('create temporary table _process_calls (n int)');
await db.query('insert into _process_calls values (0)');

async function processEvent(sub) {
  await db.query('update _process_calls set n = n + 1');
  // Same resolution as the fixed webhook (_shared/stripePeriod.js): works for
  // pre-basil (top-level) and post-basil (items-level) payload shapes.
  const renewal = renewalDateFromSubscription(sub);
  await db.query(
    `update public.profiles set subscription_tier=$1, billing_status=$2, stripe_subscription_id=$3,
       stripe_customer_id=$4, subscription_renewal_date=coalesce($5, subscription_renewal_date),
       had_trial=true where id=$6`,
    [sub.metadata.tier, sub.status, sub.id, sub.customer, renewal, sub.metadata.user_id],
  );
}

// Exact claim/release control flow from stripeWebhook/index.ts.
async function handleWebhook(event) {
  try {
    await db.query('insert into public.processed_stripe_events (event_id, event_type) values ($1,$2)', [event.id, event.type]);
  } catch (e) {
    if (e.code === '23505') return { received: true, duplicate: true };
    throw e;
  }
  try {
    await processEvent(event.subscription);
    return { received: true };
  } catch (e) {
    await db.query('delete from public.processed_stripe_events where event_id=$1', [event.id]);
    throw e;
  }
}

// ── deliver the SAME event twice (Stripe at-least-once redelivery) ───────────
const r1 = await handleWebhook(fixture);
const r2 = await handleWebhook(fixture);
console.log('delivery #1:', JSON.stringify(r1));
console.log('delivery #2:', JSON.stringify(r2));

check('first delivery processed', r1.received === true && !r1.duplicate);
check('second (redelivered) event skipped as duplicate', r2.duplicate === true);

const calls = (await db.query('select n from _process_calls')).rows[0].n;
check('process step ran EXACTLY once despite two deliveries', calls === 1, `ran ${calls}x`);

const ledger = (await db.query('select count(*)::int n from public.processed_stripe_events where event_id=$1', [fixture.id])).rows[0].n;
check('exactly one ledger row for the event id', ledger === 1);

const prof = (await db.query('select subscription_tier, billing_status, stripe_subscription_id from public.profiles where id=$1', [userId])).rows[0];
check('subscription state provisioned once (tier upgraded)', prof.subscription_tier === fixture.subscription.metadata.tier && prof.stripe_subscription_id === fixture.subscription.id, `${prof.subscription_tier}/${prof.billing_status}`);

// ── payload-shape coverage: pre-basil vs post-basil current_period_end ───────
const basil = JSON.parse(readFileSync(path.join(__dirname, 'fixtures', 'stripe-event-basil.json'), 'utf8'));
check('helper resolves OLD shape (top-level current_period_end)',
  subscriptionPeriodEnd(fixture.subscription) === fixture.subscription.current_period_end);
check('helper resolves NEW basil shape (items-level current_period_end)',
  subscriptionPeriodEnd(basil.subscription) === basil.subscription.items.data[0].current_period_end);
check('helper returns null when absent in both places (no throw)',
  subscriptionPeriodEnd({ id: 'sub_x', items: { data: [{}] } }) === null &&
  renewalDateFromSubscription({ id: 'sub_x' }) === null);

// deliver the basil-shape event twice — must process once and land the renewal date
const b1 = await handleWebhook(basil);
const b2 = await handleWebhook(basil);
check('basil-shape event processes on first delivery', b1.received === true && !b1.duplicate);
check('basil-shape redelivery skipped as duplicate', b2.duplicate === true);
const basilProf = (await db.query('select subscription_tier, subscription_renewal_date from public.profiles where id=$1', [userId])).rows[0];
const expectedDate = new Date(basil.subscription.items.data[0].current_period_end * 1000).toISOString().slice(0, 10);
check('basil-shape event writes the renewal date from the ITEM period end',
  String(basilProf.subscription_renewal_date).slice(0, 10) === expectedDate && basilProf.subscription_tier === 'elite',
  `${basilProf.subscription_renewal_date} / ${basilProf.subscription_tier}`);

// ── failure path: processing throws → claim released → retry succeeds ────────
const evt2 = { ...fixture, id: 'evt_fail_then_ok', subscription: { ...fixture.subscription } };
let threw = false;
const origProcess = processEvent;
// force one failure
async function failingHandle(event, fail) {
  try {
    await db.query('insert into public.processed_stripe_events (event_id, event_type) values ($1,$2)', [event.id, event.type]);
  } catch (e) {
    if (e.code === '23505') return { received: true, duplicate: true };
    throw e;
  }
  try {
    if (fail) throw new Error('simulated downstream failure');
    await origProcess(event.subscription);
    return { received: true };
  } catch (e) {
    await db.query('delete from public.processed_stripe_events where event_id=$1', [event.id]);
    throw e;
  }
}
try { await failingHandle(evt2, true); } catch { threw = true; }
const afterFail = (await db.query('select count(*)::int n from public.processed_stripe_events where event_id=$1', [evt2.id])).rows[0].n;
check('on processing failure the claim is released (Stripe can retry)', threw && afterFail === 0);
const retry = await failingHandle(evt2, false);
check('retry after a released claim processes successfully', retry.received === true && !retry.duplicate);

console.log(failures ? `\n${failures} FAILURE(S)` : '\nALL CHECKS PASSED');
await db.end();
process.exit(failures ? 1 : 0);
