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

function applyTheme(theme, button) {
  document.documentElement.dataset.theme = theme;
  button.textContent = theme === 'light' ? 'Dark' : 'Light';
  button.setAttribute('aria-label', `Switch to ${theme === 'light' ? 'dark' : 'light'} theme`);
}

/** Light theme is the default; the toggle remembers the user's choice. */
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
}
