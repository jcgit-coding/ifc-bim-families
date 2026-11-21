import { formatReal } from './step.js';

/**
 * Profile writers, keyed by profile type. A profile is the 2D section that is
 * extruded along a part's extrusion axis. To support a new section shape, add
 * a writer here and a matching geometry factory in src/viewer/part-geometry.js.
 */
const PROFILE_WRITERS = {
  /** { type: 'rectangle', width, depth } - centred on the part origin. */
  rectangle: (step, profile) => step.add(
    `IFCRECTANGLEPROFILEDEF(.AREA.,$,$,${formatReal(profile.width)},${formatReal(profile.depth)})`),

  /** { type: 'circle', radius } - centred on the part origin. */
  circle: (step, profile) => step.add(
    `IFCCIRCLEPROFILEDEF(.AREA.,$,$,${formatReal(profile.radius)})`),
};

export const PROFILE_TYPES = Object.freeze(Object.keys(PROFILE_WRITERS));

/** Writes a profile definition and returns its STEP reference. */
export function writeProfile(step, profile) {
  const write = PROFILE_WRITERS[profile?.type];
  if (!write) throw new Error(`Unsupported profile type: ${profile?.type}`);
  return write(step, profile);
}
