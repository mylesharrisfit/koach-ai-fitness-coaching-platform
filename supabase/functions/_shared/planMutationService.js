/**
 * planMutationService — the SINGLE WRITE PATH for nutrition_plans /
 * workout_programs (closed-loop plan mutations).
 *
 * Every change to a client's plan — coach chat command, AI adaptation, or a
 * manual edit from the approval queue — goes through proposeMutation /
 * approveMutation / rejectMutation here. No other code writes those tables
 * (the two legacy writers, assistantTools.update_nutrition_plan and
 * automationActions.adjust_calories, are rewired to call proposeMutation).
 *
 * What this buys us:
 *   - an append-only audit trail in plan_versions (who/what/why, before→after);
 *   - a stale-diff guard so a proposal can't clobber a plan that changed
 *     underneath it (compare the target's updated_at against the snapshot taken
 *     when the diff was computed);
 *   - copy-on-write for shared/template plans, so one client's change never
 *     leaks to others sharing a template;
 *   - a server-enforced apply policy: coach_command applies instantly,
 *     ai_adaptation defaults to the approval queue (per-coach opt-in). The
 *     model/client can never force an immediate apply.
 *
 * `svc` is a service-role supabase client (bypasses RLS); ownership is enforced
 * here in code (ownsClient / ownsPlan / ownsProgram) exactly like the rest of
 * the edge functions.
 *
 * PlanDiff shape (structured before/after — never a full-plan snapshot):
 *   {
 *     "fields":   { "protein_g": { "before": 180, "after": 170 }, ... },
 *     "meals":    [ { "op": "replace|add|remove", "meal_id": "m_1",
 *                     "before": {...}, "after": {...} } ],
 *     "workouts": [ { "op": "replace|add|remove", "day_number": 3,
 *                     "before": {...}, "after": {...} } ]
 *   }
 */
import { ownsClient } from './ownership.js';

// Scalar columns a diff may set, per plan kind. Anything outside these lists is
// ignored — a diff can never write an arbitrary column.
const NUTRITION_FIELDS = new Set([
  'calories', 'protein_g', 'carbs_g', 'fats_g', 'title', 'description',
  'tracking_mode', 'diet', 'goal', 'client_notes', 'start_date',
  'hydration', 'supplements', 'notes',
]);
const WORKOUT_FIELDS = new Set([
  'title', 'description', 'duration_weeks', 'days_per_week', 'difficulty',
  'category', 'notes',
]);

const TABLE = { nutrition: 'nutrition_plans', workout: 'workout_programs' };
const FK_COL = { nutrition: 'nutrition_plan_id', workout: 'workout_program_id' };

/** Stable identity for a freeform meal object. */
function mealKey(m) {
  return m?.id ?? m?.meal_id ?? m?.name ?? null;
}

/** Loose equality for stale-guard `before` checks (numeric cols round-trip as strings). */
function looseEq(a, b) {
  if (a === null || a === undefined) return b === null || b === undefined;
  return String(a) === String(b);
}

/** Fetch the target plan/program row. */
async function fetchPlan(svc, planKind, planId) {
  if (!TABLE[planKind] || !planId) return null;
  const { data } = await svc.from(TABLE[planKind]).select('*').eq('id', planId).maybeSingle();
  return data ?? null;
}

/** Does this nutrition plan belong to the caller (directly or via its client)? */
export async function ownsPlan(svc, userId, planId) {
  if (!planId) return null;
  const { data: plan } = await svc.from('nutrition_plans').select('*').eq('id', planId).maybeSingle();
  if (!plan) return null;
  if (plan.created_by === userId) return plan;
  if (plan.client_id && (await ownsClient(svc, userId, plan.client_id))) return plan;
  return null;
}

