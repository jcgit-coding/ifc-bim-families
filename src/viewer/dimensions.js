import * as THREE from 'three';
import { MM_PER_METRE } from '../core/units.js';

const LINE_COLOR = 0xe5484d;
const LABEL_FONT = 'bold 44px system-ui, sans-serif';
const LABEL_CANVAS = { width: 256, height: 64 };
const OFFSET_RATIO = 0.12;
const LABEL_HEIGHT_RATIO = 0.05;

function createLabel(text, height) {
  const canvas = document.createElement('canvas');
  canvas.width = LABEL_CANVAS.width;
  canvas.height = LABEL_CANVAS.height;
  const context = canvas.getContext('2d');
  context.fillStyle = 'rgba(255,255,255,0.92)';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#b42318';
  context.font = LABEL_FONT;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(text, canvas.width / 2, canvas.height / 2);
  const material = new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas), depthTest: false });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(height * (canvas.width / canvas.height), height, 1);
  sprite.renderOrder = 10;
  return sprite;
}

function createLine(points) {
  const material = new THREE.LineBasicMaterial({ color: LINE_COLOR, depthTest: false });
  const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), material);
  line.renderOrder = 9;
  return line;
}

/** One dimension: a line between two points, extension lines from the model and a label in mm. */
function createDimension(modelStart, modelEnd, lineStart, lineEnd, labelHeight) {
  const group = new THREE.Group();
  group.add(createLine([lineStart, lineEnd]));
  group.add(createLine([modelStart, lineStart]));
  group.add(createLine([modelEnd, lineEnd]));
  const millimetres = Math.round(modelStart.distanceTo(modelEnd) * MM_PER_METRE);
  const label = createLabel(`${millimetres} mm`, labelHeight);
  label.position.copy(lineStart).add(lineEnd).multiplyScalar(0.5);
  group.add(label);
  return group;
}

/** Builds overall width (X), depth (Y) and height (Z) dimensions around a bounding box. */
export function createDimensions(bounds) {
  const group = new THREE.Group();
  const { min, max } = bounds;
  const size = bounds.getSize(new THREE.Vector3());
  const offset = Math.max(size.x, size.y, size.z) * OFFSET_RATIO;
  const labelHeight = Math.max(size.x, size.y, size.z) * LABEL_HEIGHT_RATIO;
  const v = (x, y, z) => new THREE.Vector3(x, y, z);

  group.add(createDimension(
    v(min.x, min.y, min.z), v(max.x, min.y, min.z),
    v(min.x, min.y - offset, min.z), v(max.x, min.y - offset, min.z), labelHeight));
  group.add(createDimension(
    v(max.x, min.y, min.z), v(max.x, max.y, min.z),
    v(max.x + offset, min.y, min.z), v(max.x + offset, max.y, min.z), labelHeight));
  group.add(createDimension(
    v(min.x, min.y, min.z), v(min.x, min.y, max.z),
    v(min.x - offset, min.y - offset, min.z), v(min.x - offset, min.y - offset, max.z), labelHeight));
  return group;
}

/** Releases GPU resources held by a dimension group. */
export function disposeDimensions(group) {
  group.traverse((object) => {
    object.geometry?.dispose();
    object.material?.map?.dispose();
    object.material?.dispose();
  });
}
