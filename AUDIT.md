# KOACH AI — Platform Audit (July 2026)

Full-stack audit of the Base44-generated coaching app ahead of the migration to
Supabase + Cloudflare. Findings cite real file paths and line numbers.

**Codebase:** 709 files · 65 pages · ~550 components · 63 entities · 42 backend functions.
**Build:** passes. **Lint:** 828 problems. **Launch-readiness:** ~6.5/10.

**Headline:** This is a real application, not a prototype — most feature areas have genuine
end-to-end data flow. What blocks launch is two critical security holes, a stack still 100%
coupled to Base44, three feature areas faked as real, and ~156 abandoned duplicate components.

---

## 1. Critical security flaws (fix before production)

### CRITICAL — Free paywall bypass
`src/components/subscription/UpgradeModal.jsx:47` writes the subscription tier straight from
the browser: `base44.auth.updateMe({ subscription_tier: tierKey })`. Because tier/billing/usage
all live on the self-writable `User` record, any user can grant themselves `enterprise`, zero
their `ai_generation_count`, or fake `billing_status: 'active'` from the console.
**Fix:** tier/billing/usage writable only by the server (service role) after a verified Stripe event.

### CRITICAL — `User.role` defaults to `admin` → multi-tenant data breach
`base44/entities/User.jsonc` defaults `role` to `admin`, and `admin` bypasses RLS on every
entity (each RLS block has an `{ role: "admin" }` escape hatch). Any default-role user could
read/modify every coach's clients, messages, payments, and check-ins. Base44 may override the
default; **Supabase will not.**
**Fix:** default `role` to `user`; promote coaches explicitly; drop the blanket admin-bypass branch.

### HIGH — Third-party API keys in the browser bundle
`src/lib/sendgrid.js` uses `VITE_RESEND_API_KEY`; `src/lib/calendly.js` uses
`VITE_CALENDLY_TOKEN`; a `VITE_STRIPE_SECRET_KEY` name also appears in frontend env. Vite
inlines all `VITE_` vars into client JS — anyone can extract these.
**Fix:** move behind Workers/Edge Functions, mirroring the correct `src/lib/stripe.js` proxy pattern.

### HIGH — Stripe webhook trusts forged events when secret is unset
`base44/functions/stripeWebhook/entry.ts:64` falls back to `JSON.parse(rawBody)` if
`STRIPE_WEBHOOK_SECRET` is missing.
**Fix:** require signature verification unconditionally.

### MEDIUM — AI spend uncapped
Quota metering lives in one function, but 23 direct `InvokeLLM` calls across 20 frontend files
bypass it, and the counter is user-writable.
**Fix:** route all LLM calls through a metered server function.

**Done right:** `stripeClientProxy` (auth + role + per-action ownership check) is the template
for every sensitive function on the new stack.

---

## 2. Feature reality check

| Feature | Status | Notes |
|---|---|---|
| Client management | WORKING | Full CRUD, lifecycle, AI CSV import |
| Program builder | WORKING | Drag-drop, AI gen (metered), templates |
| Exercise library | WORKING | Video/image fields; external URLs only |
| Nutrition & meal planning | WORKING | Real USDA search, AI meals; barcode stubbed |
| Check-ins & progress | WORKING | Photos, InBody, charts; voice notes + PDF stubbed |
| Messaging | WORKING | Real-time `Message.subscribe()`, AI reply assistant |
| Scheduling | WORKING | Real Google Calendar + Zoom OAuth, Calendly |
| AI features | WORKING | Agentic Claude assistant with real tool-calling |
| Client PWA portal | WORKING | 11 pages, real manifest/SW/offline; saved cards mock |
| Habits/goals/at-risk | WORKING | Real risk/adherence/insight engines |
| Community/gamification | WORKING | Posts, comments, badges, challenges |
| Payments/subscriptions | PARTIAL | Subs + store real; **invoices marked paid by hand** |
| White-label/affiliate/marketing | PARTIAL | Real branding + affiliate; some UI-forward |
| Notifications | PARTIAL | Email real (Resend); **push never delivered** |
| Wearable integrations | SHELL | **100% mock** — hardcoded steps/sleep, dead buttons |

**Three demo-killers:** (1) `Math.random()` stats shown as real completion %/rating and progress
bars that re-randomize on re-render; (2) push notifications that subscribe but never send;
(3) wearable data that's invented in source.

---

## 3. Frontend flaws & code errors

- **4 phantom entities** queried but never defined in schema: `ClientReferral`,
  `ClientReferralReward`, `ReferralConfiguration`, `ProgressAnalysis` — an entire client-side
  referral feature silently fails. (Two referral systems exist; reconcile onto the real one.)
