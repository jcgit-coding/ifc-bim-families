import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Measure } from '../src/core/ifc/measures.js';
import { createGuid, encodeString, formatReal } from '../src/core/ifc/step.js';
import { buildIfc } from '../src/core/ifc/writer.js';

const rectanglePart = {
  name: 'Column 1', ifcClass: 'IfcColumn', predefinedType: 'COLUMN',
  origin: [0, 0, 0], extrusionAxis: [0, 0, 1], profileAxis: [1, 0, 0],
  profile: { type: 'rectangle', width: 0.15, depth: 0.15 }, length: 2.4,
};
const circlePart = {
  name: 'Pipe 1', ifcClass: 'IfcPipeSegment', predefinedType: 'RIGIDSEGMENT',
  origin: [1, 0, 0], extrusionAxis: [1, 0, 0], profileAxis: [0, 1, 0],
  profile: { type: 'circle', radius: 0.025 }, length: 3,
};
const model = {
  name: 'Test model', parts: [rectanglePart, circlePart],
  propertySets: [{ name: 'Custom_Test', properties: [{ name: 'Width', value: Measure.length(1.5) }] }],
};

test('guids are 22 characters and unique', () => {
  const guids = new Set(Array.from({ length: 200 }, createGuid));
  assert.equal(guids.size, 200);
  assert.ok([...guids].every((guid) => /^[0-9A-Za-z_$]{22}$/.test(guid)));
});

test('numbers always carry a decimal point and strings are escaped', () => {
  assert.equal(formatReal(3), '3.');
  assert.equal(formatReal(0.15), '0.15');
  assert.throws(() => formatReal(Number.NaN));
  assert.equal(encodeString("O'Brien"), "O''Brien");
  const eAcute = String.fromCodePoint(0xe9);
  assert.equal(encodeString(eAcute), '\\X2\\00E9\\X0\\');
});

test('writes a complete IFC4 file with rectangle and circle profiles', () => {
  const text = buildIfc(model);
  assert.match(text, /^ISO-10303-21;/);
  assert.match(text, /FILE_SCHEMA\(\('IFC4'\)\)/);
  assert.match(text, /END-ISO-10303-21;$/);
  assert.equal((text.match(/IFCEXTRUDEDAREASOLID/g) ?? []).length, 2);
  assert.match(text, /IFCRECTANGLEPROFILEDEF/);
  assert.match(text, /IFCCIRCLEPROFILEDEF/);
  assert.match(text, /IFCPROPERTYSET\([^)]*'Custom_Test'/);
});

test('rejects invalid models', () => {
  assert.throws(() => buildIfc({ name: 'Empty', parts: [] }), /at least one part/);
  assert.throws(() => buildIfc({ ...model, parts: [{ ...rectanglePart, ifcClass: 'IfcSpaceship' }] }), /Unsupported IFC class/);
  assert.throws(() => buildIfc({ ...model, parts: [{ ...rectanglePart, profile: { type: 'hexagon' } }] }), /Unsupported profile/);
});

test('materials are written once per name and associated with their elements', () => {
  const steel = { name: 'Steel, galvanised', category: 'Steel', color: [0.6, 0.63, 0.66] };
  const text = buildIfc({ ...model, parts: [{ ...rectanglePart, material: steel }, { ...circlePart, material: steel }] });
  assert.equal((text.match(/IFCMATERIAL\(/g) ?? []).length, 1);
  assert.match(text, /IFCMATERIAL\('Steel, galvanised',\$,'Steel'\)/);
  assert.equal((text.match(/IFCRELASSOCIATESMATERIAL/g) ?? []).length, 1);
  assert.match(text, /IFCRELASSOCIATESMATERIAL\([^)]*\(#\d+,#\d+\),#\d+\)/);
  assert.match(text, /IFCSURFACESTYLERENDERING\(#\d+,0\.,/);
  assert.match(text, /IFCMATERIALDEFINITIONREPRESENTATION/);
});

test('invalid materials are rejected', () => {
  const bad = { ...rectanglePart, material: { name: 'Bad', color: [2, 0, 0] } };
  assert.throws(() => buildIfc({ ...model, parts: [bad] }), /Invalid material/);
});
