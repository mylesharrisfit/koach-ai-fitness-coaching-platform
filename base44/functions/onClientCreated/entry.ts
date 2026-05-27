import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const RESEND_KEY = Deno.env.get('VITE_RESEND_API_KEY');
const FROM_EMAIL = Deno.env.get('VITE_FROM_EMAIL') || 'noreply@koachai.com';
const FROM_NAME = Deno.env.get('VITE_FROM_NAME') || 'KOACH AI';
const APP_URL = 'https://app.koachai.com';
const PORTAL_URL = `${APP_URL}/portal`;

async function sendEmail(to, toName, subject, html, replyTo) {
  if (!RESEND_KEY || !to) return;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: toName ? [`${toName} <${to}>`] : [to],
      subject, html,
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  });
  if (!res.ok) console.error('Email failed:', await res.text());
}

function buildWelcomeEmail(client, coachName, coachEmail) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#F3F4F6;font-family:-apple-system,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F3F4F6;padding:24px 12px;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
<tr><td style="height:4px;background:linear-gradient(135deg,#2563EB,#7C3AED);"></td></tr>
<tr><td style="padding:24px 36px 18px;background:#0F172A;"><span style="font-size:18px;font-weight:900;color:#fff;">KOACH AI</span></td></tr>
<tr><td style="padding:28px 36px 20px;background:linear-gradient(160deg,#0F172A,#1E293B);">
  <h1 style="margin:0 0 8px;font-size:26px;font-weight:900;color:#fff;">🎉 Welcome, ${client?.name?.split(' ')[0]}!</h1>
  <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.55);">${coachName} is ready to help you reach your goals.</p>
</td></tr>
<tr><td style="padding:32px 36px;">
  <p style="margin:0 0 14px;font-size:15px;color:#374151;line-height:1.7;">Hi ${client?.name?.split(' ')[0]},</p>
  <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.7;">I'm so excited to have you on board! Here's what to do first:</p>
  <div style="background:#F8FAFC;border-radius:12px;padding:20px 24px;margin:0 0 20px;">
    <p style="margin:0 0 12px;font-size:14px;"><strong style="color:#0F172A;">1. Access your portal</strong> <span style="color:#64748B;">— Log in to see your personalized plan</span></p>
    <p style="margin:0 0 12px;font-size:14px;"><strong style="color:#0F172A;">2. Complete your profile</strong> <span style="color:#64748B;">— Add measurements and fitness goals</span></p>
    <p style="margin:0;font-size:14px;"><strong style="color:#0F172A;">3. Check your program</strong> <span style="color:#64748B;">— Your training plan is ready to go!</span></p>
  </div>
  <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.7;">Any questions? Just reply to this email — I'm here for you every step of the way! 💪</p>
  <p style="margin:0;font-size:15px;color:#64748B;font-style:italic;">— ${coachName}</p>
  <table cellpadding="0" cellspacing="0" style="margin:24px 0 0;"><tr><td style="background:linear-gradient(135deg,#2563EB,#7C3AED);border-radius:10px;">
    <a href="${PORTAL_URL}" style="display:block;padding:14px 28px;color:#fff;font-weight:800;font-size:15px;text-decoration:none;">Access My Portal →</a>
  </td></tr></table>
</td></tr>
<tr><td style="padding:16px 36px 20px;background:#F8FAFC;border-top:1px solid #F1F5F9;">
  <p style="margin:0;font-size:12px;color:#94A3B8;">${coachName} · KOACH AI · <a href="${APP_URL}/unsubscribe" style="color:#94A3B8;">Unsubscribe</a></p>
