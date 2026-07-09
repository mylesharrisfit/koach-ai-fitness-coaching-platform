#!/usr/bin/env node
/**
 * One-time Base44 -> Supabase data migration (Migration Step 2a).
 * Run manually — this is NOT part of the build.
 *
 * Source (one of):
 *   BASE44_APP_ID + BASE44_API_KEY   read live via @base44/sdk, paginated
 *   --fixture <file.json>            read a local export: { EntityName: [rows] }
 *
 * Sink (one of):
 *   SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY   real project (service role)
 *   POSTGRES_URL                               direct Postgres (local dry-runs)
 *
 * Flags:
 *   --dry-run          transform + validate, write nothing
 *   --entities A,B     restrict to specific entities (dependency order kept)
 *   --out-dir <dir>    where logs go (default ./migration-logs)
 *
 * Guarantees:
 *   - Idempotent: row ids are deterministic UUIDv5 of the Base44 id, and all
 *     writes are upserts on id — re-running converges, never duplicates.
 *   - Coach/user references (ids OR emails — Base44 mixed both) resolve
 *     through auth.users, created on demand by email.
 *   - clients.invite_token (plaintext, old system only) is sha256-hashed into
 *     invite_token_hash; plaintext is never written anywhere.
 *   - Nothing is silently dropped: every unmapped/failed row lands in
 *     <out-dir>/skipped.jsonl with a reason; per-entity counts print at end.
 */
import { createHash, randomUUID } from 'node:crypto';
import { mkdirSync, writeFileSync, appendFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// ---------------------------------------------------------------------------
// CLI / env
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
const getFlag = (name) => args.includes(name);
const getOpt = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};

const DRY_RUN = getFlag('--dry-run');
const FIXTURE = getOpt('--fixture');
const ONLY = getOpt('--entities')?.split(',');
const OUT_DIR = getOpt('--out-dir') ?? './migration-logs';

mkdirSync(OUT_DIR, { recursive: true });
const SKIP_LOG = join(OUT_DIR, 'skipped.jsonl');
writeFileSync(SKIP_LOG, '');

const skipped = {};
function logSkip(entity, row, reason) {
  skipped[entity] = (skipped[entity] ?? 0) + 1;
  appendFileSync(
    SKIP_LOG,
    JSON.stringify({ entity, reason, base44_id: row?.id ?? null, row }) + '\n'
  );
}

