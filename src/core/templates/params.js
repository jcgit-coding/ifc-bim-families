/**
 * Generic handling of template parameters: defaults, coercion and range validation.
 * Parameter definition: { key, label, type, group, default, unit?, min?, max?, step?, options? }
 * Types: 'text' | 'number' | 'range' | 'select' | 'boolean'.
 */

export const PARAM_TYPES = Object.freeze(['text', 'number', 'range', 'select', 'boolean']);

const isNumeric = (param) => param.type === 'number' || param.type === 'range';

/** Returns { [key]: default } for a template. */
export function defaultValues(template) {
  return Object.fromEntries(template.params.map((param) => [param.key, param.default]));
}

/** Converts a raw value (usually a string from the UI or URL) to the parameter's type. */
export function coerceValue(param, raw) {
  if (raw === undefined || raw === null) return param.default;
  if (isNumeric(param)) return Number.parseFloat(raw);
  if (param.type === 'boolean') return raw === true || raw === 'true';
  return String(raw);
}

/** Merges raw values over the defaults, coercing each to its type. */
export function coerceAll(template, rawValues = {}) {
  return Object.fromEntries(template.params.map((param) =>
    [param.key, coerceValue(param, rawValues[param.key])]));
}

/** Checks every numeric parameter against its min/max. Returns a list of error messages. */
export function validateParams(template, values) {
  const errors = [];
  for (const param of template.params.filter(isNumeric)) {
    const value = values[param.key];
    const unit = param.unit ? ` ${param.unit}` : '';
    if (!Number.isFinite(value)) {
      errors.push(`${param.label} must be a number`);
    } else if (value < param.min || value > param.max) {
      errors.push(`${param.label} must be between ${param.min} and ${param.max}${unit}`);
    }
  }
  return errors;
}
