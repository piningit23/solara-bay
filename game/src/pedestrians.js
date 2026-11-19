// Solara Bay — pedestrians walking the sidewalks, fleeing from danger.

import * as THREE from 'three';
import { mulberry32, pick, range } from './random.js';
import { makePersonMesh } from './models.js';

const SHIRTS = [0xe74c3c, 0x3498db, 0x2ecc71, 0xf39c12, 0x9b59b6, 0x1abc9c, 0xecf0f1, 0x34495e];
const SKINS = [0xd9a066, 0xb57a4a, 0x8a5a30, 0xe8b88a, 0x6b4226];

export function createPedestrians(scene, count) {
  const rand = mulberry32(4242);
  const people = [];
  for (let i = 0; i < count; i++) {
    const mesh = makePersonMesh(pick(rand, SHIRTS), pick(rand, SKINS));
    const horizontal = rand() < 0.5;
    const road = Math.floor(range(rand, -5, 5)) * 30;
    const along = range(rand, -145, 145);
    const side = rand() < 0.5 ? 6.2 : -6.2;
    const p = {
      mesh,
      horizontal,
      road,
      along,
      side,
      dir: rand() < 0.5 ? 1 : -1,
      speed: range(rand, 1.2, 2.4),
      fleeing: false,
      fleeTimer: 0,
    };
    mesh.position.set(horizontal ? along : road + side, 0, horizontal ? road + side : along);
    scene.add(mesh);
    people.push(p);
  }
  return { people };
}

export function updatePedestrians(peds, dt, dangerPos, dangerRadius) {
  for (const p of peds.people) {
    const dx = p.mesh.position.x - dangerPos.x;
    const dz = p.mesh.position.z - dangerPos.z;
    const dist = Math.hypot(dx, dz);
    if (dist < dangerRadius) {
      p.fleeing = true;
      p.fleeTimer = 2.5;
    }
    if (p.fleeTimer > 0) p.fleeTimer -= dt;
    else p.fleeing = false;
    const speed = p.fleeing ? p.speed * 3.2 : p.speed;
    p.along += p.dir * speed * dt;
    if (p.along > 152) { p.along = 152; p.dir = -1; }
    if (p.along < -152) { p.along = -152; p.dir = 1; }
    if (p.horizontal) {
      p.mesh.position.x = p.along;
      p.mesh.position.z = p.road + p.side;
      p.mesh.rotation.y = p.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
    } else {
      p.mesh.position.z = p.along;
      p.mesh.position.x = p.road + p.side;
      p.mesh.rotation.y = p.dir > 0 ? 0 : Math.PI;
    }
    // walk bob
    const t = performance.now() / 120;
    const legL = p.mesh.getObjectByName('legL');
    const legR = p.mesh.getObjectByName('legR');
    if (legL && legR) {
      legL.rotation.x = Math.sin(t + p.along) * 0.5;
      legR.rotation.x = -Math.sin(t + p.along) * 0.5;
    }
  }
}

export function nearestPedestrian(peds, x, z, radius) {
  let best = null;
  let bestD = radius;
  for (const p of peds.people) {
    const d = Math.hypot(p.mesh.position.x - x, p.mesh.position.z - z);
    if (d < bestD) { bestD = d; best = p; }
  }
  return best;
}