- **Portal downloads every user** — `PortalNutrition.jsx:61` calls `User.list()` to find a coach
  name; exposes all users, picks wrong coach on team accounts.
- **~156 dead/orphan components** + 5 unrouted pages from regenerated features never deleted;
  6 duplicate component names live simultaneously.
- **14 "coming soon" buttons** + empty `onClick` handlers on real-looking controls.
- **Stale-data hook bugs:** `ClientDashboardModal.jsx:137` (stale client on switch);
  `CheckInEnhancedDrawer.jsx:143` / `CheckInReviewDrawer.jsx:148` (check-in notes carry to next
  client — can save feedback to wrong client); dashboard KPIs recompute every render.
- **Weak CI:** `eslint.config.js` disables `no-undef` and `no-unused-vars`, never enables
  `exhaustive-deps`. Enabling + `lint:fix` clears 524 of 828 problems and surfaces real bugs.
- **83 unbounded `.list()`** full-table fetches filtered client-side; **36 silent catch blocks**.

---

## 4. Migration blast radius (Base44 → Supabase + Cloudflare)

| Coupling point | Call-sites | Becomes |
|---|---|---|
| `base44.entities.*` | ~750+ | Supabase queries + Postgres RLS |
| `base44.functions.invoke` | 55 → 27 fns | Cloudflare Workers / Edge Functions |
| 42 backend `entry.ts` | all 42 | Rewrite off Deno + `asServiceRole` |
| `Core.InvokeLLM / UploadFile` | 46 | Claude API + Supabase Storage / R2 |
| `base44.auth.*` | ~60 | Supabase Auth (replaces URL-token flow) |
| Base44 Agents API | 1 + config | No equivalent — rebuild on Claude API |

- **278 of 705 source files** import the Base44 SDK (~39%).
- **Two empty Supabase projects exist** (`mylesharrisfit's Project`, `KOACH AI`) — both have zero
  tables. Pick `KOACH AI`, delete the other, build the schema first.
- Frontend writes ~11 fields to `User` that no schema defines (onboarding) — Postgres will reject;
  add columns or a JSONB blob.
- Relationships are untyped strings, not FKs — add real foreign keys during migration; clean up
  duplicated state (`Client.status` vs `lifecycle_status`).
- **Recommended stack:** Supabase (Postgres + Auth + Storage + Realtime) · Cloudflare Pages +
  Workers · Claude API from Workers for all AI. Vercel not needed.

---

## 5. Vs. the market (Trainerize, TrueCoach, Everfit, PT Distinction, CoachRx)

**On feature scope you already compete.** Gaps are plumbing + positioning, not missing product.

**Where you win:** agentic AI copilot (executes real actions — incumbents stop at autocomplete);
native nutrition + USDA in the same product as strong programming; all-in-one breadth
(affiliate/community/marketing/store usually add-ons elsewhere).

**Where you must catch up:** wearable sync (table-stakes, currently mock — fix first);
native mobile app (you have a PWA); push notifications (rivals deliver, yours don't).

**Market wedges that fit what you've built:**
1. **Flat pricing, 0% payment fees** — TrueCoach's 5% and CoachRx's 2% are actively resented.
2. **AI check-in triage at roster scale** — almost no one has this; you have the assistant + data.
3. **Client acquisition** — ~70% of coaches' #1 problem, unsolved by every platform.

---

## 6. Execution roadmap

**Phase 0 — Stop the bleeding (days):** kill paywall bypass; flip `admin` default to `user`;
enforce webhook signatures; turn on lint gate + `lint:fix`; delete fake-data spots.

**Phase 1 — Migrate the foundation:** schema first (63 entities → Postgres w/ FKs); hand-port RLS
minus admin bypass; Supabase Auth; a single data-layer wrapper so ~750 calls move behind one seam;
rewrite 42 functions as Workers; Realtime for messaging; Claude API for all AI behind the server.

**Phase 2 — Finish faked features:** wearables (Apple Health + MyFitnessPal at minimum);
push send-side (VAPID + web-push from a Worker); invoice payment collection + real saved cards;
wire or remove the 14 stubs; delete the ~156 dead components.

**Phase 3 — Differentiate & GTM:** lead with 0% payment fees; ship AI roster-wide check-in triage;
build client-acquisition funnels/referral/marketplace; plan the native app (Capacitor or native).

**Bottom line:** a broad, mostly-real app with a soft security floor and a backend it's mid-divorce
from. Secure it in days, migrate deliberately, finish three faked features, and it genuinely competes.
