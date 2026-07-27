/**
 * claudeAssistant tool executor (Step 5d) — the <action> tools the agentic
 * assistant can run, ported from base44/functions/claudeAssistant with ONE
 * deliberate change, applied to EVERY tool:
 *
 *   Base44 executed every tool asServiceRole with NO ownership checks — any
 *   authenticated coach could read/write ANY client, plan, program, check-in
 *   or badge by asking the assistant nicely. Multi-tenant correction: every
 *   tool resolves the target through the CALLER's ownership (clients.user_id /
 *   created_by via ownsClient; plans/check-ins through their owning client or
 *   created_by) and returns an error result instead of acting cross-tenant.
 *
 * Message/badge writes go through the shared automation executors
 * (_shared/automationActions.js) — the same write paths runAutomations and
 * the entity-event handlers use.
 *
 * Beyond the Base44 tool set this adds:
 *   - create_client: the assistant can onboard a brand-new client (weight,
 *     height, BMI, goal, …) — Base44 had no such tool, so "add this client and
 *     build them a plan" was impossible conversationally. Guarded by the same
 *     subscription client-limit gate the Clients UI enforces.
 *   - create_program / create_nutrition_plan now produce real STRUCTURED
 *     content (workouts / meals), not empty shells (see assistantGenerate.js).
 */
import { ownsClient } from './ownership.js';
import { sendMessage, awardBadge } from './automationActions.js';
import { tierLimits, createBlocked } from './subscriptionTiers.js';
import { generateProgramWorkouts, generateNutritionMeals } from './assistantGenerate.js';

const NOT_OWNED = (what = 'client') => ({ error: `Forbidden: ${what} not found or not owned by you` });

// ── Enum clamps (DB CHECK constraints reject anything off-list) ──────────────
const CLIENT_GOALS = ['weight_loss', 'muscle_gain', 'strength', 'endurance', 'flexibility', 'general_fitness'];
const GOAL_SYNONYMS = {
  fat_loss: 'weight_loss', weight_loss: 'weight_loss', lose_weight: 'weight_loss', cut: 'weight_loss', cutting: 'weight_loss',
  muscle_gain: 'muscle_gain', hypertrophy: 'muscle_gain', build_muscle: 'muscle_gain', bulk: 'muscle_gain', bulking: 'muscle_gain', gain_muscle: 'muscle_gain',
  strength: 'strength', powerlifting: 'strength',
  endurance: 'endurance', cardio: 'endurance', conditioning: 'endurance',
  flexibility: 'flexibility', mobility: 'flexibility',
  general_fitness: 'general_fitness', maintenance: 'general_fitness', recomp: 'general_fitness', recomposition: 'general_fitness', health: 'general_fitness',
};
function normalizeGoal(g) {
  if (!g) return 'general_fitness';
  const key = String(g).toLowerCase().trim().replace(/[\s-]+/g, '_');
  if (CLIENT_GOALS.includes(key)) return key;
  return GOAL_SYNONYMS[key] || 'general_fitness';
}

const LIFECYCLE = ['lead', 'active', 'at_risk', 'completed', 'alumni'];
const SEXES = ['male', 'female', 'other', 'prefer_not_to_say'];
const DIFFICULTIES = ['beginner', 'intermediate', 'advanced', 'elite'];
const CATEGORIES = ['strength', 'hypertrophy', 'fat_loss', 'athletic', 'mobility', 'custom'];
const clamp = (val, allowed, fallback) =>
  (val && allowed.includes(String(val).toLowerCase()) ? String(val).toLowerCase() : fallback);

