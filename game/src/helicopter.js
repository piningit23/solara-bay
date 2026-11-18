import * as THREE from 'three';
import { box, cylinder, material } from './models.js';

export function createHelicopter(scene) {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  box(body, 0, 0, 0, 2.4, 1.7, 4.8, '#e9d8a5');
  box(body, 0, .12, 1.65, 2.12, 1.16, 1.45, '#3e7480', { metalness: .35 });
  box(body, 0, 1.05, -2.6, .34, .3, 5.2, '#e9d8a5');
  box(body, 0, 1.18, -5.1, 2.2, .22, .35, '#e9d8a5');
  cylinder(body, 0, 1.04, -5.1, .14, .14, .42, '#263e43', 8).rotation.z = Math.PI / 2;
  const mast = cylinder(body, 0, 1.15, 0, .12, .12, .5, '#283f41');
  mast.position.y = 1.1;
  const rotor = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const blade = box(rotor, 0, 0, 0, .2, .08, 11.5, '#263f44');
    blade.rotation.y = i * Math.PI / 2;
  }
  rotor.position.y = 1.55;
  body.add(rotor);
  const tailRotor = new THREE.Group();
  for (let i = 0; i < 3; i++) { const blade = box(tailRotor, 0, 0, 0, .15, .08, 2.2, '#263f44'); blade.rotation.y = i * Math.PI / 3; }
  tailRotor.position.set(0, 1.25, -5.1);
  body.add(tailRotor);
  const beam = new THREE.Mesh(new THREE.ConeGeometry(8, 35, 20, 1, true), new THREE.MeshBasicMaterial({ color: '#fff0a4', transparent: true, opacity: .14, side: THREE.DoubleSide, depthWrite: false }));
  beam.position.set(0, -18, 0);
  beam.rotation.x = Math.PI;
  root.add(beam);
  const groundLight = new THREE.PointLight('#ffe89a', 0, 54, 2);
  groundLight.position.y = -33;
  root.add(groundLight);
  root.visible = false;
  scene.add(root);
  return { active: false, root, rotor, tailRotor, groundLight, phase: 0, update(dt, state) {
    const active = state.wanted >= 3;
    this.active = active;
    root.visible = active;
    if (!active) return;
    const target = state.player.car || state.player;
    this.phase += dt * .23;
    const orbitX = Math.sin(this.phase) * 31;
    const orbitZ = Math.cos(this.phase) * 31;
    root.position.x += (target.x + orbitX - root.position.x) * Math.min(1, dt * 1.7);
    root.position.z += (target.z + orbitZ - root.position.z) * Math.min(1, dt * 1.7);
    root.position.y = 30 + Math.sin(state.time * 1.5) * 1.4;
    root.rotation.y = Math.atan2(-orbitZ, -orbitX);
    rotor.rotation.y += dt * 42;
    tailRotor.rotation.z += dt * 40;
    groundLight.intensity = 13 + Math.sin(state.time * 7) * 4;
    const targetPoint = new THREE.Vector3(target.x, 0, target.z);
    beam.lookAt(root.worldToLocal(targetPoint.clone()));
  } };
}
