// Supabase Edge Function: stripeCheckout  (Migration Step 5a)
//
// Faithful port of base44/functions/stripeCheckout. The caller's session is
// verified (getCaller); every action reads the subscription/customer id from
// the caller's OWN profile — never from client input — so a coach can only act
// on their own billing. Privileged billing columns are written via the service
// role scoped to the caller's id (the profiles trigger blocks non-service
// writes to those columns). Secrets come only from env; none are logged.
import Stripe from 'npm:stripe@14.21.0';
import { getCaller, serviceClient, jsonResponse, cors } from '../_shared/edgeClients.js';
import { subscriptionPeriodEnd, renewalDateFromSubscription } from '../_shared/stripePeriod.js';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
    const TIER_PRICES = {
      starter: Deno.env.get('STRIPE_PRICE_STARTER'),
      pro: Deno.env.get('STRIPE_PRICE_PRO'),
      elite: Deno.env.get('STRIPE_PRICE_ELITE'),
      enterprise: Deno.env.get('STRIPE_PRICE_ENTERPRISE'),
      starter_annual: Deno.env.get('STRIPE_PRICE_STARTER_ANNUAL') || Deno.env.get('STRIPE_PRICE_STARTER'),
      pro_annual: Deno.env.get('STRIPE_PRICE_PRO_ANNUAL') || Deno.env.get('STRIPE_PRICE_PRO'),
      elite_annual: Deno.env.get('STRIPE_PRICE_ELITE_ANNUAL') || Deno.env.get('STRIPE_PRICE_ELITE'),
      enterprise_annual: Deno.env.get('STRIPE_PRICE_ENTERPRISE_ANNUAL') || Deno.env.get('STRIPE_PRICE_ENTERPRISE'),
    };

    const caller = await getCaller(req);
    if (!caller) return jsonResponse({ error: 'Unauthorized' }, 401);
    const user = caller.profile;
    const svc = serviceClient();
    // Privileged billing writes to the caller's own profile (trigger-guarded columns).
    const updateSelf = (patch) => svc.from('profiles').update(patch).eq('id', user.id);

    const { action, tier, billing_cycle, success_url, cancel_url } = await req.json();

    // ── Create or retrieve Stripe customer ──────────────────────────────────
    let customerId = user.stripe_customer_id;
    if (!customerId) {
      const existing = await stripe.customers.search({ query: `email:'${user.email}'`, limit: 1 });
      if (existing.data.length > 0) {
        customerId = existing.data[0].id;
      } else {
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.full_name || user.business_name || user.email,
          metadata: { user_id: user.id },
        });
        customerId = customer.id;
      }
      await updateSelf({ stripe_customer_id: customerId });
    }

    if (action === 'portal') {
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: cancel_url || `${req.headers.get('origin')}/subscription`,
      });
      return jsonResponse({ url: session.url });
    }

    if (action === 'cancel') {
      if (!user.stripe_subscription_id) return jsonResponse({ error: 'No active subscription to cancel' }, 400);
      const sub = await stripe.subscriptions.retrieve(user.stripe_subscription_id);
      if (sub.status === 'canceled') return jsonResponse({ error: 'Subscription already canceled' }, 400);
      const updated = await stripe.subscriptions.update(user.stripe_subscription_id, { cancel_at_period_end: true });
      const cancelRenewal = renewalDateFromSubscription(updated);
      await updateSelf({
        subscription_cancel_at_period_end: true,
        ...(cancelRenewal ? { subscription_renewal_date: cancelRenewal } : {}),
      });
      return jsonResponse({ canceled: true, ends_at: subscriptionPeriodEnd(updated) });
    }

    if (action === 'reactivate') {
      if (!user.stripe_subscription_id) return jsonResponse({ error: 'No subscription to reactivate' }, 400);
      const updated = await stripe.subscriptions.update(user.stripe_subscription_id, { cancel_at_period_end: false });
      await updateSelf({ subscription_cancel_at_period_end: false });
      return jsonResponse({ reactivated: true, status: updated.status });
    }

    // ── Checkout / Upgrade ──────────────────────────────────────────────────
    const isAnnual = billing_cycle === 'annual';
    const priceKey = isAnnual ? `${tier}_annual` : tier;
    const priceId = TIER_PRICES[priceKey];
    if (!priceId) {
      return jsonResponse({ error: `No Stripe Price ID configured for "${priceKey}". Set STRIPE_PRICE_${(isAnnual ? `${tier}_annual` : tier).toUpperCase()} in secrets.` }, 400);
    }
    if (priceId.startsWith('prod_')) {
      return jsonResponse({ error: `STRIPE_PRICE_${priceKey.toUpperCase()} is set to a Product ID (prod_...) — it must be a Price ID (price_...).` }, 400);
    }

    // Inline upgrade/downgrade if an active subscription exists (the caller's own).
    if (user.stripe_subscription_id) {
      const sub = await stripe.subscriptions.retrieve(user.stripe_subscription_id);
      if (sub && sub.status !== 'canceled') {
        const updated = await stripe.subscriptions.update(user.stripe_subscription_id, {
          items: [{ id: sub.items.data[0].id, price: priceId }],
          proration_behavior: 'always_invoice',
          metadata: { user_id: user.id, tier },
        });
        const upgradeRenewal = renewalDateFromSubscription(updated);
        await updateSelf({
          subscription_tier: tier,
          billing_cycle: billing_cycle || 'monthly',
          stripe_price_id: priceId,
          billing_status: updated.status,
          ...(upgradeRenewal ? { subscription_renewal_date: upgradeRenewal } : {}),
          subscription_cancel_at_period_end: false,
        });
        return jsonResponse({ upgraded: true, tier });
      }
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: success_url || `${req.headers.get('origin')}/subscription?success=1`,
      cancel_url: cancel_url || `${req.headers.get('origin')}/subscription`,
      subscription_data: {
        metadata: { user_id: user.id, tier },
        trial_period_days: user.had_trial ? undefined : 30,
      },
      allow_promotion_codes: true,
    });
    return jsonResponse({ url: session.url });
  } catch (error) {
    return jsonResponse({ error: (error && error.message) || 'Server error' }, 500);
  }
});
