import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { clientName, clientEmail } = await req.json();
  if (!clientEmail) return Response.json({ error: 'Missing clientEmail' }, { status: 400 });

  const coachName = user.full_name || 'Your coach';
  const appUrl = req.headers.get('origin') || 'https://app.fitforge.com';

  const subject = `${coachName} has added you to FitForge — set up your profile`;

  const body = `
Hi ${clientName || 'there'},

${coachName} has added you as a client on FitForge and wants you to set up your profile so they can personalise your training and nutrition plan.

Click the link below to get started:
${appUrl}/submit-checkin

What you'll be able to do:
• Complete your initial check-in and goals
• Track your daily progress and workouts
• Stay connected with your coach
• Access your personalised workout & nutrition plans

If you have any questions, just reply to this email or reach out to your coach directly.

Looking forward to working with you!

${coachName}
(via FitForge)
  `.trim();

  await base44.asServiceRole.integrations.Core.SendEmail({
    to: clientEmail,
    subject,
    body,
    from_name: coachName,
  });

  return Response.json({ success: true });
});