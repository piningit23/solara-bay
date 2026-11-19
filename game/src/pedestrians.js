// Pedestrians walking the sidewalks. They flee when a shot is fired or a
// car comes at them, and a hit pedestrian raises the wanted level.

import { WORLD } from './config.js';
import { mulberry32, pick, range } from './random.js';
import { makePerson } from './models.js';

const SHIRT_COLORS = [0xe74c3c, 0x3498db, 0x2ecc71, 0xf1c40f, 0x9b59b6, 0x1abc9c, 0xecf0f1];

export function spawnPedestrians(THREE, G, count) {
  const rand = mulberry32(G.seed + 31);
  for (let i = 0; i < count; i++) {
    const mesh = makePerson(THREE, pick(rand, SHIRT_COLORS));
    const street = pick(rand, WORLD.streets);
    const along = range(rand, -180, 180);
    const side = rand() > 0.5;
    const ped = {
      mesh,
      street,
      along,
      side,
      dir: rand() > 0.5 ? 1 : -1,
      speed: range(rand, 1.2, 2.4),
      flee: 0,
      walkPhase: rand() * Math.PI * 2,
    };
    mesh.position.set(side ? street + 7.5 : along, 0, side ? along : street + 7.5);
    G.scene.add(mesh);
    G.peds.push(ped);
  }
}

export function updatePedestrians(G, dt, danger) {
  for (const ped of G.peds) {
    const dx = ped.mesh.position.x - G.player.x;
    const dz = ped.mesh.position.z - G.player.z;
    const distPlayer = Math.hypot(dx, dz);
    if (danger || distPlayer < 6) ped.flee = 1.2;
    if (ped.flee > 0) {
      ped.flee -= dt;
      const away = Math.atan2(dx, dz);
      ped.mesh.position.x += Math.sin(away) * 5.5 * dt;
      ped.mesh.position.z += Math.cos(away) * 5.5 * dt;
      ped.mesh.rotation.y = away;
    } else {
      ped.along += ped.speed * ped.dir * dt;
      if (ped.along > 195) { ped.along = -195; ped.dir = 1; }
      if (ped.along < -195) { ped.along = 195; ped.dir = -1; }
      if (ped.side) {
        ped.mesh.position.set(ped.street + 7.5, 0, ped.along);
        ped.mesh.rotation.y = ped.dir > 0 ? 0 : Math.PI;
      } else {
        ped.mesh.position.set(ped.along, 0, ped.street + 7.5);
        ped.mesh.rotation.y = ped.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
      }
    }
    // Simple walk bob.
    ped.walkPhase += dt * 6;
    ped.mesh.position.y = Math.abs(Math.sin(ped.walkPhase)) * 0.06;
    // A car hitting a pedestrian is a crime.
    if (G.car && !ped.flee) {
      const d = Math.hypot(ped.mesh.position.x - G.car.x, ped.mesh.position.z - G.car.z);
      if (d < 2.4 && Math.abs(G.car.speed) > 4) {
        ped.flee = 2;
        G.wanted = Math.min(5, G.wanted + 1);
        G.toast = 'Pedestrian hit! Wanted up.';
        G.toastUntil = G.time + 2;
      }
    }
  }
}
