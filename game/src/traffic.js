// Solara Bay — traffic: cars that follow the road network, stop at
// junctions, and brake crudely for the player and for cars ahead.

import * as THREE from 'three';
import { G } from './state.js';
import { makeCarMesh, carColor } from './models.js';
import { roadCoords, nearestRoadCoord } from './world.js';
import { carPos } from './driving.js';

export function spawnTraffic(scene, count, rng) {
  const cs = roadCoords();
  for (let i = 0; i < count; i++) {
    const alongX = rng() < 0.5;
    const road = cs[Math.floor(rng() * cs.length)];
    const along = (rng() * 2 - 1) * 170;
    const mesh = makeCarMesh(carColor(i + 3), 'sedan');
    const pos = new THREE.Vector3(alongX ? along : road + (rng() < 0.5 ? 2.5 : -2.5), 0.3, alongX ? road + (rng() < 0.5 ? 2.5 : -2.5) : along);
    mesh.position.copy(pos);
    scene.add(mesh);
    const dir = rng() < 0.5 ? 1 : -1;
    const car = {
      kind: 'traffic', mesh, pos, yaw: alongX ? (dir > 0 ? Math.PI / 2 : -Math.PI / 2) : (dir > 0 ? 0 : Math.PI),
      speed: 7 + rng() * 5, alongX, road, dir, hp: 100, id: 1000 + i,
    };
    mesh.rotation.y = car.yaw;
    G.traffic.push(car);
    G.cars.push(car);
  }
}

function junctionAhead(car) {
  // stop near a crossing road when another road is just ahead
  const cs = roadCoords();
  const ahead = car.alongX ? car.pos.x + car.dir * 8 : car.pos.z + car.dir * 8;
  const coord = car.alongX ? car.pos.x : car.pos.z;
  for (const c of cs) {
    if (Math.abs(c - coord) > 2 && Math.abs(ahead - c) < 4) return true;
  }
  return false;
}

export function updateTraffic(dt) {
  const pp = carPos();
  for (const car of G.traffic) {
    let target = car.speed;
    // brake for the player
    const dPlayer = Math.hypot(car.pos.x - pp.x, car.pos.z - pp.z);
    if (dPlayer < 10) target = 0;
    // brake for a car ahead on the same road
    for (const other of G.traffic) {
      if (other === car || other.road !== car.road || other.alongX !== car.alongX) continue;
      const d = car.alongX ? (other.pos.x - car.pos.x) * car.dir : (other.pos.z - car.pos.z) * car.dir;
      if (d > 0 && d < 9) { target = 0; break; }
    }
    if (junctionAhead(car) && Math.random() < 0.5) target = Math.min(target, 2);
    car.speed += (target - car.speed) * Math.min(1, dt * 2);
    if (car.alongX) car.pos.x += car.dir * car.speed * dt;
    else car.pos.z += car.dir * car.speed * dt;
    // wrap around the island edge, pick a new road
    const lim = 185;
    if (car.alongX && (car.pos.x > lim || car.pos.x < -lim)) {
      car.pos.x = car.dir > 0 ? -lim : lim;
      car.road = nearestRoadCoord(car.pos.z);
    }
    if (!car.alongX && (car.pos.z > lim || car.pos.z < -lim)) {
      car.pos.z = car.dir > 0 ? -lim : lim;
      car.road = nearestRoadCoord(car.pos.x);
    }
    car.mesh.position.copy(car.pos);
    car.mesh.rotation.y = car.yaw;
  }
}
