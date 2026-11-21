import { PARAM_TYPES } from './params.js';

/**
 * Template contract (see docs/adding-a-template.md):
 *   id           kebab-case unique identifier
 *   name         display name
 *   discipline   catalogue group, for example "Architecture"
 *   description  one-line summary
 *   params       parameter definitions (see params.js)
 *   compute(values) -> { errors, warnings, parts, propertySets, objectType, summary, fileName }
 */

const KEBAB_CASE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** Throws a descriptive error when a template does not follow the contract. */
export function assertTemplate(template) {
  const where = `Template "${template?.id}"`;
  for (const field of ['id', 'name', 'discipline', 'description']) {
    if (!template?.[field]) throw new Error(`${where} is missing "${field}"`);
  }
  if (!KEBAB_CASE.test(template.id)) throw new Error(`${where}: id must be kebab-case`);
  if (typeof template.compute !== 'function') throw new Error(`${where} is missing compute()`);
  if (!Array.isArray(template.params) || template.params.length === 0) {
    throw new Error(`${where} needs at least one parameter`);
  }
  const keys = new Set();
  for (const param of template.params) {
    if (keys.has(param.key)) throw new Error(`${where}: duplicate parameter "${param.key}"`);
    keys.add(param.key);
    if (!PARAM_TYPES.includes(param.type)) {
      throw new Error(`${where}: parameter "${param.key}" has unknown type "${param.type}"`);
    }
    if (param.default === undefined || !param.label || !param.group) {
      throw new Error(`${where}: parameter "${param.key}" needs label, group and default`);
    }
    if (param.type === 'select' && !param.options?.length) {
      throw new Error(`${where}: select "${param.key}" needs options`);
    }
  }
}

/**
 * @param {object[]} templates implemented templates
 * @param {object[]} planned    placeholders: { discipline, name, description }
 */
export function createRegistry(templates, planned = []) {
  const ids = new Set();
  for (const template of templates) {
    assertTemplate(template);
    if (ids.has(template.id)) throw new Error(`Duplicate template id "${template.id}"`);
    ids.add(template.id);
  }
  const disciplines = [...new Set([...templates, ...planned].map((entry) => entry.discipline))];
  return {
    templates,
    planned,
    disciplines,
    get: (id) => templates.find((template) => template.id === id),
    byDiscipline: (discipline) => templates.filter((template) => template.discipline === discipline),
    plannedByDiscipline: (discipline) => planned.filter((entry) => entry.discipline === discipline),
  };
}
