# Closed-Loop Plan Mutations

Two-way loop between coach, client, and KOACH AI over a client's nutrition /
workout plans, with **one auditable write path** so every change is attributable
and no change silently clobbers a plan that moved underneath it.

1. **Coach-driven (instant).** Coach types *"change Sarah's meal plan to 150g
   protein, swap dinner to chicken"* in the AI chat → applied immediately.
2. **Client-driven (gated).** A client's logged meal swaps / workout changes
   cross a threshold → KOACH AI proposes a plan improvement → coach approves
   (or it auto-applies if the coach opted in).

## Pieces

| Layer | File | Role |
|---|---|---|
| Schema | `supabase/migrations/20260719200434_closed_loop_plan_versions.sql` | `plan_versions` audit/proposal ledger + `coach_defaults.auto_apply_ai_adaptations` / `adaptation_thresholds` |
| Cron | `supabase/migrations/20260719201210_adaptation_evaluator_cron.sql` | ensures `pg_cron`/`pg_net`; schedule snippet (secrets) applied per-environment |
| Write path | `supabase/functions/_shared/planMutationService.js` | **single write path** — `proposeMutation` / `approveMutation` / `rejectMutation` / `applyDiff` |
| Thresholds | `supabase/functions/_shared/deviationThresholds.js` | pure, tunable deviation gate (mirrors `riskScoring.js`) |
| Coach chat | `supabase/functions/_shared/assistantTools.js` + `claudeAssistant/index.ts` | `resolve_client`, `get_client_plan`, `update_nutrition_plan`, `update_workout_plan` |
| Approvals | `supabase/functions/planMutations/index.ts` | coach-facing `approve` / `reject` / manual `propose` |
| Adaptation | `supabase/functions/adaptationEvaluator/index.ts` | pg_cron sweep → Claude structured diff → `proposeMutation` |

`nutrition_plans` / `workout_programs` are written **only** through
`planMutationService`. The two legacy writers (`assistantTools.update_nutrition_plan`,
`automationActions` `adjust_calories`) were rewired to route through it.

## `plan_versions`

Append-only. `source` ∈ `ai_adaptation | coach_command | manual_edit`; `status`
∈ `pending_approval | applied | rejected | superseded`. Real FKs to
`clients` / `nutrition_plans` / `workout_programs` / `profiles`; a one-of CHECK
keeps exactly one plan target per `plan_kind`; a partial-unique index allows at
most one open proposal per plan. `diff` is a structured before/after document
(never a full-plan snapshot); `base_updated_at` snapshots the target's
`updated_at` for the stale guard.

**PlanDiff shape**
```jsonc
{ "fields":   { "protein_g": { "before": 180, "after": 170 } },
  "meals":    [ { "op": "replace|add|remove", "meal_id": "dinner", "after": {…} } ],
  "workouts": [ { "op": "replace|add|remove", "day_number": 3, "after": {…} } ] }
```

## Guardrails

- **Ownership** — `app.owns_client` RLS + `ownsClient`/`ownsPlan`/`ownsProgram`
  in the service layer. A coach can only touch their own clients' plans.
- **Apply policy (server-enforced)** — `coach_command` applies instantly;
  `ai_adaptation` applies only when the coach set `auto_apply_ai_adaptations`
  (default off → approval queue). The model/client can't force an apply.
- **Stale guard** — a proposal is rejected (`stale_diff`) if the plan's
  `updated_at` moved or a diff `before` no longer matches live state.
- **Copy-on-write** — mutating a template or a program shared across clients
  clones it for this client first (repointing `clients.assigned_*_id`), so one
  client's change never leaks to others.
- **Idempotency** — the partial-unique index + a pre-check stop the cron sweep
  from stacking duplicate proposals on the same plan.

## Deploy (per environment)

Schema + `coach_defaults` columns are already applied to the KOACH AI project.
After merging, deploy the functions and schedule the sweep:

```bash
supabase functions deploy claudeAssistant planMutations adaptationEvaluator
```

`adaptationEvaluator` is service-role-only (invoked by cron); deploy it like the
other cron/DB functions. Then, once per environment, schedule it (secrets — do
not commit):

```sql
select cron.schedule(
  'adaptation-evaluator-15min', '*/15 * * * *',
  $$ select net.http_post(
       url     := '<SUPABASE_URL>/functions/v1/adaptationEvaluator',
       headers := jsonb_build_object('Content-Type','application/json',
                                     'Authorization','Bearer <SUPABASE_SERVICE_ROLE_KEY>'),
       body    := '{}'::jsonb); $$);
```

Requires `ANTHROPIC_API_KEY` in the function env (already used by the other AI
functions).

## Frontend (Supabase-forward)

The live app still runs on the Base44 data/function layer (`src/api/base44Client.js`);
the Supabase cutover is in progress (`VITE_AUTH_PROVIDER`, `src/api/supabaseClient.js`).
These surfaces are built against the **Supabase facade** so they light up at cutover
and don't touch Base44:

- **`src/pages/PlanApprovals.jsx`** (route `/plan-approvals`) — reads
  `plan_versions` (status `pending_approval`) via `supabase.entities.PlanVersion`
  and approves/rejects via `supabase.functions.invoke('planMutations', …)`. The
  sidebar link (`Plan Approvals`, AI group) is gated by `isSupabaseAuth()` so it
  stays hidden on the Base44 shell.
- **Auto-apply toggle** — added to `src/components/settings/DefaultAssignmentSettings.jsx`
  (writes `coach_defaults.auto_apply_ai_adaptations`); activates when that
  component is on the Supabase facade.
- **Coach chat** needs no change: it already renders `actions` and invalidates
  `nutrition-plans`/`programs`/`clients`. Added chat icons for the new tools.
- Added `PlanVersion: 'plan_versions'` to the facade's `ENTITY_TABLES`.

## Direct plan writers NOT yet routed (known, deferred by decision)

The single-write-path currently covers the closed-loop paths (coach chat + AI
adaptation) and the two folded writers. These other **content mutations of
assigned plans** still write the plan tables directly and are intentionally left
for a later consolidation pass (they're coach-initiated edits; routing them
changes check-in/automation/bulk UX):

- Nutrition calorie/edit sites: `src/pages/Nutrition.jsx:69`, `Automations.jsx:92`,
  `FastReview.jsx:304`, `CheckInDetail.jsx:186`,
  `components/automations/AutomationResultsPanel.jsx:51`, `lib/applyRecommendation.js:15`,
  `components/checkin/CheckInQuickActions.jsx:51`, `components/clients/BulkActionBar.jsx:19`,
  and `supabase/functions/generateSmartMeals/index.ts:103` (overwrites `meals[]`).
- Workout content: `src/pages/ProgramBuilder.jsx:807`.

(CREATE / ASSIGN / template sites are not closed-loop mutations and are out of scope.)

## Follow-ups (not in this pass)

- Deploy the functions: `supabase functions deploy claudeAssistant planMutations
  adaptationEvaluator`, then schedule the pg_cron snippet above (once per env).
- Consolidate the direct writers above through `planMutationService` if/when you
  want every plan edit audited + copy-on-write-protected.
