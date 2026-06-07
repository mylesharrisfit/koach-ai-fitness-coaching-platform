import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { to, toName, subject, html, replyTo, templateKey } = await req.json();

    if (!to || !subject || !html) {
      return Response.json({ error: 'Missing required fields: to, subject, html' }, { status: 400 });
    }

    const apiKey = Deno.env.get('RESEND_API_KEY');
    if (!apiKey) {
      return Response.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 });
    }

    const fromName = Deno.env.get('VITE_FROM_NAME') || 'KOACH AI';
    const fromEmail = Deno.env.get('VITE_FROM_EMAIL') || 'onboarding@resend.dev';

    const payload = {
      from: `${fromName} <${fromEmail}>`,
      to: [to],
      subject,
      html,
    };

    if (replyTo) {
      payload.reply_to = replyTo;
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      return Response.json({ error: result.message || 'Resend API error', details: result }, { status: 500 });
    }

    return Response.json({ success: true, id: result.id, templateKey });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});