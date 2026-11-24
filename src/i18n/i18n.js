import es from './es.js';

/**
 * Minimal translation layer. English is the source language: every user-visible string is written in
 * English in the code and looked up in the dictionary of the active language, falling back to the
 * English text when no entry exists. Placeholders use {name} and are filled from `variables`.
 */

export const LANGUAGES = Object.freeze(['en', 'es']);
const DEFAULT_LANGUAGE = 'en';
const STORAGE_KEY = 'bim-families-language';
const DICTIONARIES = { en: {}, es };

const listeners = new Set();

function detectLanguage() {
  if (typeof document === 'undefined') return DEFAULT_LANGUAGE; // tests and scripts stay in English
  try {
    const stored = globalThis.localStorage.getItem(STORAGE_KEY);
    if (LANGUAGES.includes(stored)) return stored;
  } catch {
    // Storage can be blocked; fall back to the browser language.
  }
  return String(globalThis.navigator?.language ?? '').toLowerCase().startsWith('es') ? 'es' : DEFAULT_LANGUAGE;
}

let current = detectLanguage();

export const getLanguage = () => current;

/** Translates an English string; unknown strings are returned unchanged. */
export function t(text, variables = {}) {
  const translated = DICTIONARIES[current][text] ?? text;
  return translated.replace(/\{(\w+)\}/g, (match, name) => String(variables[name] ?? match));
}

/** Switches the language, remembers it and notifies listeners. */
export function setLanguage(language) {
  if (!LANGUAGES.includes(language) || language === current) return;
  current = language;
  try {
    globalThis.localStorage.setItem(STORAGE_KEY, language);
  } catch {
    // Ignored: the language still applies for this session.
  }
  listeners.forEach((listener) => listener(language));
}

export function onLanguageChange(listener) {
  listeners.add(listener);
}

/** Translates static markup: data-i18n (text) and data-i18n-label (aria-label); also the page title. */
export function translateDocument(root = document) {
  document.documentElement.lang = current;
  root.querySelectorAll('[data-i18n]').forEach((node) => { node.textContent = t(node.dataset.i18n); });
  root.querySelectorAll('[data-i18n-label]').forEach((node) => node.setAttribute('aria-label', t(node.dataset.i18nLabel)));
  document.title = t('BIM Families - IFC Generator');
}