// ---------------------------------------------------------------------------
// Deterministic UUIDv5 (sha1) for Base44 row ids -> stable Postgres uuids
// ---------------------------------------------------------------------------
const UUID_NS = 'a3a4c9de-4f6b-49f2-9d3a-koach'.padEnd(36, '0'); // label only
function uuidv5(name) {
  const hash = createHash('sha1').update(UUID_NS).update(String(name)).digest();
  const b = Buffer.from(hash.subarray(0, 16));
  b[6] = (b[6] & 0x0f) | 0x50; // version 5
  b[8] = (b[8] & 0x3f) | 0x80; // variant
  const h = b.toString('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}
const rowId = (base44Id) => (base44Id ? uuidv5(`row:${base44Id}`) : null);
const sha256hex = (s) => createHash('sha256').update(s).digest('hex');

// ---------------------------------------------------------------------------
// Source: Base44 SDK or fixture file
// ---------------------------------------------------------------------------
async function makeSource() {
  if (FIXTURE) {
    const data = JSON.parse(readFileSync(FIXTURE, 'utf8'));
    return { kind: `fixture:${FIXTURE}`, list: async (entity) => data[entity] ?? [] };
  }
  const { BASE44_APP_ID, BASE44_API_KEY } = process.env;
  if (!BASE44_APP_ID || !BASE44_API_KEY) {
    console.error(
      'No source available: set BASE44_APP_ID + BASE44_API_KEY, or pass --fixture <file.json>.'
    );
    process.exit(1);
  }
  const { createClient } = await import('@base44/sdk');
  const base44 = createClient({ appId: BASE44_APP_ID, apiKey: BASE44_API_KEY, requiresAuth: false });
  return {
    kind: 'base44-api',
    list: async (entity) => {
      const out = [];
      const PAGE = 200;
      for (let skip = 0; ; skip += PAGE) {
        const page = await base44.entities[entity].list('-created_date', PAGE, skip);
        out.push(...page);
        if (!page || page.length < PAGE) break;
        if (skip > 500000) throw new Error(`pagination runaway on ${entity}`);
      }
      return out;
    },
  };
}

// ---------------------------------------------------------------------------
// Sink: Supabase service role, or direct Postgres for local dry-runs
// ---------------------------------------------------------------------------
async function makeSink() {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, POSTGRES_URL } = process.env;

  if (POSTGRES_URL) {
    const { default: pg } = await import('pg');
    const pool = new pg.Pool({ connectionString: POSTGRES_URL });
    const typesCache = new Map(); // table -> Map(column -> udt_name)
    const columnTypes = async (table) => {
      if (!typesCache.has(table)) {
        const { rows } = await pool.query(
          `select column_name, udt_name from information_schema.columns
           where table_schema='public' and table_name=$1`,
          [table]
        );
        typesCache.set(table, new Map(rows.map((r) => [r.column_name, r.udt_name])));
      }
      return typesCache.get(table);
    };
    return {
      kind: `postgres:${POSTGRES_URL.replace(/\/\/.*@/, '//***@')}`,
      async columns(table) {
        return new Set((await columnTypes(table)).keys());
      },
      async ensureUser(email, fullName) {
        const found = await pool.query('select id from auth.users where email = $1', [email]);
        if (found.rows.length) return found.rows[0].id;
        const id = randomUUID();
        await pool.query(
          `insert into auth.users (id, email, raw_user_meta_data)
           values ($1, $2, jsonb_build_object('full_name', $3::text))`,
          [id, email, fullName ?? '']
        );
        return id;
      },
      async upsert(table, row) {
        const types = await columnTypes(table);
        const cols = Object.keys(row);
        // jsonb columns need JSON text (a bare JS array would be sent as a
        // Postgres array literal and fail); native array columns pass through.
        const vals = cols.map((c) => {
          const v = row[c];
          if (v === null || v === undefined) return null;
          const udt = types.get(c);
          if (udt === 'jsonb' || udt === 'json') return JSON.stringify(v);
          return v;
        });
        const params = cols.map((_, i) => `$${i + 1}`).join(', ');
        const updates = cols.filter((c) => c !== 'id').map((c) => `${q(c)} = excluded.${q(c)}`);
        await pool.query(
          `insert into public.${q(table)} (${cols.map(q).join(', ')})
           values (${params})
           on conflict (id) do update set ${updates.join(', ') || 'id = excluded.id'}`,
          vals
        );
      },
      async updateById(table, id, patch) {
        const types = await columnTypes(table);
        const cols = Object.keys(patch);
        const vals = cols.map((c) => {
          const v = patch[c];
          if (v === null || v === undefined) return null;
          const udt = types.get(c);
          if (udt === 'jsonb' || udt === 'json') return JSON.stringify(v);
          return v;
        });
        const sets = cols.map((c, i) => `${q(c)} = $${i + 2}`).join(', ');
        const res = await pool.query(
          `update public.${q(table)} set ${sets} where id = $1`,
          [id, ...vals]
        );
        if (res.rowCount === 0) throw new Error(`no row with id ${id} to patch`);
      },
      async close() {
        await pool.end();
      },
    };
  }

  if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
    const { createClient } = await import('@supabase/supabase-js');
    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    let openapi = null;
    return {
      kind: `supabase:${SUPABASE_URL}`,
      async columns(table) {
        if (!openapi) {
          const res = await fetch(`${SUPABASE_URL}/rest/v1/`, {
            headers: { apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
          });
          openapi = await res.json();
        }
        const def = openapi.definitions?.[table];
        return def ? new Set(Object.keys(def.properties ?? {})) : null;
      },
      async ensureUser(email, fullName) {
        // listUsers has no email filter pre-v2 admin generateLink trick; page through once and cache
        if (!this._userCache) {
          this._userCache = new Map();
          for (let page = 1; ; page++) {
            const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 1000 });
            if (error) throw error;
            for (const u of data.users) this._userCache.set(u.email?.toLowerCase(), u.id);
            if (data.users.length < 1000) break;
          }
        }
        const cached = this._userCache.get(email.toLowerCase());
        if (cached) return cached;
        const { data, error } = await sb.auth.admin.createUser({
          email,
          email_confirm: true,
          user_metadata: { full_name: fullName ?? '' },
        });
        if (error) throw error;
        this._userCache.set(email.toLowerCase(), data.user.id);
        return data.user.id;
      },
      async upsert(table, row) {
        const { error } = await sb.from(table).upsert(row, { onConflict: 'id' });
        if (error) throw new Error(error.message);
      },
      async updateById(table, id, patch) {
        const { error, count } = await sb
          .from(table)
          .update(patch, { count: 'exact' })
          .eq('id', id);
        if (error) throw new Error(error.message);
        if (count === 0) throw new Error(`no row with id ${id} to patch`);
      },
      async close() {},
    };
  }

  console.error(
    'No sink available: set SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY, or POSTGRES_URL for a local dry-run.'
  );
  process.exit(1);
}