/** Does this workout program belong to the caller (created it, or assigned to a client they own)? */
export async function ownsProgram(svc, userId, programId) {
  if (!programId) return null;
  const { data: prog } = await svc.from('workout_programs').select('*').eq('id', programId).maybeSingle();
  if (!prog) return null;
  if (prog.created_by === userId) return prog;
  // A program has no client_id — it's linked via clients.assigned_program_id.
  const { data: linked } = await svc.from('clients').select('id, user_id, created_by')
    .eq('assigned_program_id', programId);
  if ((linked ?? []).some((c) => c.user_id === userId || c.created_by === userId)) return prog;
  return null;
}

/**
 * Apply a structured PlanDiff to the live plan row. Returns { ok, applied } or
 * { error }. Never a full-plan overwrite — only whitelisted scalar fields and
 * targeted array ops.
 */
export async function applyDiff(svc, planKind, planId, diff) {
  const plan = await fetchPlan(svc, planKind, planId);
  if (!plan) return { error: 'plan_not_found' };

  const allowed = planKind === 'nutrition' ? NUTRITION_FIELDS : WORKOUT_FIELDS;
  const update = {};

  // Scalar fields
  for (const [key, change] of Object.entries(diff?.fields ?? {})) {
    if (!allowed.has(key)) continue;
    update[key] = change?.after;
  }

  // Nutrition meal ops (meals jsonb array)
  if (planKind === 'nutrition' && Array.isArray(diff?.meals) && diff.meals.length) {
    let meals = Array.isArray(plan.meals) ? [...plan.meals] : [];
    for (const op of diff.meals) {
      if (op.op === 'add') {
        if (op.after) meals.push(op.after);
      } else if (op.op === 'remove') {
        meals = meals.filter((m) => mealKey(m) !== op.meal_id);
      } else if (op.op === 'replace') {
        const idx = meals.findIndex((m) => mealKey(m) === op.meal_id);
        if (idx >= 0 && op.after) meals[idx] = op.after;
        else if (idx < 0 && op.after) meals.push(op.after); // upsert-on-replace
      } else {
        return { error: `unknown_meal_op:${op.op}` };
      }
    }
    update.meals = meals;
  }

  // Workout day ops (workouts jsonb array, matched by day_number)
  if (planKind === 'workout' && Array.isArray(diff?.workouts) && diff.workouts.length) {
    let workouts = Array.isArray(plan.workouts) ? [...plan.workouts] : [];
    for (const op of diff.workouts) {
      if (op.op === 'add') {
        if (op.after) workouts.push(op.after);
      } else if (op.op === 'remove') {
        workouts = workouts.filter((w) => w?.day_number !== op.day_number);
      } else if (op.op === 'replace') {
        const idx = workouts.findIndex((w) => w?.day_number === op.day_number);
        if (idx >= 0 && op.after) workouts[idx] = op.after;
        else if (idx < 0 && op.after) workouts.push(op.after);
      } else {
        return { error: `unknown_workout_op:${op.op}` };
      }
    }
    update.workouts = workouts;
  }

  if (Object.keys(update).length === 0) return { error: 'empty_diff' };

  const { error } = await svc.from(TABLE[planKind]).update(update).eq('id', planId);
  if (error) return { error: error.message };
  return { ok: true, applied: Object.keys(update) };
}

/** Verify each diff `before` still matches live state + the plan hasn't moved. */
function isStale(plan, diff, baseUpdatedAt) {
  if (baseUpdatedAt && plan.updated_at && plan.updated_at !== baseUpdatedAt) return true;
  for (const [key, change] of Object.entries(diff?.fields ?? {})) {
    if (change && 'before' in change && !looseEq(plan[key], change.before)) return true;
  }
  return false;
}

/**
 * Clone a plan for a single client so a mutation never mutates a shared
 * template or a program assigned to multiple clients. Returns the new plan id,
 * or the original id if no clone was needed.
 */
