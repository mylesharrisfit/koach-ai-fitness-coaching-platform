import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import Stripe from 'npm:stripe@14.21.0';

// Verify that client_id belongs to the calling user (coach)
const verifyClientOwnership = async (base44, userId, clientId) => {
  const clients = await base44.asServiceRole.entities.Client.filter({ id: clientId });
  const client = clients[0];
  if (!client || client.created_by_id !== userId) {
    return null;
  }
  return client;
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden: admin only' }, { status: 403 });

    const { action, payload } = await req.json();
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

    if (action === 'testConnection') {
      const account = await stripe.accounts.retrieve();
      return Response.json({ ok: true, email: account.email, display_name: account.display_name || account.business_profile?.name });
    }

    if (action === 'getClientInvoices') {
      const { customer_id, client_id } = payload;
      // Verify the client belongs to this coach
      if (client_id) {
        const client = await verifyClientOwnership(base44, user.id, client_id);
        if (!client) return Response.json({ error: 'Forbidden: client not owned by you' }, { status: 403 });
        // Also verify the customer_id matches what we have on record
        if (client.stripe_customer_id && client.stripe_customer_id !== customer_id) {
          return Response.json({ error: 'Forbidden: customer ID mismatch' }, { status: 403 });
        }
      }
      const invoices = await stripe.invoices.list({ customer: customer_id, limit: 20 });
      return Response.json({ invoices: invoices.data });
    }

    if (action === 'createCustomer') {
      const { email, name, client_id } = payload;
      // Verify the client belongs to this coach
      if (client_id) {
        const client = await verifyClientOwnership(base44, user.id, client_id);
        if (!client) return Response.json({ error: 'Forbidden: client not owned by you' }, { status: 403 });
      }
      const existing = await stripe.customers.search({ query: `email:'${email}'`, limit: 1 });
      if (existing.data.length > 0) {
        return Response.json({ customer: existing.data[0] });
      }
      const customer = await stripe.customers.create({
        email,
        name,
        metadata: { client_id: client_id || '', coach_user_id: user.id, app: 'KOACH AI' },
      });
      return Response.json({ customer });
    }

    if (action === 'sendInvoice') {
      const { customer_id, amount, description, client_id, client_name } = payload;
      // Verify the client belongs to this coach
      const client = await verifyClientOwnership(base44, user.id, client_id);
      if (!client) return Response.json({ error: 'Forbidden: client not owned by you' }, { status: 403 });
      // Verify customer_id matches the client on record (if set)
      if (client.stripe_customer_id && client.stripe_customer_id !== customer_id) {
        return Response.json({ error: 'Forbidden: customer ID mismatch' }, { status: 403 });
      }
      await stripe.invoiceItems.create({
        customer: customer_id,
        amount: Math.round(amount * 100),
        currency: 'usd',
        description,
      });
      const invoice = await stripe.invoices.create({
        customer: customer_id,
        auto_advance: true,
        collection_method: 'send_invoice',
        days_until_due: 7,
      });
      await stripe.invoices.finalizeInvoice(invoice.id);
      const sent = await stripe.invoices.sendInvoice(invoice.id);
      await base44.asServiceRole.entities.Payment.create({
        client_id,
        client_name,
        amount,
        type: 'one_time',
        status: 'pending',
        description,
        stripe_payment_id: invoice.id,
        due_date: new Date().toISOString().split('T')[0],
      });
      return Response.json({ invoice: { id: sent.id, hosted_invoice_url: sent.hosted_invoice_url } });
    }

    if (action === 'createPaymentLink') {
      const { name, amount, description, client_id } = payload;
      // Verify client ownership if a client_id is provided
      if (client_id) {
        const client = await verifyClientOwnership(base44, user.id, client_id);
        if (!client) return Response.json({ error: 'Forbidden: client not owned by you' }, { status: 403 });
      }
      const product = await stripe.products.create({
        name,
        description: description || '',
        metadata: { client_id: client_id || '', coach_user_id: user.id },
      });
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(amount * 100),
        currency: 'usd',
      });
      const link = await stripe.paymentLinks.create({
        line_items: [{ price: price.id, quantity: 1 }],
      });
      return Response.json({ url: link.url, id: link.id });
    }

    if (action === 'listProducts') {
      const products = await stripe.products.list({ active: true, limit: 20 });
      const withPrices = await Promise.all(
        products.data.map(async (p) => {
          const prices = await stripe.prices.list({ product: p.id, active: true, limit: 5 });
          return { ...p, prices: prices.data };
        })
      );
      return Response.json({ products: withPrices });
    }

    if (action === 'createProduct') {
      const { name, amount, description, interval } = payload;
      const product = await stripe.products.create({ name, description: description || '' });
      const priceData = {
        product: product.id,
        unit_amount: Math.round(amount * 100),
        currency: 'usd',
      };
      if (interval) {
        priceData.recurring = { interval };
      }
      const price = await stripe.prices.create(priceData);
      return Response.json({ product, price });
    }

    if (action === 'getCharges') {
      const charges = await stripe.charges.list({ limit: 100 });
      return Response.json({ charges: charges.data });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});