const q = (ident) => `"${ident.replace(/"/g, '""')}"`;

// ---------------------------------------------------------------------------
// Entity specs. Field categories:
//   user:  value is a Base44 user id OR email -> auth.users uuid
//   row:   value is a Base44 row id -> deterministic uuid
//   rows:  array of Base44 row ids
//   mixed: user id OR client row id (community author_id / likes)
// Order matters: FK parents before children.
// ---------------------------------------------------------------------------
const SPECS = [
  // core ------------------------------------------------------------------
  { entity: 'User', table: 'profiles', special: 'profiles' },
  { entity: 'Team', table: 'teams', user: ['owner_coach_id'] },
  { entity: 'TeamMember', table: 'team_members', user: ['user_id', 'invited_by'], row: ['team_id'] },
  {
    entity: 'Client', table: 'clients', user: ['user_id'], row: ['team_id'],
    // assigned_* FKs are added post-pass (programs/plans load later)
    defer: ['assigned_program_id', 'assigned_nutrition_id'],
    transform(row) {
      if (row.invite_token) {
        row.invite_token_hash = sha256hex(row.invite_token);
        delete row.invite_token;
      }
      return row;
    },
  },
  // coaching ----------------------------------------------------------------
  { entity: 'ExerciseLibrary', table: 'exercise_library' },
  { entity: 'WorkoutProgram', table: 'workout_programs', row: ['team_id'] },
  { entity: 'NutritionPlan', table: 'nutrition_plans', row: ['client_id', 'team_id'], rows: ['assigned_clients'] },
  { entity: 'WorkoutSession', table: 'workout_sessions', row: ['client_id', 'program_id', 'team_id'] },
  { entity: 'MealTemplate', table: 'meal_templates' },
  { entity: 'FoodItem', table: 'food_items', user: ['coach_id'] },
  { entity: 'FoodLog', table: 'food_logs', row: ['client_id', 'nutrition_plan_id', 'food_item_id'] },
  { entity: 'CheckInForm', table: 'check_in_forms', rows: ['assigned_client_ids'] },
  { entity: 'CheckIn', table: 'check_ins', row: ['client_id', 'form_id'] },
  { entity: 'DailyLog', table: 'daily_logs', row: ['client_id'] },
  { entity: 'WeighIn', table: 'weigh_ins', row: ['client_id', 'team_id'] },
  { entity: 'InBodyScan', table: 'in_body_scans', row: ['client_id'] },
  { entity: 'Habit', table: 'habits', row: ['client_id', 'team_id'] },
  { entity: 'HabitCompletion', table: 'habit_completions', row: ['habit_id', 'client_id', 'team_id'] },
  { entity: 'Goal', table: 'goals', row: ['client_id', 'team_id'] },
  { entity: 'GoalTemplate', table: 'goal_templates', user: ['coach_id'] },
  { entity: 'SupplementLibrary', table: 'supplement_library' },
  { entity: 'Message', table: 'messages', row: ['client_id', 'team_id'] },
  { entity: 'Session', table: 'coaching_sessions', row: ['client_id'] },
  { entity: 'BlockedTime', table: 'blocked_times', user: ['coach_id'] },
  { entity: 'BufferTime', table: 'buffer_times', user: ['coach_id'] },
  { entity: 'CoachAvailability', table: 'coach_availability', user: ['coach_id'] },
  // real data contains the CLIENT's email in coach_id -> fall back to row creator
  { entity: 'OnboardingResponse', table: 'onboarding_responses', user: ['coach_id'], userFallbackCreator: ['coach_id'], row: ['client_id'] },
  // business ----------------------------------------------------------------
  { entity: 'Lead', table: 'leads', row: ['converted_client_id'] },
  { entity: 'CoachingPackage', table: 'coaching_packages', row: ['auto_assign_program_id', 'auto_assign_nutrition_id'] },
  { entity: 'PlanListing', table: 'plan_listings', user: ['coach_id'], row: ['program_id', 'nutrition_id'] },
  { entity: 'Invoice', table: 'invoices', row: ['client_id'] },
  { entity: 'Payment', table: 'payments', row: ['client_id'] },
  { entity: 'EmailTemplate', table: 'email_templates', user: ['coach_id'] },
  { entity: 'MarketingCampaign', table: 'marketing_campaigns', user: ['coach_id'] },
  { entity: 'MarketingLink', table: 'marketing_links', user: ['coach_id'] },
  { entity: 'Testimonial', table: 'testimonials', user: ['coach_id'], row: ['client_id'] },
  { entity: 'ReferralProgram', table: 'referral_programs', user: ['coach_id'] },
  { entity: 'ReferralPayout', table: 'referral_payouts', user: ['coach_id'], rows: ['referral_ids'] },
  { entity: 'Referral', table: 'referrals', user: ['referrer_id', 'referred_coach_id'], row: ['payout_id'] },
  { entity: 'AffiliateProfile', table: 'affiliate_profiles', user: ['coach_id'] },
  { entity: 'AffiliateApplication', table: 'affiliate_applications', user: ['coach_id'] },
  { entity: 'AffiliateLink', table: 'affiliate_links', user: ['coach_id'] },
  { entity: 'AffiliateCommission', table: 'affiliate_commissions', user: ['affiliate_id', 'coach_id'], row: ['affiliate_link_id'] },
  { entity: 'AffiliatePayout', table: 'affiliate_payouts', user: ['affiliate_id'] },
  // community ---------------------------------------------------------------
  { entity: 'CommunityGroup', table: 'community_groups', user: ['coach_id'], rows: ['member_ids'] },
  { entity: 'Challenge', table: 'challenges', row: ['group_id'], rows: ['participants'] },
  { entity: 'CommunityPost', table: 'community_posts', user: ['coach_id'], row: ['group_id', 'challenge_id'], mixed: ['author_id'], mixedArrays: ['likes'] },
  { entity: 'PostComment', table: 'post_comments', user: ['coach_id'], row: ['post_id', 'parent_comment_id'], mixed: ['author_id'], mixedArrays: ['likes'] },
  { entity: 'ClientBadge', table: 'client_badges', row: ['client_id'] },
  { entity: 'CommunitySettings', table: 'community_settings', user: ['coach_id'] },
  // system ------------------------------------------------------------------
  { entity: 'AutomationRule', table: 'automation_rules' },
  { entity: 'AutomationLog', table: 'automation_logs', row: ['rule_id', 'client_id'] },
  {
    entity: 'Notification', table: 'notifications', user: ['recipient_id'],
    row: ['related_client_id', 'related_checkin_id'],
  },
  { entity: 'NotificationSettings', table: 'notification_settings', user: ['coach_id'] },
  { entity: 'ReminderSettings', table: 'reminder_settings', user: ['coach_id'] },
  {
    entity: 'ZapierLog', table: 'zapier_logs', row: ['client_id'],
    transform(row) {
      if (typeof row.payload === 'string') {
        try { row.payload = JSON.parse(row.payload); }
        catch { row.payload = { raw: row.payload }; }
      }
      return row;
    },
  },
  { entity: 'AIConversation', table: 'ai_conversations', row: ['client_id'] },
  // real data contains coach_id='me' (old UI bug) -> fall back to row creator
  { entity: 'ClientImportJob', table: 'client_import_jobs', user: ['coach_id'], userFallbackCreator: ['coach_id'] },
  {
    entity: 'BusinessSettings', table: 'business_settings', user: ['coach_id'],
    row: ['default_checkin_form_id', 'default_program_id', 'default_meal_plan_id', 'intake_form_id'],
  },
  { entity: 'CoachSettings', table: 'coach_settings', user: ['coach_id'] },
  { entity: 'CoachDefaults', table: 'coach_defaults', user: ['coach_id'], row: ['default_program_id', 'default_nutrition_id'] },
  { entity: 'CoachProfile', table: 'coach_profiles', user: ['coach_id'] },
  { entity: 'WhiteLabelSettings', table: 'white_label_settings', user: ['coach_id'] },
];

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------
const source = await makeSource();
const sink = await makeSink();
console.log(`source: ${source.kind}\nsink:   ${sink.kind}${DRY_RUN ? '  (DRY RUN — no writes)' : ''}\n`);

