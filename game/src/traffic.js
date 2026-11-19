// Traffic: cars that drive the road network, lane-following, stopping at
// junctions and steering around the player crudely.

import { WORLD } from './config.js';
import { mulberry32, pick, range } from './random.js';
import { makeCar } from './models.js';
import { nearestStreet } from './world.js';

const TRAFFIC_COLORS = [0xd64545, 0x3f6fb5, 0xe0e0e0, 0x3a3a3a, 0x7a9e4f, 0xd9a066, 0x8e44ad];

export function spawnTraffic(THREE, G, count) {
  const rand = mulberry32(G.seed + 77);
  for (let i = 0; i < count; i++) {
    const color = pick(rand, TRAFFIC_COLORS);
    const mesh = makeCar(THREE, color);
    const horizontal = rand() > 0.5;
    const street = pick(rand, WORLD.streets);
    const along = range(rand, -180, 180);
    const lane = rand() > 0.5 ? 2.2 : -2.2;
    const car = {
      mesh,
      horizontal,
      street,
      along,
      lane,
      speed: range(rand, 7, 12),
      dir: rand() > 0.5 ? 1 : -1,
      stopped: 0,
    };
    mesh.position.set(
      horizontal ? along : street + lane,
      0,
      horizontal ? street + lane : along,
    );
    mesh.rotation.y = horizontal ? (car.dir > 0 ? Math.PI / 2 : -Math.PI / 2) : (car.dir > 0 ? 0 : Math.PI);
    G.scene.add(mesh);
    G.traffic.push(car);
  }
}

export function updateTraffic(G, dt) {
  const px = G.player.x;
  const pz = G.player.z;
  for (const car of G.traffic) {
    // Stop at junctions when another car is close ahead, and yield to the player.
    let blocked = false;
    const aheadX = car.horizontal ? car.mesh.position.x + car.dir * 8 : car.mesh.position.x;
    const aheadZ = car.horizontal ? car.mesh.position.z : car.mesh.position.z + car.dir * 8;
    if (Math.hypot(aheadX - px, aheadZ - pz) < 7) blocked = true;
    for (const other of G.traffic) {
      if (other === car) continue;
      const d = Math.hypot(other.mesh.position.x - aheadX, other.mesh.position.z - aheadZ);
      if (d < 7) { blocked = true; break; }
    }
    if (blocked) {
      car.stopped += dt;
    } else {
      car.stopped = 0;
      car.along += car.speed * car.dir * dt;
      if (car.along > 195) car.along = -195;
      if (car.along < -195) car.along = 195;
    }
    // Keep the mesh on its lane.
    if (car.horizontal) {
      car.mesh.position.set(car.along, 0, car.street + car.lane);
      car.mesh.rotation.y = car.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
    } else {
      car.mesh.position.set(car.street + car.lane, 0, car.along);
      car.mesh.rotation.y = car.dir > 0 ? 0 : Math.PI;
    }
    // Junction slow-down: ease off near crossings so traffic reads as careful.
    const nearCross = Math.abs(nearestStreet(car.horizontal ? car.mesh.position.x : car.mesh.position.z)
      - (car.horizontal ? car.mesh.position.x : car.mesh.position.z)) < 6;
    car.mesh.position.y = nearCross ? 0 : 0;
  }
}
