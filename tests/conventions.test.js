import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { collectViolations } from '../scripts/check-conventions.mjs';

test('project follows the conventions in docs/standards.md', () => {
  assert.deepEqual(collectViolations(), []);
});

test('checker rejects emoji, Spanish text and bad file names', () => {
  const root = mkdtempSync(join(tmpdir(), 'conventions-'));
  mkdirSync(join(root, 'src'));
  const emoji = String.fromCodePoint(0x1f600);
  const accent = String.fromCodePoint(0xe9);
  writeFileSync(join(root, 'src', 'Bad_Name.js'), `// ok\nconst a = "${emoji}";\nconst b = "caf${accent}";\n`);
  const violations = collectViolations(root);
  assert.ok(violations.some((text) => text.includes('kebab-case')));
  assert.ok(violations.some((text) => text.includes('emoji')));
  assert.ok(violations.some((text) => text.includes('non-English')));
});
