import { useEffect, useState, useCallback } from 'react';
import { track } from '@/lib/telemetry';

/**
 * Coach-facing theme system. Drives Tailwind's `darkMode: ["class"]` by toggling
 * the `dark` class on <html>. Persists the choice and honours the OS preference
 * on first load. The matte-black sidebar stays dark in both modes — only content
 * surfaces flip, which is handled entirely by the token definitions in index.css.
 */

const STORAGE_KEY = 'koach-theme';

/** @typedef {'light' | 'dark' | 'system'} ThemePreference */

/** @returns {ThemePreference} */
export function getStoredTheme() {
  if (typeof localStorage === 'undefined') return 'system';
  const v = localStorage.getItem(STORAGE_KEY);
  return v === 'light' || v === 'dark' || v === 'system' ? v : 'system';
}

function prefersDark() {
  return typeof window !== 'undefined'
    && window.matchMedia
    && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/** Resolve a preference to the concrete mode actually applied. */
export function resolveTheme(pref = getStoredTheme()) {
  return pref === 'system' ? (prefersDark() ? 'dark' : 'light') : pref;
}

/** Apply the resolved mode to the document root. */
function applyResolved(mode) {
  const root = document.documentElement;
  root.classList.toggle('dark', mode === 'dark');
  root.style.colorScheme = mode;
}

/**
 * Persist and apply a theme preference. Call with no argument to re-apply the
 * stored preference (e.g. on load).
 * @param {ThemePreference} [pref]
 */
export function setTheme(pref = getStoredTheme()) {
  if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, pref);
  applyResolved(resolveTheme(pref));
  return pref;
}

/** Run once before React renders to avoid a flash of the wrong theme. */
export function initTheme() {
  applyResolved(resolveTheme());
  // Keep 'system' in sync if the OS preference changes while the app is open.
  if (typeof window !== 'undefined' && window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (getStoredTheme() === 'system') applyResolved(resolveTheme('system'));
    });
  }
}

/**
 * React hook for reading and changing the theme.
 * @returns {{ theme: ThemePreference, resolved: 'light'|'dark', setTheme: (p: ThemePreference) => void, toggle: () => void }}
 */
export function useTheme() {
  const [theme, setThemeState] = useState(getStoredTheme);
  const [resolved, setResolved] = useState(() => resolveTheme());

  useEffect(() => {
    setResolved(resolveTheme(theme));
  }, [theme]);

  const change = useCallback((pref) => {
    setTheme(pref);
    setThemeState(pref);
    setResolved(resolveTheme(pref));
    track('theme.change', { theme: pref, resolved: resolveTheme(pref) });
  }, []);

  const toggle = useCallback(() => {
    change(resolveTheme(theme) === 'dark' ? 'light' : 'dark');
  }, [theme, change]);

  return { theme, resolved, setTheme: change, toggle };
}
