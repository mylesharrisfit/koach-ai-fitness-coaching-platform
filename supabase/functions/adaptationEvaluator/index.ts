// Supabase Edge Function: adaptationEvaluator  (closed loop — client side)
//
// Batch sweep, invoked by pg_cron via pg_net.http_post (same pattern as
// runAutomations / onEntityEvent). For each active client it compares recent
// client behaviour (food_logs / workout_sessions) against their assigned plan
// using the tunable deviationThresholds gate. When a threshold is crossed it
// asks Claude for a STRUCTURED plan diff (not prose) and routes it through the
// single write path (planMutationService.proposeMutation) as an 'ai_adaptation'
// — landing in the approval queue by default, or auto-applied when the coach
// has opted in (coach_defaults.auto_apply_ai_adaptations).
//
// Auth: service-role only (the DB cron caller). Rejects everyone else, exactly
// like onEntityEvent.
import { serviceClient, cors, jsonResponse } from '../_shared/edgeClients.js';
import { invokeClaude } from '../_shared/anthropic.js';
import { proposeMutation } from '../_shared/planMutationService.js';
import { evaluateDeviations } from '../_shared/deviationThresholds.js';
import { notifyCoach, sendMessage } from '../_shared/automationActions.js';

const DAY_MS = 86_400_000;
const DEFAULT_CLIENT_LIMIT = 100;
const MAX_PROPOSALS_PER_RUN = 25; // safety cap on Claude calls / writes per sweep

function isServiceRoleCall(req: Request) {
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  return Boolean(serviceKey) && token === serviceKey;
}

function buildPrompt(client: Record<string, unknown>, planKind: string, plan: Record<string, unknown>, detail: string) {
  const goal = String(client.goal ?? 'general_fitness').replace(/_/g, ' ');
  const planSummary = planKind === 'nutrition'
    ? `Current nutrition plan — calories:${plan.calories}, protein_g:${plan.protein_g}, carbs_g:${plan.carbs_g}, fats_g:${plan.fats_g}. Meals: ${JSON.stringify(plan.meals ?? []).slice(0, 1500)}`
    : `Current workout program — days_per_week:${plan.days_per_week}, difficulty:${plan.difficulty}, category:${plan.category}. Workouts: ${JSON.stringify(plan.workouts ?? []).slice(0, 1500)}`;

  const allowed = planKind === 'nutrition'
    ? 'diff.fields keys may be: calories, protein_g, carbs_g, fats_g. diff.meals ops: {"op":"replace|add|remove","meal_id":"<id/name>","after":{...}}'
    : 'diff.fields keys may be: days_per_week, difficulty, category. diff.workouts ops: {"op":"replace|add|remove","day_number":N,"after":{...}}';

  return `You are an expert AI fitness coach improving a client's plan based on how they are actually behaving.

CLIENT: ${client.name} — goal: ${goal}, current weight: ${client.current_weight ?? 'n/a'}, target: ${client.target_weight ?? 'n/a'}.
OBSERVED DEVIATION: ${detail}
${planSummary}

Propose a SMALL, targeted adjustment to bring the plan in line with the client's behaviour and goal. Change only what's needed.
${allowed}
Every field change MUST include the current value as "before" and the new value as "after".

Return ONLY this JSON (no prose, no markdown):
{"diff": {"fields": {"<field>": {"before": <current>, "after": <new>}}}, "rationale": "one sentence why"}
If no change is warranted, return {"diff": null, "rationale": "reason"}.`;
}

