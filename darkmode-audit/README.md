# Dark-mode contrast audit (Migration Step 4.0)

Automated visual/contrast verification of dark mode across the pages tokenized
in earlier sessions. This is the visual layer that grep/lint/build could not
provide — and it caught a real gap.

## Run it

```
PLAYWRIGHT_CHROMIUM=/opt/pw-browsers/chromium-1194/chrome-linux/chrome \
  node darkmode-audit/run-audit.mjs
```

Renders each real page component (Dashboard, Clients, ClientProfile,
ProgramBuilder, Nutrition, Invoicing, ClientOnboarding, Adherence, Community)
in a headless Chromium via a mock-auth + mock-data harness (no backend), once
in forced **dark** and once in **light**, runs axe-core's `color-contrast`
rule, and screenshots. Output → `darkmode-audit/out/` (gitignored).

**Why a light baseline:** the harness renders pages outside the full
theme.js/AppLayout chain, so it has theme-independent rendering quirks that
show up in BOTH modes (Adherence alone had 125 contrast hits in light). A
violation only counts as a **dark-mode regression** if it fails in dark but
passes in light. That diff is the signal.

## Result (this run): flag NOT flipped

All 9 pages rendered in true dark mode. **41 dark-mode-specific violations**
(fail in dark, pass in light), root-caused as:

| count | cause | verdict |
|------:|-------|---------|
| 20 | components using `--kc-*` raw hex tokens | **real dark-mode gap** |
| 11 | white text on primary-blue buttons (`bg-primary text-white`, ~3.67:1) | theme-independent brand-color issue (same in light) |
| 10 | primary-blue **text** (`var(--tc-primary)` ≈ #3b82f6) on dark cards (~4.2:1) | dark-theme tuning of the primary color |

### The real finding: `--kc-*` tokens have no dark values

`src/index.css` defines **148 `--kc-*` raw tokens** (e.g. `--kc-4b5563:#4b5563`,
`--kc-fffdf0:#fffdf0`) in `:root`. The `.dark` block overrides **none** of
them. The tokenization sweep mechanically replaced hardcoded colors
(`text-gray-600` → `text-[var(--kc-4b5563)]`) with literal hex-named aliases
that are **theme-invariant** — so in dark mode they render light-mode colors:
gray-600 muted text sits near-invisible on dark backgrounds, and cream/white
`--kc-*` backgrounds keep light text on light fill. This is a **systematic
gap**, not the "small isolated fixes" the flip anticipated, so
`darkModeEnabled` stays `false`.

### Recommended follow-up (its own dedicated pass, not this step)

Give the `--kc-*` tokens `.dark` values, or (better) remap the ~148 raw
aliases to the semantic theme tokens (`--foreground`, `--muted-foreground`,
`--card`, …) that already flip correctly. Separately, retune the primary blue
for text-on-dark (or restrict `var(--tc-primary)` to fills, not text) and
decide whether white-on-primary buttons need a darker/lighter primary to clear
AA. Re-run this audit; flip the flag only when dark-only violations reach zero.
