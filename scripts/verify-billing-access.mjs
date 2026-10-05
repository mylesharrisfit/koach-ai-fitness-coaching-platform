#!/usr/bin/env node
/**
 * Pure checks for the Stripe production billing rules (no DB / network):
 *  - access rules (comped, admin, trialing/active, past_due grace, 14-day trial, denials)
 *  - frontend and edge copies of billingAccess.js contain identical code
 *  - lookup-key plan mapping, status mapping, and origin pinning of Stripe URLs
 *
 * Usage: node scripts/verify-billing-access.mjs
 */
import { readFileSync } from 'node:fs';
import { billingAccess, effectiveTier, PAST_DUE_GRACE_MS } from '../supabase/functions/_shared/billingAccess.js';
import {
  lookupKeyFor, planFromLookupKey, planFromPrice, billingStatusFromStripe, appUrl, APP_ORIGIN,
} from '../supabase/functions/_shared/stripePlans.js';

let failures = 0;
const check = (label, cond, extra = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}${extra ? `  (${extra})` : ''}`);
  if (!cond) failures++;
};

const now = new Date('2026-10-10T12:00:00Z');
const day = 24 * 60 * 60 * 1000;
const at = (ms) => new Date(now.getTime() + ms).toISOString();

// --- access rules ---------------------------------------------------------
check('new account (status none, no trial) has NO access', !billingAccess({ billing_status: 'none' }, now).hasAccess);
check('empty profile has NO access', !billingAccess({}, now).hasAccess);
check('comped has access with no subscription', billingAccess({ is_comped: true, billing_status: 'none' }, now).hasAccess);
check('admin role has access', billingAccess({ role: 'admin', billing_status: 'none' }, now).hasAccess);
check('trialing has access', billingAccess({ billing_status: 'trialing' }, now).hasAccess);
check('active has access', billingAccess({ billing_status: 'active' }, now).hasAccess);
check('migration trial running has access', billingAccess({ billing_status: 'none', trial_ends_at: at(5 * day) }, now).reason === 'trial');
check('migration trial expired has NO access', !billingAccess({ billing_status: 'none', trial_ends_at: at(-1) }, now).hasAccess);
check('past_due inside 3-day grace has access', billingAccess({ billing_status: 'past_due', past_due_since: at(-2 * day) }, now).reason === 'grace');
check('past_due after 3 days has NO access', !billingAccess({ billing_status: 'past_due', past_due_since: at(-(PAST_DUE_GRACE_MS + 1000)) }, now).hasAccess);
check('past_due with no past_due_since has NO access', !billingAccess({ billing_status: 'past_due' }, now).hasAccess);
for (const st of ['canceled', 'unpaid', 'incomplete']) {
  check(`${st} has NO access (even with an old trial date)`, !billingAccess({ billing_status: st, trial_ends_at: at(5 * day) }, now).hasAccess);
}

check('comped/admin get enterprise limits', effectiveTier({ is_comped: true, subscription_tier: 'starter' }) === 'enterprise' && effectiveTier({ role: 'admin' }) === 'enterprise');
check('everyone else follows the stored plan', effectiveTier({ subscription_tier: 'pro' }) === 'pro' && effectiveTier({}) === 'starter');

// --- frontend copy == edge copy (code after the header comment) -----------
const body = (f) => readFileSync(f, 'utf8').split('*/').slice(1).join('*/').trim();
check('src/lib/billingAccess.js matches edge _shared copy',
  body('src/lib/billingAccess.js') === body('supabase/functions/_shared/billingAccess.js'));

// --- plan mapping by lookup key -------------------------------------------
check('lookup key monthly', lookupKeyFor('pro', 'monthly') === 'koach_pro_monthly');
check('lookup key annual -> yearly', lookupKeyFor('elite', 'annual') === 'koach_elite_yearly');
check('lookup key yearly', lookupKeyFor('starter', 'yearly') === 'koach_starter_yearly');
check('map koach_enterprise_yearly', JSON.stringify(planFromLookupKey('koach_enterprise_yearly')) === '{"plan":"enterprise","interval":"annual"}');
check('map koach_starter_monthly', JSON.stringify(planFromLookupKey('koach_starter_monthly')) === '{"plan":"starter","interval":"monthly"}');
check('unknown lookup key -> null', planFromLookupKey('other_thing') === null && planFromLookupKey(null) === null);
check('price without lookup key falls back to recurring interval',
  JSON.stringify(planFromPrice({ recurring: { interval: 'year' } })) === '{"plan":null,"interval":"annual"}');
check('status mapping', billingStatusFromStripe('trialing') === 'trialing'
  && billingStatusFromStripe('past_due') === 'past_due'
  && billingStatusFromStripe('canceled') === 'canceled'
  && billingStatusFromStripe('incomplete_expired') === 'canceled');

// --- Stripe return URLs are pinned to app.koachai.net ----------------------
check('origin constant', APP_ORIGIN === 'https://app.koachai.net');
check('localhost origin discarded', appUrl('http://localhost:5173/subscription?success=1', '/x') === 'https://app.koachai.net/subscription?success=1');
check('marketing origin discarded', appUrl('https://koachai.net/pricing', '/x') === 'https://app.koachai.net/pricing');
check('relative path kept', appUrl('/?checkout=success', '/x') === 'https://app.koachai.net/?checkout=success');
check('protocol-relative tricks stay on app origin', appUrl('//evil.example/x', '/subscription').startsWith('https://app.koachai.net/'));
check('missing -> fallback', appUrl(undefined, '/subscription') === 'https://app.koachai.net/subscription');

console.log(failures ? `\n${failures} FAILED` : '\nall passed');
process.exit(failures ? 1 : 0);
