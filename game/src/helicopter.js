// Solara Bay — police helicopter. Spawns at 3+ wanted stars, circles above
// the player, shines a visible spotlight cone, plays rotor sound, and shows
// as an "H" marker on the minimap. Despawns below 3 stars.

import * as THREE from 'three';
import { G } from './state.js';
import { makeHelicopterMesh } from './models.js';
import { setRotor } from './audio.js';
import { carPos } from './driving.js';

export function spawnHelicopter(scene) {
  if (G.heli) return G.heli;
  const mesh = makeHelicopterMesh();
  const pp = carPos();
  mesh.position.set(pp.x + 20, 32, pp.z - 20);
  scene.add(mesh);
  G.heli = { mesh, pos: mesh.position, angle: 0, yaw: 0 };
  setRotor(true);
  G.messages.push('POLICE HELICOPTER overhead!');
  return G.heli;
}

export function despawnHelicopter() {
  if (!G.heli) return;
  G.scene.remove(G.heli.mesh);
  G.heli = null;
  setRotor(false);
}

export function updateHelicopter(dt) {
  const h = G.heli;
  if (!h) return;
  if (h.mesh.userData.rotor) h.mesh.userData.rotor.rotation.y += dt * 22;
  if (G.heliFrozen) return;
  const pp = carPos();
  h.angle += dt * 0.45;
  const radius = 22;
  const tx = pp.x + Math.cos(h.angle) * radius;
  const tz = pp.z + Math.sin(h.angle) * radius;
  h.pos.x += (tx - h.pos.x) * Math.min(1, dt * 1.5);
  h.pos.z += (tz - h.pos.z) * Math.min(1, dt * 1.5);
  h.pos.y = 30 + Math.sin(G.time * 0.8) * 2;
  h.yaw = Math.atan2(pp.x - h.pos.x, pp.z - h.pos.z);
  h.mesh.rotation.y = h.yaw;
  // keep the spotlight cone pointing at the player
  if (h.mesh.userData.cone) {
    h.mesh.userData.cone.position.set(0, -11, 0);
  }
}
