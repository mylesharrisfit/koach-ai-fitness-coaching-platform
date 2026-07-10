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

---

# Step 5 — Function Re-platforming

42 Base44 functions total. **Ported so far (13):** sendClientInvite,
validateInviteToken, setupPortalAccount (Step 3); runAutomations (Step 4);
stripeCheckout, stripeCreateSubscription, stripeCancelSubscription,
stripeWebhook, stripeGetDashboard, stripeClientProxy, storeCheckout,
storeCreateProduct (Step 5a); weeklyDigest (Step 5b). setupPortalAccount and
runAutomations are new (no Base44 original), so **11 of the 42 Base44
functions are ported**; **31 remain**, planned below.

## Step 5a — Stripe/payments (done)

All 8 ported to `supabase/functions/` with the shared `_shared/edgeClients.js`
(caller-session verification + service client + `ownsClient`). Confirmed:
signature verification preserved in stripeWebhook; **idempotency added** (new
`processed_stripe_events` ledger — Base44 had none); secrets env-only and never
logged (grep-verified, zero `console.*`); coach-facing functions verify the
caller and act only on the caller's own records, writing trigger-guarded
billing columns via the service role scoped to the caller's id. Rehearsed:
`npm run verify:stripe` (redelivered event processed exactly once; failed
processing releases the claim for retry).

## Step 5b — Digest wired to shared risk scoring (done)

weeklyDigest re-platformed to call `_shared/weeklyDigest.js` →
`getAtRiskClients` (0–100), replacing its inline 0–10 priorityScore. Email
language updated ("Risk score: N/100"). **sendCheckInReminders was inspected
and has NO risk/staleness model** — it's a weekly-completion boolean check
(checked-in-this-week / worked-out-this-week), a different concern; forcing it
onto riskScoring would be a reinterpretation, so it stays a straight
email-function port (backlog below). Rehearsed: `npm run verify:digest`
(digest scores match `getAtRiskClients` exactly; no local reimplementation).

## Step 5c — Remaining 31 functions (prioritized plan, no code yet)

Priority rationale: **P1** = correctness/data-integrity or blocks the app on
Supabase (triggers, subscription gate, intake); **P2** = core coach features
(AI, import, email); **P3** = integrations/seed utilities.

### DB-trigger equivalents (5) — **P1**
Base44 ran these as entity lifecycle hooks (fired after a record was
created/updated). Postgres equivalent: an `AFTER INSERT/UPDATE` trigger on the
table that calls an Edge Function via `pg_net.http_post` (same pattern as the
automation runner) — chosen over pure plpgsql because each does
notification/message/email side effects that are far cleaner in JS. Each also
needs the idempotency discipline from 5a (a trigger can fire on retries).

| fn | fires on | does | complexity | dep |
|---|---|---|---|---|
| onCheckInCreated | check_ins INSERT | notify coach, auto-message client, email | med | mailer |
| onCheckInResponded | check_ins UPDATE (coach_responded) | notify/message client, email | med | mailer |
| onClientCreated | clients INSERT | welcome messages, defaults, email (6 msg writes) | high | mailer |
| onIntakeSubmitted | onboarding_responses INSERT | notify coach, seed messages/notifications | high | mailer |
| onWorkoutCompleted | workout_sessions UPDATE (completed) | notify/message, badge check | med | mailer |

Note: these overlap the Step 4 automation runner's action surface — the
trigger functions should reuse `_shared/automationRunner.js` executors
(send_message/notify_coach/award_badge) rather than re-implement them.

### AI-calling functions (7) — **P2**
Two call the Anthropic API **directly** (accurate, grep-confirmed); five go
through Base44's `InvokeLLM` integration, which must be repointed at a real
provider on Supabase (Anthropic, matching the two direct ones — the app's model
identity is Claude).

