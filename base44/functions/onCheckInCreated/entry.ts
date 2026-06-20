import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const RESEND_KEY = Deno.env.get('RESEND_API_KEY');
const FROM_EMAIL = Deno.env.get('VITE_FROM_EMAIL') || 'noreply@koachai.com';
const FROM_NAME = Deno.env.get('VITE_FROM_NAME') || 'KOACH AI';
const APP_URL = 'https://app.koachai.com';

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

function buildCheckInEmail(client, checkIn, coachName) {
  const rows = [
    checkIn?.weight ? `<tr><td style="padding:12px 18px;font-size:14px;color:#64748B;border-bottom:1px solid #F1F5F9;">Weight</td><td style="padding:12px 18px;font-size:14px;font-weight:700;color:#0F172A;text-align:right;border-bottom:1px solid #F1F5F9;">${checkIn.weight} lbs</td></tr>` : '',
    checkIn?.compliance_training ? `<tr><td style="padding:12px 18px;font-size:14px;color:#64748B;border-bottom:1px solid #F1F5F9;">Training Compliance</td><td style="padding:12px 18px;font-size:14px;font-weight:700;color:#2563EB;text-align:right;border-bottom:1px solid #F1F5F9;">${checkIn.compliance_training}%</td></tr>` : '',
    checkIn?.compliance_nutrition ? `<tr><td style="padding:12px 18px;font-size:14px;color:#64748B;border-bottom:1px solid #F1F5F9;">Nutrition Compliance</td><td style="padding:12px 18px;font-size:14px;font-weight:700;color:#0F172A;text-align:right;border-bottom:1px solid #F1F5F9;">${checkIn.compliance_nutrition}%</td></tr>` : '',
    checkIn?.mood ? `<tr><td style="padding:12px 18px;font-size:14px;color:#64748B;">Mood</td><td style="padding:12px 18px;font-size:14px;font-weight:700;color:#0F172A;text-align:right;">${checkIn.mood}</td></tr>` : '',
  ].filter(Boolean).join('');

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#F3F4F6;font-family:-apple-system,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F3F4F6;padding:24px 12px;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
<tr><td style="height:4px;background:linear-gradient(135deg,#2563EB,#7C3AED);"></td></tr>
<tr><td style="padding:24px 36px 18px;background:#0F172A;"><span style="font-size:18px;font-weight:900;color:#fff;">KOACH AI</span></td></tr>
<tr><td style="padding:28px 36px 20px;background:linear-gradient(160deg,#0F172A,#1E293B);">
  <h1 style="margin:0 0 8px;font-size:24px;font-weight:900;color:#fff;">📋 New Check-in from ${client?.name?.split(' ')[0]}</h1>
  <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.55);">Review and respond to keep your client motivated.</p>
</td></tr>
<tr><td style="padding:32px 36px;">
  <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.7;"><strong>${client?.name}</strong> just submitted their check-in.</p>
  ${rows ? `<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E2E8F0;border-radius:12px;overflow:hidden;margin:16px 0;">${rows}</table>` : ''}
  ${checkIn?.notes ? `<div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:12px;padding:16px 18px;margin:16px 0;"><p style="margin:0;font-size:14px;color:#374151;font-style:italic;">"${checkIn.notes.slice(0, 200)}"</p></div>` : ''}
  <table cellpadding="0" cellspacing="0" style="margin:20px 0 0;"><tr><td style="background:linear-gradient(135deg,#2563EB,#7C3AED);border-radius:10px;">
    <a href="${APP_URL}/checkin-review" style="display:block;padding:14px 28px;color:#fff;font-weight:800;font-size:15px;text-decoration:none;">Review Check-in →</a>
  </td></tr></table>
</td></tr>
<tr><td style="padding:16px 36px 20px;background:#F8FAFC;border-top:1px solid #F1F5F9;">
  <p style="margin:0;font-size:12px;color:#94A3B8;">${coachName} · KOACH AI · <a href="${APP_URL}/unsubscribe" style="color:#94A3B8;">Unsubscribe</a></p>
</td></tr>
</table></td></tr></table></body></html>`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const checkIn = payload.data;
    if (!checkIn) return Response.json({ ok: true });

    const allUsers = await base44.asServiceRole.entities.User.list();

    // Notify the client's owning coach first, fall back to all admins
    let coaches = [];
    if (checkIn.client_id) {
      const clients = await base44.asServiceRole.entities.Client.filter({ id: checkIn.client_id });
      const client = clients?.[0];
      if (client?.created_by_id) {
        const owner = allUsers.find(u => u.id === client.created_by_id);
        if (owner) coaches = [owner];
      }
    }
    if (coaches.length === 0) {
      coaches = allUsers.filter(u => u.role === 'admin');
    }

    // Create in-app notifications
    await Promise.all(coaches.map(coach =>
      base44.asServiceRole.entities.Notification.create({
        recipient_id: coach.email,
        category: 'checkin',
        type: 'checkin_received',
        title: `New check-in from ${checkIn.client_name || 'a client'} 📋`,
        body: checkIn.notes
          ? `"${checkIn.notes.slice(0, 80)}${checkIn.notes.length > 80 ? '…' : ''}"`
          : `Submitted on ${checkIn.date}`,
        client_name: checkIn.client_name,
        is_read: false,
        action_label: 'Review',
        link: '/checkin-review',
        related_client_id: checkIn.client_id,
        related_checkin_id: checkIn.id,
        priority: 'normal',
      })
    ));

    // Send email to each coach
    const client = { name: checkIn.client_name, id: checkIn.client_id };
    await Promise.all(coaches.map(coach => {
      const html = buildCheckInEmail(client, checkIn, coach.full_name || 'Coach');
      return sendEmail(
        coach.email,
        coach.full_name,
        `${checkIn.client_name} submitted their check-in 📋`,
        html,
        null
      );
    }));

    return Response.json({ ok: true, notified: coaches.length });
  } catch (error) {
    console.error('onCheckInCreated error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});