import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const RESEND_KEY = Deno.env.get('RESEND_API_KEY');
const FROM_EMAIL = Deno.env.get('VITE_FROM_EMAIL') || 'noreply@koachai.com';
const FROM_NAME  = Deno.env.get('VITE_FROM_NAME')  || 'KOACH AI';
const APP_URL    = 'https://app.koachai.com';

async function sendEmail(to, toName, subject, html) {
  if (!RESEND_KEY || !to) return;
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: toName ? [`${toName} <${to}>`] : [to],
      subject,
      html,
    }),
  });
}

function buildWorkoutEmail(clientName, session, coachName) {
  const rating   = session.session_rating ? `${session.session_rating}/10` : '—';
  const duration = session.duration_minutes ? `${session.duration_minutes} min` : '—';
  const workout  = session.workout_day_name || 'Workout';
  const note     = session.session_note || '';

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#F3F4F6;font-family:-apple-system,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F3F4F6;padding:24px 12px;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
<tr><td style="height:4px;background:linear-gradient(135deg,#2563EB,#7C3AED);"></td></tr>
<tr><td style="padding:24px 36px 18px;background:#0F172A;"><span style="font-size:18px;font-weight:900;color:#fff;">KOACH AI</span></td></tr>
<tr><td style="padding:28px 36px 20px;background:linear-gradient(160deg,#0F172A,#1E293B);">
  <h1 style="margin:0 0 8px;font-size:24px;font-weight:900;color:#fff;">💪 ${clientName?.split(' ')[0]} crushed a workout!</h1>
  <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.55);">Your client just logged a completed session.</p>
</td></tr>
<tr><td style="padding:32px 36px;">
  <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.7;"><strong>${clientName}</strong> completed <strong>${workout}</strong>.</p>
  <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E2E8F0;border-radius:12px;overflow:hidden;margin:0 0 16px;">
    <tr><td style="padding:12px 18px;font-size:14px;color:#64748B;border-bottom:1px solid #F1F5F9;">Session</td><td style="padding:12px 18px;font-size:14px;font-weight:700;color:#0F172A;text-align:right;border-bottom:1px solid #F1F5F9;">${workout}</td></tr>
    <tr><td style="padding:12px 18px;font-size:14px;color:#64748B;border-bottom:1px solid #F1F5F9;">Duration</td><td style="padding:12px 18px;font-size:14px;font-weight:700;color:#2563EB;text-align:right;border-bottom:1px solid #F1F5F9;">${duration}</td></tr>
    <tr><td style="padding:12px 18px;font-size:14px;color:#64748B;">Difficulty Rating</td><td style="padding:12px 18px;font-size:14px;font-weight:700;color:#0F172A;text-align:right;">${rating}</td></tr>
  </table>
  ${note ? `<div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:12px;padding:16px 18px;margin:0 0 20px;"><p style="margin:0;font-size:14px;color:#374151;font-style:italic;">"${note.slice(0, 200)}"</p></div>` : ''}
  <table cellpadding="0" cellspacing="0"><tr><td style="background:linear-gradient(135deg,#2563EB,#7C3AED);border-radius:10px;">
    <a href="${APP_URL}/clients" style="display:block;padding:14px 28px;color:#fff;font-weight:800;font-size:15px;text-decoration:none;">View Client Progress →</a>
  </td></tr></table>
</td></tr>
<tr><td style="padding:16px 36px 20px;background:#F8FAFC;border-top:1px solid #F1F5F9;">
  <p style="margin:0;font-size:12px;color:#94A3B8;">${coachName} · KOACH AI</p>
</td></tr>
</table></td></tr></table></body></html>`;
}

Deno.serve(async (req) => {
  try {
    const base44   = createClientFromRequest(req);
    const payload  = await req.json();
    const session  = payload.data;

    if (!session?.client_id) return Response.json({ ok: true });

    // Look up the client name
    let clientName = 'A client';
    const clients = await base44.asServiceRole.entities.Client.filter({ id: session.client_id });
    if (clients?.[0]?.name) clientName = clients[0].name;

    // Notify all admin coaches
    const users   = await base44.asServiceRole.entities.User.list();
    const coaches = users.filter(u => u.role === 'admin');

    const workout = session.workout_day_name || 'Workout';

    await Promise.all(coaches.map(coach =>
      base44.asServiceRole.entities.Notification.create({
        recipient_id:      coach.email,
        category:          'client_activity',
        type:              'workout_completed',
        title:             `💪 ${clientName} completed a workout`,
        body:              `${workout}${session.duration_minutes ? ` · ${session.duration_minutes} min` : ''}${session.session_rating ? ` · Rating ${session.session_rating}/10` : ''}`,
        client_name:       clientName,
        is_read:           false,
        action_label:      'View Progress',
        link:              '/progress',
        related_client_id: session.client_id,
        priority:          'normal',
      })
    ));

    await Promise.all(coaches.map(coach =>
      sendEmail(
        coach.email,
        coach.full_name,
        `💪 ${clientName} just completed ${workout}`,
        buildWorkoutEmail(clientName, session, coach.full_name || 'Coach'),
      )
    ));

    return Response.json({ ok: true, notified: coaches.length });
  } catch (error) {
    console.error('onWorkoutCompleted error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});