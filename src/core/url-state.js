import { coerceAll } from './templates/params.js';

/**
 * Shareable state lives in the URL hash: "#t=<templateId>&<key>=<value>...".
 * Only values that differ from the defaults are written, which keeps links short.
 */

/** Encodes a template selection and its values as a hash string (without "#"). */
export function encodeState(template, values) {
  const query = new URLSearchParams({ t: template.id });
  for (const param of template.params) {
    if (values[param.key] !== param.default) query.set(param.key, String(values[param.key]));
  }
  return query.toString();
}

/** Decodes a hash string. Returns { template: undefined } for the catalogue (home) view. */
export function decodeState(registry, hash) {
  const query = new URLSearchParams(hash.replace(/^#/, ''));
  const template = registry.get(query.get('t'));
  if (!template) return { template: undefined, values: {} };
  const raw = Object.fromEntries(query.entries());
  return { template, values: coerceAll(template, raw) };
}
