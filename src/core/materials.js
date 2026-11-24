/**
 * Shared material catalogue. A part references a material object from here; the IFC writer turns it
 * into an IfcMaterial (name, category) with a surface colour, which Revit imports as a material.
 * Material: { name, category, color: [r, g, b] (0..1), transparency? (0 opaque .. 1 clear) }.
 * `name` is the IFC material name and the (translatable) UI label.
 */

const CATALOGUE = Object.freeze({
  'aluminium-anthracite': { name: 'Aluminium, anthracite', category: 'Aluminium', color: [0.22, 0.24, 0.26] },
  'aluminium-white': { name: 'Aluminium, white', category: 'Aluminium', color: [0.93, 0.93, 0.92] },
  'aluminium-natural': { name: 'Aluminium, natural', category: 'Aluminium', color: [0.72, 0.74, 0.76] },
  'steel-galvanised': { name: 'Steel, galvanised', category: 'Steel', color: [0.6, 0.63, 0.66] },
  'timber-oak': { name: 'Timber, oak', category: 'Wood', color: [0.66, 0.5, 0.32] },
  'concrete-grey': { name: 'Concrete, grey', category: 'Concrete', color: [0.62, 0.62, 0.6] },
  'glass-clear': { name: 'Glass, clear', category: 'Glass', color: [0.7, 0.85, 0.9], transparency: 0.7 },
});

/** Ids and labels for a `select` parameter: [[id, name], ...]. */
export const MATERIAL_OPTIONS = Object.freeze(Object.entries(CATALOGUE).map(([id, material]) => [id, material.name]));

/** Returns the material for an id; throws on unknown ids so typos fail loudly. */
export function getMaterial(id) {
  const material = CATALOGUE[id];
  if (!material) throw new Error(`Unknown material: ${id}`);
  return material;
}
