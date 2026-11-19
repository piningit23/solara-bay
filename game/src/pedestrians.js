// Solara Bay — pedestrians: sidewalk walkers who stroll, wait at corners,
// and flee when a shot is fired or a car comes at them.

import * as THREE from 'three';
import { G } from './state.js';
import { makePersonMesh } from './models.js';
import { roadCoords, clampToIsland } from './world.js';
import { carPos } from './driving.js';

const SHIRTS = [0xd23c2e, 0x2e7dd2, 0xe8b93c, 0x3cb371, 0x8e44ad, 0xe8e8e8, 0xff7f2a, 0x5a9e9e];

export function spawnPedestrians(scene, count, rng) {
  const cs = roadCoords();
  for (let i = 0; i < count; i++) {
    const road = cs[Math.floor(rng() * cs.length)];
    const along = (rng() * 2 - 1) * 180;
    const mesh = makePersonMesh(SHIRTS[i % SHIRTS.length], 0x2a2a33);
    const pos = new THREE.Vector3(
      rng() < 0.5 ? along : road + 9 + rng() * 2,
      0.3,
      rng() < 0.5 ? road + 9 + rng() * 2 : along);
    // simpler: place on a sidewalk offset from a road
    pos.set(along, 0.3, road + 9);
    mesh.position.copy(pos);
    scene.add(mesh);
    G.peds.push({
      mesh, pos, yaw: rng() * Math.PI * 2, speed: 1.2 + rng() * 1.2,
      fleeing: 0, pause: rng() * 3, dir: rng() < 0.5 ? 1 : -1, alongX: rng() < 0.5,
    });
  }
}

export function scarePedestrians(x, z, radius) {
  for (const p of G.peds) {
    const d = Math.hypot(p.pos.x - x, p.pos.z - z);
    if (d < radius) {
      p.fleeing = 2.5;
      p.yaw = Math.atan2(p.pos.x - x, p.pos.z - z);
    }
  }
}

export function updatePedestrians(dt) {
  const pp = carPos();
  const drivingFast = G.car && Math.abs(G.car.speed) > 8;
  for (const p of G.peds) {
    const dPlayer = Math.hypot(p.pos.x - pp.x, p.pos.z - pp.z);
    if (drivingFast && dPlayer < 8) {
      p.fleeing = 2;
      p.yaw = Math.atan2(p.pos.x - pp.x, p.pos.z - pp.z);
    }
    if (p.fleeing > 0) {
      p.fleeing -= dt;
      p.pos.x += Math.sin(p.yaw) * 5 * dt;
      p.pos.z += Math.cos(p.yaw) * 5 * dt;
    } else if (p.pause > 0) {
      p.pause -= dt;
    } else {
      if (p.alongX) p.pos.x += p.dir * p.speed * dt;
      else p.pos.z += p.dir * p.speed * dt;
      if (Math.random() < dt * 0.05) { p.pause = 1 + Math.random() * 2; p.dir *= -1; }
    }
    const cl = clampToIsland(p.pos.x, p.pos.z, 2);
    p.pos.x = cl.x; p.pos.z = cl.z;
    p.mesh.position.copy(p.pos);
    p.mesh.rotation.y = p.yaw;
    p.mesh.position.y = 0.3 + Math.abs(Math.sin(G.time * 8 + p.pos.x)) * 0.05;
  }
}
