/**
 * Enforces the project conventions from docs/standards.md:
 *  - source files have at most MAX_LINES lines
 *  - file names are kebab-case
 *  - code and docs are written in English (no Spanish-only characters)
 * Usage: node scripts/check-conventions.mjs
 */
import { readdirSync, readFileSync } from 'node:fs';
import { basename, extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

export const MAX_LINES = 1000;
const ROOT = fileURLToPath(new URL('..', import.meta.url));
const CHECKED_EXTENSIONS = new Set(['.js', '.mjs', '.css', '.html', '.md', '.py', '.yml', '.json']);
const IGNORED_DIRECTORIES = new Set(['vendor', 'node_modules', '.git', '_archive', 'samples-out']);
const ALLOWED_UPPERCASE_FILES = new Set(['README.md', 'LICENSE.md']);
const KEBAB_FILE_NAME = /^[a-z0-9]+(-[a-z0-9]+)*$/;
// Spanish-only letters and punctuation, written as escapes so this file stays plain ASCII.
// Code points of Spanish-only letters and punctuation (a, e, i, o, u acutes; n tilde; u diaeresis;
// upper-case forms; inverted ? and !). Built from numbers so this file stays plain ASCII.
const SPANISH_CODE_POINTS = [
  0xe1, 0xe9, 0xed, 0xf3, 0xfa, 0xf1, 0xfc, 0xc1, 0xc9, 0xcd, 0xd3, 0xda, 0xd1, 0xdc, 0xbf, 0xa1,
];
const SPANISH_CHARACTERS = new RegExp(`[${String.fromCodePoint(...SPANISH_CODE_POINTS)}]`);

function* walk(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!IGNORED_DIRECTORIES.has(entry.name)) yield* walk(join(directory, entry.name));
    } else {
      yield join(directory, entry.name);
    }
  }
}

/** Returns a list of human-readable violations for the files under `root`. */
export function collectViolations(root = ROOT) {
  const violations = [];
  for (const file of walk(root)) {
    const extension = extname(file);
    if (!CHECKED_EXTENSIONS.has(extension) || basename(file) === 'package-lock.json') continue;
    const name = relative(root, file).replaceAll('\\', '/');
    const stem = basename(file, extension).replace(/\.test$/, '');
    if (!ALLOWED_UPPERCASE_FILES.has(basename(file)) && !KEBAB_FILE_NAME.test(stem)) {
      violations.push(`${name}: file name must be kebab-case`);
    }
    const lines = readFileSync(file, 'utf8').split('\n');
    if (lines.length > MAX_LINES) violations.push(`${name}: ${lines.length} lines (max ${MAX_LINES})`);
    lines.forEach((line, index) => {
      if (SPANISH_CHARACTERS.test(line)) violations.push(`${name}:${index + 1}: non-English text`);
    });
  }
  return violations;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const violations = collectViolations();
  if (violations.length > 0) {
    console.error(violations.join('\n'));
    process.exit(1);
  }
  console.log('Conventions OK');
}
