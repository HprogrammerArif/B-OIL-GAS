/**
 * Theme helpers: persistence, application and token lookup.
 *
 * The theme is applied via `data-theme` on <html>; all colours resolve from
 * `styles/tokens.css`. Canvas drawing cannot use `var(--x)` so it reads the
 * computed token value with `readToken`.
 */

export type Theme = 'light' | 'dark';

const THEME_KEY = 'oneops.theme.v1';

export function getInitialTheme(): Theme {
  try {
    const saved = window.localStorage.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    /* storage unavailable (private mode) — fall through */
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme);
  try {
    window.localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* ignore */
  }
}

/** Resolve a CSS custom property (e.g. `--text-1`) to its current computed value. */
export function readToken(name: string, fallback = ''): string {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}