| fn | provider today | secret | complexity |
|---|---|---|---|
| analyzeProgress | Anthropic direct (claude-opus-4-5) | ANTHROPIC_API_KEY | med |
| generateExerciseLibrary | Anthropic direct (claude-sonnet-4) | ANTHROPIC_API_KEY | med |
| aiMessageAssistant | Base44 InvokeLLM → repoint Anthropic | ANTHROPIC_API_KEY | med |
| claudeAssistant | Base44 InvokeLLM → repoint Anthropic | ANTHROPIC_API_KEY | med |
| generateAIProgram | Base44 InvokeLLM (+integrations) | ANTHROPIC_API_KEY | high |
| generateMealPlan | Base44 InvokeLLM (+integrations) | ANTHROPIC_API_KEY | high |
| generateSmartMeals | Base44 InvokeLLM (+integrations) | ANTHROPIC_API_KEY | med |

Shared work: one `_shared/anthropic.js` client (base URL + key + model ids) so
all seven share transport, retry, and token handling. Use the latest Claude
models per the app's stated identity.

### Onboarding / import (6) — **P1/P2**
| fn | does | complexity | dep |
|---|---|---|---|
| submitOnboardingIntake | public intake → onboarding_responses (RLS: service-role insert path from Step 1) | med | — | **P1** |
| commitClientImport | write mapped CSV rows → clients | med | — | **P2** |
| mapImportColumns | AI column-mapping for CSV import | med | ANTHROPIC_API_KEY | **P2** |
| searchFoods | USDA FoodData lookup | low | USDA_API_KEY | **P2** |
| seedExerciseLibrary | bulk-insert preset exercises | low | — | **P3** |
| seedTeam | create demo team/data | low | — | **P3** |

### Integrations / email / push (9) — **P2/P3**
| fn | provider | secret | complexity |
|---|---|---|---|
| sendEmailNotification | Resend (`api.resend.com`) | RESEND_API_KEY, FROM_EMAIL/NAME | low — **port first; 5a/5b invoke it** |
| emailHelper | email templating helper | — | low |
| sendInvoiceReminder | invoice-due emails (via mailer) | (RESEND via sendEmailNotification) | low |
| sendCheckInReminders | Fri reminder emails + notifications (weekly-completion, no risk) | RESEND_API_KEY | med |
| getPushPublicKey | returns VAPID public key | VAPID_PUBLIC_KEY | low |
| savePushSubscription | store web-push subscription | — | low |
| storePushSubscription | store web-push subscription (dup of above?) | — | low |
| googleCalendarProxy | Google Calendar API proxy | Google OAuth creds | high |
| zoomProxy | Zoom meeting create (server-to-server OAuth) | ZOOM_ACCOUNT_ID/CLIENT_ID/CLIENT_SECRET | high |

**sendEmailNotification is the keystone** — Step 5a's webhook and 5b's digest
already `invoke('sendEmailNotification', …)` defensively; porting it first turns
those email paths live. savePushSubscription vs storePushSubscription look
redundant — reconcile to one when porting.

### Referrals / subscription (4) — **P1/P2**
| fn | does | complexity | dep |
|---|---|---|---|
| validateSubscription | tier/limit gate (max_clients, program/plan counts) — called before create actions | med | — | **P1** (Clients.jsx already calls it) |
| verifyProgramWorkoutCount | integrity check on a program's workout count | low | — | **P2** |
| initializeReferralProgram | create a coach's referral_program row | low | — | **P3** |
| processReferralReward | credit a referral (money-adjacent → idempotency needed) | med | — | **P2** |

### Suggested continuation order
1. **sendEmailNotification** (unblocks 5a/5b email + all trigger fns).
2. **validateSubscription** (Clients cutover already depends on it).
3. **submitOnboardingIntake** + the 5 **DB-trigger** functions (data-integrity
   path; reuse automationRunner executors).
4. AI functions behind a shared `_shared/anthropic.js`.
5. import/referral/integration/seed utilities.
