# Automation & Scoring Migration (Migration Step 4)

Server-side rebuild of the two browser-only backends flagged in the original
audit: the risk/priority scoring and the automation engine. Companion to
`SCHEMA_MIGRATION.md` (Steps 1–3).

## 4.1 — One risk-scoring model (source of truth)

Two implementations disagreed:

| | `src/lib/riskEngine.js` (UI) | `weeklyDigest` inline |
|---|---|---|
| model | factor accumulation | additive |
| scale | **0–100** | 0–10 |
| window | 3–4 check-ins | 3 check-ins |
| flags | 9 weighted (high 30 / med 15 / low 5) | 4 ad-hoc terms |
| shown to coaches | **yes** (Adherence, At-Risk pages) | only in the weekly email |

**Kept: `riskEngine.js`'s model** — it is the number coaches already see in the
UI, so keeping it means the whole app agrees rather than showing two different
"risk" figures. Its logic is ported **verbatim** (line-for-line, not
reinterpreted) into `supabase/functions/_shared/riskScoring.js` (with the
scoring primitives it needs in `_shared/adherence.js`). The only change is that
`now` is injectable for deterministic runs; the numbers are identical.

The divergent `weeklyDigest` priorityScore is **superseded** by this module. It
is a Base44 function re-platformed in Step 5; when that happens it must import
`_shared/riskScoring.js` instead of its inline formula. **This changes what the
weekly digest reports** — from the 0–10 additive priorityScore to the 0–100
risk model coaches see in the UI — which is the point (one number everywhere).
The two formulas were **not** blended (that would invent a third score).

**Proof (`npm run verify:risk-parity`):** the shared module reproduces
`riskEngine.js` byte-for-byte (identical riskScore + triggered flags) across a
4-client / 10-check-in sample covering every flag. Output confirmed identical.

## 4.2 — Server-side automation runner

### Runner mechanism: Edge Function invoked by pg_cron

`supabase/functions/runAutomations/index.ts`, scheduled by `pg_cron` +
`pg_net.http_post` (see `supabase/migrations/20260709000900_automation_runner.sql`).

**Why an edge function, not a pure plpgsql pg_cron job:** the rule semantics
(date-fns day-difference windows, adherence/streak math, both rule shapes) are
ported **verbatim** from the existing JS engines. Reimplementing them in
plpgsql would be a reinterpretation — exactly what Step 4 forbids — and a
fidelity risk. Keeping the logic as JS in a shared module means the runner and
the verification harness execute the *same code*. pg_cron gives reliable in-DB
scheduling; pg_net invokes the function over HTTP. Tradeoff: one extra network
hop per run and a service-role-key secret in the cron job (applied post-deploy,
never committed — the migration ships the schedule as a documented template).

### The schema-drift bug (condition_type vs trigger_type) — resolved

There were **two** rule schemas and **two** engines that disagreed:

- **legacy** `condition_type` + `condition_threshold` +
  `action_type`/`action_message`/`action_calorie_delta` — evaluated by
  `src/lib/automationEngine.js` (conditions: missed_checkin, missed_workouts,
  low_adherence, weight_plateau, low_nutrition, mood_low, no_progress,
  declining_trend).
- **new** `trigger_type` + `trigger_value` + `actions[]` — evaluated by the
  inline engine in `src/pages/Automations.jsx` (triggers: no_checkin,
  low_compliance, high_compliance, streak, weight_plateau, weight_loss_fast,
  new_client).

The live browser engine filtered `r.is_active && r.trigger_type`, so **legacy
`condition_type` rules were silently ignored**. The new runner
(`_shared/automationRunner.js`) handles **both**: each rule is dispatched by
whichever discriminator it carries (`trigger_type` wins if both are present,
matching the browser's action-normalization precedence at
`Automations.jsx:157`). Both engines' condition logic is ported verbatim; no
rule semantics were rewritten. Action-type synonyms across the two engines
(`flag_client` ≡ `flag_at_risk`, plus `update_status`) are unified in the
executor. Rules are migrated **in place** — no data migration needed; a rule
works whichever shape it was authored in.

### Logging every evaluation

The original engine logged only *fires*. The runner writes an `automation_logs`
row for **every** evaluation (fired or not) — additive columns `fired boolean`
and `detail text` were added in migration 9 to carry the outcome + reason, so
coaches get a full "why didn't my rule fire?" audit trail.

### Idempotency

Per **window** (default UTC day, `AUTOMATION_WINDOW=hour` to tighten), the
runner dedups on `(rule_id, client_id)`: before evaluating a pair it checks for
an existing `automation_logs` row with `triggered_at >= window_start` and skips
if found. So overlapping/retried invocations in the same window never
re-evaluate — no duplicate messages, badges, status flips, or log rows.

## 4.3 — Rehearsal results (`npm run verify:automation`)

Real Postgres (all 9 migrations), a fixture with **both** rule shapes plus an
inactive rule and a lead, run twice. All 15 checks pass:

- run #1: **12 evaluations** (3 eligible clients × 4 active rules; the lead and
  the inactive rule are correctly excluded), **5 fires**, **12 log rows** (one
  per evaluation, fired or not).
- **6 of those logs come from legacy `condition_type` rules** — proving they
  are no longer silently ignored.
- a stale client fires **both** a legacy (`missed_checkin`) and a new
  (`no_checkin`) rule; `flag_at_risk` moves it to `at_risk`; `low_adherence`
  sends a message; the `streak` rule awards a badge.
- run #2 (same window): **0 evaluations, 0 new logs, 0 duplicate
  messages/badges** — idempotency holds.

The rehearsal runs the shared module through a pg-backed executor that mirrors
`runAutomations/index.ts`; DATE/TIMESTAMP columns are returned as strings so
the module receives the same shape PostgREST gives the deployed function.

## Not yet exercisable locally

pg_cron/pg_net aren't installed on the rehearsal Postgres (the migration
degrades to a documented no-op there), so the *scheduling* hop and the live
edge-function HTTP invocation need a real Supabase project. The evaluation,
action execution, logging, and idempotency — the substance — are all proven
against real Postgres.
