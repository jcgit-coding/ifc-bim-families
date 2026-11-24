import { t } from '../i18n/i18n.js';

const STORAGE_KEY = 'bim-families-theme';
const DEFAULT_THEME = 'light';
const THEMES = ['light', 'dark'];

function readStoredTheme() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return THEMES.includes(stored) ? stored : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME; // storage can be blocked (private mode)
  }
}

/** Updates the button text for the active theme (also called after a language change). */
function labelButton(button) {
  const isLight = document.documentElement.dataset.theme === 'light';
  button.textContent = t(isLight ? 'Dark' : 'Light');
  button.setAttribute('aria-label', t(isLight ? 'Switch to dark theme' : 'Switch to light theme'));
}

function applyTheme(theme, button) {
  document.documentElement.dataset.theme = theme;
  labelButton(button);
}

/** Light theme is the default; the toggle remembers the user's choice. Returns a function that relabels the button. */
export function initTheme(button) {
  applyTheme(readStoredTheme(), button);
  button.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
    applyTheme(next, button);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Ignored: the theme still applies for this session.
    }
  });
  return () => labelButton(button);
}
