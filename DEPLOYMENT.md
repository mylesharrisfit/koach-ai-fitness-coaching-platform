# Deployment — Cloudflare Pages (static SPA)

This app is a **pure static Vite + React SPA**. `npm run build` emits static
files to `dist/` (HTML + hashed JS/CSS + PWA assets) that any static host can
serve — **no Node server, no server-side rendering, no Pages Functions**. It is
deployed via **Cloudflare Pages** using the **GitHub integration** (Cloudflare
builds on each push).

## Confirmed build settings

Verified against `package.json` and `vite.config.js` (not assumed):

| Setting            | Value                | Source of truth                                      |
| ------------------ | -------------------- | ---------------------------------------------------- |
| Build command      | `npm run build`      | `package.json` → `scripts.build` = `vite build`      |
| Build output dir   | `dist`               | Vite default — `vite.config.js` sets no `build.outDir`|
| Asset base path    | `/` (site root)      | Vite default — `vite.config.js` sets no `base`        |
| Node version       | 18 or 20 (LTS)       | Vite 6 requires Node 18+; pin `NODE_VERSION` (below)  |
| Framework preset   | **Vite**             | Dashboard preset auto-fills the two values above     |

The dev-only Base44 proxy log (`[base44] Proxy not enabled …`) is Vite
middleware that runs during `vite dev` **only** — it is not part of the
production bundle and has no runtime presence on Pages.

## Do we need a config file? (wrangler.toml vs. Pages)

**No `wrangler.toml`.** That file is for Cloudflare **Workers** and advanced
Pages Functions deploys. The Pages **GitHub-integration** flow takes the build
command and output directory from the **dashboard**, so a repo config file is
not required and would be redundant. It has deliberately not been added.

**One file that _is_ needed:** [`public/_redirects`](public/_redirects). The app
routes with react-router `BrowserRouter`, so deep links (e.g.
`app.koachai.net/clients`) and hard refreshes have no matching static file and
would 404. The `_redirects` rule `/*  /index.html  200` makes Pages serve real
static assets first, then fall back to `index.html` so the client router can
take over. Vite copies everything in `public/` into `dist/`, so it ships
automatically — nothing to configure in the dashboard.

## Required environment variables

**All `VITE_`-prefixed vars are build-time and baked into the client bundle** —
they are public. Never put secrets or a Supabase **service-role** key here (the
anon key is public by design and safe). Because they are baked in at build time,
changing any of them requires a **new build / redeploy** to take effect. Set
them in the Pages project under **Settings → Environment variables** for **both**
Production and Preview.

### Needed now (while still on the Base44 backend, pre-Step 7)

| Variable                     | Needed | Notes                                                        |
| ---------------------------- | ------ | ------------------------------------------------------------ |
| `VITE_BASE44_APP_BASE_URL`   | **Yes**| Base44 backend base URL the SDK calls. Required until Step 7.|
| `VITE_BASE44_APP_ID`         | **Yes**| Base44 app id (`src/lib/app-params.js`).                     |
| `VITE_BASE44_FUNCTIONS_VERSION` | Rec. | Pins the Base44 functions version.                          |
| `VITE_AUTH_PROVIDER`         | Rec.   | `base44` (default) until the Supabase cutover.               |
| `NODE_VERSION`               | Rec.   | Set to `20` (or `18`) so Pages builds on a supported Node.   |

### Needed later (once Step 7 lands — Supabase cutover)

Not required yet; the app only reads these once a page/auth is cut over to
Supabase (`src/api/supabaseClient.js`, `.env.example`). Add them at Step 7:

| Variable                 | Notes                                                     |
| ------------------------ | --------------------------------------------------------- |
| `VITE_SUPABASE_URL`      | Public Supabase project URL.                              |
| `VITE_SUPABASE_ANON_KEY` | Public anon key **only** — never the service-role key.    |
| `VITE_AUTH_PROVIDER`     | Flip to `supabase` to enable the in-app Supabase login.   |

### Optional (integration feature flags)

Several integrations light up only if their `VITE_` var is present (Stripe,
Resend, Calendly, web-push VAPID, from-name/email). They are optional — see
[`.env.example`](.env.example) for the full list. Leave unset to keep those
features off.

## Production build smoke-check (run + verified)

```bash
rm -rf dist && npm run build      # exit 0
```

Confirmed the output is a static site, not a Node-server app:

- `dist/` contains exactly: `index.html`, `assets/index-*.js`, `assets/index-*.css`,
  `manifest.json`, `sw.js`, `offline.html`, `_redirects` — no `functions/`, no
  server entry, no native modules.
- `index.html` has `<div id="root">` and a `<script type="module" src="/assets/…">`;
  asset URLs are absolute-root (`/assets/…`), correct for serving at the site root.
- Served from a plain non-Node static server (`python3 -m http.server`),
  `/`, the JS asset, the CSS asset, and `/manifest.json` all returned **HTTP 200**.

To re-run the smoke-check locally:

```bash
npm run build
cd dist && python3 -m http.server 8199    # then curl / in another shell
# or: npm run preview                       # Vite's own static preview server
```

## Dashboard setup checklist (manual — one-time)

This part cannot be automated; do it once in the Cloudflare dashboard.

- [ ] **Cloudflare → Workers & Pages → Create → Pages → Connect to Git.**
- [ ] Authorize the GitHub app and select the
      `mylesharrisfit/koach-ai-fitness-coaching-platform` repo.
- [ ] **Production branch:** `main`.
- [ ] **Framework preset:** **Vite** (auto-fills the next two).
- [ ] **Build command:** `npm run build`
- [ ] **Build output directory:** `dist`
- [ ] **Environment variables** (Settings → Environment variables, add to
      **Production** and **Preview**):
  - [ ] `NODE_VERSION` = `20`
  - [ ] `VITE_BASE44_APP_BASE_URL` = _(Base44 backend base URL)_
  - [ ] `VITE_BASE44_APP_ID` = _(Base44 app id)_
  - [ ] `VITE_BASE44_FUNCTIONS_VERSION` = _(pinned version)_
  - [ ] `VITE_AUTH_PROVIDER` = `base44`
  - [ ] _(Step 7 only)_ `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and flip
        `VITE_AUTH_PROVIDER` to `supabase`.
- [ ] **Save and Deploy** — wait for the first build to go green.
- [ ] Confirm the `*.pages.dev` preview URL loads, and hard-refresh a deep route
      (e.g. `/clients`) to verify the `_redirects` SPA fallback works.
- [ ] **Custom domain:** project → **Custom domains → Set up a custom domain** →
      enter **`app.koachai.net`** → follow the prompt. Since `koachai.net`'s
      nameservers are already on Cloudflare, Pages creates the `app` CNAME and
      provisions the TLS cert automatically. Wait for **Active**.
- [ ] Load **https://app.koachai.net**, confirm it serves and deep links work.
- [ ] **After Step 7 deploy:** set the Supabase vars above and **redeploy** (env
      vars are baked in at build time — a redeploy is required for them to apply).
