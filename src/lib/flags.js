/**
 * Feature flags. Keep these dead simple (module constants) until there's a real
 * need for runtime/remote flags.
 */

/**
 * Coach-facing dark mode. ROLLED BACK to false: the Step 4.4 audit only
 * covered the INITIAL RENDER of the nine audited pages — dozens of --kc-*
 * tokens without .dark overrides remain in tabs, modals, and drill-down
 * states (ExerciseLibrary, Sales/Kanban, Settings, Adherence detail views,
 * …), so dark mode is still broken beyond the first paint. Re-enable only
 * after the extended audit (nested UI states, not just page loads) is clean.
 */
export const darkModeEnabled = false;
