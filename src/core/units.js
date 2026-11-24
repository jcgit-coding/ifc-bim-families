/**
 * Unit conversion helpers. The model (parts, IFC, viewer) works in metres and degrees.
 * Template parameters declare their own display unit: 'm' for lengths, 'cm' for sections and
 * spacings, 'mm' where needed, 'deg' for angles.
 */

const METRES_PER_UNIT = Object.freeze({ m: 1, cm: 0.01, mm: 0.001 });

/** Converts a value in a length unit ('m', 'cm' or 'mm') to metres. */
export function toMetres(value, unit) {
  const factor = METRES_PER_UNIT[unit];
  if (factor === undefined) throw new Error(`Unknown length unit: ${unit}`);
  return value * factor;
}

/** True for units that toMetres() can convert. */
export const isLengthUnit = (unit) => unit in METRES_PER_UNIT;

export const degreesToRadians = (degrees) => (degrees * Math.PI) / 180;