async function copyOnWriteIfShared(svc, planKind, plan, clientId, coachId) {
  if (planKind === 'nutrition') {
    const shared = plan.is_template || plan.status === 'template' || !plan.client_id || plan.client_id !== clientId;
    if (!shared) return { planId: plan.id, cloned: false };
    const { id, created_at, updated_at, ...rest } = plan; // eslint-disable-line no-unused-vars
    const { data: clone, error } = await svc.from('nutrition_plans').insert({
      ...rest,
      client_id: clientId,
      is_template: false,
      status: 'active',
      template_category: null,
      created_by: coachId,
    }).select('id').single();
    if (error) return { error: `clone_failed: ${error.message}` };
    await svc.from('clients').update({ assigned_nutrition_id: clone.id }).eq('id', clientId);
    return { planId: clone.id, cloned: true };
  }

  // workout: no client_id — shared if template or assigned to >1 client.
  const { data: assigned } = await svc.from('clients').select('id').eq('assigned_program_id', plan.id);
  const shared = plan.is_template || (assigned ?? []).some((c) => c.id !== clientId) || (assigned ?? []).length === 0;
  if (!shared) return { planId: plan.id, cloned: false };
  const { id, created_at, updated_at, ...rest } = plan; // eslint-disable-line no-unused-vars
  const { data: clone, error } = await svc.from('workout_programs').insert({
    ...rest,
    is_template: false,
    created_by: coachId,
  }).select('id').single();
  if (error) return { error: `clone_failed: ${error.message}` };
  await svc.from('clients').update({ assigned_program_id: clone.id }).eq('id', clientId);
  return { planId: clone.id, cloned: true };
}

/**
 * Propose (and maybe apply) a plan mutation. The one entry point every caller
 * uses. Returns { ok, version, applied, planId, cloned } or { error, code }.
 *
 * autoApply policy (server-enforced, never trusted from the model/client):
 *   - source 'coach_command' → always applied immediately.
 *   - source 'ai_adaptation' → applied only if the caller passes autoApply
 *     (the evaluator sets it from coach_defaults.auto_apply_ai_adaptations);
 *     otherwise pending_approval.
 *   - source 'manual_edit'   → applied per the caller's autoApply.
 */
export async function proposeMutation({
  svc, coachId, clientId, planKind, planId, diff, rationale,
  source, triggerType = null, autoApply = false,
}) {
  if (!svc || !coachId || !clientId) return { error: 'missing_args', code: 'bad_request' };
  if (!TABLE[planKind]) return { error: `bad_plan_kind:${planKind}`, code: 'bad_request' };
  if (!['ai_adaptation', 'coach_command', 'manual_edit'].includes(source)) {
    return { error: `bad_source:${source}`, code: 'bad_request' };
  }
  if (!diff || typeof diff !== 'object') return { error: 'missing_diff', code: 'bad_request' };

  // Ownership: coach owns the client AND the plan.
  const client = await ownsClient(svc, coachId, clientId);
  if (!client) return { error: 'client not owned by you', code: 'not_owned' };
  const owned = planKind === 'nutrition'
    ? await ownsPlan(svc, coachId, planId)
    : await ownsProgram(svc, coachId, planId);
  if (!owned) return { error: 'plan not owned by you', code: 'not_owned' };

  // Copy-on-write for shared/template plans.
  const cow = await copyOnWriteIfShared(svc, planKind, owned, clientId, coachId);
  if (cow.error) return { error: cow.error, code: 'clone_failed' };
  const effectivePlanId = cow.planId;

  const plan = await fetchPlan(svc, planKind, effectivePlanId);
  if (!plan) return { error: 'plan_not_found', code: 'not_found' };
  const baseUpdatedAt = plan.updated_at;

  // Server-enforced apply policy.
  const finalAuto = source === 'coach_command' ? true : Boolean(autoApply);

  // If applying now, apply the diff first so the audit row only records a
  // successful apply. (A fresh clone can't be stale, so the guard is a no-op there.)
  if (finalAuto) {
    if (!cow.cloned && isStale(plan, diff, baseUpdatedAt)) {
      return { error: 'plan changed since the diff was computed', code: 'stale_diff' };
    }
    const applied = await applyDiff(svc, planKind, effectivePlanId, diff);
    if (applied.error) return { error: applied.error, code: 'apply_failed' };
  }

  const now = new Date().toISOString();
  const row = {
    client_id: clientId,
    plan_kind: planKind,
    [FK_COL[planKind]]: effectivePlanId,
    source,
    trigger_type: triggerType,
    status: finalAuto ? 'applied' : 'pending_approval',
    diff,
    rationale: rationale ?? null,
    proposed_by: source === 'ai_adaptation' ? 'ai' : coachId,
    base_updated_at: baseUpdatedAt,
    created_by: coachId,
    applied_at: finalAuto ? now : null,
  };

  const { data: version, error } = await svc.from('plan_versions').insert(row).select('*').single();
  if (error) {
    // Unique-violation on the partial index = an open proposal already exists.
    if (error.code === '23505') return { error: 'an open proposal already exists for this plan', code: 'open_proposal_exists' };
    return { error: error.message, code: 'insert_failed' };
  }

  return { ok: true, version, applied: finalAuto, planId: effectivePlanId, cloned: cow.cloned };
}

