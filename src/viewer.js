import * as THREE from 'three';
import { OrbitControls } from '../vendor/OrbitControls.js';

/* Visor 3D (Z arriba, metros). Dibuja las mismas piezas que se exportan a IFC. */
export function createViewer(container) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
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
  grid.material.transparent = true; grid.material.opacity = 0.35;
  scene.add(grid);

  const group = new THREE.Group();
  scene.add(group);
  let box = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3(1, 1, 1));
  let first = true;

  const COLORS = { estructura: 0x7d8794, lama: 0x2f7de1 };
  const geos = new Map();

  function clear() {
    group.children.slice().forEach((o) => { o.traverse((c) => { if (c.material) c.material.dispose(); }); group.remove(o); });
    geos.forEach((g) => g.dispose()); geos.clear();
  }

  function setParts(parts) {
    clear();
    parts.forEach((q) => {
      const key = `${q.profile.dx}|${q.profile.dy}|${q.len}`;
      let g = geos.get(key);
      if (!g) { g = new THREE.BoxGeometry(q.profile.dx, q.profile.dy, q.len); geos.set(key, g); }
      const mat = new THREE.MeshStandardMaterial({ color: COLORS[q.kind] || 0xaaaaaa, roughness: 0.6, metalness: 0.1 });
      const mesh = new THREE.Mesh(g, mat);
      const x = new THREE.Vector3(...q.x).normalize(), z = new THREE.Vector3(...q.z).normalize();
      const y = new THREE.Vector3().crossVectors(z, x);
      mesh.matrixAutoUpdate = false;
      mesh.matrix.makeBasis(x, y, z);
      mesh.matrix.setPosition(new THREE.Vector3(...q.o).addScaledVector(z, q.len / 2));
      const edges = new THREE.LineSegments(new THREE.EdgesGeometry(g), new THREE.LineBasicMaterial({ color: 0x1d2330, transparent: true, opacity: 0.45 }));
      edges.matrixAutoUpdate = false; edges.matrix.copy(mesh.matrix);
      group.add(mesh, edges);
    });
    box = new THREE.Box3().setFromObject(group);
    if (first && parts.length) { view('iso'); first = false; }
  }

  function view(name) {
    const c = box.getCenter(new THREE.Vector3()), s = box.getSize(new THREE.Vector3());
    const r = Math.max(s.x, s.y, s.z) * 1.9 + 1;
    const d = { iso: [1, -1.1, 0.8], planta: [0, -0.001, 1], frontal: [0, -1, 0.12], lateral: [1, 0, 0.12] }[name];
    const v = new THREE.Vector3(...d).normalize().multiplyScalar(r);
    camera.position.copy(c).add(v);
    controls.target.copy(c);
    controls.update();
  }

  function resize() {
    const w = container.clientWidth, h = container.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(container);
  resize();
  renderer.setAnimationLoop(() => { controls.update(); renderer.render(scene, camera); });

  return { setParts, view };
}
