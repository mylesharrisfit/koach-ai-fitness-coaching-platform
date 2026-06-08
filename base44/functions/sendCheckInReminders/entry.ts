import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Scheduled every Friday at 2pm ET — reminds active clients who:
//   1. Haven't submitted a check-in this week (Mon–Fri window)
//   2. Haven't completed any workout this week

const FROM_EMAIL = 'support@koachai.net';
const FROM_NAME = 'KOACH AI';
const APP_URL = 'https://koachai.net';

function startOfCurrentWeek() {
  const now = new Date();
  const day = now.getUTCDay(); // 0=Sun, 1=Mon …
  const diff = day === 0 ? -6 : 1 - day; // roll back to Monday
  const mon = new Date(now);
  mon.setUTCDate(now.getUTCDate() + diff);
  mon.setUTCHours(0, 0, 0, 0);
  return mon;
}

async function sendEmail(apiKey, to, subject, html) {
  if (!apiKey || !to) return;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: `${FROM_NAME} <${FROM_EMAIL}>`, to: [to], subject, html }),
  });
  if (!res.ok) {
    const err = await res.json();
    console.error('Resend error:', err);
  }
}

function buildReminderEmail({ clientName, missedCheckin, missedWorkout }) {
  const items = [];
  if (missedCheckin) items.push({ icon: '📋', label: 'Weekly Check-in', sub: 'Your coach reviews your progress every week — this is key to results.', link: `${APP_URL}/portal/checkin`, cta: 'Submit Check-in' });
  if (missedWorkout) items.push({ icon: '🏋️', label: 'Workout This Week', sub: "Don't let the week slip by without getting a session in.", link: `${APP_URL}/portal/workouts`, cta: 'View Workouts' });

  const cards = items.map(item => `
    <tr><td style="padding:14px 20px;border-radius:12px;background:#F8FAFC;border:1px solid #E2E8F0;margin-bottom:12px;display:block;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="font-size:22px;width:36px;vertical-align:middle;">${item.icon}</td>
          <td style="padding-left:12px;vertical-align:middle;">
            <p style="margin:0 0 2px;font-size:15px;font-weight:700;color:#0F172A;">${item.label}</p>
            <p style="margin:0;font-size:13px;color:#64748B;">${item.sub}</p>
          </td>
        </tr>
        <tr><td colspan="2" style="padding-top:12px;">
          <a href="${item.link}" style="display:inline-block;padding:10px 20px;background:linear-gradient(135deg,#2563EB,#1D4ED8);color:#fff;font-size:13px;font-weight:700;border-radius:8px;text-decoration:none;">${item.cta} →</a>
        </td></tr>
      </table>
    </td></tr>
    <tr><td style="height:10px;"></td></tr>
  `).join('');

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#F3F4F6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F3F4F6;padding:24px 12px;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
  <tr><td style="height:4px;background:linear-gradient(135deg,#2563EB,#7C3AED);"></td></tr>
  <tr><td style="padding:28px 36px;background:#0F172A;">
    <span style="font-size:20px;font-weight:900;color:#fff;letter-spacing:-0.5px;">KOACH AI</span>
  </td></tr>
  <tr><td style="padding:32px 36px 24px;">
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:900;color:#0F172A;letter-spacing:-0.5px;">⏰ Friday reminder, ${clientName.split(' ')[0]}</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.7;">
      The week's almost over — here's what still needs your attention before the weekend:
    </p>
    <table width="100%" cellpadding="0" cellspacing="0">${cards}</table>
    <p style="margin:24px 0 0;font-size:14px;color:#64748B;line-height:1.7;">
      Consistency is everything. Your coach is in your corner — let's finish the week strong. 💪
    </p>
  </td></tr>
  <tr><td style="padding:16px 36px 20px;background:#F8FAFC;border-top:1px solid #F1F5F9;">
    <p style="margin:0;font-size:12px;color:#94A3B8;">© KOACH AI · <a href="${APP_URL}" style="color:#94A3B8;text-decoration:none;">koachai.net</a> · You're receiving this as part of your coaching program.</p>
  </td></tr>
</table></td></tr></table>
</body></html>`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const apiKey = Deno.env.get('RESEND_API_KEY');
    const weekStart = startOfCurrentWeek();

    // Load all active clients, check-ins and workout sessions in parallel
    const [clients, allCheckIns, allSessions, users] = await Promise.all([
      base44.asServiceRole.entities.Client.filter({ lifecycle_status: 'active' }),
      base44.asServiceRole.entities.CheckIn.list('-date', 1000),
      base44.asServiceRole.entities.WorkoutSession.list('-completed_at', 1000),
      base44.asServiceRole.entities.User.list(),
    ]);

    const coaches = users.filter(u => u.role === 'admin');
    const remindersSent = [];

    for (const client of clients) {
      if (!client.email) continue;

      // Check-in this week?
      const hasCheckin = allCheckIns.some(ci => {
        if (ci.client_id !== client.id) return false;
        const d = new Date(ci.date);
        return d >= weekStart;
      });

      // Workout this week?
      const hasWorkout = allSessions.some(ws => {
        if (ws.client_id !== client.id) return false;
        const d = new Date(ws.completed_at);
        return d >= weekStart;
      });

      const missedCheckin = !hasCheckin;
      const missedWorkout = !hasWorkout;

      if (!missedCheckin && !missedWorkout) continue;

      // Send email to client
      const subject = missedCheckin && missedWorkout
        ? "⏰ Quick reminder: check-in & workout still pending"
        : missedCheckin
          ? "⏰ Don't forget your weekly check-in"
          : "⏰ You've still got time for a workout this week";

      await sendEmail(apiKey, client.email, subject, buildReminderEmail({
        clientName: client.name,
        missedCheckin,
        missedWorkout,
      }));

      // In-app notification to client
      await base44.asServiceRole.entities.Notification.create({
        recipient_id: client.email,
        category: 'reminder',
        type: 'friday_reminder',
        title: "Friday reminder ⏰",
        body: [
          missedCheckin && "You haven't submitted your weekly check-in yet.",
          missedWorkout && "You haven't logged a workout this week.",
        ].filter(Boolean).join(' '),
        is_read: false,
        link: missedCheckin ? '/portal/checkin' : '/portal/workouts',
        related_client_id: client.id,
        priority: 'high',
      });

      // In-app notification to coaches
      await Promise.all(coaches.map(coach =>
        base44.asServiceRole.entities.Notification.create({
          recipient_id: coach.email,
          category: 'reminder',
          type: 'client_friday_reminder',
          title: `${client.name} needs a nudge 📌`,
          body: [
            missedCheckin && "No check-in this week.",
            missedWorkout && "No workout logged this week.",
          ].filter(Boolean).join(' '),
          is_read: false,
          link: '/checkin-review',
          related_client_id: client.id,
          priority: 'normal',
        })
      ));

      remindersSent.push({ name: client.name, missedCheckin, missedWorkout });
    }

    console.log(`Friday reminders sent to ${remindersSent.length} client(s):`, remindersSent.map(r => r.name));
    return Response.json({ ok: true, count: remindersSent.length, remindersSent });
  } catch (error) {
    console.error('sendCheckInReminders error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});