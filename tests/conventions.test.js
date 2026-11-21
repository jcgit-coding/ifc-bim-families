import assert from 'node:assert/strict';
import { test } from 'node:test';
import { collectViolations } from '../scripts/check-conventions.mjs';

test('project follows the conventions in docs/standards.md', () => {
  assert.deepEqual(collectViolations(), []);
});
