import * as THREE from 'three';
import { OrbitControls } from '../../vendor/OrbitControls.js';
import { localFrame } from '../core/geometry/frame.js';
import { createDimensions, disposeDimensions } from './dimensions.js';
import { createPartGeometry, partGeometryKey } from './part-geometry.js';

const ROLE_COLORS = Object.freeze({
  structure: 0x7d8794,
  operable: 0x2f7de1,
  finish: 0xc9b08a,
  service: 0x2fa36b,
});
const DEFAULT_COLOR = 0xaaaaaa;
const VIEW_DIRECTIONS = Object.freeze({
  isometric: [1, -1.1, 0.8],
  top: [0, -0.001, 1],
  front: [0, -1, 0.12],
  side: [1, 0, 0.12],
});

/** 3D viewer (Z up, metres). It draws the same parts that the IFC writer exports. */
export function createViewer(container) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.05, 500);
  camera.up.set(0, 0, 1);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  scene.add(new THREE.HemisphereLight(0xffffff, 0x8890a0, 1.1));
  const sun = new THREE.DirectionalLight(0xffffff, 1.4);
  sun.position.set(6, -8, 12);
  scene.add(sun);

  const grid = new THREE.GridHelper(30, 30, 0x889099, 0xbfc5cc);
  grid.rotation.x = Math.PI / 2;
  grid.material.transparent = true;
  grid.material.opacity = 0.35;
  scene.add(grid);

  const modelGroup = new THREE.Group();
  scene.add(modelGroup);
  let dimensionGroup;
  let dimensionsVisible = true;
  const geometryCache = new Map();
  let bounds = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3(1, 1, 1));
  let framed = false;

  function clearModel() {
    modelGroup.children.slice().forEach((object) => {
      object.traverse((child) => child.material?.dispose());
      modelGroup.remove(object);
    });
    geometryCache.forEach((geometry) => geometry.dispose());
    geometryCache.clear();
  }

  function cachedGeometry(part) {
    const key = partGeometryKey(part);
    if (!geometryCache.has(key)) geometryCache.set(key, createPartGeometry(part));
    return geometryCache.get(key);
  }

  function createPartObjects(part) {
    const geometry = cachedGeometry(part);
    const { x, y, z } = localFrame(part.extrusionAxis, part.profileAxis);
    const matrix = new THREE.Matrix4().makeBasis(
      new THREE.Vector3(...x), new THREE.Vector3(...y), new THREE.Vector3(...z));
    matrix.setPosition(new THREE.Vector3(...part.origin).addScaledVector(new THREE.Vector3(...z), part.length / 2));

    const material = new THREE.MeshStandardMaterial({
      color: ROLE_COLORS[part.role] ?? DEFAULT_COLOR, roughness: 0.6, metalness: 0.1,
    });
    const mesh = new THREE.Mesh(geometry, material);
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(geometry),
      new THREE.LineBasicMaterial({ color: 0x1d2330, transparent: true, opacity: 0.45 }));
    for (const object of [mesh, edges]) {
      object.matrixAutoUpdate = false;
      object.matrix.copy(matrix);
    }
    return [mesh, edges];
  }

  function setParts(parts) {
    clearModel();
    parts.forEach((part) => modelGroup.add(...createPartObjects(part)));
    bounds = new THREE.Box3().setFromObject(modelGroup);
    rebuildDimensions();
    if (!framed && parts.length > 0) {
      setView('isometric');
      framed = true;
    }
  }

  function rebuildDimensions() {
    if (dimensionGroup) {
      scene.remove(dimensionGroup);
      disposeDimensions(dimensionGroup);
    }
    dimensionGroup = createDimensions(bounds);
    dimensionGroup.visible = dimensionsVisible;
    scene.add(dimensionGroup);
  }

  function setDimensionsVisible(visible) {
    dimensionsVisible = visible;
    if (dimensionGroup) dimensionGroup.visible = visible;
  }

  function setView(name) {
    const center = bounds.getCenter(new THREE.Vector3());
    const size = bounds.getSize(new THREE.Vector3());
    const distance = Math.max(size.x, size.y, size.z) * 1.9 + 1;
    const offset = new THREE.Vector3(...VIEW_DIRECTIONS[name]).normalize().multiplyScalar(distance);
    camera.position.copy(center).add(offset);
    controls.target.copy(center);
    controls.update();
  }

  function resize() {
    const { clientWidth: width, clientHeight: height } = container;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(container);
  resize();
  renderer.setAnimationLoop(() => {
    controls.update();
    renderer.render(scene, camera);
  });

  return { setParts, setView, setDimensionsVisible };
}
