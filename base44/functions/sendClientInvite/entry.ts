import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { clientName, clientEmail, welcomeMessage } = await req.json();
  if (!clientEmail) return Response.json({ error: 'Missing clientEmail' }, { status: 400 });

  const coachName = user.full_name || 'Your coach';
  const appUrl = 'https://koachai.net';

  // Build invite link with coach info and pre-filled email embedded in URL
  const inviteCode = btoa(`${clientEmail}:${user.id}:${Date.now()}`).replace(/=/g, '').slice(0, 24);
  const params = new URLSearchParams({
    coach: coachName,
    email: clientEmail,
    ...(welcomeMessage ? { welcome: welcomeMessage } : {}),
  });
  const joinUrl = `${appUrl}/join/${inviteCode}?${params.toString()}`;

  const subject = `${coachName} invited you to KOACH AI — set up your profile`;

  const body = `
Hi ${clientName || 'there'},

${coachName} has added you as a client on KOACH AI and wants you to set up your profile so they can build your personalized training and nutrition plan.

Click the link below to get started:
${joinUrl}

What you'll set up:
• Your account and personal profile
• Fitness background and goals
• Nutrition preferences
• Notification settings

This takes about 3 minutes and your coach will be notified when you're done.

${welcomeMessage ? `\nA note from ${coachName}:\n"${welcomeMessage}"\n` : ''}
Looking forward to working with you!

${coachName}
(via KOACH AI)
  `.trim();

  await base44.asServiceRole.integrations.Core.SendEmail({
    to: clientEmail,
    subject,
    body,
    from_name: coachName,
  });

  return Response.json({ success: true, joinUrl });
});