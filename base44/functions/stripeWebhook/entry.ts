import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

// Reverse-map price ID → tier key (reads env vars)
function getTierFromPriceId(priceId) {
  const map = {
    [Deno.env.get('STRIPE_PRICE_STARTER')]:    'starter',
    [Deno.env.get('STRIPE_PRICE_PRO')]:         'pro',
    [Deno.env.get('STRIPE_PRICE_ELITE')]:       'elite',
    [Deno.env.get('STRIPE_PRICE_ENTERPRISE')]:  'enterprise',
  };
  return map[priceId] || null;
}

async function syncSubscriptionToUser(base44, subscription) {
  const userId = subscription.metadata?.user_id;
  if (!userId) return;

  const priceId = subscription.items?.data?.[0]?.price?.id;
  const tier = getTierFromPriceId(priceId) || subscription.metadata?.tier || 'starter';
  const renewalDate = new Date(subscription.current_period_end * 1000).toISOString().split('T')[0];

  // Map Stripe status → billing_status
  let billingStatus = subscription.status; // active, past_due, canceled, trialing, unpaid, incomplete
  let tierToSet = tier;

  // On cancellation, downgrade to starter
  if (subscription.status === 'canceled') {
    tierToSet = 'starter';
    billingStatus = 'canceled';
  }

  // On past_due/unpaid, keep tier but flag status
  const update = {
    subscription_tier: tierToSet,
    billing_status: billingStatus,
    stripe_subscription_id: subscription.id,
    stripe_customer_id: subscription.customer,
    stripe_price_id: priceId || '',
    subscription_renewal_date: renewalDate,
    subscription_cancel_at_period_end: subscription.cancel_at_period_end || false,
  };

  // Find user by ID and update
  try {
    const u = await base44.asServiceRole.entities.User.get(userId);
    if (u) {
      await base44.asServiceRole.entities.User.update(u.id, update);
    }
  } catch (_) {
    // User not found — skip silently
  }
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  let event;
  try {
    if (webhookSecret && sig) {
      event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret);
    } else {
      const parsed = JSON.parse(body);
      // Support both raw event shape and wrapped {type, data} shape
      event = parsed.data?.object ? parsed : { type: parsed.type, data: { object: parsed } };
    }
  } catch (err) {
    return Response.json({ error: 'Invalid payload: ' + err.message }, { status: 400 });
  }

  const obj = event.data.object;

  // ── Subscription lifecycle events ─────────────────────────────────────────
  if ([
    'customer.subscription.created',
    'customer.subscription.updated',
    'customer.subscription.deleted',
  ].includes(event.type)) {
    await syncSubscriptionToUser(base44, obj);
  }

  // ── Payment events ─────────────────────────────────────────────────────────
  if (event.type === 'invoice.payment_succeeded') {
    const subId = obj.subscription;
    if (subId) {
      const sub = await stripe.subscriptions.retrieve(subId);
      await syncSubscriptionToUser(base44, sub);
      // Update payment records
      const payments = await base44.asServiceRole.entities.Payment.filter({ stripe_payment_id: subId });
      for (const p of payments.filter(p => p.status === 'pending')) {
        await base44.asServiceRole.entities.Payment.update(p.id, {
          status: 'paid',
          paid_date: new Date().toISOString().split('T')[0],
        });
      }
    }
  }

  if (event.type === 'invoice.payment_failed') {
    const subId = obj.subscription;
    if (subId) {
      const sub = await stripe.subscriptions.retrieve(subId);
      await syncSubscriptionToUser(base44, sub);
      // Mark pending payments as failed
      const payments = await base44.asServiceRole.entities.Payment.filter({ stripe_payment_id: subId });
      for (const p of payments.filter(p => p.status === 'pending')) {
        await base44.asServiceRole.entities.Payment.update(p.id, { status: 'failed' });
      }
    }
  }

  // ── Checkout completed ─────────────────────────────────────────────────────
  if (event.type === 'checkout.session.completed') {
    const sessionSubId = obj.subscription;
    if (sessionSubId) {
      const sub = await stripe.subscriptions.retrieve(sessionSubId);
      await syncSubscriptionToUser(base44, sub);
    }
  }

  return Response.json({ received: true });
});