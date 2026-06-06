import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

  // Fetch all subscriptions from Stripe
  const subscriptions = await stripe.subscriptions.list({ limit: 100, status: 'all' });
  const charges = await stripe.charges.list({ limit: 100 });

  const activeCount = subscriptions.data.filter(s => s.status === 'active').length;
  const pastDueCount = subscriptions.data.filter(s => s.status === 'past_due').length;
  const canceledCount = subscriptions.data.filter(s => s.status === 'canceled').length;

  const mrr = subscriptions.data
    .filter(s => s.status === 'active')
    .reduce((sum, s) => sum + (s.items.data[0]?.price?.unit_amount || 0) / 100, 0);

  const totalRevenue = charges.data
    .filter(c => c.paid && !c.refunded)
    .reduce((sum, c) => sum + c.amount / 100, 0);

  const failedCharges = charges.data.filter(c => c.failure_code).length;

  // Last 6 months MRR trend (from our payments DB)
  const payments = await base44.asServiceRole.entities.Payment.list('-paid_date', 200);
  const now = new Date();
  const monthlyRevenue = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleString('default', { month: 'short' });
    const month = d.getMonth();
    const year = d.getFullYear();
    const total = payments
      .filter(p => p.status === 'paid' && p.paid_date)
      .filter(p => {
        const pd = new Date(p.paid_date);
        return pd.getMonth() === month && pd.getFullYear() === year;
      })
      .reduce((s, p) => s + (p.amount || 0), 0);
    monthlyRevenue.push({ month: label, revenue: total });
  }

  return Response.json({
    mrr,
    total_revenue: totalRevenue,
    active_subscriptions: activeCount,
    past_due: pastDueCount,
    canceled: canceledCount,
    failed_charges: failedCharges,
    monthly_revenue: monthlyRevenue,
    subscriptions: subscriptions.data.slice(0, 20).map(s => ({
      id: s.id,
      status: s.status,
      amount: (s.items.data[0]?.price?.unit_amount || 0) / 100,
      interval: s.items.data[0]?.price?.recurring?.interval,
      current_period_end: s.current_period_end,
      customer_email: s.customer_email,
      metadata: s.metadata,
    })),
  });
});