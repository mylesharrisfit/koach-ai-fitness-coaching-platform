import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@17.3.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { listing_id, success_url, cancel_url } = await req.json();

    if (!listing_id) return Response.json({ error: 'listing_id required' }, { status: 400 });

    const listings = await base44.asServiceRole.entities.PlanListing.filter({ id: listing_id });
    const listing = listings[0];
    if (!listing) return Response.json({ error: 'Listing not found' }, { status: 404 });

    const origin = 'https://koachai.net';
    const successUrl = success_url || `${origin}/store/success?listing_id=${listing_id}`;
    const cancelUrl = cancel_url || `${origin}/store`;

    const sessionParams = {
      payment_method_types: ['card'],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { listing_id, coach_id: listing.coach_id || '' },
    };

    if (user.email) sessionParams.customer_email = user.email;

    if (listing.stripe_price_id) {
      sessionParams.line_items = [{ price: listing.stripe_price_id, quantity: 1 }];
      sessionParams.mode = listing.payment_type === 'subscription' ? 'subscription' : 'payment';
    } else {
      // Fallback: create price on the fly
      sessionParams.line_items = [{
        price_data: {
          currency: 'usd',
          unit_amount: Math.round(Number(listing.price) * 100),
          product_data: {
            name: listing.title,
            description: listing.description || listing.title,
            images: listing.image_url ? [listing.image_url] : [],
          },
        },
        quantity: 1,
      }];
      sessionParams.mode = 'payment';
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return Response.json({ checkout_url: session.url, session_id: session.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});