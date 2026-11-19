// Solara Bay — police: patrol cars that chase and ram, foot officers,
// roadblocks at 4-5 stars, and the wanted-level rules.

import * as THREE from 'three';
import { makeCarMesh, makePersonMesh } from './models.js';

export function createPolice(scene) {
  return {
    scene,
    cars: [],        // {mesh, speed}
    officers: [],    // {mesh, speed}
    roadblock: [],   // {mesh}
    roadblockAt: null,
    spawnTimer: 0,
    sirenOn: false,
  };
}

export function spawnPoliceCar(police, x, z) {
  const mesh = makeCarMesh(0xf5f5f5, true);
  mesh.position.set(x, 0, z);
  police.scene.add(mesh);
  const car = { mesh, speed: 0 };
  police.cars.push(car);
  return car;
}

function spawnOfficer(police, x, z) {
  const mesh = makePersonMesh(0x1a2a6b, 0xd9a066);
  mesh.position.set(x, 0, z);
  police.scene.add(mesh);
  const off = { mesh, speed: 0 };
  police.officers.push(off);
  return off;
}

export function desiredPoliceCount(wanted) {
  if (wanted <= 0) return 0;
  if (wanted === 1) return 1;
  if (wanted === 2) return 2;
  if (wanted === 3) return 3;
  return 4;
}

export function updatePolice(police, dt, state, playerPos, onFoot, audio) {
  const wanted = Math.round(state.wantedFloat);
  state.wanted = wanted;
  const want = desiredPoliceCount(wanted);

  // Spawn / despawn cars
  police.spawnTimer -= dt;
  if (police.cars.length < want && police.spawnTimer <= 0) {
    police.spawnTimer = 1.2;
    const a = Math.random() * Math.PI * 2;
    spawnPoliceCar(police, playerPos.x + Math.cos(a) * 45, playerPos.z + Math.sin(a) * 45);
  }
  while (police.cars.length > want) {
    const c = police.cars.pop();
    police.scene.remove(c.mesh);
  }
  // Foot officers only matter when the player is on foot
  const wantOfficers = onFoot ? Math.min(wanted, 3) : 0;
  while (police.officers.length < wantOfficers) {
    const a = Math.random() * Math.PI * 2;
    spawnOfficer(police, playerPos.x + Math.cos(a) * 25, playerPos.z + Math.sin(a) * 25);
  }
  while (police.officers.length > wantOfficers) {
    const o = police.officers.pop();
    police.scene.remove(o.mesh);
  }

  // Chase: cars steer toward the player and ram
  for (const car of police.cars) {
    const dx = playerPos.x - car.mesh.position.x;
    const dz = playerPos.z - car.mesh.position.z;
    const dist = Math.hypot(dx, dz);
    const targetAngle = Math.atan2(dx, dz);
    let diff = targetAngle - car.mesh.rotation.y;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    car.mesh.rotation.y += Math.max(-2.4 * dt, Math.min(2.4 * dt, diff));
    const speed = Math.min(30, 14 + wanted * 3.5);
    car.mesh.position.x += Math.sin(car.mesh.rotation.y) * speed * dt;
    car.mesh.position.z += Math.cos(car.mesh.rotation.y) * speed * dt;
    // ram damage
    if (dist < 2.6) {
      if (onFoot) state.health -= 14 * dt * 4;
      else if (state.car) state.car.damage = Math.min(100, (state.car.damage || 0) + 8 * dt * 4);
    }
    // flashing lightbar
    const bar = car.mesh.getObjectByName('lightbar');
    const bar2 = car.mesh.getObjectByName('lightbar2');
    const flash = Math.floor(performance.now() / 180) % 2 === 0;
    if (bar) bar.visible = flash;
    if (bar2) bar2.visible = !flash;
  }

  // Officers chase on foot
  for (const off of police.officers) {
    const dx = playerPos.x - off.mesh.position.x;
    const dz = playerPos.z - off.mesh.position.z;
    const dist = Math.hypot(dx, dz);
    if (dist > 0.5) {
      off.mesh.position.x += (dx / dist) * 6.5 * dt;
      off.mesh.position.z += (dz / dist) * 6.5 * dt;
      off.mesh.rotation.y = Math.atan2(dx, dz);
    }
    if (dist < 1.6) {
      state.health -= 10 * dt;
      if (state.health <= 0) state.bustedReason = 'Busted by an officer';
    }
  }

  // Roadblocks at 4-5 stars: 2-3 cars parked across the road ahead
  if (wanted >= 4) {
    if (!police.roadblockAt ||
        Math.hypot(police.roadblockAt.x - playerPos.x, police.roadblockAt.z - playerPos.z) > 70) {
      clearRoadblock(police);
      const ahead = 34;
      const fx = Math.sin(state.playerAngle);
      const fz = Math.cos(state.playerAngle);
      const bx = playerPos.x + fx * ahead;
      const bz = playerPos.z + fz * ahead;
      police.roadblockAt = { x: bx, z: bz };
      const perp = state.playerAngle + Math.PI / 2;
      [-4, 0, 4].forEach((off) => {
        const mesh = makeCarMesh(0xf5f5f5, true);
        mesh.position.set(bx + Math.sin(perp) * off, 0, bz + Math.cos(perp) * off);
        mesh.rotation.y = perp;
        police.scene.add(mesh);
        police.roadblock.push({ mesh });
      });
    }
    for (const rb of police.roadblock) {
      const bar = rb.mesh.getObjectByName('lightbar');
      if (bar) bar.visible = Math.floor(performance.now() / 180) % 2 === 0;
    }
  } else if (police.roadblock.length) {
    clearRoadblock(police);
  }

  police.sirenOn = wanted > 0;
  if (audio) audio.setSiren(police.sirenOn);

  // Wanted decay: hide from police to cool down; garage clears faster
  const nearPolice = police.cars.some((c) =>
    Math.hypot(c.mesh.position.x - playerPos.x, c.mesh.position.z - playerPos.z) < 28) ||
    police.officers.length > 0;
  const inGarage = Math.hypot(playerPos.x + 52, playerPos.z + 52) < 16;
  if (state.wantedFloat > 0 && !nearPolice) {
    state.hiddenTimer += dt;
    if (state.hiddenTimer > 6) {
      state.wantedFloat = Math.max(0, state.wantedFloat - (inGarage ? 0.6 : 0.12) * dt);
    }
  } else {
    state.hiddenTimer = 0;
  }
}

export function clearRoadblock(police) {
  for (const rb of police.roadblock) police.scene.remove(rb.mesh);
  police.roadblock = [];
  police.roadblockAt = null;
}

export function addWanted(state, amount) {
  state.wantedFloat = Math.min(5, state.wantedFloat + amount);
  state.wanted = Math.round(state.wantedFloat);
  state.hiddenTimer = 0;
}
