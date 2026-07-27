/**
 * Structured content generators for the claudeAssistant tools.
 *
 * The conversational assistant used to create workout programs with an empty
 * `workouts: []` array and nutrition plans with macros but no `meals` — so
 * "create a structured workout / meal plan for this client" produced a titled
 * shell with nothing to train or eat. These helpers let the create_program /
 * create_nutrition_plan tools fill that content server-side with a single,
 * focused LLM call (kept out of the chat turn's token budget), mirroring what
 * the UI's generateAIProgram / generateMealPlan functions produce.
 *
 * Both return `null` on any failure so the caller can fall back to the empty
 * shell — generation is best-effort and never blocks the assignment.
 */
import { invokeClaude, extractJson } from './anthropic.js';

/**
 * Build a structured `workouts[]` array (days -> exercises) from high-level
 * program parameters. Shape matches the WorkoutProgram.workouts schema the
 * coach profile / client portal render.
 */
export async function generateProgramWorkouts({
  goal, difficulty, days_per_week, duration_weeks, equipment, notes,
} = {}) {
  const dpw = Math.max(1, Math.min(Number(days_per_week) || 4, 7));
  const prompt = `Generate ONLY JSON for a ${dpw}-day-per-week resistance training program. No prose, no markdown.

Goal: ${goal || 'general fitness'}
Level: ${difficulty || 'intermediate'}
Duration: ${duration_weeks || 8} weeks
Equipment: ${equipment || 'full gym'}
${notes ? 'Notes: ' + notes : ''}

Return exactly this shape:
{"workouts":[{"day_name":"Day 1 - Upper Body","day_number":1,"workout_notes":"","exercises":[{"name":"Barbell Bench Press","sets":4,"reps":"6-8","rest_seconds":120,"rpe":"8","section":"main","notes":""}]}]}

Rules:
- Exactly ${dpw} training days, day_number 1..${dpw}, with a descriptive day_name.
- 4-7 exercises per day; compound lifts first, accessories after.
- reps is a STRING (e.g. "8-12"). sets/rest_seconds/rpe are appropriate to the goal and level.
- Use real, commonly known exercise names.`;

  try {
    const res = await invokeClaude({ prompt, maxTokens: 3500, expectJson: true });
    if (!res.ok) return null;
    const parsed = res.parsed || extractJson(res.text);
    const workouts = parsed?.workouts;
    if (!Array.isArray(workouts) || workouts.length === 0) return null;
    // Normalise day_number and guard exercise arrays.
    return workouts.map((w, i) => ({
      day_name: w.day_name || `Day ${i + 1}`,
      day_number: Number(w.day_number) || i + 1,
      workout_notes: w.workout_notes || '',
      exercises: Array.isArray(w.exercises) ? w.exercises : [],
    }));
  } catch (_e) {
    return null; // best-effort: caller falls back to an empty program shell
  }
}

/**
 * Build structured meals + supporting fields from macro targets. Returns the
 * subset of NutritionPlan columns the create tool writes, or null on failure.
 */
export async function generateNutritionMeals({
  goal, calories, protein_g, carbs_g, fats_g, meals_per_day, diet, allergies,
} = {}) {
  const numMeals = Math.max(2, Math.min(Number(meals_per_day) || 4, 6));
  const prompt = `Generate ONLY JSON for a daily nutrition plan. No prose, no markdown.

Goal: ${goal || 'maintenance'}
Daily targets: ${calories || 'sensible'} kcal | Protein ${protein_g || '?'}g | Carbs ${carbs_g || '?'}g | Fats ${fats_g || '?'}g
Meals per day: ${numMeals}
Diet style: ${diet || 'standard'}
Avoid: ${allergies || 'none'}

Return exactly this shape:
{"meals":[{"id":"meal_1","name":"Breakfast","time":"8:00 AM","calories":0,"protein":0,"carbs":0,"fats":0,"instructions":"","foods":[{"name":"Oats","amount":80,"unit":"g","amount_household":"1 cup","calories":0,"protein":0,"carbs":0,"fats":0}]}],"client_notes":"","shopping_list":["chicken breast","rice"],"hydration":{"daily_oz":100}}

Rules:
- Exactly ${numMeals} meals; per-meal macros should sum close to the daily targets.
- Real foods with realistic amounts. Keep it concise.
- shopping_list is an array of plain strings.`;

  try {
    const res = await invokeClaude({ prompt, maxTokens: 3500, expectJson: true });
    if (!res.ok) return null;
    const parsed = res.parsed || extractJson(res.text);
    if (!parsed || !Array.isArray(parsed.meals) || parsed.meals.length === 0) return null;
    return {
      meals: parsed.meals,
      client_notes: typeof parsed.client_notes === 'string' ? parsed.client_notes : '',
      // shopping_list column is text[] — coerce every entry to a string.
      shopping_list: Array.isArray(parsed.shopping_list)
        ? parsed.shopping_list.map((s) => String(s)).filter(Boolean)
        : [],
      hydration: parsed.hydration && typeof parsed.hydration === 'object' ? parsed.hydration : null,
    };
  } catch (_e) {
    return null; // best-effort: caller falls back to a macro-only plan
  }
}
