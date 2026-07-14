/**
 * Feature flags. Keep these dead simple (module constants) until there's a real
 * need for runtime/remote flags.
 */

/**
 * Coach-facing dark mode. The theme system (theme.js, the .dark token block,
 * the Settings Appearance tab) is fully built, and the Step 4.4 token remap
 * closed out the hardcoded light colors: the axe-core dark-mode audit
 * (npm run audit:darkmode) reports ZERO dark-only contrast violations across
 * all nine audited pages. Fixed-dark surfaces (onboarding flow, landing pages)
 * and brand/integration colors are intentionally theme-invariant.
 */
export const darkModeEnabled = true;
