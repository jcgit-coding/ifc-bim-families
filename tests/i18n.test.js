import assert from 'node:assert/strict';
import { test } from 'node:test';
import es from '../src/i18n/es.js';
import { t } from '../src/i18n/i18n.js';
import { registry } from '../src/templates/index.js';

/** Every user-visible string a template or planned entry declares must have a Spanish entry. */
function declaredStrings() {
  const strings = new Set();
  for (const template of registry.templates) {
    [template.name, template.description, template.discipline].forEach((text) => strings.add(text));
    for (const param of template.params) {
      strings.add(param.label);
      strings.add(param.group);
      (param.options ?? []).forEach(([, label]) => strings.add(label));
    }
  }
  for (const entry of registry.planned) {
    [entry.name, entry.description, entry.discipline].forEach((text) => strings.add(text));
  }
  return strings;
}

test('Spanish dictionary covers every declared template string', () => {
  const missing = [...declaredStrings()].filter((text) => !(text in es));
  assert.deepEqual(missing, []);
});

test('Spanish entries keep the same placeholders as their English source', () => {
  const placeholders = (text) => (text.match(/\{\w+\}/g) ?? []).sort().join();
  for (const [source, translation] of Object.entries(es)) {
    assert.equal(placeholders(translation), placeholders(source), source);
  }
});

test('t() fills placeholders and falls back to the English text', () => {
  assert.equal(t('{label} must be a number', { label: 'Width' }), 'Width must be a number');
  assert.equal(t('Untranslated text'), 'Untranslated text');
});
