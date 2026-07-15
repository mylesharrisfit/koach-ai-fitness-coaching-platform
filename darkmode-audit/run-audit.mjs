/* Dark-mode contrast audit driver, v2 (incident follow-up).
 *
 * v1 only scanned each page's INITIAL render — which is how ~60 un-overridden
 * --kc-* tokens in tabs, modals, and drill-down states slipped past a "9/9
 * clean" result. v2:
 *   - covers 25 pages (every page hosting a --kc-* token without a .dark
 *     override, plus the original nine),
 *   - after the initial scan, CRAWLS nested UI states: it clicks every
 *     role=tab element and every safe-looking button (plus the first few
 *     cursor-pointer drill-down cards), runs axe's color-contrast rule after
 *     each click, and unions the violations across states,
 *   - runs the same crawl in dark AND light and reports DARK-ONLY violations
 *     (dark union minus light union, keyed by element signature).
 *
 * Output (screenshots + report.json) goes to darkmode-audit/out/ (gitignored). */
import { chromium } from 'playwright';
import { createServer } from 'vite';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, 'out');
mkdirSync(OUT, { recursive: true });

const PAGES = [
  'Dashboard', 'Clients', 'ClientProfile', 'ProgramBuilder', 'Nutrition',
  'Invoicing', 'ClientOnboarding', 'Adherence', 'Community',
  'Programs', 'ExerciseLibrary', 'Sales', 'Settings', 'AccountSettings',
  'AtRiskClients', 'Assistant', 'Subscription', 'OnboardingManager',
  'EmailCenter', 'MarketingTools', 'Business', 'PaymentTracking',
  'ClientDashboard', 'Schedule', 'WhiteLabel',
];
const MAX_TRIGGERS = Number(process.env.AUDIT_MAX_TRIGGERS || 18);
const axeSource = readFileSync(path.join(__dirname, '..', 'node_modules', 'axe-core', 'axe.min.js'), 'utf8');

const vite = await createServer({ configFile: path.join(__dirname, 'vite.harness.config.js') });
await vite.listen();
const PORT = vite.config.server.port;
const base = `http://localhost:${PORT}/darkmode-audit/index.html`;
console.log(`harness on ${base}`);

const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM || undefined,
});

// A stable signature for a violation, theme-independent (element identity +
// markup), so dark vs light unions can be diffed.
const sig = (v) => `${v.target}::${v.html}`;

// In-page helpers, serialized into the page.
const PAGE_HELPERS = `
  window.__audit = {
    // Enumerate interaction triggers from the CURRENT state of the page:
    // role=tab elements, safe short-labeled buttons, and a few drill-down
    // cards. Returns [{kind, text, index}] where index disambiguates
    // same-labeled elements. Destructive/navigation-ish labels are skipped.
    collectTriggers() {
      const bad = /delete|remove|sign ?out|log ?out|archive|export|download|send|save|submit|pay|checkout|upgrade|subscribe|cancel|back|continue|next|copy|invite|create|add |new /i;
      const seen = new Map();
      const out = [];
      const push = (kind, el) => {
        const text = (el.innerText || el.getAttribute('aria-label') || '').trim().replace(/\\s+/g, ' ').slice(0, 40);
        if (!text || text.length > 32) return;
        if (bad.test(text)) return;
        const st = getComputedStyle(el);
        if (st.display === 'none' || st.visibility === 'hidden') return;
        const key = kind + '|' + text;
        const n = seen.get(key) ?? 0;
        seen.set(key, n + 1);
        out.push({ kind, text, index: n });
      };
      document.querySelectorAll('[role=tab]').forEach((el) => push('tab', el));
      document.querySelectorAll('button, [role=button]').forEach((el) => push('button', el));
      Array.from(document.querySelectorAll('[class*=cursor-pointer]')).slice(0, 3).forEach((el) => push('card', el));
      return out;
    },
    // Re-locate a trigger in the CURRENT DOM by (kind, text, index) and click.
    fire(t) {
      const sel = t.kind === 'tab' ? '[role=tab]'
        : t.kind === 'button' ? 'button, [role=button]'
        : '[class*=cursor-pointer]';
      const matches = Array.from(document.querySelectorAll(sel)).filter((el) => {
        const text = (el.innerText || el.getAttribute('aria-label') || '').trim().replace(/\\s+/g, ' ').slice(0, 40);
        return text === t.text;
      });
      const el = matches[t.index] ?? matches[0];
      if (!el) return false;
      el.scrollIntoView({ block: 'center' });
      el.click();
      return true;
    },
  };
`;

async function runAxe(page) {
  const result = await page.evaluate(async () => await axe.run(document, { runOnly: ['color-contrast'] }));
  return result.violations.flatMap((v) => v.nodes.map((n) => ({
    impact: n.impact, target: n.target?.join(' '),
    summary: (n.failureSummary || '').replace(/\s+/g, ' ').slice(0, 300),
    html: (n.html || '').slice(0, 160),
  })));
}