// user resolution maps, built from the Base44 User entity
const userIdToUuid = new Map();
const emailToUuid = new Map();
const knownClientRowIds = new Set(); // base44 Client ids, for mixed author fields

async function resolveUser(value) {
  if (!value) return null;
  const v = String(value);
  if (v.includes('@')) return emailToUuid.get(v.toLowerCase()) ?? null;
  return userIdToUuid.get(v) ?? null;
}

// Base44 platform metadata + auth-layer state (auth state moves to Supabase
// Auth in Step 3, not to profiles) — dropped intentionally, without log noise.
const BUILTIN_DROP = new Set([
  'is_sample', 'app_id', 'entity_name', '_id',
  'disabled', 'disabled_reason', 'force_password_reset', 'is_verified',
  'is_service', 'collaborator_role', '_app_role',
]);

async function transformRow(spec, raw) {
  const row = { ...raw };
  // Base44 built-ins
  row.id = rowId(raw.id);
  if (!row.id) throw new Error('missing id');
  if (raw.created_date) { row.created_at = raw.created_date; delete row.created_date; }
  if (raw.updated_date) { row.updated_at = raw.updated_date; delete row.updated_date; }
  const creator = raw.created_by_id ?? raw.created_by; // id preferred, email fallback
  delete row.created_by_id;
  delete row.created_by;
  const createdBy = await resolveUser(creator);
  if (createdBy) row.created_by = createdBy;
  for (const k of BUILTIN_DROP) delete row[k];

  for (const f of spec.user ?? []) {
    if (row[f] == null) continue;
    const mapped = await resolveUser(row[f]);
    if (!mapped) {
      // Opt-in per spec: coach_id fields may fall back to the row creator
      // (the creator IS the coach for these entities). Never used for
      // recipient-style fields, where it would misroute data.
      if (spec.userFallbackCreator?.includes(f) && createdBy) {
        appendFileSync(
          SKIP_LOG,
          JSON.stringify({ entity: spec.entity, reason: `note: ${f}='${row[f]}' unresolved, used row creator`, base44_id: raw.id }) + '\n'
        );
        row[f] = createdBy;
        continue;
      }
      throw new Error(`unresolved user reference ${f}=${row[f]}`);
    }
    row[f] = mapped;
  }
  for (const f of spec.row ?? []) {
    if (row[f] == null) continue;
    row[f] = rowId(row[f]);
  }
  for (const f of spec.rows ?? []) {
    if (row[f] == null) continue;
    row[f] = row[f].map((v) => rowId(v));
  }
  const mixedMap = async (v) => {
    const asUser = await resolveUser(v);
    if (asUser && !knownClientRowIds.has(String(v))) return asUser;
    return rowId(v);
  };
  for (const f of spec.mixed ?? []) {
    if (row[f] == null) continue;
    row[f] = await mixedMap(row[f]);
  }
  for (const f of spec.mixedArrays ?? []) {
    if (row[f] == null) continue;
    row[f] = await Promise.all(row[f].map(mixedMap));
  }
  for (const f of spec.defer ?? []) delete row[f]; // applied in second pass
  if (spec.transform) spec.transform(row);

  // Base44 rows are schemaless: an explicit null means "unset". Strip nulls
  // so Postgres column defaults (and NOT NULL defaults) apply instead.
  for (const k of Object.keys(row)) {
    if (row[k] === null || row[k] === undefined) delete row[k];
  }

  // drop keys the target table doesn't have (logged, not silent)
  const cols = await sink.columns(spec.table);
  if (cols) {
    for (const k of Object.keys(row)) {
      if (!cols.has(k)) {
        appendFileSync(
          SKIP_LOG,
          JSON.stringify({ entity: spec.entity, reason: `dropped unknown column '${k}'`, base44_id: raw.id, value: row[k] }) + '\n'
        );
        delete row[k];
      }
    }
  }
  return row;
}

