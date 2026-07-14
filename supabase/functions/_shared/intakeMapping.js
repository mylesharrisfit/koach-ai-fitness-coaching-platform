/**
 * Public-intake form → onboarding_responses row mapping (Step 5c) — the
 * mapping logic of base44/functions/submitOnboardingIntake, kept in _shared so
 * the submitOnboardingIntake edge function and the local rehearsal build the
 * SAME row (and the rehearsal proves it satisfies the new CHECK constraints
 * the schema-less Base44 entity never had).
 */

// Goal enum mapping: form picker IDs → entity enum values (verbatim Base44)
export const GOAL_MAP = {
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

// Activity level mapping: form display strings → entity enum values (verbatim)
export const ACTIVITY_MAP = {
  'Mostly sitting': 'sedentary',
  'Light movement': 'lightly_active',
  'Moderately active': 'moderately_active',
  'Very active': 'very_active',
  'Athlete-level': 'athlete',
};

// Experience mapping: form ids → previous_experience CHECK values. The form's
// 'intermediate' ("1–3 years of consistent training") maps to 'experienced';
// Base44 stored the raw string because its entity had no constraint.
export const EXPERIENCE_MAP = {
  none: 'none',
  beginner: 'beginner',
  some: 'some',
  intermediate: 'experienced',
  experienced: 'experienced',
  advanced: 'advanced',
};

const ACTIVITY_ENUM = ['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'athlete'];

/** Build the onboarding_responses insert row from the public intake payload. */
export function buildIntakeRow({ name, email, formData }, coach_id) {
  const d = formData || {};

  const rawGoal = (d.goals || [])[0] || 'general_fitness';
  const mappedGoal = GOAL_MAP[rawGoal] || 'general_fitness';

  const mappedActivityLevel = ACTIVITY_MAP[d.activity_level]
    || (ACTIVITY_ENUM.includes(d.activity_level) ? d.activity_level : null);

  const mappedExperience = EXPERIENCE_MAP[d.experience] || null;

  return {
    name,
    email,
    phone: d.phone || null,
    age: d.age ? Number(d.age) : null,
    height: d.height || null,
    current_weight: d.current_weight ? Number(d.current_weight) : null,
    goal: mappedGoal,
    activity_level: mappedActivityLevel,
    training_days_per_week: d.training_days_per_week ? Number(d.training_days_per_week) : null,
    previous_experience: mappedExperience,
    food_preferences: [
      d.fav_foods?.length ? `Likes: ${d.fav_foods.join(', ')}` : '',
      d.disliked_foods ? `Dislikes: ${d.disliked_foods}` : '',
      d.dietary_restrictions?.length ? `Dietary: ${d.dietary_restrictions.join(', ')}` : '',
      d.food_allergies?.length ? `Allergies: ${d.food_allergies.join(', ')}` : '',
      d.allergy_notes ? `Allergy notes: ${d.allergy_notes}` : '',
    ].filter(Boolean).join(' | ') || null,
    health_conditions: [
      (d.injuries || []).join(', '),
      (d.medical_conditions || []).join(', '),
      d.medications ? `Medications: ${d.medications}` : '',
      d.parq_answer ? `PAR-Q heart condition: ${d.parq_answer}` : '',
      d.health_notes || '',
    ].filter(Boolean).join(' | ') || null,
    motivation: d.motivation || null,
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
      mappedExperience === null && d.experience ? `Experience (unmapped): ${d.experience}` : '',
      'Consent agreed: Yes',
    ].filter(Boolean).join(' | '),
    coach_id,
    status: 'pending',
    created_by: null, // public submission — no authenticated creator
  };
}
