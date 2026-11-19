// Solara Bay — wanted level and police: chasing police cars, on-foot
// officers, roadblocks at 4–5 stars, and wanted decay when the player hides.

import * as THREE from 'three';
import { G } from './state.js';
import { makePoliceMesh, makePersonMesh } from './models.js';
import { CITY, GARAGE } from './config.js';
import { carPos } from './driving.js';
import { setSiren } from './audio.js';
import { spawnHelicopter, despawnHelicopter } from './helicopter.js';

let roadblockTimer = 0;

export function addWanted(stars, reason) {
  const before = G.wanted;
  G.wanted = Math.max(0, Math.min(5, G.wanted + stars));
  G.wantedHeat = 1;
  if (G.wanted > before && reason) G.messages.push('WANTED +' + stars + ' — ' + reason);
  syncPolice();
}

export function setWanted(stars) {
  G.wanted = Math.max(0, Math.min(5, stars));
  G.wantedHeat = stars > 0 ? 1 : 0;
  syncPolice();
}

function syncPolice() {
  // helicopter at 3+ stars
  if (G.wanted >= 3) spawnHelicopter(G.scene);
  else despawnHelicopter();
  // police cars: one per wanted star, capped at 4
  const want = Math.min(4, G.wanted);
  while (G.police.length < want) spawnPoliceCar();
  while (G.police.length > want) {
    const c = G.police.pop();
    G.scene.remove(c.mesh);
    const i = G.cars.indexOf(c); if (i >= 0) G.cars.splice(i, 1);
  }
  // on-foot officers when the player is on foot and wanted >= 1
  const wantOfficers = (!G.onFoot || G.wanted === 0) ? 0 : Math.min(3, G.wanted);
  while (G.officers.length < wantOfficers) spawnOfficer();
  while (G.officers.length > wantOfficers) {
    const o = G.officers.pop();
    G.scene.remove(o.mesh);
  }
  setSiren(G.wanted > 0, G.time);
}

export function spawnPoliceCar() {
  const pp = carPos();
  const angle = Math.random() * Math.PI * 2;
  const mesh = makePoliceMesh();
  const pos = new THREE.Vector3(
    Math.max(-180, Math.min(180, pp.x + Math.cos(angle) * 55)),
    0.3,
    Math.max(-180, Math.min(180, pp.z + Math.sin(angle) * 55)));
  mesh.position.copy(pos);
  G.scene.add(mesh);
  const car = { kind: 'police', mesh, pos, yaw: angle, speed: 0, hp: 100, id: 2000 + G.police.length };
  G.police.push(car);
  G.cars.push(car);
  return car;
}

export function spawnOfficer() {
  const pp = carPos();
  const mesh = makePersonMesh(0x1a2a5a, 0x1a1a22);
  const pos = new THREE.Vector3(pp.x + (Math.random() * 30 - 15), 0.3, pp.z + (Math.random() * 30 - 15));
  mesh.position.copy(pos);
  G.scene.add(mesh);
  G.officers.push({ mesh, pos, yaw: 0, speed: 5.5, hp: 60 });
}

export function spawnRoadblock() {
  const pp = carPos();
  const dir = G.car ? G.car.yaw : G.player.yaw;
  const aheadX = pp.x + Math.sin(dir) * 34;
  const aheadZ = pp.z + Math.cos(dir) * 34;
  clearRoadblocks();
  for (let i = -1; i <= 1; i++) {
    const mesh = makePoliceMesh();
    const px = aheadX + Math.cos(dir) * i * 5;
    const pz = aheadZ - Math.sin(dir) * i * 5;
    mesh.position.set(px, 0.3, pz);
    mesh.rotation.y = dir + Math.PI / 2;
    G.scene.add(mesh);
    G.roadblocks.push({ mesh, pos: mesh.position, yaw: dir + Math.PI / 2, hp: 100, kind: 'roadblock' });
  }
  G.messages.push('ROADBLOCK AHEAD — ram it or go around!');
}

export function clearRoadblocks() {
  for (const r of G.roadblocks) G.scene.remove(r.mesh);
  G.roadblocks = [];
}

