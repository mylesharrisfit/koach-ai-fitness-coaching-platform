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

---

# UI/UX Migration (Phases 1–3)

Work done to prepare the app for white-label theming, dark mode, and a lower-cognitive-load
coach experience. Behavior preserved throughout; shadcn/ui + Radix + Vite kept.

## Phase 1 — Design-system tokenization + dark mode + white label

**New foundation**
- `src/index.css`: added a `.dark` token block (RGB triplets) so content surfaces flip while the
  matte-black sidebar stays dark in both modes. Body background now reads `rgb(var(--background))`
  instead of a hardcoded hex.
- `src/lib/theme.js`: `light | dark | system` preference, persisted to `localStorage` (`koach-theme`),
  respects `prefers-color-scheme`, applied before first paint via `initTheme()` in `main.jsx`.
  `useTheme()` hook + `setTheme`/`toggle`.
- `src/lib/brand.js` + `src/lib/useBrandColor.js`: a coach's White Label `primary_color` overrides the
  `--primary` token family at runtime (`--primary`, `--sidebar-primary`, `--ring`, `--chart-1`,
  contrast-aware `--primary-foreground`). Works in light and dark. Mounted in `AppLayout`.
- `src/lib/telemetry.js`: `track(event, props)` seam for the Nova event layer (dev console sink now;
  `addTelemetrySink` for the future transport). **TODO(nova): wire the real transport.**
- `ThemeToggle` (segmented, in Settings → Appearance) + `ThemeToggleButton` (compact, in the desktop
  sidebar header and mobile topbar).

**Token map (hex → token) applied to the shell**

| Hardcoded value | Token / class |
|---|---|
| `#0D0D0D` / `#0A0A0A` sidebar & topbar bg | `bg-sidebar` (`--sidebar-background`) |
| `rgba(255,255,255,0.05)` sidebar borders | `border-sidebar-border` |
| `#2563EB` primary / active accent | `bg-primary` / `text-primary` (`--primary`, brandable) |
| `rgba(59,130,246,0.12)` active pill, `#3B82F6` rail | `rgb(var(--sidebar-primary) / …)` (brandable) |
| `#FFFFFF` content cards | `bg-card` |
| `#111827` heading / dark tile | `text-foreground` / `bg-foreground` (or `bg-sidebar` for persistent-dark banners) |
| `#9CA3AF`, `#6B7280`, `#374151` secondary text | `text-muted-foreground` |
| `#E5E7EB`, `#E7EAF3` borders | `border-border` |
| `#F3F4F6`, `#F6F7FB` subtle surfaces | `bg-muted` |
| `#EF4444` / `#DC2626` | `text-destructive` / `bg-destructive` |
| `#22C55E` / `#16A34A` | `success` token |
| `#F59E0B` | `warning` token |

**Files fully tokenized (zero hardcoded hex):** `AppLayout.jsx`, `Sidebar.jsx`, `BottomNav.jsx`,
`MoreSheet.jsx`, `TodayView.jsx`.

**Remaining UI debt (not done this pass):** the token map above is established, but ~8,000 hex/rgba
occurrences remain across the other `src/components` and `src/pages` files (hot files: `#9ca3af` ×821,
`#2563eb` ×632, `#374151` ×628, `#6b7280` ×627, `#e5e7eb` ×491). These are a mechanical page-by-page
sweep using the map above, each requiring dark-mode QA — tracked as follow-up, not a blind global
replace (the palette is only partly 1:1 with tokens, so a scripted swap would cause visual
regressions). Also intentionally left as literals: `rgba(255,255,255,α)` opacities inside the
matte-black sidebar, and the token definitions in `index.css` itself.

## Phase 2 — Nav consolidation + ⌘K command palette

**New IA (13 visible items):**
- MAIN: Dashboard, Clients, Messages, Calendar
- COACHING: Programs, Nutrition, Check-ins, Adherence
- GROW: Business, Leads, Store
- AI: Assistant, Automations
- Bottom: Settings

**Demoted to the command palette + Settings (routes preserved, nothing deleted):** Exercises, Food
Library, Community, Challenges, Templates, White Label, Team, Weekly Summary, Email Center, Onboarding,
Analytics. **At-Risk** is folded into `/adherence` as an Overview/At-Risk tab (the `/at-risk` route
still works and is in the palette).

**Command registry shape** (`src/lib/commandRegistry.js`) — registering a command is a one-object add:
```js
{ id: 'ai.run_my_day', title: 'Run My Day', section: 'AI', icon: Zap,
  keywords: 'triage priorities', run: (ctx) => { ctx.track('ai.action', {…}); ctx.navigate('/'); ctx.close(); } }
```
`ctx = { navigate, setTheme, close, track }`. Sections: `AI` (quick-actions), `Create`, `Go to`
(every route incl. demoted). `COMMANDS` = `[...ACTION_COMMANDS, ...ROUTE_COMMANDS]`. The palette
(`src/components/command/CommandPalette.jsx`) is a global provider: ⌘K/Ctrl+K + `useCommandPalette().open()`,
fuzzy search over title+keywords, built on the existing cmdk `command.jsx`.

**Telemetry events exposed:** `nav.click`, `nav.subtab`, `command.open`, `command.invoke`,
`ai.action`, `create`, `theme.change`, `brand.apply` (all via `track()` — currently dev-console sink).

## Phase 3 — Dashboard prioritization + loading states

- `TodayView`: **Run My Day (Action Center) pinned to the top** of the actionable stack; the remaining
  sections (Today's Schedule, Weekly Snapshot, AI Insights, BI) are ordered by unresolved signal
  (AI Insights promoted when clients need attention — stale check-in ≥10 days or adherence <65).
- `DashboardSkeleton` + `ErrorState` (reusable, `src/components/shared/ErrorState.jsx`) wired into
  `Dashboard.jsx` (skeleton on first load, error card with retry on failure).
- `Clients.jsx`: added an error state (retry) alongside the existing skeleton + empty state; skeleton
  tokenized to `bg-muted`.

**Remaining UI debt:** extend skeleton/empty/error states to the other data-heavy widgets
(Messages, Programs, Nutrition, Adherence tables) using the same `ErrorState` + `Skeleton` primitives;
complete the hex→token sweep (above); replace the remaining native `alert()`/`confirm()` dialogs and
14 "coming soon" stubs noted in §3.

---

# Phase 4 — Client Portal Review (PLANNED — not implemented)

A dedicated later pass, kept separate from the coach app. Do **not** build in the current run.

**Nav trim (6 → 5):** the client portal bottom nav currently has 6 items. Trim to **Home, Train,
Schedule, Progress, Coach** — demote **Community** into Home (a feed card / secondary surface) rather
than a primary tab. Five targets is the mobile sweet spot and matches the coach-side simplification.

**"Simple + premium" UX review of the client screens**, to run then:
- Apply the same token system to `src/pages/portal/*` and `src/components/portal/*` so the client app
  inherits dark mode + white-label brand color (currently coach-only).
- Reduce per-screen density; one primary action per screen; large touch targets.
- Replace the portal's mock/placeholder spots flagged in the audit (saved payment methods `MockCard`,
  the `User.list()` coach lookup in `PortalNutrition`, the abandoned `PortalReferral` broken entities).
- Add skeleton/empty/error states to portal data loads for parity with the coach app.
- QA every portal screen in light + dark and under a sample brand color.
