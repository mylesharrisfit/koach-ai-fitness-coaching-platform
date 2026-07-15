// Supabase Edge Function: stripeCreateSubscription  (Migration Step 5a)
//
// Faithful port of base44/functions/stripeCreateSubscription. A coach creates a
// billing subscription for one of THEIR clients. Ownership is verified
// server-side (ownsClient) before any Stripe call — the client-supplied
// client_id is never trusted. Payment row written via service role. Secrets
// from env only; none logged.
import Stripe from 'npm:stripe@14.21.0';
import { getCaller, serviceClient, ownsClient, jsonResponse, cors } from '../_shared/edgeClients.js';
import { billingDeniedFor } from '../_shared/teamRole.js';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const caller = await getCaller(req);
    if (!caller) return jsonResponse({ error: 'Unauthorized' }, 401);

    // Step 6 RBAC: coach-tier team members don't manage anything money-shaped;
    // billing rides on the team owner's profile. Server-side mirror of the
    // frontend's useTeamRole gate (CoachBillingBlock).
    {
      const denied = await billingDeniedFor(serviceClient(), caller.auth.id);
      if (denied) return jsonResponse(denied, 403);
    }
    const user = caller.profile;
    const svc = serviceClient();

    const { client_id, price_amount, interval, client_email, client_name, description } = await req.json();

    // The client must belong to the calling coach.
    const client = await ownsClient(svc, user.id, client_id);
    if (!client) return jsonResponse({ error: 'Forbidden: client not owned by you' }, 403);

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

    const existing = await stripe.customers.search({ query: `email:'${client_email}'`, limit: 1 });
    let customer;
    if (existing.data.length > 0) {
      customer = existing.data[0];
    } else {
      customer = await stripe.customers.create({
        email: client_email,
        name: client_name,
        metadata: { client_id, coach_user_id: user.id },
      });
    }

    const price = await stripe.prices.create({
      currency: 'usd',
      unit_amount: Math.round(price_amount * 100),
      recurring: { interval: interval || 'month' },
      product_data: { name: description || 'Coaching Subscription' },
    });

    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: price.id }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
      metadata: { client_id, coach_user_id: user.id },
    });

    await svc.from('payments').insert({
      client_id,
      client_name,
      amount: price_amount,
      type: 'monthly',
      status: 'pending',
      description: description || 'Stripe Subscription',
      stripe_payment_id: subscription.id,
      due_date: new Date().toISOString().split('T')[0],
      created_by: user.id,
    });

    return jsonResponse({
      subscription_id: subscription.id,
      client_secret: subscription.latest_invoice?.payment_intent?.client_secret,
      customer_id: customer.id,
    });
  } catch (error) {
    return jsonResponse({ error: (error && error.message) || 'Server error' }, 500);
  }
});