function nearGarage() {
  const pp = carPos();
  return Math.hypot(pp.x - GARAGE.x, pp.z - GARAGE.z) < 24;
}

export function updatePolice(dt) {
  const pp = carPos();
  const hidden = nearGarage();
  // wanted decays when out of police sight; faster at the garage safehouse
  if (G.wanted > 0) {
    const anyNear = G.police.some((c) => Math.hypot(c.pos.x - pp.x, c.pos.z - pp.z) < 26);
    if (!anyNear || hidden) {
      G.wantedHeat -= dt * (hidden ? 0.25 : 0.06);
      if (G.wantedHeat <= 0) {
        G.wanted = Math.max(0, G.wanted - 1);
        G.wantedHeat = G.wanted > 0 ? 1 : 0;
        if (G.wanted === 0) { G.messages.push('You lost the heat.'); clearRoadblocks(); }
        syncPolice();
      }
    } else {
      G.wantedHeat = Math.min(1, G.wantedHeat + dt * 0.1);
    }
  }

  // roadblocks at 4–5 stars, refreshed every 25 s
  if (G.wanted >= 4) {
    roadblockTimer -= dt;
    if (roadblockTimer <= 0 && G.roadblocks.length === 0) {
      spawnRoadblock();
      roadblockTimer = 25;
    }
  } else if (G.roadblocks.length > 0) {
    clearRoadblocks();
  }

  // police cars chase and ram
  for (const car of G.police) {
    const dx = pp.x - car.pos.x;
    const dz = pp.z - car.pos.z;
    const dist = Math.hypot(dx, dz);
    const targetYaw = Math.atan2(dx, dz);
    let dy = targetYaw - car.yaw;
    while (dy > Math.PI) dy -= Math.PI * 2;
    while (dy < -Math.PI) dy += Math.PI * 2;
    car.yaw += Math.max(-2.4 * dt, Math.min(2.4 * dt, dy));
    const top = 24 + G.wanted * 1.5;
    car.speed = Math.min(top, car.speed + 14 * dt);
    car.pos.x += Math.sin(car.yaw) * car.speed * dt;
    car.pos.z += Math.cos(car.yaw) * car.speed * dt;
    car.mesh.position.copy(car.pos);
    car.mesh.rotation.y = car.yaw;
    // ram: damage the player car or the player
    if (dist < 3.4) {
      if (G.car) {
        G.car.hp -= 18 * dt * 10;
        G.shake = Math.min(0.6, G.shake + 0.25);
        if (G.car.hp <= 0) { G.car.hp = 0; G.car.speed = 0; }
      } else {
        hurtPlayer(12 * dt);
      }
      car.speed *= 0.5;
    }
    // flash the light bar
    if (car.mesh.userData.lightBars) {
      const on = Math.floor(G.time * 6) % 2 === 0;
      car.mesh.userData.lightBars[0].material.emissiveIntensity = on ? 2 : 0.2;
      car.mesh.userData.lightBars[1].material.emissiveIntensity = on ? 0.2 : 2;
    }
  }

  // officers chase on foot
  for (const o of G.officers) {
    const dx = pp.x - o.pos.x;
    const dz = pp.z - o.pos.z;
    const dist = Math.hypot(dx, dz);
    o.yaw = Math.atan2(dx, dz);
    if (dist > 1.6) {
      o.pos.x += Math.sin(o.yaw) * o.speed * dt;
      o.pos.z += Math.cos(o.yaw) * o.speed * dt;
    } else {
      hurtPlayer(10 * dt);
    }
    o.mesh.position.copy(o.pos);
    o.mesh.rotation.y = o.yaw;
  }
  setSiren(G.wanted > 0, G.time);
}

export function hurtPlayer(amount) {
  if (G.armor > 0) {
    const absorbed = Math.min(G.armor, amount);
    G.armor -= absorbed;
    amount -= absorbed;
  }
  G.health -= amount;
  G.shake = Math.min(0.7, G.shake + 0.2);
  if (G.health <= 0) {
    G.health = 0;
    G.busted = true;
    G.mode = 'busted';
  }
}

export function bustPlayer() {
  G.busted = true;
  G.mode = 'busted';
}
