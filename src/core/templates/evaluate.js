import { validateParams } from './params.js';

const EMPTY_RESULT = Object.freeze({
  parts: [], propertySets: [], warnings: [], summary: [], fileName: 'model.ifc',
});

/**
 * Runs generic range validation, then the template's own compute().
 * Always returns a complete result object; `errors` is non-empty when the model is invalid.
 */
export function evaluateTemplate(template, values) {
  const rangeErrors = validateParams(template, values);
  if (rangeErrors.length > 0) return { ...EMPTY_RESULT, errors: rangeErrors };
  const result = template.compute(values);
  return { ...EMPTY_RESULT, ...result, errors: result.errors ?? [] };
}

/** Turns an evaluation result into the model accepted by the IFC writer. */
export function toIfcModel(name, result) {
  return {
    name,
    objectType: result.objectType,
    parts: result.parts,
    propertySets: result.propertySets,
  };
}
