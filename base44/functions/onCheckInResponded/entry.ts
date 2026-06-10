import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const RESEND_KEY = Deno.env.get('RESEND_API_KEY');
const FROM_EMAIL = Deno.env.get('VITE_FROM_EMAIL') || 'noreply@koachai.com';
const FROM_NAME = Deno.env.get('VITE_FROM_NAME') || 'KOACH AI';
const APP_URL = 'https://koachai.net';

async function sendEmail(to, toName, subject, html, replyTo) {
  if (!RESEND_KEY || !to) return;
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: toName ? [`${toName} <${to}>`] : [to],
      subject, html,
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  });
}

function buildReviewedEmail(client, checkIn, coachName) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#F3F4F6;font-family:-apple-system,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F3F4F6;padding:24px 12px;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
<tr><td style="height:4px;background:linear-gradient(135deg,#2563EB,#7C3AED);"></td></tr>
<tr><td style="padding:24px 36px 18px;background:#0F172A;"><span style="font-size:18px;font-weight:900;color:#fff;">KOACH AI</span></td></tr>
<tr><td style="padding:28px 36px 20px;background:linear-gradient(160deg,#0F172A,#1E293B);">
  <h1 style="margin:0 0 8px;font-size:24px;font-weight:900;color:#fff;">✓ Coach Reviewed Your Check-in</h1>
  <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.55);">${coachName} left you personalized feedback.</p>
</td></tr>
<tr><td style="padding:32px 36px;">
  <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.7;">Hi ${client?.name?.split(' ')[0]},</p>
  ${checkIn?.coach_notes ? `<div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:12px;padding:18px 20px;margin:0 0 18px;"><p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#374151;">💬 ${coachName}'s feedback:</p><p style="margin:0;font-size:15px;color:#374151;font-style:italic;line-height:1.7;">"${checkIn.coach_notes}"</p></div>` : ''}
  <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.7;">Keep up the amazing work!</p>
  <table cellpadding="0" cellspacing="0"><tr><td style="background:linear-gradient(135deg,#2563EB,#7C3AED);border-radius:10px;">
    <a href="${APP_URL}/portal/checkin" style="display:block;padding:14px 28px;color:#fff;font-weight:800;font-size:15px;text-decoration:none;">View Full Feedback →</a>
  </td></tr></table>
</td></tr>
<tr><td style="padding:16px 36px 20px;background:#F8FAFC;border-top:1px solid #F1F5F9;">
  <p style="margin:0;font-size:12px;color:#94A3B8;">${coachName} · KOACH AI · <a href="${APP_URL}/unsubscribe" style="color:#94A3B8;">Unsubscribe</a></p>
</td></tr>
</table></td></tr></table></body></html>`;
}

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

    // Find coach name from admin users
    const users = await base44.asServiceRole.entities.User.list();
    const coach = users.find(u => u.role === 'admin');
    const coachName = coach?.full_name || 'Your Coach';

    await base44.asServiceRole.entities.Notification.create({
      recipient_id: client.email,
      category: 'checkin',
      type: 'feedback_sent',
      title: `${coachName} reviewed your check-in ✓`,
      body: checkIn.coach_notes
        ? checkIn.coach_notes.slice(0, 120) + (checkIn.coach_notes.length > 120 ? '…' : '')
        : 'Your coach has left feedback on your latest check-in.',
      is_read: false,
      action_label: 'View Feedback',
      link: '/portal/checkin',
      related_client_id: client.id,
      related_checkin_id: checkIn.id,
      priority: 'normal',
    });

    // Send email to client
    await sendEmail(
      client.email,
      client.name,
      `${coachName} reviewed your check-in ✓`,
      buildReviewedEmail(client, checkIn, coachName),
      coach?.email
    );

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});