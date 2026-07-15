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
 */
import { ownsClient } from './ownership.js';
import { sendMessage, awardBadge } from './automationActions.js';

const NOT_OWNED = (what = 'client') => ({ error: `Forbidden: ${what} not found or not owned by you` });

/** Does this nutrition plan belong to the caller (directly or via its client)? */
async function ownsPlan(svc, userId, planId) {
  if (!planId) return null;
  const { data: plan } = await svc.from('nutrition_plans').select('*').eq('id', planId).maybeSingle();
  if (!plan) return null;
  if (plan.created_by === userId) return plan;
  if (plan.client_id && await ownsClient(svc, userId, plan.client_id)) return plan;
  return null;
}

export async function executeAssistantTool(svc, userId, toolName, input) {
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

      case 'create_nutrition_plan': {
        if (input.client_id && !(await ownsClient(svc, userId, input.client_id))) return NOT_OWNED();
        const { data: plan, error } = await svc.from('nutrition_plans').insert({
          title: input.title,
          calories: input.calories,
          protein_g: input.protein_g,
          carbs_g: input.carbs_g,
          fats_g: input.fats_g,
          tracking_mode: input.tracking_mode || 'macros',
          description: input.description || '',
          client_id: input.client_id || null,
          status: 'active',
          created_by: userId,
        }).select('id').single();
        if (error) return { error: error.message };
        if (input.client_id) {
          await svc.from('clients').update({ assigned_nutrition_id: plan.id }).eq('id', input.client_id);
        }
        return { success: true, plan_id: plan.id, message: 'Created nutrition plan: ' + input.title };
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
        const { error } = await svc.from('nutrition_plans').update(fields).eq('id', plan.id);
        if (error) return { error: error.message };
        return { success: true, message: 'Nutrition plan updated successfully' };
      }

      case 'create_program': {
        if (input.client_id && !(await ownsClient(svc, userId, input.client_id))) return NOT_OWNED();
        const { data: prog, error } = await svc.from('workout_programs').insert({
          title: input.title,
          duration_weeks: input.duration_weeks,
          days_per_week: input.days_per_week,
          difficulty: input.difficulty || 'intermediate',
          description: input.description || '',
          workouts: [],
          created_by: userId,
        }).select('id').single();
        if (error) return { error: error.message };
        if (input.client_id) {
          await svc.from('clients').update({ assigned_program_id: prog.id }).eq('id', input.client_id);
        }
        return { success: true, program_id: prog.id, message: 'Created program: ' + input.title };
      }

      case 'update_client': {
        const client = await ownsClient(svc, userId, input.client_id);
        if (!client) return NOT_OWNED();
        const fields = {};
        if (input.goal) fields.goal = input.goal;
        if (input.lifecycle_status) fields.lifecycle_status = input.lifecycle_status;
        if (input.notes) fields.notes = input.notes;
        if (input.tags) fields.tags = input.tags;
        if (input.target_weight) fields.target_weight = input.target_weight;
        if (input.current_weight) fields.current_weight = input.current_weight;
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
