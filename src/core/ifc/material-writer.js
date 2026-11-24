import { formatReal, quote, toList, createGuid } from './step.js';

const globalId = () => quote(createGuid());

/**
 * Writes IfcMaterial entities with a surface style. Materials are shared by name, so every part
 * with the same material points at one IfcMaterial. Returns:
 *   styleFor(material)       the IfcSurfaceStyle to attach to a part's solid (shows colour in viewers)
 *   associate(material, el)  records that an element uses the material
 *   writeAssociations()      writes one IfcRelAssociatesMaterial per material
 */
export function createMaterialWriter(step, bodyContext) {
  const written = new Map();

  function write(material) {
    const [red, green, blue] = material.color;
    const colour = step.add(`IFCCOLOURRGB($,${formatReal(red)},${formatReal(green)},${formatReal(blue)})`);
    const rendering = step.add(
      `IFCSURFACESTYLERENDERING(${colour},${formatReal(material.transparency ?? 0)},$,$,$,$,$,$,.NOTDEFINED.)`);
    const style = step.add(`IFCSURFACESTYLE(${quote(material.name)},.BOTH.,${toList([rendering])})`);
    const reference = step.add(
      `IFCMATERIAL(${quote(material.name)},$,${material.category ? quote(material.category) : '$'})`);
    // Material-level style: this is where Revit reads the material colour.
    const styledItem = step.add(`IFCSTYLEDITEM($,${toList([style])},$)`);
    const styledRepresentation = step.add(
      `IFCSTYLEDREPRESENTATION(${bodyContext},'Style','Material',${toList([styledItem])})`);
    step.add(`IFCMATERIALDEFINITIONREPRESENTATION($,$,${toList([styledRepresentation])},${reference})`);
    return { reference, style, elements: [] };
  }

  const entry = (material) => {
    if (!written.has(material.name)) written.set(material.name, write(material));
    return written.get(material.name);
  };

  return {
    styleFor: (material) => entry(material).style,
    associate: (material, element) => entry(material).elements.push(element),
    writeAssociations() {
      for (const { reference, elements } of written.values()) {
        step.add(`IFCRELASSOCIATESMATERIAL(${globalId()},$,$,$,${toList(elements)},${reference})`);
      }
    },
  };
}
