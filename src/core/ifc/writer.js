import { StepBuilder, createGuid, formatReal, quote, toList } from './step.js';
import { writeProfile } from './profiles.js';
import { createMaterialWriter } from './material-writer.js';

/**
 * Generic IFC4 writer. It knows nothing about specific families: it receives a
 * model made of extruded parts and writes the project, spatial tree, elements,
 * an aggregating assembly and property sets.
 *
 * Model contract (metres, degrees):
 *   { name, objectType, parts: Part[], propertySets: PropertySet[] }
 *   Part        { name, ifcClass, predefinedType, origin, extrusionAxis, profileAxis,
 *                 profile, length, material?, propertySets? }
 *   Material    { name, category?, color: [r, g, b], transparency? }  (see src/core/materials.js)
 *   PropertySet { name, properties: [{ name, value }] }   (value from Measure.*)
 */

/** IFC4 classes whose attribute list ends with Tag + PredefinedType, as the writer assumes. */
export const SUPPORTED_ELEMENT_CLASSES = Object.freeze([
  'IfcBeam', 'IfcBuildingElementProxy', 'IfcColumn', 'IfcCovering', 'IfcMember',
  'IfcPipeSegment', 'IfcPlate', 'IfcRailing', 'IfcShadingDevice', 'IfcSlab', 'IfcWall',
]);

const ORIGIN = [0, 0, 0];
const WORLD_Z = [0, 0, 1];
const WORLD_X = [1, 0, 0];
const RADIANS_PER_DEGREE = 0.0174532925199;
const ASSEMBLY_CLASS = 'IfcBuildingElementProxy';

const globalId = () => quote(createGuid());

function createGeometryWriters(step) {
  const point = (v) => step.add(`IFCCARTESIANPOINT((${v.map(formatReal).join(',')}))`);
  const direction = (v) => step.add(`IFCDIRECTION((${v.map(formatReal).join(',')}))`);
  const axisPlacement = (origin, zAxis, xAxis) =>
    step.add(`IFCAXIS2PLACEMENT3D(${point(origin)},${direction(zAxis)},${direction(xAxis)})`);
  const worldPlacement = () => axisPlacement(ORIGIN, WORLD_Z, WORLD_X);
  const localPlacement = (parent, axes) => step.add(`IFCLOCALPLACEMENT(${parent ?? '$'},${axes})`);
  return { direction, axisPlacement, worldPlacement, localPlacement };
}

function writeUnits(step) {
  const length = step.add('IFCSIUNIT(*,.LENGTHUNIT.,$,.METRE.)');
  const area = step.add('IFCSIUNIT(*,.AREAUNIT.,$,.SQUARE_METRE.)');
  const volume = step.add('IFCSIUNIT(*,.VOLUMEUNIT.,$,.CUBIC_METRE.)');
  const radian = step.add('IFCSIUNIT(*,.PLANEANGLEUNIT.,$,.RADIAN.)');
  const dimensions = step.add('IFCDIMENSIONALEXPONENTS(0,0,0,0,0,0,0)');
  const conversion = step.add(
    `IFCMEASUREWITHUNIT(IFCPLANEANGLEMEASURE(${RADIANS_PER_DEGREE}),${radian})`);
  const degree = step.add(
    `IFCCONVERSIONBASEDUNIT(${dimensions},.PLANEANGLEUNIT.,'DEGREE',${conversion})`);
  return step.add(`IFCUNITASSIGNMENT(${toList([length, area, volume, degree])})`);
}

function writeSpatialTree(step, geometry, projectName) {
  const context = step.add(
    `IFCGEOMETRICREPRESENTATIONCONTEXT($,'Model',3,1.E-05,${geometry.worldPlacement()},$)`);
  const bodyContext = step.add(
    `IFCGEOMETRICREPRESENTATIONSUBCONTEXT('Body','Model',*,*,*,*,${context},$,.MODEL_VIEW.,$)`);
  const project = step.add(
    `IFCPROJECT(${globalId()},$,${quote(projectName)},$,$,$,$,${toList([context])},${writeUnits(step)})`);

  const sitePlacement = geometry.localPlacement(null, geometry.worldPlacement());
  const site = step.add(`IFCSITE(${globalId()},$,'Site',$,$,${sitePlacement},$,$,.ELEMENT.,$,$,$,$,$)`);
  const buildingPlacement = geometry.localPlacement(sitePlacement, geometry.worldPlacement());
  const building = step.add(
    `IFCBUILDING(${globalId()},$,'Building',$,$,${buildingPlacement},$,$,.ELEMENT.,$,$,$)`);
  const storeyPlacement = geometry.localPlacement(buildingPlacement, geometry.worldPlacement());
  const storey = step.add(
    `IFCBUILDINGSTOREY(${globalId()},$,'Level 0',$,$,${storeyPlacement},$,$,.ELEMENT.,0.)`);

  const aggregate = (parent, child) =>
    step.add(`IFCRELAGGREGATES(${globalId()},$,$,$,${parent},${toList([child])})`);
  aggregate(project, site);
  aggregate(site, building);
  aggregate(building, storey);
  return { bodyContext, storey, storeyPlacement };
}