// ── BMI from free-form height + weight (lbs) ─────────────────────────────────
function heightToMeters(h) {
  if (!h) return null;
  const s = String(h).trim().toLowerCase();
  let m = s.match(/([\d.]+)\s*cm/);
  if (m) return parseFloat(m[1]) / 100;
  m = s.match(/(\d+)\s*(?:'|ft|feet|foot)\s*(\d+(?:\.\d+)?)?/); // 5'10", 5 ft 10
  if (m) return ((parseFloat(m[1]) * 12) + (m[2] ? parseFloat(m[2]) : 0)) * 0.0254;
  m = s.match(/([\d.]+)\s*(?:in|inch|inches|")/);
  if (m) return parseFloat(m[1]) * 0.0254;
  m = s.match(/^([\d.]+)\s*m?$/); // bare metres like 1.78
  if (m) { const v = parseFloat(m[1]); if (v > 0 && v < 3) return v; }
  return null;
}
function computeBmi(height, weightLbs) {
  const meters = heightToMeters(height);
  const lbs = Number(weightLbs);
  if (!meters || !lbs) return null;
  const bmi = (lbs * 0.453592) / (meters * meters);
  return Number.isFinite(bmi) && bmi > 5 && bmi < 100 ? Math.round(bmi * 10) / 10 : null;
}

/** Does this nutrition plan belong to the caller (directly or via its client)? */
async function ownsPlan(svc, userId, planId) {
  if (!planId) return null;
  const { data: plan } = await svc.from('nutrition_plans').select('*').eq('id', planId).maybeSingle();
  if (!plan) return null;
  if (plan.created_by === userId) return plan;
  if (plan.client_id && await ownsClient(svc, userId, plan.client_id)) return plan;
  return null;
}

/**
 * @param ctx { profile } — the caller's profiles row, used for the subscription
 *   tier gate on create_client. Optional; falls back to the starter tier.
 */
export async function executeAssistantTool(svc, userId, toolName, input, ctx = {}) {
  try {
    switch (toolName) {
      case 'get_client_data': {
        const client = await ownsClient(svc, userId, input.client_id);
        if (!client) return NOT_OWNED();
        const { data: checkIns } = await svc.from('check_ins').select('*')
          .eq('client_id', client.id).order('date', { ascending: false }).limit(5);
        const { data: plan } = client.assigned_nutrition_id
          ? await svc.from('nutrition_plans').select('*').eq('id', client.assigned_nutrition_id).maybeSingle()
          : { data: null };
        return { client, recent_checkins: checkIns ?? [], nutrition_plan: plan };
      }

      case 'list_clients': {
        const { data: allClients } = await svc.from('clients').select('*')
          .or(`user_id.eq.${userId},created_by.eq.${userId}`)
          .order('name').limit(100);
        const filter = input.filter;
        const filtered = filter && filter !== 'all'
          ? (allClients ?? []).filter((c) => c.lifecycle_status === filter)
          : (allClients ?? []);
        return {
          clients: filtered.map((c) => ({
            id: c.id, name: c.name, status: c.lifecycle_status,
            goal: c.goal, assigned_nutrition_id: c.assigned_nutrition_id,
            assigned_program_id: c.assigned_program_id, current_weight: c.current_weight,
          })),
        };
      }

      case 'create_client': {
        if (!input.name) return { error: 'A client name is required.' };

        // Subscription client-limit gate — the same one the Clients UI calls
        // (validateSubscription: validate_create_client). Prevents the
        // assistant from being an end-run around plan limits.
        const tier = ctx?.profile?.subscription_tier || 'starter';
        const { count: clientCount } = await svc.from('clients')
          .select('id', { count: 'exact', head: true })
          .or(`user_id.eq.${userId},created_by.eq.${userId}`);
        if (createBlocked(tier, 'max_clients', clientCount ?? 0)) {
          return { error: `Client limit reached (${tierLimits(tier).max_clients} on the ${tier} plan). Upgrade to add more clients.` };
        }

        const bmi = input.bmi != null ? Number(input.bmi) : computeBmi(input.height, input.current_weight);
        const noteParts = [];
        if (input.notes) noteParts.push(input.notes);
        if (bmi) noteParts.push(`BMI: ${bmi}`);

        // email is NOT NULL in the schema — synthesise a placeholder if the
        // coach didn't supply one so onboarding isn't blocked on it.
        const slug = String(input.name).toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.|\.$/g, '') || 'client';
        const fields = {
          name: input.name,
          email: input.email || `${slug}@no-email.koach.local`,
          goal: normalizeGoal(input.goal),
          lifecycle_status: clamp(input.lifecycle_status, LIFECYCLE, 'active'),
          start_date: input.start_date || new Date().toISOString().slice(0, 10),
          user_id: userId,
          created_by: userId,
        };
        if (input.current_weight != null) fields.current_weight = Number(input.current_weight);
        // starting_weight defaults to the current weight so progress has a baseline.
        fields.starting_weight = input.starting_weight != null
          ? Number(input.starting_weight)
          : (input.current_weight != null ? Number(input.current_weight) : null);
        if (input.target_weight != null) fields.target_weight = Number(input.target_weight);
        if (input.height) fields.height = String(input.height);
        const sex = clamp(input.sex, SEXES, null);
        if (sex) fields.sex = sex;
        if (input.date_of_birth) fields.date_of_birth = input.date_of_birth;
        if (input.phone) fields.phone = String(input.phone);
        if (noteParts.length) fields.notes = noteParts.join('\n');

        const { data: client, error } = await svc.from('clients').insert(fields).select('id').single();
        if (error) return { error: error.message };
        return {
          success: true, client_id: client.id, bmi: bmi || undefined,
          message: `Added client ${input.name}` + (bmi ? ` (BMI ${bmi})` : ''),
        };
      }

      case 'create_nutrition_plan': {
        if (input.client_id && !(await ownsClient(svc, userId, input.client_id))) return NOT_OWNED();
        const trackingMode = input.tracking_mode === 'habits' ? 'habits' : 'macros';

        // Prefer meals the model supplied; otherwise generate a structured
        // meal plan server-side (macros mode only). Habits plans stay macro/
        // meal-free by design. Generation is best-effort — never blocks save.
        let meals = Array.isArray(input.meals) && input.meals.length ? input.meals : null;
        let generated = null;
        if (!meals && trackingMode === 'macros' && input.structured !== false) {
          generated = await generateNutritionMeals({
            goal: input.goal, calories: input.calories,
            protein_g: input.protein_g, carbs_g: input.carbs_g, fats_g: input.fats_g,
            meals_per_day: input.meals_per_day, diet: input.diet, allergies: input.allergies,
          });
          meals = generated?.meals || null;
        }

        const planFields = {
          title: input.title,
          calories: input.calories,
          protein_g: input.protein_g,
          carbs_g: input.carbs_g,
          fats_g: input.fats_g,
          tracking_mode: trackingMode,
          description: input.description || '',
          meals: meals || [],
          ai_generated: true,
          client_id: input.client_id || null,
          status: 'active',
          created_by: userId,
        };
        // Only write optional content columns when populated (keeps empty
        // text[]/jsonb defaults out of the insert).
        const clientNotes = input.client_notes || generated?.client_notes;
        const shopping = input.shopping_list || generated?.shopping_list;
        const hydration = input.hydration || generated?.hydration;
        if (clientNotes) planFields.client_notes = clientNotes;
        if (Array.isArray(shopping) && shopping.length) planFields.shopping_list = shopping;
        if (hydration) planFields.hydration = hydration;

        const { data: plan, error } = await svc.from('nutrition_plans').insert(planFields).select('id').single();
        if (error) return { error: error.message };
        if (input.client_id) {
          await svc.from('clients').update({ assigned_nutrition_id: plan.id }).eq('id', input.client_id);
        }
        const mealCount = (meals || []).length;
        return {
          success: true, plan_id: plan.id, meals: mealCount,
          message: `Created nutrition plan: ${input.title}` + (mealCount ? ` (${mealCount} meals)` : ' (macro targets)'),
        };
      }

      case 'update_nutrition_plan': {
        const plan = await ownsPlan(svc, userId, input.plan_id);
        if (!plan) return NOT_OWNED('nutrition plan');
        const fields = {};
        if (input.calories !== undefined) fields.calories = input.calories;
        if (input.protein_g !== undefined) fields.protein_g = input.protein_g;
        if (input.carbs_g !== undefined) fields.carbs_g = input.carbs_g;
        if (input.fats_g !== undefined) fields.fats_g = input.fats_g;
        if (input.title) fields.title = input.title;
        if (input.description) fields.description = input.description;
        if (Array.isArray(input.meals)) fields.meals = input.meals;
        const { error } = await svc.from('nutrition_plans').update(fields).eq('id', plan.id);
        if (error) return { error: error.message };
        return { success: true, message: 'Nutrition plan updated successfully' };
      }

      case 'create_program': {
        if (input.client_id && !(await ownsClient(svc, userId, input.client_id))) return NOT_OWNED();

        // Prefer workouts the model supplied; otherwise generate a structured
        // program server-side so the client actually has something to train.
        let workouts = Array.isArray(input.workouts) && input.workouts.length ? input.workouts : null;
        if (!workouts && input.structured !== false) {
          workouts = await generateProgramWorkouts({
            goal: input.goal, difficulty: input.difficulty,
            days_per_week: input.days_per_week, duration_weeks: input.duration_weeks,
            equipment: input.equipment, notes: input.description,
          });
        }

        const { data: prog, error } = await svc.from('workout_programs').insert({
          title: input.title,
          duration_weeks: input.duration_weeks,
          days_per_week: input.days_per_week,
          difficulty: clamp(input.difficulty, DIFFICULTIES, 'intermediate'),
          category: clamp(input.category, CATEGORIES, 'custom'),
          description: input.description || '',
          workouts: workouts || [],
          created_by: userId,
        }).select('id').single();
        if (error) return { error: error.message };
        if (input.client_id) {
          await svc.from('clients').update({ assigned_program_id: prog.id }).eq('id', input.client_id);
        }
        const dayCount = (workouts || []).length;
        return {
          success: true, program_id: prog.id, days: dayCount,
          message: `Created program: ${input.title}` + (dayCount ? ` (${dayCount} training days)` : ''),
        };
      }

      case 'update_client': {
        const client = await ownsClient(svc, userId, input.client_id);
        if (!client) return NOT_OWNED();
        const fields = {};
        if (input.goal) fields.goal = normalizeGoal(input.goal);
        if (input.lifecycle_status) fields.lifecycle_status = clamp(input.lifecycle_status, LIFECYCLE, client.lifecycle_status);
        if (input.notes) fields.notes = input.notes;
        if (input.tags) fields.tags = input.tags;
        if (input.target_weight != null) fields.target_weight = Number(input.target_weight);
        if (input.current_weight != null) fields.current_weight = Number(input.current_weight);
        if (input.height) fields.height = String(input.height);
        if (input.sex) { const s = clamp(input.sex, SEXES, null); if (s) fields.sex = s; }
        if (input.date_of_birth) fields.date_of_birth = input.date_of_birth;
        if (Object.keys(fields).length === 0) return { error: 'No updatable fields provided.' };
        const { error } = await svc.from('clients').update(fields).eq('id', client.id);
        if (error) return { error: error.message };
        return { success: true, message: 'Client profile updated' };
      }

      case 'flag_client_at_risk': {
        const client = await ownsClient(svc, userId, input.client_id);
        if (!client) return NOT_OWNED();
        const { error } = await svc.from('clients').update({
          lifecycle_status: 'at_risk',
          lifecycle_notes: '[AI Flag] ' + input.reason + ' (urgency: ' + (input.urgency || 'medium') + ')',
        }).eq('id', client.id);
        if (error) return { error: error.message };
        return { success: true, message: 'Client flagged as at-risk: ' + input.reason };
      }

      case 'send_message': {
        const client = await ownsClient(svc, userId, input.client_id);
        if (!client) return NOT_OWNED();
        await sendMessage(svc, {
          client_id: client.id, client_name: client.name,
          content: input.message, sender: 'coach', created_by: userId,
        });
        return { success: true, message: 'Message sent to client' };
      }

      case 'create_checkin_response': {
        const { data: checkIn } = await svc.from('check_ins').select('id, client_id').eq('id', input.checkin_id).maybeSingle();
        if (!checkIn || !(await ownsClient(svc, userId, checkIn.client_id))) return NOT_OWNED('check-in');
        const { error } = await svc.from('check_ins').update({
          coach_notes: input.response,
          review_status: input.review_status || 'reviewed',
          coach_responded: true,
        }).eq('id', checkIn.id);
        if (error) return { error: error.message };
        return { success: true, message: 'Check-in response submitted' };
      }

      case 'award_badge': {
        const client = await ownsClient(svc, userId, input.client_id);
        if (!client) return NOT_OWNED();
        await awardBadge(svc, null, {
          client_id: client.id, client_name: client.name,
          badge_key: input.badge_key, notes: input.notes || '',
        });
        return { success: true, message: 'Badge awarded: ' + input.badge_key };
      }

      default:
        return { error: 'Unknown tool: ' + toolName };
    }
  } catch (err) {
    return { error: err.message };
  }
}
