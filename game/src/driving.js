// Solara Bay — driving: steal parked cars, arcade handling, NOS boost,
// parking at the garage, collision with buildings.

import * as THREE from 'three';
import { CAR, GARAGE } from './config.js';
import { makeCarMesh } from './models.js';
import { mulberry32, pick, range } from './random.js';
import { collideCircle } from './player.js';
import { addWanted } from './police.js';

const PARKED_COLORS = [0xc0392b, 0x2980b9, 0xf1c40f, 0x27ae60, 0xe67e22, 0x9b59b6, 0x1abc9c, 0xecf0f1, 0x2c3e50];

export function createParkedCars(scene, count) {
  const rand = mulberry32(99);
  const cars = [];
  for (let i = 0; i < count; i++) {
    const horizontal = rand() < 0.5;
    const road = Math.floor(range(rand, -5, 5)) * 30;
    const along = range(rand, -140, 140);
    const side = rand() < 0.5 ? 6.5 : -6.5;
    const x = horizontal ? along : road + side;
    const z = horizontal ? road + side : along;
    if (Math.hypot(x - GARAGE.x, z - GARAGE.z) < 20) continue;
    const mesh = makeCarMesh(pick(rand, PARKED_COLORS), false);
    mesh.position.set(x, 0, z);
    mesh.rotation.y = horizontal ? Math.PI / 2 : 0;
    scene.add(mesh);
    cars.push({ mesh, x, z, taken: false, damage: 0 });
  }
  return { cars };
}

export function nearestParkedCar(parked, x, z, radius) {
  let best = null;
  let bestD = radius;
  for (const car of parked.cars) {
    if (car.taken) continue;
    const d = Math.hypot(car.mesh.position.x - x, car.mesh.position.z - z);
    if (d < bestD) { bestD = d; best = car; }
  }
  return best;
}

export function stealCar(state, car, audio) {
  car.taken = true;
  state.car = car;
  state.onFoot = false;
  state.carSpeed = 0;
  state.carsStolen += 1;
  addWanted(state, 1);
  state.message = 'CAR STOLEN — +1 star. Drive away!';
  state.messageTimer = 3;
  if (audio) audio.blip(440, 0.2, 'square', 0.25);
}

export function exitCar(state) {
  if (!state.car) return;
  const car = state.car;
  state.onFoot = true;
  state.playerPos.x = car.mesh.position.x + Math.sin(car.mesh.rotation.y + Math.PI / 2) * 2.5;
  state.playerPos.z = car.mesh.position.z + Math.cos(car.mesh.rotation.y + Math.PI / 2) * 2.5;
  state.playerAngle = car.mesh.rotation.y;
  state.car = null;
  state.carSpeed = 0;
}

export function updateDriving(dt, state, input, colliders, audio, exhaust) {
  const car = state.car;
  if (!car) return;
  const topSpeed = state.upgrades.engine ? CAR.maxSpeedEngine : CAR.maxSpeed;
  const grip = state.upgrades.tires ? CAR.gripTires : CAR.grip;
  const fwd = input.isDown('KeyW') || input.isDown('ArrowUp');
  const back = input.isDown('KeyS') || input.isDown('ArrowDown');
  const left = input.isDown('KeyA') || input.isDown('ArrowLeft');
  const right = input.isDown('KeyD') || input.isDown('ArrowRight');
  const brake = input.isDown('Space');

  if (fwd) state.carSpeed += CAR.accel * dt;
  else if (back) state.carSpeed -= CAR.accel * 0.7 * dt;
  else state.carSpeed *= Math.pow(0.4, dt);
  if (brake) state.carSpeed *= Math.pow(0.05, dt);
  state.boosting = false;
  if (input.isDown('ShiftLeft') && state.nos > 0 && state.carSpeed > 4) {
    state.carSpeed += 26 * dt;
    state.nos = Math.max(0, state.nos - 34 * dt);
    state.boosting = true;
    if (exhaust) exhaust(car.mesh.position, car.mesh.rotation.y);
  } else {
    state.nos = Math.min(100, state.nos + 7 * dt);
  }
  state.carSpeed = Math.max(-CAR.reverseSpeed, Math.min(topSpeed + (state.boosting ? 10 : 0), state.carSpeed));
  const steer = (left ? 1 : 0) - (right ? 1 : 0);
  const dirSign = state.carSpeed >= 0 ? 1 : -1;
  car.mesh.rotation.y += steer * CAR.turnRate * grip * dirSign * dt * Math.min(1, Math.abs(state.carSpeed) / 8 + 0.2);
  const nx = car.mesh.position.x + Math.sin(car.mesh.rotation.y) * state.carSpeed * dt;
  const nz = car.mesh.position.z + Math.cos(car.mesh.rotation.y) * state.carSpeed * dt;
  const pos = { x: nx, z: nz };
  collideCircle(pos, colliders, 2.2);
  if (Math.hypot(pos.x - nx, pos.z - nz) > 0.01 && Math.abs(state.carSpeed) > 10) {
    // hit a building
    car.damage = Math.min(100, (car.damage || 0) + 6);
    state.carSpeed *= 0.4;
    if (audio) audio.crash();
  }
  car.mesh.position.x = Math.max(-152, Math.min(152, pos.x));
  car.mesh.position.z = Math.max(-152, Math.min(152, pos.z));
  state.playerPos.x = car.mesh.position.x;
  state.playerPos.z = car.mesh.position.z;
  state.playerAngle = car.mesh.rotation.y;
  if (audio) audio.setEngine(Math.abs(state.carSpeed) / topSpeed, true);
}
