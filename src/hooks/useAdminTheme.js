import { useCallback, useLayoutEffect, useState } from 'react';

/**
 * Admin light/dark theme.
 *
 * Light is the default for anyone who has never chosen; a saved choice always
 * wins. The choice lives in localStorage (no backend user-preference system
 * exists, and a theme is not worth creating one for) and is applied as
 * `data-admin-theme` on <html>. The attribute is removed when the last admin
 * screen unmounts, so the public website is never restyled by it.
 */
const STORAGE_KEY = 'clix_admin_theme';
const DEFAULT_THEME = 'light';
const THEMES = ['dark', 'light'];

export function readStoredTheme() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return THEMES.includes(saved) ? saved : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME; // private mode / blocked storage
  }
}

function applyTheme(theme) {
  document.documentElement.dataset.adminTheme = theme;
}

export function useAdminTheme() {
  const [theme, setTheme] = useState(readStoredTheme);

  // Layout effect: applied before paint, so a light-default page never
  // flashes the dark palette first.
  useLayoutEffect(() => {
    applyTheme(theme);
    return () => { delete document.documentElement.dataset.adminTheme; };
  }, [theme]);

  const setAndStore = useCallback(next => {
    setTheme(next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch { /* preference simply won't persist */ }
  }, []);

  const toggle = useCallback(() => {
    setAndStore(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setAndStore]);

  return { theme, toggle, setTheme: setAndStore };
}
