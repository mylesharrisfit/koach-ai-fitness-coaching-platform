import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    if (!payload.email || !payload.name) {
      return Response.json({ error: 'Name and email are required' }, { status: 400 });
    }

    // Create OnboardingResponse using service role — unauthenticated prospects can't write directly
    const record = await base44.asServiceRole.entities.OnboardingResponse.create({
      name: payload.name,
      email: payload.email,
      phone: payload.phone || '',
      age: payload.age ? Number(payload.age) : undefined,
      height: payload.height,
      current_weight: payload.current_weight ? Number(payload.current_weight) : undefined,
      goal: payload.goal || 'general_fitness',
      activity_level: payload.activity_level,
      training_days_per_week: payload.training_days_per_week,
      previous_experience: payload.previous_experience,
      food_preferences: payload.food_preferences,
      health_conditions: payload.health_conditions,
      motivation: payload.motivation,
      schedule_preferences: payload.schedule_preferences,
      coach_id: payload.coach_id,
      status: 'pending',
    });

    // Fire-and-forget: send emails + in-app notifications via existing function
    base44.asServiceRole.functions.invoke('onIntakeSubmitted', {
      intakeId: record.id,
      clientName: payload.name,
      clientEmail: payload.email,
      coachId: payload.coach_id,
    }).catch(e => console.error('onIntakeSubmitted follow-up error:', e));

    return Response.json({ success: true, id: record.id });
  } catch (error) {
    console.error('submitOnboardingIntake error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});