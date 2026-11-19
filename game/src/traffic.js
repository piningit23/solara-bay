// Solara Bay — traffic cars: lane-following, junction stops, crude avoidance.

import * as THREE from 'three';
import { mulberry32, pick, range } from './random.js';
import { makeCarMesh } from './models.js';

const TRAFFIC_COLORS = [0xc0392b, 0x2980b9, 0xf1c40f, 0x7f8c8d, 0x27ae60, 0xe67e22, 0x8e44ad, 0xecf0f1];

export function createTraffic(scene, count) {
  const rand = mulberry32(777);
  const cars = [];
  for (let i = 0; i < count; i++) {
    const horizontal = rand() < 0.5;
    const road = Math.floor(range(rand, -5, 5)) * 30;
    const along = range(rand, -145, 145);
    const lane = (rand() < 0.5 ? 2.5 : -2.5);
    const mesh = makeCarMesh(pick(rand, TRAFFIC_COLORS), false);
    const car = {
      mesh,
      horizontal,
      road,
      along,
      lane,
      dir: rand() < 0.5 ? 1 : -1,
      speed: range(rand, 7, 12),
      stopped: false,
    };
    mesh.position.set(horizontal ? along : road + lane, 0, horizontal ? road + lane : along);
    mesh.rotation.y = horizontal ? (car.dir > 0 ? Math.PI / 2 : -Math.PI / 2) : (car.dir > 0 ? 0 : Math.PI);
    scene.add(mesh);
    cars.push(car);
  }
  return { cars };
}

export function updateTraffic(traffic, dt, playerPos, isPlayerCar) {
  for (const car of traffic.cars) {
    // crude avoidance: slow down if the player is right ahead
    const dx = car.mesh.position.x - playerPos.x;
    const dz = car.mesh.position.z - playerPos.z;
    const dist = Math.hypot(dx, dz);
    let speed = car.speed;
    if (dist < 9) speed = car.speed * 0.25;
    // stop at junctions: slow near a cross street
    const nearJunction = car.horizontal
      ? Math.abs(((car.along % 30) + 30) % 30 - 15) < 4
      : Math.abs(((car.along % 30) + 30) % 30 - 15) < 4;
    if (nearJunction && Math.random() < 0.3) speed *= 0.4;
    car.along += car.dir * speed * dt;
    if (car.along > 155) car.along = -155;
    if (car.along < -155) car.along = 155;
    if (car.horizontal) {
      car.mesh.position.x = car.along;
      car.mesh.position.z = car.road + car.lane;
    } else {
      car.mesh.position.z = car.along;
      car.mesh.position.x = car.road + car.lane;
    }
  }
}

export function trafficNear(traffic, x, z, radius) {
  for (const car of traffic.cars) {
    const dx = car.mesh.position.x - x;
    const dz = car.mesh.position.z - z;
    if (Math.hypot(dx, dz) < radius) return car;
  }
  return null;
}
