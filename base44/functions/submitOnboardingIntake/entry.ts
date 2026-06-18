import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    if (!payload.email || !payload.name) {
      return Response.json({ error: 'Name and email are required' }, { status: 400 });
    }

    // Fire-and-forget: send emails + in-app notifications
    base44.functions.invoke('onIntakeSubmitted', {
      clientName: payload.name,
      clientEmail: payload.email,
      coachId: payload.coach_id,
    }).catch(e => console.error('onIntakeSubmitted follow-up error:', e));

    return Response.json({ success: true });
  } catch (error) {
    console.error('submitOnboardingIntake error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});