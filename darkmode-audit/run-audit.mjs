/* Dark-mode contrast audit driver. Serves the harness, loads each page in
 * forced dark mode, screenshots, and runs axe-core's color-contrast rule.
 * Output (screenshots + report.json) goes to darkmode-audit/out/ (gitignored). */
import { chromium } from 'playwright';
import { createServer } from 'vite';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, 'out');
mkdirSync(OUT, { recursive: true });

const PAGES = ['Dashboard', 'Clients', 'ClientProfile', 'ProgramBuilder', 'Nutrition', 'Invoicing', 'ClientOnboarding', 'Adherence', 'Community'];
const axeSource = readFileSync(path.join(__dirname, '..', 'node_modules', 'axe-core', 'axe.min.js'), 'utf8');

const vite = await createServer({ configFile: path.join(__dirname, 'vite.harness.config.js') });
await vite.listen();
const PORT = vite.config.server.port;
const base = `http://localhost:${PORT}/darkmode-audit/index.html`;
console.log(`harness on ${base}`);

const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM || undefined,
});
const ctx = await browser.newContext({ viewport: { width: 1280, height: 1600 }, colorScheme: 'dark' });

// A stable signature for a violation, theme-independent (element identity +
// which contrast direction failed), so we can diff dark vs light.
const sig = (v) => `${v.target}::${v.html}`;

async function scan(name, mode) {
  const page = await ctx.newPage();
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e.message)));
  try {
    await page.goto(`${base}?page=${name}&mode=${mode}`, { waitUntil: 'load', timeout: 20000 });
    // force the requested theme regardless of the harness default
    await page.evaluate((m) => document.documentElement.classList.toggle('dark', m === 'dark'), mode);
    await page.waitForFunction(() => window.__auditReady || document.getElementById('audit-render-error'), null, { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(500);
    const renderError = await page.$eval('#audit-render-error', (el) => el.textContent).catch(() => null);
    const isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    if (mode === 'dark') await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: true });
    let violations = [];
    if (!renderError) {
      await page.addScriptTag({ content: axeSource });
      const result = await page.evaluate(async () => await axe.run(document, { runOnly: ['color-contrast'] }));
      violations = result.violations.flatMap((v) => v.nodes.map((n) => ({
        impact: n.impact, target: n.target?.join(' '),
        summary: (n.failureSummary || '').replace(/\s+/g, ' ').slice(0, 300),
        html: (n.html || '').slice(0, 160),
      })));
    }
    return { renderError, isDark, bg, violations, pageErrors: pageErrors.slice(0, 3), close: () => page.close() };
  } catch (e) {
    return { error: String(e.message), violations: [], close: () => page.close() };
  }
}

const report = [];
for (const name of PAGES) {
  const dark = await scan(name, 'dark');
  const light = await scan(name, 'light');
  await dark.close(); await light.close();

  const lightSigs = new Set((light.violations || []).map(sig));
  // Dark-mode REGRESSIONS = fail in dark but not in light (theme-specific).
  const darkOnly = (dark.violations || []).filter((v) => !lightSigs.has(sig(v)));

  report.push({
    page: name, isDark: dark.isDark, bodyBg: dark.bg, renderError: dark.renderError, error: dark.error,
    darkTotal: dark.violations.length, lightTotal: light.violations.length,
    darkOnlyCount: darkOnly.length, darkOnly,
    themeIndependent: dark.violations.length - darkOnly.length,
    pageErrors: dark.pageErrors,
  });
  console.log(`${name.padEnd(18)} ${dark.renderError ? 'RENDER-ERROR' : `dark=${dark.violations.length} light=${light.violations.length} DARK-ONLY=${darkOnly.length}`}`);
}

writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
const darkOnlyTotal = report.reduce((a, r) => a + (r.darkOnlyCount || 0), 0);
const themeIndep = report.reduce((a, r) => a + (r.themeIndependent || 0), 0);
const rendered = report.filter((r) => !r.renderError && !r.error).length;
console.log(`\n=== SUMMARY ===`);
console.log(`pages rendered: ${rendered}/${PAGES.length}`);
console.log(`DARK-MODE-SPECIFIC violations (fail in dark, pass in light): ${darkOnlyTotal}`);
console.log(`theme-independent violations (fail in BOTH themes — pre-existing, out of scope): ${themeIndep}`);
report.filter((r) => r.renderError || r.error).forEach((r) => console.log(`  could not scan ${r.page}: ${(r.renderError || r.error || '').slice(0, 80)}`));

await browser.close();
await vite.close();
process.exit(0);
