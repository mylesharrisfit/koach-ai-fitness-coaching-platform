import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@17.3.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
    const { listing } = await req.json();

    // Create Stripe product
    const stripeProduct = await stripe.products.create({
      name: listing.title,
      description: listing.description || listing.title,
      images: listing.image_url ? [listing.image_url] : [],
      metadata: { coach_id: user.email, listing_id: listing.id || '' },
    });

    // Create Stripe price
    const priceParams = {
      product: stripeProduct.id,
      currency: 'usd',
    };

    if (listing.is_free) {
      priceParams.unit_amount = 0;
      priceParams.recurring = undefined;
    } else if (listing.payment_type === 'subscription') {
      priceParams.unit_amount = Math.round(Number(listing.price) * 100);
      const intervalMap = { monthly: 'month', quarterly: 'month', annual: 'year' };
      const intervalCountMap = { monthly: 1, quarterly: 3, annual: 1 };
      priceParams.recurring = {
        interval: intervalMap[listing.billing_frequency] || 'month',
        interval_count: intervalCountMap[listing.billing_frequency] || 1,
      };
    } else {
      priceParams.unit_amount = Math.round(Number(listing.price) * 100);
    }

    const stripePrice = await stripe.prices.create(priceParams);

    return Response.json({
      stripe_product_id: stripeProduct.id,
      stripe_price_id: stripePrice.id,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});