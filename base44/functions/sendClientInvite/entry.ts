import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const APP_URL = 'https://koachai.net';

function buildInviteEmailHtml({ clientName, coachName, setupUrl, welcomeMessage }) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#F3F4F6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F3F4F6;padding:24px 12px;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
  <tr><td style="height:4px;background:linear-gradient(135deg,#2563EB,#7C3AED);"></td></tr>
  <tr><td style="padding:28px 36px;background:#0F172A;">
    <span style="font-size:20px;font-weight:900;color:#fff;letter-spacing:-0.5px;">KOACH AI</span>
  </td></tr>
  <tr><td style="padding:36px 36px 24px;">
    <h1 style="margin:0 0 12px;font-size:26px;font-weight:900;color:#0F172A;letter-spacing:-0.5px;">You've been invited! 🎉</h1>
    <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.7;">
      Hi <strong>${clientName || 'there'}</strong>,
    </p>
    <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.7;">
      <strong>${coachName}</strong> has added you as a client on KOACH AI and wants you to set up your account so they can build your personalized training and nutrition plan.
    </p>
    ${welcomeMessage ? `
    <div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:12px;padding:16px 20px;margin:0 0 20px;">
      <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#1D4ED8;text-transform:uppercase;letter-spacing:0.05em;">A note from ${coachName}</p>
      <p style="margin:0;font-size:14px;color:#374151;line-height:1.7;">"${welcomeMessage}"</p>
    </div>` : ''}
    <div style="background:#F8FAFC;border-radius:12px;padding:16px 20px;margin:0 0 24px;">
      <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#0F172A;">What happens next:</p>
      <p style="margin:0 0 6px;font-size:13px;color:#64748B;">1. Click the button below to create your account</p>
      <p style="margin:0 0 6px;font-size:13px;color:#64748B;">2. Your profile gets linked to your coach automatically</p>
      <p style="margin:0;font-size:13px;color:#64748B;">3. Access your personalized plan in the portal</p>
    </div>
    <table cellpadding="0" cellspacing="0"><tr><td style="background:linear-gradient(135deg,#2563EB,#1D4ED8);border-radius:10px;">
      <a href="${setupUrl}" style="display:block;padding:16px 32px;color:#fff;font-weight:800;font-size:16px;text-decoration:none;">Set Up My Account →</a>
    </td></tr></table>
    <p style="margin:20px 0 0;font-size:12px;color:#94A3B8;">
      Or copy this link: <a href="${setupUrl}" style="color:#2563EB;">${setupUrl}</a>
    </p>
    <p style="margin:12px 0 0;font-size:11px;color:#CBD5E1;">This invite link expires in 7 days.</p>
  </td></tr>
  <tr><td style="padding:16px 36px 20px;background:#F8FAFC;border-top:1px solid #F1F5F9;">
    <p style="margin:0;font-size:12px;color:#94A3B8;">© KOACH AI · <a href="${APP_URL}" style="color:#94A3B8;text-decoration:none;">koachai.net</a> · You received this because ${coachName} added you as a client.</p>
  </td></tr>
</table></td></tr></table>
</body></html>`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { clientName, clientEmail, clientId, welcomeMessage } = await req.json();
    if (!clientEmail) return Response.json({ error: 'Missing clientEmail' }, { status: 400 });
    if (!clientId)    return Response.json({ error: 'Missing clientId' }, { status: 400 });

    const coachName = user.full_name || 'Your coach';

    // 1. Generate a secure random token (32 hex bytes = 64 chars)
    const tokenBytes = new Uint8Array(32);
    crypto.getRandomValues(tokenBytes);
    const token = Array.from(tokenBytes).map(b => b.toString(16).padStart(2, '0')).join('');

    // 2. Expiry: 7 days from now
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    // 3. Store token + expiry on the Client record
    await base44.asServiceRole.entities.Client.update(clientId, {
      invite_token: token,
      invite_token_expires: expires,
    });

    // 4. Build the invite URL pointing to the new /client-setup route
    const setupUrl = `${APP_URL}/client-setup/${token}`;

    // 5. Send the invite email via sendEmailNotification (Resend-based)
    const html = buildInviteEmailHtml({ clientName, coachName, setupUrl, welcomeMessage });

    await base44.functions.invoke('sendEmailNotification', {
      to: clientEmail,
      toName: clientName,
      subject: `${coachName} invited you to KOACH AI — set up your account`,
      html,
    });

    return Response.json({ success: true, setupUrl });
  } catch (error) {
    console.error('sendClientInvite error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});