import * as THREE from 'three';

const CIRCLE_SEGMENTS = 32;

/**
 * Geometry factories keyed by profile type, mirroring src/core/ifc/profiles.js.
 * Each returns a geometry centred on its midpoint with the extrusion along local Z.
 */
const GEOMETRY_FACTORIES = {
  rectangle: (profile, length) => new THREE.BoxGeometry(profile.width, profile.depth, length),
  circle: (profile, length) => {
    const geometry = new THREE.CylinderGeometry(profile.radius, profile.radius, length, CIRCLE_SEGMENTS);
    return geometry.rotateX(Math.PI / 2); // cylinders extrude along Y by default
  },
};

export function createPartGeometry(part) {
  const factory = GEOMETRY_FACTORIES[part.profile.type];
  if (!factory) throw new Error(`No viewer geometry for profile type: ${part.profile.type}`);
  return factory(part.profile, part.length);
}

/** Cache key so identical parts share one geometry. */
export const partGeometryKey = (part) => `${JSON.stringify(part.profile)}|${part.length}`;
