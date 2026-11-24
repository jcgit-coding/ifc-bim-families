# Adding a template (a new family)

A template is a plain JavaScript module that describes the parameters of a family and turns
their values into parts. The engine takes care of the form, the 3D preview, validation,
sharing links and the IFC export.

## 1. Create `src/templates/<family-id>.js`

```js
import { Measure } from '../core/ifc/measures.js';
import { mmToMetres } from '../core/units.js';

const params = [
  { key: 'name', label: 'Name', type: 'text', group: 'General', default: 'Steel beam' },
  { key: 'length', label: 'Length', type: 'number', unit: 'mm', group: 'Dimensions',
    default: 3000, min: 500, max: 12000, step: 10 },
];

function compute(values) {
  const length = mmToMetres(values.length);
  return {
    errors: [],                       // cross-field rules only; ranges are checked by the engine
    warnings: [],
    objectType: 'Steel beam',
    fileName: `steel-beam_${values.length}.ifc`,
    summary: [{ label: 'Length', value: `${length} m` }],
    parts: [{
      name: 'Beam', ifcClass: 'IfcBeam', predefinedType: 'BEAM', role: 'structure',
      origin: [0, 0, 0], extrusionAxis: [1, 0, 0], profileAxis: [0, 1, 0],
      profile: { type: 'rectangle', width: 0.2, depth: 0.3 }, length,
    }],
    propertySets: [{ name: 'Custom_SteelBeam_Parameters',
      properties: [{ name: 'Length', value: Measure.length(length) }] }],
  };
}

export default {
  id: 'steel-beam', name: 'Steel beam', discipline: 'Structure',
  description: 'Straight beam with a rectangular section.', params, compute,
};
```

## 2. Register it
In `src/templates/index.js` import the module and add it to `IMPLEMENTED_TEMPLATES`.
If a "Coming soon" card exists for it in `src/templates/planned.js`, remove that entry.

## 3. Verify
```
npm test && npm run check
```
The test suite automatically checks the contract, the default values and that a valid IFC is produced.

## 3b. Translate it
Write every user-visible string in English (parameter labels, groups, option labels, name, description,
discipline, summary labels, errors and warnings). Wrap strings built inside `compute()` with `t()` from
`src/i18n/i18n.js`, using `{name}` placeholders for values. Then add the Spanish text to
`src/i18n/es.js`. The tests fail when a declared template string has no Spanish entry. Parts, IFC
property names and file names are never translated.

## Reference
- **Parameter types:** `text`, `number`, `range`, `select` (with `options: [[value, label], ...]`), `boolean`.
- **Conditional parameters:** `visibleWhen: { key: 'shape', value: 'circular' }` shows a parameter only
  while another parameter has that value. Hidden parameters are not range-validated.
- **Cross sections:** parametrise sections (shape and dimensions) instead of hard-coding them, as the
  pergola does for columns (rectangular width/depth or circular diameter) and beams.
- **Profiles:** `rectangle { width, depth }` and `circle { radius }`. New shapes: add a writer in
  `src/core/ifc/profiles.js` and a geometry factory in `src/viewer/part-geometry.js`.
- **IFC classes:** see `SUPPORTED_ELEMENT_CLASSES` in `src/core/ifc/writer.js`.
- **Roles** (viewer colours): `structure`, `operable`, `finish`, `service`.
- **Part axes:** `extrusionAxis` is the direction the profile is extruded; `profileAxis` is the
  direction of the profile's `width`. `origin` is the centre of the profile at the start of the extrusion.
