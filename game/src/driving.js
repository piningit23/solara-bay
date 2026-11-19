// Solara Bay — driving: steal parked cars (E), arcade handling, NOS boost,
// car damage, exiting (E), and the short "jacking" moment with a wanted bump.

import * as THREE from 'three';
import { G } from './state.js';
import { keys, pressed } from './input.js';
import { makeCarMesh, carColor } from './models.js';
import { parkedSpots, collidesWithBuilding, clampToIsland, nearestRoadCoord } from './world.js';
import { playCrash, playChime } from './audio.js';
import { addWanted } from './police.js';

export let jacking = 0;   // seconds left of the jacking animation

export function spawnParkedCars(scene, rng) {
  for (let i = 0; i < parkedSpots.length; i++) {
    const s = parkedSpots[i];
    const kind = i % 5 === 0 ? 'sport' : 'sedan';
    const mesh = makeCarMesh(carColor(i), kind);
    mesh.position.set(s.x, 0.3, s.z);
    mesh.rotation.y = s.angle;
    scene.add(mesh);
    G.cars.push({
      kind: 'parked', mesh, pos: mesh.position, yaw: s.angle,
      speed: 0, color: carColor(i), stolen: false, hp: 100, id: i,
    });
  }
}

export function nearestParkedCar(maxDist) {
  const p = G.player.pos;
  let best = null, bd = maxDist;
  for (const c of G.cars) {
    if (c.kind !== 'parked' || c.stolen) continue;
    const d = Math.hypot(c.pos.x - p.x, c.pos.z - p.z);
    if (d < bd) { bd = d; best = c; }
  }
  return best;
}

export function enterCar(car) {
  jacking = 0.8;
  car.stolen = true;
  car.kind = 'driven';
  G.car = car;
  G.onFoot = false;
  G.player.mesh.visible = false;
  G.stats.carsStolen++;
  addWanted(1, 'Car stolen');
  playChime();
}

export function exitCar() {
  if (!G.car) return;
  const car = G.car;
  car.kind = 'parked';
  G.car = null;
  G.onFoot = true;
  G.player.mesh.visible = true;
  G.player.pos.set(car.pos.x + 3, 0.3, car.pos.z + 3);
  G.player.yaw = car.yaw;
}

export function updateDriving(dt, mouse) {
  const car = G.car;
  if (!car) return;
  // steering follows the camera orbit while driving too
  if (mouse.dx) { /* camera orbit handled in main.js */ }

  const fwd = keys['KeyW'] || keys['ArrowUp'];
  const back = keys['KeyS'] || keys['ArrowDown'];
  const left = keys['KeyA'] || keys['ArrowLeft'];
  const right = keys['KeyD'] || keys['ArrowRight'];
  const brake = keys['Space'];
  const boosting = (keys['ShiftLeft'] || keys['ShiftRight']) && G.nos > 0 && fwd;

  let top = G.upgrades.engine ? 34 : 26;
  const grip = G.upgrades.tires ? 2.6 : 2.0;
  if (boosting) {
    top = 44;
    G.nos = Math.max(0, G.nos - 34 * dt);
    G.boosting = true;
  } else {
    G.boosting = false;
    G.nos = Math.min(100, G.nos + 7 * dt);
  }

  if (fwd) car.speed = Math.min(top, car.speed + 16 * dt);
  else if (back) car.speed = Math.max(-9, car.speed - 12 * dt);
  else car.speed *= Math.pow(0.4, dt);
  if (brake) car.speed *= Math.pow(0.05, dt);
  if (Math.abs(car.speed) > 0.5) {
    car.yaw -= (left ? 1 : 0) * grip * dt * Math.sign(car.speed) * Math.min(1, Math.abs(car.speed) / 10);
    car.yaw += (right ? 1 : 0) * grip * dt * Math.sign(car.speed) * Math.min(1, Math.abs(car.speed) / 10);
  }
  const nx = car.pos.x + Math.sin(car.yaw) * car.speed * dt;
  const nz = car.pos.z + Math.cos(car.yaw) * car.speed * dt;
  let hit = false;
  if (!collidesWithBuilding(nx, car.pos.z, 1.6)) car.pos.x = nx; else hit = true;
  if (!collidesWithBuilding(car.pos.x, nz, 1.6)) car.pos.z = nz; else hit = true;
  const cl = clampToIsland(car.pos.x, car.pos.z, 3);
  if (cl.x !== car.pos.x || cl.z !== car.pos.z) hit = true;
  car.pos.x = cl.x; car.pos.z = cl.z;
  if (hit && Math.abs(car.speed) > 6) {
    damageCar(car, Math.abs(car.speed) * 1.2);
    playCrash();
    G.shake = Math.min(0.6, G.shake + 0.3);
    car.speed *= 0.4;
  }
  car.mesh.position.copy(car.pos);
  car.mesh.rotation.y = car.yaw;
  car.mesh.rotation.z = (left ? 0.04 : 0) - (right ? 0.04 : 0);
  // keep the car on the nearest road visually when cruising straight
  car.speed = Math.max(-9, Math.min(48, car.speed));
}

export function damageCar(car, amount) {
  const mult = G.upgrades.armor ? 0.45 : 1;
  car.hp -= amount * mult;
  if (car.hp <= 0) {
    car.hp = 0;
    car.speed = 0;
    G.messages.push('Your car is wrecked — get out and find another.');
  }
}

export function carPos() {
  return G.car ? G.car.pos : G.player.pos;
}

export function updateJacking(dt) {
  if (jacking > 0) jacking -= dt;
}