function diffIsEmpty(diff: Record<string, unknown> | null | undefined) {
  if (!diff || typeof diff !== 'object') return true;
  const f = (diff.fields && typeof diff.fields === 'object') ? Object.keys(diff.fields as object).length : 0;
  const m = Array.isArray(diff.meals) ? diff.meals.length : 0;
  const w = Array.isArray(diff.workouts) ? diff.workouts.length : 0;
  return f + m + w === 0;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    if (!isServiceRoleCall(req)) return jsonResponse({ error: 'Unauthorized' }, 401);
    const svc = serviceClient();
    const body = await req.json().catch(() => ({}));
    const clientLimit = Number(body.limit) || DEFAULT_CLIENT_LIMIT;
    const now = new Date();

    const { data: clients } = await svc.from('clients').select('*')
      .eq('lifecycle_status', 'active').limit(clientLimit);

    const stats = { scanned: 0, triggered: 0, proposed: 0, applied: 0, pending: 0, skipped: 0, errors: 0 };
    const coachDefaultsCache = new Map<string, Record<string, unknown> | null>();

    for (const client of clients ?? []) {
      if (stats.proposed >= MAX_PROPOSALS_PER_RUN) break;
      stats.scanned++;
      try {
        // Gather recent logs only for the plan kinds the client actually has.
        const ctx: { client: Record<string, unknown>; foodLogs: unknown[]; sessions: unknown[] } = { client, foodLogs: [], sessions: [] };
        if (client.assigned_nutrition_id) {
          const since = new Date(now.getTime() - 7 * DAY_MS).toISOString().slice(0, 10);
          const { data } = await svc.from('food_logs').select('logged_by, logged_date')
            .eq('client_id', client.id).gte('logged_date', since);
          ctx.foodLogs = data ?? [];
        }
        if (client.assigned_program_id) {
          const since = new Date(now.getTime() - 28 * DAY_MS).toISOString();
          const { data } = await svc.from('workout_sessions').select('status, completed_at, scheduled_date, exercise_logs')
            .eq('client_id', client.id).gte('completed_at', since);
          ctx.sessions = data ?? [];
        }

        const coachId = client.user_id ?? client.created_by;
        if (!coachDefaultsCache.has(coachId)) {
          const { data: cd } = await svc.from('coach_defaults').select('auto_apply_ai_adaptations, adaptation_thresholds')
            .eq('coach_id', coachId).maybeSingle();
          coachDefaultsCache.set(coachId, cd ?? null);
        }
        const coachDefaults = coachDefaultsCache.get(coachId);

        const deviations = evaluateDeviations(ctx, coachDefaults?.adaptation_thresholds, now);
        for (const dev of deviations) {
          if (stats.proposed >= MAX_PROPOSALS_PER_RUN) break;
          stats.triggered++;

          const planId = dev.plan_kind === 'nutrition' ? client.assigned_nutrition_id : client.assigned_program_id;
          if (!planId) { stats.skipped++; continue; }

          // Idempotency: don't stack a new proposal on an open one for this plan.
          const { data: open } = await svc.from('plan_versions').select('id')
            .eq('client_id', client.id).eq('plan_kind', dev.plan_kind)
            .eq('status', 'pending_approval').limit(1);
          if (open?.length) { stats.skipped++; continue; }

          const table = dev.plan_kind === 'nutrition' ? 'nutrition_plans' : 'workout_programs';
          const { data: plan } = await svc.from(table).select('*').eq('id', planId).maybeSingle();
          if (!plan) { stats.skipped++; continue; }

          const llm = await invokeClaude({ prompt: buildPrompt(client, dev.plan_kind, plan, dev.detail), maxTokens: 1500, expectJson: true });
          if (!llm.ok || diffIsEmpty(llm.parsed?.diff)) { stats.skipped++; continue; }

          const autoApply = Boolean(coachDefaults?.auto_apply_ai_adaptations);
          const res = await proposeMutation({
            svc, coachId, clientId: client.id,
            planKind: dev.plan_kind, planId,
            diff: llm.parsed.diff,
            rationale: llm.parsed.rationale || dev.detail,
            source: 'ai_adaptation', triggerType: dev.trigger_type,
            autoApply,
          });
          if (res.error) { stats.errors++; continue; }
          stats.proposed++;

          if (res.applied) {
            stats.applied++;
            await notifyCoach(svc, {
              recipient_id: coachId, category: 'ai', type: 'plan_adapted',
              title: `AI updated ${client.name}'s ${dev.plan_kind} plan`,
              body: `${dev.detail} — ${llm.parsed.rationale || 'plan adjusted'}`,
              related_client_id: client.id, action_label: 'View plan', link: `/clients/${client.id}`,
            });
            await sendMessage(svc, {
              client_id: client.id, client_name: client.name, sender: 'coach',
              content: `Your ${dev.plan_kind} plan was updated based on your recent activity. ${llm.parsed.rationale || ''}`.trim(),
              created_by: coachId,
            });
          } else {
            stats.pending++;
            await notifyCoach(svc, {
              recipient_id: coachId, category: 'ai', type: 'plan_adaptation_pending',
              title: `AI suggested a change to ${client.name}'s ${dev.plan_kind} plan`,
              body: `${dev.detail} — ${llm.parsed.rationale || 'review suggested change'}`,
              related_client_id: client.id, action_label: 'Review', link: `/clients/${client.id}`, priority: 'normal',
            });
          }
        }
      } catch (e) {
        stats.errors++;
        console.error(`adaptationEvaluator client ${client.id} failed:`, (e as Error).message);
      }
    }

    return jsonResponse({ received: true, ...stats });
  } catch (error) {
    console.error('adaptationEvaluator error:', (error as Error).message);
    return jsonResponse({ error: (error as Error).message }, 500);
  }
});
