import { Measure } from '../core/ifc/measures.js';
import { getMaterial, MATERIAL_OPTIONS } from '../core/materials.js';
import { valuesInMetres } from '../core/templates/params.js';
import { degreesToRadians } from '../core/units.js';
import { t } from '../i18n/i18n.js';

/**
 * Bioclimatic pergola: perimeter frame (columns + beams) with rotating slats.
 * Axes: X = width (slat length), Y = depth, Z = height. Origin at the front-left base corner.
 */

const SLAT_ANGLE_MAX = 110;
const EPSILON = 1e-9;
const SET_PARAMETERS = 'Custom_BioclimaticPergola_Parameters';
const SET_SLAT = 'Custom_BioclimaticPergola_Slat';
const DEFAULT_MATERIAL = 'aluminium-anthracite';

const params = [
  { key: 'name', label: 'Name', type: 'text', group: 'General', default: 'Bioclimatic pergola' },
  { key: 'width', label: 'Width (slat length)', type: 'number', unit: 'm', group: 'Dimensions', default: 4, min: 1, max: 12, step: 0.05 },
  { key: 'depth', label: 'Depth', type: 'number', unit: 'm', group: 'Dimensions', default: 3, min: 1, max: 12, step: 0.05 },
  { key: 'height', label: 'Total height', type: 'number', unit: 'm', group: 'Dimensions', default: 2.6, min: 2, max: 5, step: 0.05 },
  { key: 'columnCount', label: 'Count', type: 'select', group: 'Columns', default: '4',
    options: [['4', '4 (corners)'], ['2', '2 (front only)']] },
  { key: 'columnShape', label: 'Section shape', type: 'select', group: 'Columns', default: 'rectangular',
    options: [['rectangular', 'Rectangular'], ['circular', 'Circular']] },
  { key: 'columnWidth', label: 'Section width (X)', type: 'number', unit: 'cm', group: 'Columns', default: 15, min: 5, max: 50, step: 0.5,
    visibleWhen: { key: 'columnShape', value: 'rectangular' } },
  { key: 'columnDepth', label: 'Section depth (Y)', type: 'number', unit: 'cm', group: 'Columns', default: 15, min: 5, max: 50, step: 0.5,
    visibleWhen: { key: 'columnShape', value: 'rectangular' } },
  { key: 'columnDiameter', label: 'Diameter', type: 'number', unit: 'cm', group: 'Columns', default: 15, min: 5, max: 50, step: 0.5,
    visibleWhen: { key: 'columnShape', value: 'circular' } },
  { key: 'beamWidth', label: 'Section width', type: 'number', unit: 'cm', group: 'Beams', default: 15, min: 5, max: 40, step: 0.5 },
  { key: 'beamHeight', label: 'Section height', type: 'number', unit: 'cm', group: 'Beams', default: 20, min: 5, max: 50, step: 0.5 },
  { key: 'slatWidth', label: 'Slat width', type: 'number', unit: 'cm', group: 'Slats', default: 20, min: 5, max: 50, step: 0.5 },
  { key: 'slatThickness', label: 'Slat thickness', type: 'number', unit: 'cm', group: 'Slats', default: 3, min: 0.5, max: 10, step: 0.1 },
  { key: 'slatGap', label: 'Minimum gap', type: 'number', unit: 'cm', group: 'Slats', default: 2, min: 0, max: 20, step: 0.1 },
  { key: 'slatAngle', label: 'Opening angle', type: 'number', unit: 'deg', group: 'Slats', default: 0, min: 0, max: SLAT_ANGLE_MAX, step: 1 },
  { key: 'columnMaterial', label: 'Columns', type: 'select', group: 'Materials', default: DEFAULT_MATERIAL, options: MATERIAL_OPTIONS },
  { key: 'beamMaterial', label: 'Beams', type: 'select', group: 'Materials', default: DEFAULT_MATERIAL, options: MATERIAL_OPTIONS },
  { key: 'slatMaterial', label: 'Slats', type: 'select', group: 'Materials', default: DEFAULT_MATERIAL, options: MATERIAL_OPTIONS },
];

function validateGeometry(v) {
  const errors = [];
  if (v.beamHeight >= v.height) errors.push(t('Beam height must be smaller than the total height'));
  if (v.depth <= 2 * v.beamWidth) errors.push(t('Depth is too small for the beams'));
  if (v.width <= 2 * v.beamWidth) errors.push(t('Width is too small for the beams'));
  return errors;
}

/** Column section: profile for the IFC/viewer plus the footprint used to place it. */
function columnSection(d, shape) {
  if (shape === 'circular') {
    return { profile: { type: 'circle', radius: d.columnDiameter / 2 }, footprintX: d.columnDiameter, footprintY: d.columnDiameter };
  }
  return {
    profile: { type: 'rectangle', width: d.columnWidth, depth: d.columnDepth },
    footprintX: d.columnWidth, footprintY: d.columnDepth,
  };
}

function buildColumns(d, columnCount, section) {
  const { profile, footprintX, footprintY } = section;
  const rows = columnCount === 4 ? [footprintY / 2, d.depth - footprintY / 2] : [footprintY / 2];
  const columns = [];
  for (const y of rows) {
    for (const x of [footprintX / 2, d.width - footprintX / 2]) {
      columns.push({
        name: `Column ${columns.length + 1}`, ifcClass: 'IfcColumn', predefinedType: 'COLUMN', role: 'structure',
        origin: [x, y, 0], extrusionAxis: [0, 0, 1], profileAxis: [1, 0, 0],
        profile, length: d.height - d.beamHeight, material: getMaterial(d.columnMaterial),
      });
    }
  }
  return columns;
}

