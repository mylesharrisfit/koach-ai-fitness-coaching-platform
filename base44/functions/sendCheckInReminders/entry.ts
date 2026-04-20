import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Scheduled weekly — finds active clients who haven't checked in for 8+ days
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const clients = await base44.asServiceRole.entities.Client.filter({ lifecycle_status: 'active' });
    const checkIns = await base44.asServiceRole.entities.CheckIn.list('-date', 500);

    const now = new Date();
    const remindersSent = [];

    for (const client of clients) {
      const clientCIs = checkIns
        .filter(ci => ci.client_id === client.id)
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      const lastCI = clientCIs[0];
      const daysSince = lastCI
        ? Math.floor((now - new Date(lastCI.date)) / (1000 * 60 * 60 * 24))
        : 999;

      if (daysSince >= 8 && client.email) {
        // Notify coach
        const coaches = (await base44.asServiceRole.entities.User.list()).filter(u => u.role === 'admin');
        await Promise.all(coaches.map(coach =>
          base44.asServiceRole.entities.Notification.create({
            recipient_id: coach.email,
            type: 'checkin_reminder',
            title: `${client.name} hasn't checked in for ${daysSince} days`,
            body: 'Consider reaching out to keep them on track.',
            is_read: false,
            link: '/checkin-review',
            related_client_id: client.id,
          })
        ));

        // Also notify the client
        await base44.asServiceRole.entities.Notification.create({
          recipient_id: client.email,
          type: 'checkin_reminder',
          title: "Don't forget your weekly check-in!",
          body: "Your coach is waiting to review your progress. It only takes 60 seconds.",
          is_read: false,
          link: '/submit-checkin',
          related_client_id: client.id,
        });

        remindersSent.push(client.name);
      }
    }

    return Response.json({ ok: true, remindersSent });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});