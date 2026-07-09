/**
 * Feature flags. Keep these dead simple (module constants) until there's a real
 * need for runtime/remote flags.
 */

/**
 * Coach-facing dark mode. The theme system (theme.js, the .dark token block,
 * the Settings Appearance tab) is fully built, but most pages still hardcode
 * light colors, so exposing the switch would break them. Flip to `true` only
 * once the tokenization sweep is complete and dark mode reads correctly app-wide.
 */
export const darkModeEnabled = true;