const counts = {};
const deferred = []; // [{table, id, patch}] second pass for clients.assigned_*

// Pass 0 — users first: build auth users + maps, upsert profile fields
const userRows = ONLY && !ONLY.includes('User') ? [] : await source.list('User');
for (const u of userRows) {
  const email = u.email?.toLowerCase();
  if (!email) { logSkip('User', u, 'user row without email'); continue; }
  const uid = DRY_RUN ? uuidv5(`dryrun-user:${email}`) : await sink.ensureUser(email, u.full_name);
  userIdToUuid.set(String(u.id), uid);
  emailToUuid.set(email, uid);
}

// Client ids feed `mixed` resolution (author_id may be a client id)
if (!ONLY || ONLY.includes('CommunityPost') || ONLY.includes('PostComment') || ONLY.includes('Client')) {
  for (const c of await source.list('Client')) knownClientRowIds.add(String(c.id));
}

for (const spec of SPECS) {
  if (ONLY && !ONLY.includes(spec.entity)) continue;

  if (spec.special === 'profiles') {
    let ok = 0;
    for (const u of userRows) {
      const uid = userIdToUuid.get(String(u.id));
      if (!uid) continue;
      const profile = { ...u };
      delete profile.invite_token;
      const row = await transformRow({ ...spec, special: undefined }, profile);
      row.id = uid; // profiles pk = auth user id, not uuidv5
      try {
        if (!DRY_RUN) await sink.upsert('profiles', row);
        ok++;
      } catch (e) {
        logSkip('User', u, e.message);
      }
    }
    counts.User = { read: userRows.length, written: ok };
    console.log(`User -> profiles: ${ok}/${userRows.length}`);
    continue;
  }

  const rows = await source.list(spec.entity);
  let ok = 0;
  for (const raw of rows) {
    try {
      const row = await transformRow(spec, raw);
      if (spec.entity === 'Client') {
        for (const f of ['assigned_program_id', 'assigned_nutrition_id']) {
          if (raw[f]) deferred.push({ table: 'clients', id: row.id, patch: { [f]: rowId(raw[f]) } });
        }
      }
      if (!DRY_RUN) await sink.upsert(spec.table, row);
      ok++;
    } catch (e) {
      logSkip(spec.entity, raw, e.message);
    }
  }
  counts[spec.entity] = { read: rows.length, written: ok };
  console.log(`${spec.entity} -> ${spec.table}: ${ok}/${rows.length}`);
}

// Pass 2 — deferred FK patches (clients.assigned_* need programs/plans present)
let patched = 0;
for (const d of deferred) {
  try {
    if (!DRY_RUN) await sink.updateById(d.table, d.id, d.patch);
    patched++;
  } catch (e) {
    logSkip('Client(deferred-fk)', { id: d.id, ...d.patch }, e.message);
  }
}
if (deferred.length) console.log(`clients assigned_* backfill: ${patched}/${deferred.length}`);

// ---------------------------------------------------------------------------
console.log('\n=== summary ===');
for (const [entity, c] of Object.entries(counts)) {
  const s = skipped[entity] ?? 0;
  console.log(`${entity.padEnd(24)} read=${c.read}  written=${c.written}  skipped=${s}`);
}
const totalSkipped = Object.values(skipped).reduce((a, b) => a + b, 0);
console.log(`\nskipped/failed rows logged to ${SKIP_LOG} (${totalSkipped} entries incl. dropped-column notes)`);
await sink.close();
