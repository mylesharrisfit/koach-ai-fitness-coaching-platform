// Supabase Edge Function: stripeCancelSubscription  (Migration Step 5a)
//
// Faithful port of base44/functions/stripeCancelSubscription. The subscription
// id is read from the caller's OWN profile — never client-supplied — so a coach
// can only cancel their own subscription. The "already gone" handling that lets
// account deletion proceed safely is preserved verbatim. Secrets from env only.
import Stripe from 'npm:stripe@14.21.0';
import { getCaller, serviceClient, jsonResponse, cors } from '../_shared/edgeClients.js';
import { billingDeniedFor } from '../_shared/teamRole.js';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
    const caller = await getCaller(req);
    if (!caller) return jsonResponse({ error: 'Unauthorized' }, 401);

    // Step 6 RBAC: coach-tier team members don't manage anything money-shaped;
    // billing rides on the team owner's profile. Server-side mirror of the
    // frontend's useTeamRole gate (CoachBillingBlock).
    {
      const denied = await billingDeniedFor(serviceClient(), caller.auth.id);
      if (denied) return jsonResponse(denied, 403);
    }

    // Never trust a client-supplied id — use the caller's stored subscription.
    const subscriptionId = caller.profile.stripe_subscription_id;
    if (!subscriptionId) return jsonResponse({ status: 'no_active_subscription' });

    try {
      const canceled = await stripe.subscriptions.cancel(subscriptionId);
      return jsonResponse({ status: canceled.status });
    } catch (stripeErr) {
      const code = stripeErr?.code;
      const msg = (stripeErr?.message || '').toLowerCase();
      const alreadyGone =
        code === 'resource_missing' ||
        msg.includes('no such subscription') ||
        msg.includes('already canceled') ||
        msg.includes('already been canceled');
      if (alreadyGone) return jsonResponse({ status: 'no_active_subscription' });
      return jsonResponse({ error: stripeErr.message }, 500);
    }
  } catch (error) {
    return jsonResponse({ error: (error && error.message) || 'Server error' }, 500);
  }
});
