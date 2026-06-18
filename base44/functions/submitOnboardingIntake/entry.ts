import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Goal enum mapping: form picker IDs → entity enum values
const GOAL_MAP = {
  fat_loss: 'fat_loss',
  muscle_gain: 'muscle_gain',
  strength: 'strength',
  hybrid: 'hybrid',
  endurance: 'endurance',
  confidence: 'general_fitness',
  energy: 'general_fitness',
  athletic: 'endurance',
  general_health: 'general_fitness',
  lifestyle: 'general_fitness',
};

// Activity level mapping: form display strings → entity enum values
const ACTIVITY_MAP = {
  'Mostly sitting': 'sedentary',
  'Light movement': 'lightly_active',
  'Moderately active': 'moderately_active',
  'Very active': 'very_active',
  'Athlete-level': 'athlete',
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const { name, email, coachId, formData } = payload;

    if (!name || !email) {
      return Response.json({ success: false, error: 'Name and email are required' }, { status: 400 });
    }

    const d = formData || {};

    // Map goal: take first selected goal and map to valid enum
    const rawGoal = (d.goals || [])[0] || 'general_fitness';
    const mappedGoal = GOAL_MAP[rawGoal] || 'general_fitness';

    // Map activity level display string to enum
    const mappedActivityLevel = ACTIVITY_MAP[d.activity_level] || d.activity_level || undefined;

    const record = await base44.asServiceRole.entities.OnboardingResponse.create({
      name,
      email,
      phone: d.phone || undefined,
      age: d.age ? Number(d.age) : undefined,
      height: d.height || undefined,
      current_weight: d.current_weight ? Number(d.current_weight) : undefined,
      goal: mappedGoal,
      activity_level: mappedActivityLevel,
      training_days_per_week: d.training_days_per_week ? Number(d.training_days_per_week) : undefined,
      previous_experience: d.experience || undefined,
      food_preferences: [
        d.fav_foods?.length ? `Likes: ${d.fav_foods.join(', ')}` : '',
        d.disliked_foods ? `Dislikes: ${d.disliked_foods}` : '',
        d.dietary_restrictions?.length ? `Dietary: ${d.dietary_restrictions.join(', ')}` : '',
        d.food_allergies?.length ? `Allergies: ${d.food_allergies.join(', ')}` : '',
        d.allergy_notes ? `Allergy notes: ${d.allergy_notes}` : '',
      ].filter(Boolean).join(' | ') || undefined,
      health_conditions: [
        (d.injuries || []).join(', '),
        (d.medical_conditions || []).join(', '),
        d.medications ? `Medications: ${d.medications}` : '',
        d.parq_answer ? `PAR-Q heart condition: ${d.parq_answer}` : '',
        d.health_notes || '',
      ].filter(Boolean).join(' | ') || undefined,
      motivation: d.motivation || undefined,
      schedule_preferences: [
        d.work_schedule || '',
        `Equipment: ${d.equipment_access || 'not specified'}`,
        d.equipment_notes ? `Equipment notes: ${d.equipment_notes}` : '',
        d.training_styles?.join(', ') || '',
        `Training days: ${d.training_days_per_week}/week`,
        d.sleep_quality ? `Sleep: ${d.sleep_quality}/10` : '',
        d.stress_level ? `Stress: ${d.stress_level}/10` : '',
        d.water_intake ? `Water: ${d.water_intake}/10` : '',
        d.alcohol_frequency ? `Alcohol: ${d.alcohol_frequency}` : '',
        d.commitment_level ? `Commitment: ${d.commitment_level}/10` : '',
        (d.obstacles || []).length ? `Obstacles: ${d.obstacles.join(', ')}` : '',
        d.training_history ? `Training history: ${d.training_history}` : '',
        d.anything_else ? `Additional notes: ${d.anything_else}` : '',
        'Consent agreed: Yes',
      ].filter(Boolean).join(' | '),
      coach_id: coachId || undefined,
      status: 'pending',
    });

    // Fire-and-forget notification (non-blocking)
    base44.asServiceRole.integrations.Core.SendEmail({
      to: email,
      subject: 'Your application has been received!',
      body: `Hi ${name},\n\nThank you for completing your intake form. Your coach will review your profile and reach out shortly.\n\nKOACH AI`,
    }).catch(e => console.error('Confirmation email error:', e));

    return Response.json({ success: true, id: record.id });
  } catch (error) {
    console.error('submitOnboardingIntake error:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});