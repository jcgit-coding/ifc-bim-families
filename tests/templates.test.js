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

test('column and beam sections are parametrised', () => {
  const [template] = registry.templates;
  const base = defaultValues(template);
  const rectangular = evaluateTemplate(template, { ...base, columnWidth: 200, columnDepth: 300 });
  const column = rectangular.parts.find((part) => part.ifcClass === 'IfcColumn');
  assert.deepEqual(column.profile, { type: 'rectangle', width: 0.2, depth: 0.3 });

  const circular = evaluateTemplate(template, { ...base, columnShape: 'circular', columnDiameter: 250 });
  assert.deepEqual(circular.parts.find((part) => part.ifcClass === 'IfcColumn').profile, { type: 'circle', radius: 0.125 });

  const beams = evaluateTemplate(template, { ...base, beamWidth: 100, beamHeight: 250 })
    .parts.filter((part) => part.ifcClass === 'IfcBeam');
  assert.ok(beams.every((beam) => beam.profile.width === 0.1 && beam.profile.depth === 0.25));
});

test('hidden parameters are not validated and bad dependencies are rejected', () => {
  const [template] = registry.templates;
  const hiddenOutOfRange = { ...defaultValues(template), columnDiameter: 1 };
  assert.deepEqual(validateParams(template, hiddenOutOfRange), []);
  const broken = { ...template, params: [...template.params, { key: 'x', label: 'X', type: 'text', group: 'G', default: '', visibleWhen: { key: 'missing', value: 1 } }] };
  assert.throws(() => assertTemplate(broken), /unknown parameter/);
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
