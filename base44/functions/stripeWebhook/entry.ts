import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  let event;
  if (webhookSecret) {
    event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret);
  } else {
    event = JSON.parse(body);
  }

  const data = event.data.object;

  if (event.type === 'invoice.payment_succeeded') {
    const sub = data.subscription;
    const clientId = data.metadata?.client_id || data.lines?.data?.[0]?.metadata?.client_id;
    // Update matching payment records
    const payments = await base44.asServiceRole.entities.Payment.filter({ stripe_payment_id: sub });
    for (const p of payments) {
      await base44.asServiceRole.entities.Payment.update(p.id, {
        status: 'paid',
        paid_date: new Date().toISOString().split('T')[0],
      });
    }
    // Create a new payment record for renewal
    if (payments.length > 0) {
      const existing = payments[0];
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      await base44.asServiceRole.entities.Payment.create({
        client_id: existing.client_id,
        client_name: existing.client_name,
        amount: existing.amount,
        type: 'monthly',
        status: 'pending',
        description: 'Stripe Subscription (renewal)',
        stripe_payment_id: sub,
        due_date: nextMonth.toISOString().split('T')[0],
      });
    }
  }

  if (event.type === 'invoice.payment_failed') {
    const sub = data.subscription;
    const payments = await base44.asServiceRole.entities.Payment.filter({ stripe_payment_id: sub });
    for (const p of payments.filter(p => p.status === 'pending')) {
      await base44.asServiceRole.entities.Payment.update(p.id, { status: 'failed' });
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = data.id;
    const payments = await base44.asServiceRole.entities.Payment.filter({ stripe_payment_id: sub });
    for (const p of payments.filter(p => p.status === 'pending')) {
      await base44.asServiceRole.entities.Payment.update(p.id, { status: 'failed' });
    }
  }

  return Response.json({ received: true });
});