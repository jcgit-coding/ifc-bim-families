/**
 * Template catalogue. To add a family: create src/templates/<family>.js following
 * docs/adding-a-template.md, import it here and add it to IMPLEMENTED_TEMPLATES.
 */
import { createRegistry } from '../core/templates/registry.js';
import bioclimaticPergola from './bioclimatic-pergola.js';
import planned from './planned.js';

const IMPLEMENTED_TEMPLATES = [bioclimaticPergola];

export const registry = createRegistry(IMPLEMENTED_TEMPLATES, planned);
