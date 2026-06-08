import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const FROM_EMAIL = 'support@koachai.net';
const FROM_NAME = 'KOACH AI';
const APP_URL = 'https://koachai.net';

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
  const data = await res.json();
  if (!res.ok) console.error('Resend error:', data);
  return data;
}

function buildClientConfirmEmail({ clientName, coachName }) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#F3F4F6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F3F4F6;padding:24px 12px;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
  <tr><td style="height:4px;background:linear-gradient(135deg,#2563EB,#7C3AED);"></td></tr>
  <tr><td style="padding:28px 36px;background:#0F172A;">
    <span style="font-size:20px;font-weight:900;color:#fff;letter-spacing:-0.5px;">KOACH AI</span>
  </td></tr>
  <tr><td style="padding:36px 36px 24px;">
    <h1 style="margin:0 0 12px;font-size:26px;font-weight:900;color:#0F172A;letter-spacing:-0.5px;">You're in! 🎉</h1>
    <p style="margin:0 0 20px;font-size:16px;color:#374151;line-height:1.7;">
      Hey <strong>${clientName}</strong>,
    </p>
    <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.7;">
      Thanks for completing your intake — your application has been received and is now in your coach's hands.
    </p>
    <div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:12px;padding:20px 24px;margin:0 0 24px;">
      <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#1D4ED8;text-transform:uppercase;letter-spacing:0.05em;">What happens next</p>
      <table cellpadding="0" cellspacing="0" width="100%">
        ${['Your coach reviews your full intake profile.', 'A personalized training & nutrition plan gets built for you.', `${coachName || 'Your coach'} will reach out to you within 24 hours to get started.`].map((step, i) => `
        <tr>
          <td style="padding:6px 0;vertical-align:top;width:28px;">
            <div style="width:22px;height:22px;background:#2563EB;border-radius:50%;text-align:center;line-height:22px;font-size:11px;font-weight:800;color:#fff;">${i + 1}</div>
          </td>
          <td style="padding:6px 0 6px 10px;font-size:14px;color:#374151;line-height:1.6;">${step}</td>
        </tr>`).join('')}
      </table>
    </div>
    <p style="margin:0;font-size:14px;color:#6B7280;line-height:1.7;">
      In the meantime, sit tight — your transformation is about to begin. If you have any questions, just reply to this email.
    </p>
  </td></tr>
  <tr><td style="padding:20px 36px 28px;background:#F8FAFC;border-top:1px solid #F1F5F9;">
    <p style="margin:0;font-size:12px;color:#94A3B8;">© KOACH AI · <a href="${APP_URL}" style="color:#94A3B8;text-decoration:none;">koachai.net</a> · This email was sent to confirm your coaching intake submission.</p>
  </td></tr>
</table></td></tr></table>
</body></html>`;
}

function buildCoachNotifyEmail({ coachName, clientName, clientEmail, submittedAt }) {
  const date = new Date(submittedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#F3F4F6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F3F4F6;padding:24px 12px;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
  <tr><td style="height:4px;background:linear-gradient(135deg,#2563EB,#7C3AED);"></td></tr>
  <tr><td style="padding:28px 36px;background:#0F172A;">
    <span style="font-size:20px;font-weight:900;color:#fff;letter-spacing:-0.5px;">KOACH AI</span>
  </td></tr>
  <tr><td style="padding:36px 36px 28px;">
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:900;color:#0F172A;letter-spacing:-0.5px;">📋 New Intake Submitted</h1>
    <p style="margin:0 0 24px;font-size:14px;color:#6B7280;">Received ${date}</p>
    <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.7;">
      Hey ${coachName || 'Coach'} — <strong>${clientName}</strong> just completed your client intake form and is pending review.
    </p>
    <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:16px 20px;margin:0 0 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:8px 0;font-size:13px;color:#6B7280;border-bottom:1px solid #F1F5F9;">Client</td>
          <td style="padding:8px 0;font-size:13px;font-weight:700;color:#0F172A;text-align:right;border-bottom:1px solid #F1F5F9;">${clientName}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;font-size:13px;color:#6B7280;">Email</td>
          <td style="padding:8px 0;font-size:13px;color:#0F172A;text-align:right;">${clientEmail}</td>
        </tr>
      </table>
    </div>
    <table cellpadding="0" cellspacing="0"><tr><td style="background:linear-gradient(135deg,#2563EB,#1D4ED8);border-radius:10px;">
      <a href="${APP_URL}/onboarding-manager" style="display:block;padding:14px 28px;color:#fff;font-weight:800;font-size:15px;text-decoration:none;">Review Intake →</a>
    </td></tr></table>
  </td></tr>
  <tr><td style="padding:16px 36px 20px;background:#F8FAFC;border-top:1px solid #F1F5F9;">
    <p style="margin:0;font-size:12px;color:#94A3B8;">KOACH AI · <a href="${APP_URL}" style="color:#94A3B8;text-decoration:none;">koachai.net</a></p>
  </td></tr>
</table></td></tr></table>
</body></html>`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { intakeId, clientName, clientEmail, coachId } = await req.json();

    if (!clientEmail || !clientName) {
      return Response.json({ error: 'Missing clientEmail or clientName' }, { status: 400 });
    }

    const apiKey = Deno.env.get('RESEND_API_KEY');
    const submittedAt = new Date().toISOString();

    // Find the coach (admin user matching coachId/email)
    let coachName = 'Your Coach';
    let coachEmail = null;
    try {
      const users = await base44.asServiceRole.entities.User.list();
      const admins = users.filter(u => u.role === 'admin');
      // Match by email (coachId is the coach email passed as URL param)
      const matched = coachId ? admins.find(u => u.email === decodeURIComponent(coachId) || u.id === coachId) : admins[0];
      const coach = matched || admins[0];
      if (coach) {
        coachName = coach.full_name || 'Your Coach';
        coachEmail = coach.email;
      }
    } catch (e) {
      console.error('Could not fetch coach:', e.message);
    }

    // 1. Send confirmation email to client
    await sendEmail(
      apiKey,
      clientEmail,
      `You're in, ${clientName} — intake received ✅`,
      buildClientConfirmEmail({ clientName, coachName })
    );

    // 2. Send notification email to coach
    if (coachEmail) {
      await sendEmail(
        apiKey,
        coachEmail,
        `New intake from ${clientName} — pending review 📋`,
        buildCoachNotifyEmail({ coachName, clientName, clientEmail, submittedAt })
      );
    }

    // 3. Create in-app notification for coach(es)
    try {
      const users = await base44.asServiceRole.entities.User.list();
      const admins = users.filter(u => u.role === 'admin');
      await Promise.all(admins.map(admin =>
        base44.asServiceRole.entities.Notification.create({
          recipient_id: admin.email,
          category: 'intake',
          type: 'intake_submitted',
          title: `New intake from ${clientName} 📋`,
          body: `${clientName} (${clientEmail}) completed your intake form and is pending review.`,
          client_name: clientName,
          is_read: false,
          action_label: 'Review',
          link: '/onboarding-manager',
          priority: 'high',
        })
      ));
    } catch (e) {
      console.error('In-app notification error:', e.message);
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('onIntakeSubmitted error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});