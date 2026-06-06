import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { client_id, price_amount, interval, client_email, client_name, description } = await req.json();

  // Verify caller is admin OR owns the client record
  if (user.role !== 'admin') {
    const clients = await base44.asServiceRole.entities.Client.filter({ id: client_id });
    const client = clients[0];
    if (!client || client.created_by_id !== user.id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  // Create or retrieve Stripe customer
  const existing = await stripe.customers.search({ query: `email:'${client_email}'`, limit: 1 });
  let customer;
  if (existing.data.length > 0) {
    customer = existing.data[0];
  } else {
    customer = await stripe.customers.create({ email: client_email, name: client_name, metadata: { client_id } });
  }

  // Create a price (inline)
  const price = await stripe.prices.create({
    currency: 'usd',
    unit_amount: Math.round(price_amount * 100),
    recurring: { interval: interval || 'month' },
    product_data: { name: description || 'Coaching Subscription' },
  });

  // Create subscription with payment behavior = default_incomplete so we can collect payment
  const subscription = await stripe.subscriptions.create({
    customer: customer.id,
    items: [{ price: price.id }],
    payment_behavior: 'default_incomplete',
    payment_settings: { save_default_payment_method: 'on_subscription' },
    expand: ['latest_invoice.payment_intent'],
    metadata: { client_id, coach_user_id: user.id },
  });

  // Record payment in our DB
  await base44.asServiceRole.entities.Payment.create({
    client_id,
    client_name,
    amount: price_amount,
    type: 'monthly',
    status: 'pending',
    description: description || 'Stripe Subscription',
    stripe_payment_id: subscription.id,
    due_date: new Date().toISOString().split('T')[0],
  });

  return Response.json({
    subscription_id: subscription.id,
    client_secret: subscription.latest_invoice?.payment_intent?.client_secret,
    customer_id: customer.id,
  });
});