</td></tr>
</table></td></tr></table></body></html>`;
}

function buildNewClientCoachEmail(client, coachName) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#F3F4F6;font-family:-apple-system,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F3F4F6;padding:24px 12px;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
<tr><td style="height:4px;background:linear-gradient(135deg,#2563EB,#7C3AED);"></td></tr>
<tr><td style="padding:24px 36px 18px;background:#0F172A;"><span style="font-size:18px;font-weight:900;color:#fff;">KOACH AI</span></td></tr>
<tr><td style="padding:28px 36px 20px;background:linear-gradient(160deg,#0F172A,#1E293B);">
  <h1 style="margin:0 0 8px;font-size:24px;font-weight:900;color:#fff;">💪 New Client Joined!</h1>
  <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.55);">${client?.name} has been added to your roster.</p>
</td></tr>
<tr><td style="padding:32px 36px;">
  <div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:12px;padding:18px 20px;margin:0 0 18px;">
    <p style="margin:0 0 4px;font-size:17px;font-weight:900;color:#0F172A;">${client?.name}</p>
    <p style="margin:0;font-size:13px;color:#64748B;">${client?.email || '—'}</p>
  </div>
  <p style="margin:0 0 18px;font-size:15px;color:#374151;line-height:1.7;">Next step: assign them a program and send a welcome message to kick things off right! 🚀</p>
  <table cellpadding="0" cellspacing="0" style="margin:0;"><tr><td style="background:linear-gradient(135deg,#2563EB,#7C3AED);border-radius:10px;">
    <a href="${APP_URL}/clients" style="display:block;padding:14px 28px;color:#fff;font-weight:800;font-size:15px;text-decoration:none;">View Client Profile →</a>
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
    const body = await req.json();
    const { data: client } = body;

    if (!client || !client.id) {
      return Response.json({ skipped: true, reason: 'No client data' });
    }

    // Find coach defaults
    const allDefaults = await base44.asServiceRole.entities.CoachDefaults.list();
    const defaults = allDefaults?.[0];
    const updates = {};

    if (defaults?.default_program_id && !client.assigned_program_id) {
      updates.assigned_program_id = defaults.default_program_id;
    }
    if (defaults?.default_nutrition_id && !client.assigned_nutrition_id) {
      updates.assigned_nutrition_id = defaults.default_nutrition_id;
    }
    if (Object.keys(updates).length > 0) {
      await base44.asServiceRole.entities.Client.update(client.id, updates);
    }

    // Welcome message
    if (defaults?.send_welcome_message && defaults.welcome_message) {
      await base44.asServiceRole.entities.Message.create({
        client_id: client.id,
        client_name: client.name,
        sender: 'coach',
        content: defaults.welcome_message,
        tag: 'general',
      });
    }

    // Find coach users (admins) to notify
    const users = await base44.asServiceRole.entities.User.list();
    const coaches = users.filter(u => u.role === 'admin');

    // In-app notification to coach
    await Promise.all(coaches.map(coach =>
      base44.asServiceRole.entities.Notification.create({
        recipient_id: coach.email,
        category: 'client',
        type: 'new_client',
        title: `New client: ${client.name} 🎉`,
        body: `${client.name} has been added. ${Object.keys(updates).length > 0 ? 'Plans auto-assigned.' : ''}`,
        client_name: client.name,
        is_read: false,
        action_label: 'View Profile',
        link: `/client-profile?id=${client.id}`,
        priority: 'normal',
      })
    ));

    // Email to coach
    await Promise.all(coaches.map(coach =>
      sendEmail(
        coach.email,
        coach.full_name,
        `${client.name} just joined your roster! 💪`,
        buildNewClientCoachEmail(client, coach.full_name || 'Coach'),
        null
      )
    ));

    // Welcome email to client (if they have an email)
    if (client.email) {
      const primaryCoach = coaches[0];
      const coachName = primaryCoach?.full_name || 'Your Coach';
      const coachEmail = primaryCoach?.email;
      await sendEmail(
        client.email,
        client.name,
        `Welcome to ${coachName}'s coaching! Your journey starts now 💪`,
        buildWelcomeEmail(client, coachName, coachEmail),
        coachEmail
      );
    }

    return Response.json({
      success: true,
      client_id: client.id,
      updates_applied: updates,
    });
  } catch (error) {
    console.error('onClientCreated error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});