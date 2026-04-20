import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const checkIn = payload.data;
    if (!checkIn) return Response.json({ ok: true });

    // Notify all admin/coach users that a new check-in was submitted
    const users = await base44.asServiceRole.entities.User.list();
    const coaches = users.filter(u => u.role === 'admin');

    await Promise.all(coaches.map(coach =>
      base44.asServiceRole.entities.Notification.create({
        recipient_id: coach.email,
        type: 'checkin_received',
        title: `New check-in from ${checkIn.client_name || 'a client'}`,
        body: checkIn.notes
          ? `"${checkIn.notes.slice(0, 80)}${checkIn.notes.length > 80 ? '…' : ''}"`
          : `Submitted on ${checkIn.date}`,
        is_read: false,
        link: '/checkin-review',
        related_client_id: checkIn.client_id,
        related_checkin_id: checkIn.id,
      })
    ));

    return Response.json({ ok: true, notified: coaches.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});