/** Load a plan_versions row and verify the caller may act on it. */
async function loadOwnedVersion(svc, versionId, coachId) {
  if (!versionId) return { error: 'missing_version_id', code: 'bad_request' };
  const { data: version } = await svc.from('plan_versions').select('*').eq('id', versionId).maybeSingle();
  if (!version) return { error: 'version_not_found', code: 'not_found' };
  if (version.created_by !== coachId && !(await ownsClient(svc, coachId, version.client_id))) {
    return { error: 'version not owned by you', code: 'not_owned' };
  }
  return { version };
}

/** Approve a pending proposal: re-check staleness, apply, mark applied. */
export async function approveMutation({ svc, versionId, coachId }) {
  const loaded = await loadOwnedVersion(svc, versionId, coachId);
  if (loaded.error) return loaded;
  const { version } = loaded;
  if (version.status !== 'pending_approval') return { error: `not pending (status=${version.status})`, code: 'not_pending' };

  const planId = version[FK_COL[version.plan_kind]];
  const plan = await fetchPlan(svc, version.plan_kind, planId);
  if (!plan) return { error: 'plan_not_found', code: 'not_found' };

  if (isStale(plan, version.diff, version.base_updated_at)) {
    await svc.from('plan_versions').update({
      status: 'superseded', reviewed_by: coachId, reviewed_at: new Date().toISOString(),
      review_notes: 'Plan changed since this proposal was created; re-propose against current state.',
    }).eq('id', version.id);
    return { error: 'plan changed since this proposal was created', code: 'stale_diff' };
  }

  const applied = await applyDiff(svc, version.plan_kind, planId, version.diff);
  if (applied.error) return { error: applied.error, code: 'apply_failed' };

  const now = new Date().toISOString();
  const { data: updated, error } = await svc.from('plan_versions').update({
    status: 'applied', reviewed_by: coachId, reviewed_at: now, applied_at: now,
  }).eq('id', version.id).select('*').single();
  if (error) return { error: error.message, code: 'update_failed' };
  return { ok: true, version: updated, applied: true };
}

/** Reject a pending proposal (append-only: nothing is deleted). */
export async function rejectMutation({ svc, versionId, coachId, reason = null }) {
  const loaded = await loadOwnedVersion(svc, versionId, coachId);
  if (loaded.error) return loaded;
  const { version } = loaded;
  if (version.status !== 'pending_approval') return { error: `not pending (status=${version.status})`, code: 'not_pending' };

  const now = new Date().toISOString();
  const { data: updated, error } = await svc.from('plan_versions').update({
    status: 'rejected', reviewed_by: coachId, reviewed_at: now, review_notes: reason,
  }).eq('id', version.id).select('*').single();
  if (error) return { error: error.message, code: 'update_failed' };
  return { ok: true, version: updated, applied: false };
}