function writePropertySets(step, element, propertySets = []) {
  for (const { name, properties } of propertySets) {
    const refs = properties.map(({ name: propName, value }) =>
      step.add(`IFCPROPERTYSINGLEVALUE(${quote(propName)},$,${value},$)`));
    const set = step.add(`IFCPROPERTYSET(${globalId()},$,${quote(name)},$,${toList(refs)})`);
    step.add(`IFCRELDEFINESBYPROPERTIES(${globalId()},$,$,$,${toList([element])},${set})`);
  }
}

function writePart(step, geometry, tree, materials, part) {
  const profile = writeProfile(step, part.profile);
  const solid = step.add(
    `IFCEXTRUDEDAREASOLID(${profile},${geometry.worldPlacement()},${geometry.direction(WORLD_Z)},${formatReal(part.length)})`);
  const representation = step.add(
    `IFCSHAPEREPRESENTATION(${tree.bodyContext},'Body','SweptSolid',${toList([solid])})`);
  if (part.material) step.add(`IFCSTYLEDITEM(${solid},${toList([materials.styleFor(part.material)])},$)`);
  const shape = step.add(`IFCPRODUCTDEFINITIONSHAPE($,$,${toList([representation])})`);
  const placement = geometry.localPlacement(
    tree.storeyPlacement, geometry.axisPlacement(part.origin, part.extrusionAxis, part.profileAxis));
  const element = step.add(
    `${part.ifcClass.toUpperCase()}(${globalId()},$,${quote(part.name)},$,$,${placement},${shape},$,.${part.predefinedType}.)`);
  if (part.material) materials.associate(part.material, element);
  writePropertySets(step, element, part.propertySets);
  return element;
}

function assertMaterial(part) {
  const { material } = part;
  if (material === undefined) return;
  const validColour = Array.isArray(material.color) && material.color.length === 3
    && material.color.every((channel) => channel >= 0 && channel <= 1);
  if (!material.name || !validColour) throw new Error(`Invalid material in part "${part.name}"`);
}

function assertModel(model) {
  if (!model?.name) throw new Error('IFC model needs a name');
  if (!Array.isArray(model.parts) || model.parts.length === 0) {
    throw new Error('IFC model needs at least one part');
  }
  for (const part of model.parts) {
    assertMaterial(part);
    if (!SUPPORTED_ELEMENT_CLASSES.includes(part.ifcClass)) {
      throw new Error(`Unsupported IFC class "${part.ifcClass}" in part "${part.name}"`);
    }
  }
}

/** Builds the IFC4 file content (STEP text) for a model. */
export function buildIfc(model) {
  assertModel(model);
  const step = new StepBuilder();
  const geometry = createGeometryWriters(step);
  const tree = writeSpatialTree(step, geometry, model.name);

  const materials = createMaterialWriter(step, tree.bodyContext);
  const elements = model.parts.map((part) => writePart(step, geometry, tree, materials, part));
  materials.writeAssociations();

  const assemblyPlacement = geometry.localPlacement(tree.storeyPlacement, geometry.worldPlacement());
  const assembly = step.add(
    `${ASSEMBLY_CLASS.toUpperCase()}(${globalId()},$,${quote(model.name)},$,${quote(model.objectType ?? model.name)},${assemblyPlacement},$,$,.USERDEFINED.)`);
  step.add(`IFCRELAGGREGATES(${globalId()},$,$,$,${assembly},${toList(elements)})`);
  step.add(`IFCRELCONTAINEDINSPATIALSTRUCTURE(${globalId()},$,$,$,${toList([assembly])},${tree.storey})`);
  writePropertySets(step, assembly, model.propertySets);

  const timestamp = new Date().toISOString().slice(0, 19);
  return [
    'ISO-10303-21;', 'HEADER;',
    "FILE_DESCRIPTION(('ViewDefinition [ReferenceView_V1.2]'),'2;1');",
    `FILE_NAME('model.ifc','${timestamp}',(''),(''),'','ifc-bim-families','');`,
    "FILE_SCHEMA(('IFC4'));", 'ENDSEC;', 'DATA;',
    ...step.lines,
    'ENDSEC;', 'END-ISO-10303-21;',
  ].join('\n');
}
