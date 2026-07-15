/**
 * Shared automation ACTION EXECUTORS (Step 4.2, extracted to _shared in
 * Step 5c so the DB-trigger event functions reuse the exact same write paths
 * instead of reimplementing them).
 *
 * Three primitives own every notification/message/badge write:
 *   sendMessage / notifyCoach / awardBadge
 * `executeAction` is the rule-action dispatcher runAutomations uses (faithful
 * port of Automations.jsx executeAction, with legacy action-type synonyms
 * unified: flag_client≡flag_at_risk, update_status). The Step 5c entity-event
 * handlers (_shared/entityEvents.js) call the same primitives with their own
 * Base44-faithful payloads.
 *
 * `admin` is a service-role supabase client (or a rehearsal shim exposing the
 * same .from().insert/.update API).
 */
import { renderMessage } from './automationRunner.js';

/** Strip undefined values so inserts only carry the columns the caller set. */
function compact(obj) {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));
}

/** Coach→client chat message (messages table). */
export async function sendMessage(admin, { client_id, client_name, content, sender = 'coach', tag, created_by }) {
  if (!content) return { skipped: 'empty message' };
  const { error } = await admin.from('messages').insert(compact({
    client_id, client_name, content, sender, tag, created_by,
  }));
  if (error) throw new Error(`sendMessage: ${error.message}`);
  return { ok: true };
}

/** In-app notification (notifications table; recipient_id → auth.users). */
export async function notifyCoach(admin, {
  recipient_id, category = 'ai', type = 'automation', title, body, client_name,
  action_label, link, related_client_id, related_checkin_id, priority,
}) {
  if (!recipient_id) return { skipped: 'no recipient' };
  const { error } = await admin.from('notifications').insert(compact({
    recipient_id, category, type, title, body, client_name,
    action_label, link, related_client_id, related_checkin_id, priority,
  }));
  if (error) throw new Error(`notifyCoach: ${error.message}`);
  return { ok: true };
}

/**
 * Award a badge once (client_badges): no-ops if the client already holds
 * badge_key — the idempotency rule the browser engine used.
 * `existingBadges` is the pre-loaded list (runAutomations batch-loads); pass
 * null to have this helper check the table directly.
 */
export async function awardBadge(admin, existingBadges, { client_id, client_name, badge_key, notes, earned_date }) {
  if (!badge_key) return { skipped: 'no badge key' };
  let already;
  if (existingBadges) {
    already = existingBadges.some((b) => b.client_id === client_id && b.badge_key === badge_key);
  } else {
    const { data } = await admin.from('client_badges')
      .select('id').eq('client_id', client_id).eq('badge_key', badge_key).limit(1);
    already = Boolean(data?.length);
  }
  if (already) return { skipped: 'already awarded' };
  const { error } = await admin.from('client_badges').insert(compact({
    client_id, client_name, badge_key,
    earned_date: earned_date ?? new Date().toISOString().split('T')[0],
    notes: notes ?? 'Auto-awarded by automation',
  }));
  if (error) throw new Error(`awardBadge: ${error.message}`);
  return { ok: true };
}

/**
 * Faithful port of Automations.jsx executeAction (moved from runAutomations).
 * Non-throwing, like the original (which ignored supabase-js error results):
 * one failing action must not abort the whole rule sweep.
 */
export async function executeAction(admin, action, client, lastCheckIn, clientCheckIns, plans, badges) {
  try {
    await executeActionStrict(admin, action, client, lastCheckIn, clientCheckIns, plans, badges);
  } catch (e) {
    console.error(`executeAction ${action?.type} failed for client ${client?.id}:`, e.message);
  }
}

async function executeActionStrict(admin, action, client, lastCheckIn, clientCheckIns, plans, badges) {
  const msg = renderMessage(action.message, client, lastCheckIn, clientCheckIns);
  switch (action.type) {
    case 'send_message':
    case 'send_template':
      if (msg) await sendMessage(admin, { client_id: client.id, content: msg, sender: 'coach' });
      break;
    case 'notify_coach':
    case 'suggest_adjustment': {
      // recipient is the owning coach (clients.user_id / created_by); notifications.recipient_id → auth.users
      const recipient = client.user_id ?? client.created_by;
      await notifyCoach(admin, {
        recipient_id: recipient, category: 'ai', type: 'automation',
        title: `Automation: ${client.name}`, body: msg || `Rule triggered for ${client.name}`,
        related_client_id: client.id,
      });
      break;
    }
    case 'award_badge':
      await awardBadge(admin, badges, {
        client_id: client.id, client_name: client.name, badge_key: action.value,
      });
      break;
    case 'update_status':
      if (action.value) await admin.from('clients').update({ lifecycle_status: action.value }).eq('id', client.id);
      break;
    case 'adjust_calories': {
      const plan = plans.find((p) => p.id === client.assigned_nutrition_id);
      if (plan) {
        const delta = Number(action.value) || 0;
        await admin.from('nutrition_plans').update({ calories: (plan.calories || 2000) + delta }).eq('id', plan.id);
      }
      break;
    }
    case 'flag_client':
    case 'flag_at_risk':
      await admin.from('clients').update({ lifecycle_status: 'at_risk' }).eq('id', client.id);
      break;
  }
}
