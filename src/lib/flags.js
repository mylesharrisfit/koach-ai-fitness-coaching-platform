/**
 * Feature flags. Keep these dead simple (module constants) until there's a real
 * need for runtime/remote flags.
 */

/**
 * Coach-facing dark mode. Re-enabled after the extended audit v2
 * (npm run audit:darkmode): 25 pages — every page hosting a --kc-* token —
 * crawled through tabs/modals/drill-downs (205 UI states, not just initial
 * renders) with ZERO dark-only color-contrast violations. Remaining
 * un-overridden --kc-* tokens are documented theme-invariant groups
 * (brand/integration colors, fixed-dark onboarding + hero/pill surfaces,
 * medals) — see the token comment in src/index.css.
 */
export const darkModeEnabled = true;