/** Load a page in one theme, crawl states, return union of violations per state. */
async function crawl(ctx, name, mode) {
  const page = await ctx.newPage();
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e.message)));
  const byState = {}; // state label -> violations
  let states = 0, triggers = [];
  try {
    await page.goto(`${base}?page=${name}&mode=${mode}`, { waitUntil: 'load', timeout: 30000 });
    await page.evaluate((m) => document.documentElement.classList.toggle('dark', m === 'dark'), mode);
    await page.waitForFunction(() => window.__auditReady || document.getElementById('audit-render-error'), null, { timeout: 25000 }).catch(() => {});
    await page.waitForTimeout(400);
    const renderError = await page.$eval('#audit-render-error', (el) => el.textContent).catch(() => null);
    if (renderError) { await page.close(); return { renderError, byState, states: 0, triggers: 0, pageErrors }; }

    await page.addScriptTag({ content: axeSource });
    await page.addScriptTag({ content: PAGE_HELPERS });

    byState.initial = await runAxe(page);
    states = 1;
    if (mode === 'dark') await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: true }).catch(() => {});

    triggers = (await page.evaluate(() => window.__audit.collectTriggers())).slice(0, MAX_TRIGGERS);
    for (const t of triggers) {
      const label = `${t.kind}:${t.text}${t.index ? `#${t.index}` : ''}`;
      try {
        const fired = await page.evaluate((tt) => window.__audit.fire(tt), t);
        if (!fired) continue;
        await page.waitForTimeout(450);
        byState[label] = await runAxe(page);
        states++;
      } catch { /* state failed — keep crawling */ }
      // close any modal/drawer the click opened
      await page.keyboard.press('Escape').catch(() => {});
      await page.waitForTimeout(150);
      await page.keyboard.press('Escape').catch(() => {});
    }
    await page.close();
    return { renderError: null, byState, states, triggers: triggers.length, pageErrors: pageErrors.slice(0, 3) };
  } catch (e) {
    await page.close().catch(() => {});
    return { error: String(e.message), byState, states, triggers: triggers.length, pageErrors };
  }
}

const report = [];
for (const name of PAGES) {
  // fresh context per page keeps crawl state deterministic across modes
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 1600 }, colorScheme: 'dark' });
  const dark = await crawl(ctx, name, 'dark');
  const light = await crawl(ctx, name, 'light');
  await ctx.close();

  const lightSigs = new Set(Object.values(light.byState).flat().map(sig));
  const darkOnlyMap = new Map(); // sig -> {violation, states:[]}
  for (const [state, viols] of Object.entries(dark.byState)) {
    for (const v of viols) {
      const s = sig(v);
      if (lightSigs.has(s)) continue;
      if (!darkOnlyMap.has(s)) darkOnlyMap.set(s, { ...v, states: [] });
      darkOnlyMap.get(s).states.push(state);
    }
  }
  const darkOnly = [...darkOnlyMap.values()];
  const darkTotal = new Set(Object.values(dark.byState).flat().map(sig)).size;
  const lightTotal = lightSigs.size;

  report.push({
    page: name, renderError: dark.renderError, error: dark.error,
    statesVisited: dark.states, triggersFound: dark.triggers,
    darkTotal, lightTotal, darkOnlyCount: darkOnly.length, darkOnly,
    themeIndependent: darkTotal - darkOnly.length,
    pageErrors: dark.pageErrors,
  });
  console.log(`${name.padEnd(18)} ${dark.renderError ? 'RENDER-ERROR' : dark.error ? `ERROR: ${dark.error.slice(0, 60)}` : `states=${dark.states} dark=${darkTotal} light=${lightTotal} DARK-ONLY=${darkOnly.length}`}`);
}

writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
const darkOnlyTotal = report.reduce((a, r) => a + (r.darkOnlyCount || 0), 0);
const themeIndep = report.reduce((a, r) => a + (r.themeIndependent || 0), 0);
const rendered = report.filter((r) => !r.renderError && !r.error).length;
const statesTotal = report.reduce((a, r) => a + (r.statesVisited || 0), 0);
console.log(`\n=== SUMMARY (v2: initial render + tabs/modals/drill-downs) ===`);
console.log(`pages rendered: ${rendered}/${PAGES.length}   UI states scanned: ${statesTotal}`);
console.log(`DARK-MODE-SPECIFIC violations (fail in dark, pass in light): ${darkOnlyTotal}`);
console.log(`theme-independent violations (fail in BOTH themes — pre-existing, out of scope): ${themeIndep}`);
report.filter((r) => r.renderError || r.error).forEach((r) => console.log(`  could not scan ${r.page}: ${(r.renderError || r.error || '').slice(0, 100)}`));
report.filter((r) => r.darkOnlyCount).forEach((r) => {
  console.log(`\n--- ${r.page}: ${r.darkOnlyCount} dark-only ---`);
  r.darkOnly.forEach((v) => console.log(`  [${v.states.join(',')}] ${v.target}\n    ${v.summary.slice(0, 160)}\n    ${v.html.slice(0, 120)}`));
});

await browser.close();
await vite.close();
process.exit(0);