function buildBeams(d) {
  const z = d.height - d.beamHeight / 2;
  const profile = { type: 'rectangle', width: d.beamWidth, depth: d.beamHeight };
  const beam = (name, origin, extrusionAxis, profileAxis, length) => ({
    name, ifcClass: 'IfcBeam', predefinedType: 'BEAM', role: 'structure',
    origin, extrusionAxis, profileAxis, profile, length, material: getMaterial(d.beamMaterial),
  });
  const sideLength = d.depth - 2 * d.beamWidth;
  return [
    beam('Front beam', [0, d.beamWidth / 2, z], [1, 0, 0], [0, 1, 0], d.width),
    beam('Rear beam', [0, d.depth - d.beamWidth / 2, z], [1, 0, 0], [0, 1, 0], d.width),
    beam('Left beam', [d.beamWidth / 2, d.beamWidth, z], [0, 1, 0], [1, 0, 0], sideLength),
    beam('Right beam', [d.width - d.beamWidth / 2, d.beamWidth, z], [0, 1, 0], [1, 0, 0], sideLength),
  ];
}

/** Slats are evenly distributed between the side beams; the count follows from the gap. */
function buildSlats(d, angleDegrees) {
  const clearDepth = d.depth - 2 * d.beamWidth;
  const count = Math.max(1, Math.floor(clearDepth / (d.slatWidth + d.slatGap) + EPSILON));
  const pitch = clearDepth / count;
  const angle = degreesToRadians(angleDegrees);
  const z = d.height - d.beamHeight / 2;
  const slats = Array.from({ length: count }, (_, index) => ({
    name: `Slat ${index + 1}`, ifcClass: 'IfcShadingDevice', predefinedType: 'JALOUSIE', role: 'operable',
    origin: [d.beamWidth, d.beamWidth + (index + 0.5) * pitch, z],
    extrusionAxis: [1, 0, 0],
    profileAxis: [0, Math.cos(angle), Math.sin(angle)],
    profile: { type: 'rectangle', width: d.slatWidth, depth: d.slatThickness },
    length: d.width - 2 * d.beamWidth, material: getMaterial(d.slatMaterial),
    propertySets: [{ name: SET_SLAT, properties: [{ name: 'OpeningAngle', value: Measure.angle(angleDegrees) }] }],
  }));
  return { slats, count, pitch, overlaps: d.slatWidth * Math.cos(angle) > pitch + EPSILON };
}

function compute(values) {
  const d = valuesInMetres({ params }, values);
  const errors = validateGeometry(d);
  if (errors.length > 0) return { errors };

  const columnCount = Number.parseInt(values.columnCount, 10);
  const { slats, count, pitch, overlaps } = buildSlats(d, values.slatAngle);
  const planArea = d.width * d.depth;
  const section = columnSection(d, values.columnShape);

  return {
    errors,
    warnings: overlaps ? [t('At this angle the slats overlap in plan view.')] : [],
    objectType: 'Bioclimatic pergola',
    fileName: `bioclimatic-pergola_${values.width}x${values.depth}m_${values.slatAngle}deg.ifc`,
    parts: [...buildColumns(d, columnCount, section), ...buildBeams(d), ...slats],
    summary: [
      { label: t('Slats'), value: String(count) },
      { label: t('Slat pitch'), value: `${(pitch * 100).toFixed(1)} cm` },
      { label: t('Columns'), value: t('{count} ({shape})', { count: columnCount, shape: t(values.columnShape) }) },
      { label: t('Plan area'), value: `${planArea.toFixed(2)} m²` },
    ],
    propertySets: [{
      name: SET_PARAMETERS,
      properties: [
        { name: 'Width', value: Measure.length(d.width) },
        { name: 'Depth', value: Measure.length(d.depth) },
        { name: 'TotalHeight', value: Measure.length(d.height) },
        { name: 'ColumnShape', value: Measure.label(values.columnShape) },
        { name: 'ColumnWidth', value: Measure.length(section.footprintX) },
        { name: 'ColumnDepth', value: Measure.length(section.footprintY) },
        { name: 'BeamWidth', value: Measure.length(d.beamWidth) },
        { name: 'BeamHeight', value: Measure.length(d.beamHeight) },
        { name: 'SlatWidth', value: Measure.length(d.slatWidth) },
        { name: 'SlatThickness', value: Measure.length(d.slatThickness) },
        { name: 'SlatGap', value: Measure.length(d.slatGap) },
        { name: 'SlatPitch', value: Measure.length(pitch) },
        { name: 'SlatAngle', value: Measure.angle(values.slatAngle) },
        { name: 'ColumnMaterial', value: Measure.label(getMaterial(d.columnMaterial).name) },
        { name: 'BeamMaterial', value: Measure.label(getMaterial(d.beamMaterial).name) },
        { name: 'SlatMaterial', value: Measure.label(getMaterial(d.slatMaterial).name) },
        { name: 'ColumnCount', value: Measure.integer(columnCount) },
        { name: 'SlatCount', value: Measure.integer(count) },
        { name: 'PlanArea', value: Measure.area(planArea) },
      ],
    }],
  };
}

export default {
  id: 'bioclimatic-pergola',
  name: 'Bioclimatic pergola',
  discipline: 'Architecture',
  description: 'Perimeter frame with columns, beams and rotating slats.',
  params,
  compute,
};
