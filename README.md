# KOACH AI

Premium AI-powered fitness coaching platform. Vite + React SPA, Supabase
(Auth + Postgres + Edge Functions) backend, deployed on Cloudflare Workers
static assets. See [`DEPLOYMENT.md`](./DEPLOYMENT.md) for the deploy flow and
[`SCHEMA_MIGRATION.md`](./SCHEMA_MIGRATION.md) for the Base44 → Supabase history.

> Migration note: this project began on Base44 and has been migrated to
> Supabase. Auth and all data now run through Supabase — the Base44 hosted
> backend is retained only behind an explicit, deprecated opt-out. Run in the
> default `supabase` auth mode.

## Local development

**Prerequisites:** Node 20+, and a Supabase project (URL + anon key).

1. Clone the repository and `cd` into it.
2. Install dependencies:
   ```
   npm install
   ```
3. Create an `.env.local` (copy `.env.example`) and set the Supabase vars:
   ```
   VITE_AUTH_PROVIDER=supabase
   VITE_SUPABASE_URL=https://<your-project>.supabase.co
   VITE_SUPABASE_ANON_KEY=<your-anon-key>
   ```
   Use the **anon** key only — never the service role in frontend env. Server
   secrets (service role, JWT secret, Stripe keys) are set on Supabase via
   `supabase secrets set`, not in this file. See `.env.example` for the full
   list.
4. Run the app:
   ```
   npm run dev
   ```

> The legacy `VITE_BASE44_*` variables are only needed for the deprecated
> `VITE_AUTH_PROVIDER=base44` path and can be ignored for normal development.

## Scripts

- `npm run dev` — Vite dev server
- `npm run build` — production build to `dist/`
- `npm run lint` / `npm run typecheck` — static checks
- `npm run verify:*` — migration/auth/facade verification harnesses (see
  `scripts/`)

## Deploying

See [`DEPLOYMENT.md`](./DEPLOYMENT.md). In short: `npm run build` then
`npx wrangler deploy` (reads `wrangler.jsonc`, uploads `dist/`). Set the
`VITE_*` build variables in the Cloudflare Workers Build settings.
