import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildIfc } from '../src/core/ifc/writer.js';
import { evaluateTemplate, toIfcModel } from '../src/core/templates/evaluate.js';
import { coerceAll, defaultValues, validateParams } from '../src/core/templates/params.js';
import { assertTemplate, createRegistry } from '../src/core/templates/registry.js';
import { decodeState, encodeState } from '../src/core/url-state.js';
import { registry } from '../src/templates/index.js';

test('every registered template satisfies the contract', () => {
  assert.ok(registry.templates.length > 0);
  registry.templates.forEach(assertTemplate);
});

test('every template produces a valid IFC with its default values', () => {
  for (const template of registry.templates) {
    const values = defaultValues(template);
    assert.deepEqual(validateParams(template, values), [], `${template.id}: defaults out of range`);
    const result = evaluateTemplate(template, values);
    assert.deepEqual(result.errors, [], template.id);
    assert.ok(result.parts.length > 0, `${template.id}: no parts`);
    assert.match(buildIfc(toIfcModel(template.name, result)), /END-ISO-10303-21;$/);
  }
});

test('out-of-range values are reported without calling compute()', () => {
  const [template] = registry.templates;
  const values = { ...defaultValues(template), width: 1 };
  const result = evaluateTemplate(template, values);
  assert.equal(result.errors.length, 1);
  assert.deepEqual(result.parts, []);
});

test('registry rejects duplicate ids and malformed templates', () => {
  const [template] = registry.templates;
  assert.throws(() => createRegistry([template, template]), /Duplicate template id/);
  assert.throws(() => assertTemplate({ ...template, id: 'Bad_Id' }), /kebab-case/);
  assert.throws(() => assertTemplate({ ...template, params: [] }), /at least one parameter/);
});

test('URL state round-trips and omits default values', () => {
  const [template] = registry.templates;
  const values = { ...defaultValues(template), width: 5000, slatAngle: 45 };
  const hash = encodeState(template, values);
  assert.match(hash, /^t=bioclimatic-pergola&/);
  assert.ok(!hash.includes('depth='));
  const decoded = decodeState(registry, `#${hash}`);
  assert.equal(decoded.template.id, template.id);
  assert.deepEqual(decoded.values, coerceAll(template, values));
  assert.equal(decodeState(registry, '').template, undefined);
});
