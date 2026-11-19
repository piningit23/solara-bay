// Solara Bay — crew ally Dante Reyes: follows the player in crew missions,
// rams chasing police cars, shoots at enemies on foot, shows as "D" on the map.

import * as THREE from 'three';
import { makeCarMesh, makePersonMesh } from './models.js';

export function createCrew(scene) {
  const carMesh = makeCarMesh(0xffd700, false);
  carMesh.visible = false;
  scene.add(carMesh);
  const footMesh = makePersonMesh(0xffd700, 0xd9a066);
  footMesh.visible = false;
  scene.add(footMesh);
  return {
    scene,
    carMesh,
    footMesh,
    active: false,
    inCar: true,
    speed: 0,
    shootTimer: 0,
  };
}

export function setCrewActive(crew, state, active, atPos) {
  crew.active = active;
  state.danteActive = active;
  crew.carMesh.visible = active;
  crew.footMesh.visible = false;
  crew.inCar = true;
  if (active && atPos) {
    crew.carMesh.position.set(atPos.x + 4, 0, atPos.z + 4);
    state.dantePos = { x: atPos.x + 4, z: atPos.z + 4 };
  }
}

export function updateCrew(crew, dt, state, playerPos, police, enemies) {
  if (!crew.active) return;
  const mesh = crew.inCar ? crew.carMesh : crew.footMesh;
  const dx = playerPos.x - mesh.position.x;
  const dz = playerPos.z - mesh.position.z;
  const dist = Math.hypot(dx, dz);
  // Follow: keep about 6 units behind the player
  if (dist > 8) {
    const targetAngle = Math.atan2(dx, dz);
    let diff = targetAngle - mesh.rotation.y;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    mesh.rotation.y += Math.max(-2.6 * dt, Math.min(2.6 * dt, diff));
    const speed = Math.min(30, 12 + dist * 0.5);
    mesh.position.x += Math.sin(mesh.rotation.y) * speed * dt;
    mesh.position.z += Math.cos(mesh.rotation.y) * speed * dt;
  }
  state.dantePos = { x: mesh.position.x, z: mesh.position.z };
  // Ram chasing police cars that get close to the player
  for (const car of police.cars) {
    const cd = Math.hypot(car.mesh.position.x - playerPos.x, car.mesh.position.z - playerPos.z);
    const dd = Math.hypot(car.mesh.position.x - mesh.position.x, car.mesh.position.z - mesh.position.z);
    if (cd < 12 && dd < 3.5) {
      // shove the police car away from the player
      const push = 26 * dt;
      const ax = (car.mesh.position.x - playerPos.x) / (cd || 1);
      const az = (car.mesh.position.z - playerPos.z) / (cd || 1);
      car.mesh.position.x += ax * push * 4;
      car.mesh.position.z += az * push * 4;
    }
  }
  // Shoot at enemies when on foot
  if (!crew.inCar && enemies && enemies.length) {
    crew.shootTimer -= dt;
    if (crew.shootTimer <= 0) {
      crew.shootTimer = 0.7;
      let nearest = null;
      let best = 40;
      for (const e of enemies) {
        if (e.dead) continue;
        const d = Math.hypot(e.mesh.position.x - mesh.position.x, e.mesh.position.z - mesh.position.z);
        if (d < best) { best = d; nearest = e; }
      }
      if (nearest) {
        nearest.health -= 20;
        if (nearest.health <= 0) nearest.dead = true;
      }
    }
  }
}
