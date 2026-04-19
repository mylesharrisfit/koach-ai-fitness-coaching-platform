import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

// Map tier keys to Stripe Price IDs.
// IMPORTANT: Set these env vars in your dashboard matching your actual Stripe price IDs.
// Format: STRIPE_PRICE_STARTER, STRIPE_PRICE_PRO, STRIPE_PRICE_ELITE, STRIPE_PRICE_ENTERPRISE
const TIER_PRICES = {
  starter:    Deno.env.get('STRIPE_PRICE_STARTER'),
  pro:        Deno.env.get('STRIPE_PRICE_PRO'),
  elite:      Deno.env.get('STRIPE_PRICE_ELITE'),
  enterprise: Deno.env.get('STRIPE_PRICE_ENTERPRISE'),
};

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { action, tier, success_url, cancel_url } = await req.json();

  // ── Create or retrieve Stripe customer ──────────────────────────────────────
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

  // ── Billing Portal (manage existing subscription) ────────────────────────────
  if (action === 'portal') {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: cancel_url || `${req.headers.get('origin')}/subscription`,
    });
    return Response.json({ url: session.url });
  }

  // ── Checkout (new subscription or upgrade) ────────────────────────────────────
  const priceId = TIER_PRICES[tier];
  if (!priceId) {
    return Response.json(
      { error: `No Stripe Price ID configured for tier "${tier}". Set STRIPE_PRICE_${tier.toUpperCase()} in secrets.` },
      { status: 400 }
    );
  }

  const params = {
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: success_url || `${req.headers.get('origin')}/subscription?success=1`,
    cancel_url: cancel_url || `${req.headers.get('origin')}/subscription`,
    subscription_data: {
      metadata: { user_id: user.id, tier },
    },
    allow_promotion_codes: true,
  };

  // If already has a subscription, use upgrade flow
  if (user.stripe_subscription_id) {
    const sub = await stripe.subscriptions.retrieve(user.stripe_subscription_id);
    if (sub && sub.status !== 'canceled') {
      // Update subscription inline instead of new checkout
      const updated = await stripe.subscriptions.update(user.stripe_subscription_id, {
        items: [{ id: sub.items.data[0].id, price: priceId }],
        proration_behavior: 'always_invoice',
        metadata: { user_id: user.id, tier },
      });
      // Immediately update tier in DB
      await base44.auth.updateMe({
        subscription_tier: tier,
        stripe_price_id: priceId,
        billing_status: updated.status,
        subscription_renewal_date: new Date(updated.current_period_end * 1000).toISOString().split('T')[0],
      });
      return Response.json({ upgraded: true, tier });
    }
  }

  const session = await stripe.checkout.sessions.create(params);
  return Response.json({ url: session.url });
});