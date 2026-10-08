#!/usr/bin/env node
/**
 * Horizontal-overflow audit of the real app with seeded mock data (no backend).
 *
 *   node design-preview/overflow.mjs                 # default screens, 390 + 768
 *   node design-preview/overflow.mjs clients=/clients portal=/portal?as=client
 *   node design-preview/overflow.mjs --json          # machine-readable
 *
 * A screen fails when, at a given width, either
 *   - the document scrolls sideways (scrollWidth > viewport), or
 *   - a page-level scroller (a tall overflow-y container, e.g. the client
 *     portal shell) scrolls sideways, or
 *   - a visible element sticks out past the viewport edge and no ancestor
 *     clips it.
 * Intentional horizontal scrollers (tab strips, carousels: an element with an
 * explicit overflow-x of auto/scroll that is not a page scroller) are fine.
 *
 * Exit code 1 when any screen fails. Env: PREVIEW_PORT (default 5288).
 */
import { createServer } from 'vite';
import { chromium } from 'playwright';
import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';

const here = import.meta.dirname;
const JORDAN = 'c1000000-0000-4000-8000-000000000001';
const UPPER_LOWER = 'd1000000-0000-4000-8000-000000000001';
const JORDAN_PLAN = 'e1000000-0000-4000-8000-000000000002';

// `@checkin` is resolved in-page to a seeded check-in id.
const DEFAULT_ROUTES = [
  ['dashboard', '/'],
  ['clients', '/clients'],
  ['client-profile', `/client-profile?id=${JORDAN}`],
  ...['programs', 'nutrition', 'checkins', 'progress', 'photos', 'messages', 'billing', 'connected_apps']
    .map((tab) => [`client-profile-${tab}`, `/client-profile?id=${JORDAN}&tab=${tab}`]),
  ['program-builder', `/program-builder?id=${UPPER_LOWER}`],
  ['meal-plans', '/nutrition'],
  ['meal-plan', `/nutrition?plan=${JORDAN_PLAN}`],
  ['checkin-review', '/checkin-review'],
  ['checkin-detail', '/checkin-detail?id=@checkin'],
  ['messages', '/messages'],
  ['portal-today', '/portal?as=client'],
  ['portal-workouts', '/portal/workouts?as=client'],
  ['portal-nutrition', '/portal/nutrition?as=client'],
  ['portal-checkin', '/portal/checkin?as=client'],
  ['portal-progress', '/portal/progress?as=client'],
  ['portal-calendar', '/portal/calendar?as=client'],
  ['portal-community', '/portal/community?as=client'],
  ['portal-messages', '/portal/messages?as=client'],
  ['portal-notifications', '/portal/notifications?as=client'],
  ['portal-profile', '/portal/profile?as=client'],
  ['portal-billing', '/portal/billing?as=client'],
];

