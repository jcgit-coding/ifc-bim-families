/**
 * Writes one IFC per registered template (default values) into the given directory.
 * Used by CI to validate the output with IfcOpenShell.
 * Usage: node scripts/export-samples.mjs <output-directory>
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildIfc } from '../src/core/ifc/writer.js';
import { evaluateTemplate, toIfcModel } from '../src/core/templates/evaluate.js';
import { defaultValues } from '../src/core/templates/params.js';
import { registry } from '../src/templates/index.js';

const outputDirectory = process.argv[2];
if (!outputDirectory) {
  console.error('Usage: node scripts/export-samples.mjs <output-directory>');
  process.exit(1);
}
mkdirSync(outputDirectory, { recursive: true });

for (const template of registry.templates) {
  const values = defaultValues(template);
  const result = evaluateTemplate(template, values);
  if (result.errors.length > 0) throw new Error(`${template.id}: ${result.errors.join('; ')}`);
  const target = join(outputDirectory, `${template.id}.ifc`);
  writeFileSync(target, buildIfc(toIfcModel(values.name ?? template.name, result)));
  console.log(`Wrote ${target}`);
}
