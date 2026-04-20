import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Triggered when coach_responded flips to true on a CheckIn
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const checkIn = payload.data;
    const oldData = payload.old_data;

    // Only fire when coach_responded just became true
    if (!checkIn?.coach_responded || oldData?.coach_responded) {
      return Response.json({ ok: true, skipped: true });
    }

    // Look up client by client_id to get their email
    const clients = await base44.asServiceRole.entities.Client.filter({ id: checkIn.client_id });
    const client = clients[0];
    if (!client?.email) return Response.json({ ok: true, skipped: 'no client email' });

    await base44.asServiceRole.entities.Notification.create({
      recipient_id: client.email,
      type: 'feedback_sent',
      title: 'Your coach reviewed your check-in',
      body: checkIn.coach_notes
        ? checkIn.coach_notes.slice(0, 120) + (checkIn.coach_notes.length > 120 ? '…' : '')
        : 'Your coach has left feedback on your latest check-in.',
      is_read: false,
      link: '/submit-checkin',
      related_client_id: client.id,
      related_checkin_id: checkIn.id,
    });

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});