import * as THREE from 'three';
import { CITY, COLORS } from './config.js';
import { seeded, pick } from './random.js';

function mesh(geometry, color, y = 0) { const object = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color, roughness: .82 })); object.position.y = y; return object; }
function box(scene, x, z, w, h, d, color) { const object = mesh(new THREE.BoxGeometry(w, h, d), color, h / 2); object.position.x = x; object.position.z = z; scene.add(object); return object; }
export function buildCity(scene) {
  scene.background = new THREE.Color(COLORS.sky); scene.fog = new THREE.Fog(COLORS.sky, 75, 210);
  scene.add(new THREE.HemisphereLight(0xfff2c5, 0x3b6670, 2.3)); const sun = new THREE.DirectionalLight(0xffe2a5, 3); sun.position.set(-60, 100, 40); scene.add(sun);
  scene.add(mesh(new THREE.PlaneGeometry(220, 220), COLORS.sand)); scene.children.at(-1).rotation.x = -Math.PI / 2;
  box(scene, 0, -96, 220, 1, 30, COLORS.ocean); box(scene, 0, 82, 220, .5, 7, 0xd7c37d);
  for (const x of CITY.blocks) { box(scene, x, 0, 7, .14, 150, COLORS.asphalt); box(scene, 0, x, 150, .14, 7, COLORS.asphalt); }
  const random = seeded(22); const facade = [0xf07861, 0xe0b65b, 0x71a8aa, 0xc57b91, 0x7890a5, 0xe2d4a5];
  for (const x of [-75, -45, -15, 15, 45, 75]) for (const z of [-75, -45, -15, 15, 45, 75]) { if (Math.abs(x) > 68 || Math.abs(z) > 68) continue; const h = 5 + random() * 13; box(scene, x + (random() - .5) * 8, z + (random() - .5) * 8, 16 + random() * 7, h, 16 + random() * 7, pick(random, facade)); }
  for (let i = 0; i < 24; i++) { const x = -82 + (i % 8) * 23; const z = i < 8 ? 68 : i < 16 ? -68 : -82 + (i - 16) * 23; const trunk = box(scene, x, z, 1, 5, 1, 0x805832); const crown = mesh(new THREE.ConeGeometry(3.5, 8, 7), 0x2d805c, 9); crown.position.x = x; crown.position.z = z; scene.add(crown); } 
  const sign = box(scene, -60, 60, 16, 5, 2, COLORS.neon); sign.material.emissive.setHex(0x7b4800); return scene;
}
export function makeCar(color = 0xd95842, police = false) { const group = new THREE.Group(); const body = mesh(new THREE.BoxGeometry(4.2, 1.1, 7), color, 1.1); group.add(body); const roof = mesh(new THREE.BoxGeometry(3.3, 1.1, 3.3), police ? 0xedf3f0 : 0x263b43, 2.1); roof.position.z = -.3; group.add(roof); for (const x of [-2, 2]) for (const z of [-2.3, 2.3]) { const wheel = mesh(new THREE.CylinderGeometry(.65, .65, .35, 12), 0x111518, .65); wheel.rotation.z = Math.PI / 2; wheel.position.x = x; wheel.position.z = z; group.add(wheel); } if (police) { const light = mesh(new THREE.BoxGeometry(1.5, .35, .5), 0xef544f, 2.8); group.add(light); } return group; }
export function distance(a, b) { return Math.hypot(a.x - b.x, a.z - b.z); }
