import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { invoice_id, message_override } = await req.json();
    if (!invoice_id) return Response.json({ error: 'invoice_id required' }, { status: 400 });

    const invoices = await base44.entities.Invoice.list('-created_date', 500);
    const invoice = invoices.find(i => i.id === invoice_id);
    if (!invoice) return Response.json({ error: 'Invoice not found' }, { status: 404 });

    const firstName = (invoice.client_name || '').split(' ')[0] || 'there';
    const coachFirst = (user.full_name || 'Your Coach').split(' ')[0];

    const defaultMessage = `Hi ${firstName}, this is a friendly reminder that invoice ${invoice.invoice_number} for $${Number(invoice.amount).toFixed(2)} is due on ${invoice.due_date || 'soon'}. Please make your payment at your earliest convenience. Thank you! — Coach ${coachFirst}`;
    const body = message_override || defaultMessage;

    const results = [];

    // Email reminder
    if (invoice.client_email) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: invoice.client_email,
        subject: `Payment Reminder: Invoice ${invoice.invoice_number} — $${Number(invoice.amount).toFixed(2)}`,
        body,
      });
      results.push('email');
    }

    // In-app message
    if (invoice.client_id) {
      await base44.asServiceRole.entities.Message.create({
        client_id: invoice.client_id,
        client_name: invoice.client_name,
        sender: 'coach',
        content: `⏰ Payment Reminder: ${body}`,
        tag: 'general',
      });
      results.push('message');
    }

    return Response.json({ success: true, sent_via: results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});