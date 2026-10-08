#!/usr/bin/env node
/**
 * generateSmartMeals: ownership is checked BEFORE the AI call.
 *
 * Runs the REAL generateSmartMeals edge function (Deno) through REAL PostgREST
 * against a fresh migrated database (scripts/lib/edgeHarness.mjs), with the
 * Anthropic API faked by intercepting api.anthropic.com so every Claude call
 * is counted. A coach naming another tenant's client or plan must be refused
 * with no Claude call and no monthly generation used; their own client/plan
 * must still work end to end (meals saved on the plan).
 *
 * Usage (fresh database: auth-shim.sql + all migrations):
 *   POSTGRES_URL=postgresql://postgres@127.0.0.1:55432/smtest \
 *   POSTGREST_BIN=/path/to/postgrest DENO_BIN=/path/to/deno \
 *     node scripts/verify-smart-meals-ownership.mjs
 */
import pg from 'pg';
import { startEdgeHarness, userToken } from './lib/edgeHarness.mjs';

const POSTGRES_URL = process.env.POSTGRES_URL;
if (!POSTGRES_URL) { console.error('Set POSTGRES_URL'); process.exit(1); }
const db = new pg.Client({ connectionString: POSTGRES_URL });
await db.connect();

let failures = 0;
const check = (label, cond, extra = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}${extra ? `  (${extra})` : ''}`);
  if (!cond) failures++;
};

const A = '5e000000-0000-0000-0000-00000000000a';
const B = '5e000000-0000-0000-0000-00000000000b';
if ((await db.query('select 1 from auth.users where id=$1', [A])).rowCount) {
  console.error('verify-smart-meals-ownership needs a FRESH migrated database.');
  process.exit(1);
}
await db.query(`insert into auth.users (id, email) values ($1,'a@sm.test'), ($2,'b@sm.test')`, [A, B]);
await db.query(`update public.profiles set billing_status='active', subscription_tier='pro', ai_generation_count=0, ai_generation_month=null where id in ($1,$2)`, [A, B]);
const one = async (sql, v) => (await db.query(sql, v)).rows[0];
const aClient = (await one(`insert into public.clients (name, email, user_id, created_by) values ('A1','a1@sm.test',$1,$1) returning id`, [A])).id;
const bClient = (await one(`insert into public.clients (name, email, user_id, created_by) values ('B1','b1@sm.test',$1,$1) returning id`, [B])).id;
const aPlan = (await one(`insert into public.nutrition_plans (title, client_id, created_by) values ('A plan',$1,$2) returning id`, [aClient, A])).id;
const bPlan = (await one(`insert into public.nutrition_plans (title, client_id, created_by, meals) values ('B plan',$1,$2,'[]') returning id`, [bClient, B])).id;

let claudeCalls = 0;
const MEAL = { meal_name: 'Breakfast', time: '08:00', options: [{ label: 'Oats', foods: [{ food_name: 'Oats', portion: '80g', calories: 300, protein: 10, carbs: 50, fats: 6 }] }] };
const h = await startEdgeHarness({
  postgresUrl: POSTGRES_URL,
  functions: ['generateSmartMeals'],
  env: { ANTHROPIC_API_KEY: 'sk-ant-harness' },
  intercept: {
    'api.anthropic.com': ({ body }) => {
      claudeCalls++;
      const req = JSON.parse(body || '{}');
      const name = req.tools?.[0]?.name ?? 'submit_meals';
      const input = name === 'submit_meal' ? MEAL : { meals: [MEAL] };
      return { status: 200, body: { id: 'msg_x', type: 'message', role: 'assistant', stop_reason: 'tool_use', usage: { output_tokens: 10 }, content: [{ type: 'tool_use', id: 'tu_1', name, input }] } };
    },
  },
});
const T = userToken(A, 'a@sm.test');
const used = async () => (await one('select ai_generation_count n from public.profiles where id=$1', [A])).n ?? 0;
const base = { calories: 2000, protein_g: 150, carbs_g: 200, fats_g: 60, meal_count: 1, options_count: 1 };

try {
  for (const [label, extra] of [
    ["another coach's client_id", { client_id: bClient }],
    ["another coach's nutrition_plan_id", { nutrition_plan_id: bPlan }],
    ["another coach's client_id (single-meal regenerate)", { client_id: bClient, mode: 'regenerate', meal: { meal_name: 'Breakfast', total_meals: 4 } }],
  ]) {
    const before = claudeCalls; const genBefore = await used();
    const r = await h.callFunction('generateSmartMeals', { token: T, body: { ...base, ...extra } });
    check(`${label}: 403 with no Claude call and no generation used`,
      r.status === 403 && claudeCalls === before && await used() === genBefore,
      `status=${r.status} calls=${claudeCalls - before} gen=${genBefore}->${await used()}`);
  }
  const bMeals = (await one('select meals::text m from public.nutrition_plans where id=$1', [bPlan])).m;
  check("another coach's plan untouched", bMeals === '[]');

  const before = claudeCalls; const genBefore = await used();
  const ok = await h.callFunction('generateSmartMeals', { token: T, body: { ...base, client_id: aClient, nutrition_plan_id: aPlan } });
  const aMeals = (await one('select meals from public.nutrition_plans where id=$1', [aPlan])).meals;
  check('own client + plan: generates, saves meals on the plan, uses 1 generation',
    ok.status === 200 && ok.body.draft_plan_id === aPlan && claudeCalls > before && await used() === genBefore + 1 && aMeals?.[0]?.meal_name === 'Breakfast',
    `status=${ok.status} ${JSON.stringify(ok.body).slice(0, 120)}`);
  const regen = await h.callFunction('generateSmartMeals', { token: T, body: { ...base, client_id: aClient, mode: 'regenerate', meal: { meal_name: 'Breakfast', total_meals: 4 } } });
  check('own client: single-meal regenerate still works', regen.status === 200 && regen.body.meal?.meal_name === 'Breakfast', `${regen.status}`);
} finally {
  await h.stop();
}

console.log(failures ? `\n${failures} FAILURE(S)` : '\nALL CHECKS PASSED');
await db.end();
process.exit(failures ? 1 : 0);
