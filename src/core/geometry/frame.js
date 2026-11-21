/** Minimal 3D vector helpers used to orient extruded parts. Vectors are [x, y, z] arrays. */

export const crossProduct = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];

export const normalize = (vector) => {
  const length = Math.hypot(...vector);
  if (length === 0) throw new RangeError('Cannot normalise a zero-length vector');
  return vector.map((component) => component / length);
};

/**
 * Builds the right-handed local frame of an extruded part.
 * @param {number[]} extrusionAxis direction of extrusion (local Z)
 * @param {number[]} profileAxis   direction of the profile's width (local X)
 * @returns {{x: number[], y: number[], z: number[]}}
 */
export function localFrame(extrusionAxis, profileAxis) {
  const z = normalize(extrusionAxis);
  const x = normalize(profileAxis);
  return { x, y: crossProduct(z, x), z };
}
