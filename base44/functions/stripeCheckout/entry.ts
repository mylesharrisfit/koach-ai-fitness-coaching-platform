import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@14.21.0';

Deno.serve(async (req) => {
  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

    // Map tier+billing to Stripe Price IDs.
    // Set these env vars in your dashboard:
    //   STRIPE_PRICE_STARTER, STRIPE_PRICE_PRO, STRIPE_PRICE_ELITE, STRIPE_PRICE_ENTERPRISE  (monthly)
    //   STRIPE_PRICE_STARTER_ANNUAL, STRIPE_PRICE_PRO_ANNUAL, STRIPE_PRICE_ELITE_ANNUAL, STRIPE_PRICE_ENTERPRISE_ANNUAL  (annual)
    const TIER_PRICES = {
      starter:            Deno.env.get('STRIPE_PRICE_STARTER'),
      pro:                Deno.env.get('STRIPE_PRICE_PRO'),
      elite:              Deno.env.get('STRIPE_PRICE_ELITE'),
      enterprise:         Deno.env.get('STRIPE_PRICE_ENTERPRISE'),
      starter_annual:     Deno.env.get('STRIPE_PRICE_STARTER_ANNUAL') || Deno.env.get('STRIPE_PRICE_STARTER'),
      pro_annual:         Deno.env.get('STRIPE_PRICE_PRO_ANNUAL')     || Deno.env.get('STRIPE_PRICE_PRO'),
      elite_annual:       Deno.env.get('STRIPE_PRICE_ELITE_ANNUAL')   || Deno.env.get('STRIPE_PRICE_ELITE'),
      enterprise_annual:  Deno.env.get('STRIPE_PRICE_ENTERPRISE_ANNUAL') || Deno.env.get('STRIPE_PRICE_ENTERPRISE'),
    };

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { action, tier, billing_cycle, success_url, cancel_url } = await req.json();

    // ── Create or retrieve Stripe customer ─────────────────────────────────────
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
      await base44.auth.updateMe({ stripe_customer_id: customerId });
    }

    // ── Billing Portal ─────────────────────────────────────────────────────────
    if (action === 'portal') {
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: cancel_url || `${req.headers.get('origin')}/subscription`,
      });
      return Response.json({ url: session.url });
    }

    // ── Cancel subscription ────────────────────────────────────────────────────
    if (action === 'cancel') {
      if (!user.stripe_subscription_id) {
        return Response.json({ error: 'No active subscription to cancel' }, { status: 400 });
      }
      const sub = await stripe.subscriptions.retrieve(user.stripe_subscription_id);
      if (sub.status === 'canceled') {
        return Response.json({ error: 'Subscription already canceled' }, { status: 400 });
      }
      const updated = await stripe.subscriptions.update(user.stripe_subscription_id, {
        cancel_at_period_end: true,
      });
      await base44.auth.updateMe({
        subscription_cancel_at_period_end: true,
        subscription_renewal_date: new Date(updated.current_period_end * 1000).toISOString().split('T')[0],
      });
      return Response.json({ canceled: true, ends_at: updated.current_period_end });
    }

    // ── Reactivate subscription ────────────────────────────────────────────────
    if (action === 'reactivate') {
      if (!user.stripe_subscription_id) {
        return Response.json({ error: 'No subscription to reactivate' }, { status: 400 });
      }
      const updated = await stripe.subscriptions.update(user.stripe_subscription_id, {
        cancel_at_period_end: false,
      });
      await base44.auth.updateMe({ subscription_cancel_at_period_end: false });
      return Response.json({ reactivated: true, status: updated.status });
    }

    // ── Checkout / Upgrade ─────────────────────────────────────────────────────
    const isAnnual = billing_cycle === 'annual';
    const priceKey = isAnnual ? `${tier}_annual` : tier;
    const priceId = TIER_PRICES[priceKey];

    if (!priceId) {
      return Response.json(
        { error: `No Stripe Price ID configured for "${priceKey}". Set STRIPE_PRICE_${(isAnnual ? `${tier}_annual` : tier).toUpperCase()} in secrets.` },
        { status: 400 }
      );
    }
    if (priceId.startsWith('prod_')) {
      return Response.json(
        { error: `STRIPE_PRICE_${priceKey.toUpperCase()} is set to a Product ID (prod_...) — it must be a Price ID (price_...).` },
        { status: 400 }
      );
    }

    // If already has an active subscription, inline upgrade/downgrade
    if (user.stripe_subscription_id) {
      const sub = await stripe.subscriptions.retrieve(user.stripe_subscription_id);
      if (sub && sub.status !== 'canceled') {
        const updated = await stripe.subscriptions.update(user.stripe_subscription_id, {
          items: [{ id: sub.items.data[0].id, price: priceId }],
          proration_behavior: 'always_invoice',
          metadata: { user_id: user.id, tier },
        });
        await base44.auth.updateMe({
          subscription_tier: tier,
          billing_cycle: billing_cycle || 'monthly',
          stripe_price_id: priceId,
          billing_status: updated.status,
          subscription_renewal_date: new Date(updated.current_period_end * 1000).toISOString().split('T')[0],
          subscription_cancel_at_period_end: false,
        });
        return Response.json({ upgraded: true, tier });
      }
    }

    // New checkout session (no existing subscription or it was cancelled)
    const params = {
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: success_url || `${req.headers.get('origin')}/subscription?success=1`,
      cancel_url: cancel_url || `${req.headers.get('origin')}/subscription`,
      subscription_data: {
        metadata: { user_id: user.id, tier },
        // 30-day trial for new subscribers
        trial_period_days: user.had_trial ? undefined : 30,
      },
      allow_promotion_codes: true,
    };

    const session = await stripe.checkout.sessions.create(params);
    return Response.json({ url: session.url });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});