export const WIDTHS = {
  390: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  768: { viewport: { width: 768, height: 1024 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
};

const args = process.argv.slice(2);
const asJson = args.includes('--json');
const specs = args.filter((a) => !a.startsWith('--')).map((a) => {
  const i = a.indexOf('=');
  return i === -1 ? [a, a] : [a.slice(0, i), a.slice(i + 1)];
});
const routes = specs.length ? specs : DEFAULT_ROUTES;

const vite = await createServer({ configFile: path.join(here, 'vite.config.js'), server: { hmr: false, watch: null } });
await vite.listen();
const BASE = `http://localhost:${vite.config.server.port}`;

function chromeCandidates() {
  const list = [process.env.PLAYWRIGHT_CHROMIUM, '/opt/pw-browsers/chromium'];
  const root = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers';
  try {
    for (const d of readdirSync(root)) if (d.startsWith('chromium-')) list.push(path.join(root, d, 'chrome-linux', 'chrome'));
  } catch { /* no browsers dir */ }
  return list.filter((p) => p && existsSync(p));
}
let browser;
try { browser = await chromium.launch(); } catch (e) {
  for (const executablePath of chromeCandidates()) {
    try { browser = await chromium.launch({ executablePath }); break; } catch { /* next */ }
  }
  if (!browser) { await vite.close(); throw e; }
}

const ALLOWED = new Set(['localhost', '127.0.0.1']);

/** Runs in the page: what sticks out sideways at this width. */
function measure() {
  const vw = document.documentElement.clientWidth;
  const vh = window.innerHeight;
  const describe = (el) => {
    const cls = typeof el.className === 'string' ? el.className : '';
    const text = (el.innerText || el.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 50);
    return `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}${cls ? `.${cls.trim().split(/\s+/).slice(0, 6).join('.')}` : ''}${text ? ` "${text}"` : ''}`;
  };
  const issues = [];
  const docOver = document.documentElement.scrollWidth - vw;
  if (docOver > 1) issues.push({ kind: 'document', px: docOver });

  const all = [...document.querySelectorAll('body *')];
  for (const el of all) {
    const cs = getComputedStyle(el);
    // page-level scrollers that scroll sideways
    if (/(auto|scroll|hidden|clip)/.test(cs.overflowY + cs.overflowX) && el.clientHeight > vh * 0.5 && el.scrollWidth > el.clientWidth + 1
      && !/(visible)/.test(cs.overflowX)) {
      const explicitX = /(auto|scroll)/.test(el.style.overflowX) || /\boverflow-x-(auto|scroll)\b/.test(el.className);
      // overflow-x hidden/clip on a page scroller = content cut off at the edge
      const kind = /(hidden|clip)/.test(cs.overflowX) ? 'clipped' : 'scroller';
      if (!explicitX) issues.push({ kind, px: el.scrollWidth - el.clientWidth, el: describe(el) });
    }
  }
  const offenders = [];
  for (const el of all) {
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) continue;
    if (r.right <= vw + 1 && r.left >= -1) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.position === 'fixed' && (r.left >= vw || r.right <= 0)) continue;
    let a = el.parentElement;
    let clipped = false;
    while (a && a !== document.body) {
      const acs = getComputedStyle(a);
      if (/(auto|scroll|hidden|clip)/.test(acs.overflowX)) {
        const ar = a.getBoundingClientRect();
        if (ar.right <= vw + 1 && ar.left >= -1) { clipped = true; break; }
      }
      a = a.parentElement;
    }
    if (!clipped) offenders.push(el);
  }
  // report only the outermost offenders
  for (const el of offenders) {
    if (offenders.some((o) => o !== el && o.contains(el))) continue;
    const r = el.getBoundingClientRect();
    issues.push({ kind: 'element', px: Math.round(Math.max(r.right - vw, -r.left)), el: describe(el) });
  }
  return issues;
}

const results = [];
for (const [name, route] of routes) {
  for (const [w, opts] of Object.entries(WIDTHS)) {
    const context = await browser.newContext({ ...opts, reducedMotion: 'reduce' });
    await context.route('**/*', (r) => {
      let host = '';
      try { host = new URL(r.request().url()).hostname; } catch { /* data: */ }
      return !host || ALLOWED.has(host) ? r.continue() : r.abort();
    });
    const page = await context.newPage();
    let target = route;
    if (route.includes('@checkin')) {
      await page.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 45000 });
      const ciId = await page.evaluate(() => window.__preview?.store?.check_ins?.find((c) => c.client_id && c.coach_notes == null)?.id
        ?? window.__preview?.store?.check_ins?.[0]?.id);
      target = route.replace('@checkin', ciId);
      await page.evaluate((t) => { history.pushState({}, '', t); dispatchEvent(new PopStateEvent('popstate')); }, target);
      await page.waitForLoadState('networkidle').catch(() => {});
    } else {
      await page.goto(BASE + route, { waitUntil: 'networkidle', timeout: 45000 }).catch(() => {});
    }
    await page.waitForTimeout(700);
    const issues = await page.evaluate(measure);
    results.push({ name, route: target, width: Number(w), issues });
    await context.close();
  }
}
await browser.close();
await vite.close();

const failing = results.filter((r) => r.issues.length);
if (asJson) {
  console.log(JSON.stringify(results, null, 2));
} else {
  for (const r of results) {
    console.log(`${r.issues.length ? '✗' : '✓'} ${r.name} @${r.width}`);
    for (const i of r.issues) console.log(`    ${i.kind} +${i.px}px ${i.el ?? ''}`);
  }
  console.log(`\n${results.length} checks, ${failing.length} with horizontal overflow.`);
}
process.exit(failing.length ? 1 : 0);
