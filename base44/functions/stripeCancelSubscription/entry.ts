import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import Stripe from 'npm:stripe@14.21.0';

Deno.serve(async (req) => {
  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Look up the subscription ID from the user's own stored record — never trust the client
    const subscriptionId = user.stripe_subscription_id;

    if (!subscriptionId) {
      // No subscription on record — safe to proceed with account deletion
      return Response.json({ status: 'no_active_subscription' });
    }

    try {
      const canceled = await stripe.subscriptions.cancel(subscriptionId);
      return Response.json({ status: canceled.status });
    } catch (stripeErr) {
      const code = stripeErr?.code;
      const msg = stripeErr?.message || '';
      const alreadyGone =
        code === 'resource_missing' ||
        msg.toLowerCase().includes('no such subscription') ||
        msg.toLowerCase().includes('already canceled') ||
        msg.toLowerCase().includes('already been canceled');

      if (alreadyGone) {
        // Subscription doesn't exist or is already canceled — safe to proceed
        return Response.json({ status: 'no_active_subscription' });
      }

      // Unexpected Stripe error — do NOT allow deletion to proceed
      return Response.json({ error: stripeErr.message }, { status: 500 });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});