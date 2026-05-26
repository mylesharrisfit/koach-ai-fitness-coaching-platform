import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@14.21.0';

Deno.serve(async (req) => {
  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    // Build price-to-tier map at runtime
    function getTierFromPriceId(priceId) {
      const map = {};
      for (const key of ['STARTER', 'PRO', 'ELITE', 'ENTERPRISE']) {
        const monthly = Deno.env.get(`STRIPE_PRICE_${key}`);
        const annual  = Deno.env.get(`STRIPE_PRICE_${key}_ANNUAL`);
        if (monthly) map[monthly] = key.toLowerCase();
        if (annual)  map[annual]  = key.toLowerCase();
      }
      return map[priceId] || null;
    }

    async function syncSubscriptionToUser(base44, subscription) {
      const userId = subscription.metadata?.user_id;
      if (!userId) return;

      const priceId = subscription.items?.data?.[0]?.price?.id;
      const tier = getTierFromPriceId(priceId) || subscription.metadata?.tier || 'starter';
      const renewalDate = new Date(subscription.current_period_end * 1000).toISOString().split('T')[0];

      let tierToSet = tier;
      let billingStatus = subscription.status;

      if (subscription.status === 'canceled') {
        tierToSet = 'starter';
        billingStatus = 'canceled';
      }

      const update = {
        subscription_tier: tierToSet,
        billing_status: billingStatus,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: subscription.customer,
        stripe_price_id: priceId || '',
        subscription_renewal_date: renewalDate,
        subscription_cancel_at_period_end: subscription.cancel_at_period_end || false,
        had_trial: true, // mark so future checkouts skip trial
      };

      const u = await base44.asServiceRole.entities.User.get(userId);
      if (u) {
        await base44.asServiceRole.entities.User.update(u.id, update);
      }
    }

    async function sendEmail(base44, { to, subject, body }) {
      await base44.asServiceRole.integrations.Core.SendEmail({ to, subject, body });
    }

    const base44 = createClientFromRequest(req);
    const rawBody = await req.text();
    const sig = req.headers.get('stripe-signature');

    let event;
    if (webhookSecret && sig) {
      event = await stripe.webhooks.constructEventAsync(rawBody, sig, webhookSecret);
    } else {
      const parsed = JSON.parse(rawBody);
      event = parsed.data?.object ? parsed : { type: parsed.type, data: { object: parsed } };
    }

    const obj = event.data.object;

    // ── Subscription lifecycle ─────────────────────────────────────────────────
    if (['customer.subscription.created', 'customer.subscription.updated', 'customer.subscription.deleted'].includes(event.type)) {
      await syncSubscriptionToUser(base44, obj);
    }

    // ── Checkout completed ─────────────────────────────────────────────────────
    if (event.type === 'checkout.session.completed') {
      const subId = obj.subscription;
      if (subId) {
        const sub = await stripe.subscriptions.retrieve(subId);
        await syncSubscriptionToUser(base44, sub);
      }
    }

    // ── Payment succeeded ──────────────────────────────────────────────────────
    if (event.type === 'invoice.payment_succeeded') {
      const subId = obj.subscription;
      if (subId) {
        const sub = await stripe.subscriptions.retrieve(subId);
        await syncSubscriptionToUser(base44, sub);
        // Update any pending/failed payment records
        const payments = await base44.asServiceRole.entities.Payment.filter({ stripe_payment_id: subId });
        for (const p of payments.filter(p => p.status === 'pending' || p.status === 'failed')) {
          await base44.asServiceRole.entities.Payment.update(p.id, {
            status: 'paid',
            paid_date: new Date().toISOString().split('T')[0],
          });
        }
      }
    }

    // ── Payment failed ─────────────────────────────────────────────────────────
    if (event.type === 'invoice.payment_failed') {
      const subId = obj.subscription;
      const customerId = obj.customer;
      if (subId) {
        const sub = await stripe.subscriptions.retrieve(subId);
        await syncSubscriptionToUser(base44, sub);

        // Send warning email to coach
        if (customerId) {
          const customer = await stripe.customers.retrieve(customerId);
          const email = customer.email;
          if (email) {
            await sendEmail(base44, {
              to: email,
              subject: '⚠️ Payment failed — action required to keep your KOACH AI account active',
              body: `Hi,\n\nYour recent payment for KOACH AI failed. Please update your billing information within 7 days to avoid service interruption.\n\nUpdate billing: ${Deno.env.get('APP_URL') || 'https://app.koach.ai'}/subscription\n\nIf you have questions, reply to this email.\n\nKOACH AI Team`,
            });
          }
        }

        // Log failed payment
        const payments = await base44.asServiceRole.entities.Payment.filter({ stripe_payment_id: subId });
        for (const p of payments.filter(p => p.status === 'pending')) {
          await base44.asServiceRole.entities.Payment.update(p.id, { status: 'failed' });
        }
      }
    }

    // ── Trial ending soon (3 days before) ─────────────────────────────────────
    if (event.type === 'customer.subscription.trial_will_end') {
      const customerId = obj.customer;
      const trialEnd = new Date(obj.trial_end * 1000);
      const formattedDate = trialEnd.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

      if (customerId) {
        const customer = await stripe.customers.retrieve(customerId);
        const email = customer.email;
        if (email) {
          await sendEmail(base44, {
            to: email,
            subject: '🔔 Your KOACH AI trial ends in 3 days',
            body: `Hi,\n\nYour free trial of KOACH AI Pro ends on ${formattedDate}.\n\nTo keep access to all your coaching tools, add a payment method before your trial ends:\n\n${Deno.env.get('APP_URL') || 'https://app.koach.ai'}/subscription\n\nIf you don't add a payment method, your account will be moved to the free Starter plan.\n\nKOACH AI Team`,
          });
        }
      }
    }

    return Response.json({ received: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});