// Solara Bay — crew ally Dante Reyes. During crew missions (9 and 12) he
// follows the player in his own car, rams chasing police, and shoots at
// enemies on foot. Minimap marker "D", HUD indicator "DANTE — CREW".

import * as THREE from 'three';
import { G } from './state.js';
import { makeCarMesh, makePersonMesh } from './models.js';
import { carPos } from './driving.js';

export function spawnCrew(scene) {
  if (G.crew) return G.crew;
  const pp = carPos();
  const mesh = makeCarMesh(0x8e44ad, 'sport');
  mesh.position.set(pp.x + 6, 0.3, pp.z + 6);
  scene.add(mesh);
  // Dante himself, standing in the car seat area, visible on foot moments
  const dante = makePersonMesh(0x8e44ad, 0x222222);
  dante.position.set(pp.x + 6, 0.3, pp.z + 6);
  dante.visible = false;
  scene.add(dante);
  G.crew = {
    mesh, danteMesh: dante, pos: mesh.position, yaw: 0, speed: 0,
    name: 'Dante Reyes', active: true, shootTimer: 0,
  };
  G.messages.push('DANTE REYES joined your crew.');
  return G.crew;
}

export function despawnCrew() {
  if (!G.crew) return;
  G.scene.remove(G.crew.mesh);
  G.scene.remove(G.crew.danteMesh);
  G.crew = null;
}

export function updateCrew(dt) {
  const c = G.crew;
  if (!c || !c.active) return;
  const pp = carPos();
  const dx = pp.x - c.pos.x;
  const dz = pp.z - c.pos.z;
  const dist = Math.hypot(dx, dz);
  // follow at ~10 units behind the player
  if (dist > 12) {
    const targetYaw = Math.atan2(dx, dz);
    let dy = targetYaw - c.yaw;
    while (dy > Math.PI) dy -= Math.PI * 2;
    while (dy < -Math.PI) dy += Math.PI * 2;
    c.yaw += Math.max(-2.6 * dt, Math.min(2.6 * dt, dy));
    c.speed = Math.min(30, c.speed + 16 * dt);
  } else {
    c.speed = Math.max(0, c.speed - 20 * dt);
  }
  c.pos.x += Math.sin(c.yaw) * c.speed * dt;
  c.pos.z += Math.cos(c.yaw) * c.speed * dt;
  c.mesh.position.copy(c.pos);
  c.mesh.rotation.y = c.yaw;

  // ram the nearest chasing police car
  for (const cop of G.police) {
    const d = Math.hypot(cop.pos.x - c.pos.x, cop.pos.z - c.pos.z);
    if (d < 4) {
      cop.speed *= 0.3;
      cop.pos.x += Math.sin(c.yaw) * 6 * dt;
      cop.pos.z += Math.cos(c.yaw) * 6 * dt;
      G.shake = Math.min(0.5, G.shake + 0.15);
    }
  }
  // shoot at nearby mission enemies
  c.shootTimer -= dt;
  if (c.shootTimer <= 0 && G.enemies.length > 0) {
    const e = G.enemies[0];
    const d = Math.hypot(e.pos.x - c.pos.x, e.pos.z - c.pos.z);
    if (d < 45) {
      e.hp -= 12;
      c.shootTimer = 0.5;
      if (e.hp <= 0) {
        G.scene.remove(e.mesh);
        G.enemies.splice(G.enemies.indexOf(e), 1);
        G.stats.takedowns++;
      }
    }
  }
}
