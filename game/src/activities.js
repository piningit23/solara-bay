// Solara Bay — side activities in free roam (and inside the Respect Run):
// (1) taxi fares, (2) vigilante bounties on a marked criminal car,
// (3) 10 hidden "sunken cache" packages around the island.

import * as THREE from 'three';
import { G } from './state.js';
import { CACHE_SPOTS } from './config.js';
import { makePersonMesh, makeCarMesh, carColor } from './models.js';
import { roadCoords } from './world.js';
import { carPos } from './driving.js';
import { addRespect } from './respect.js';
import { playCash, playChime } from './audio.js';
import { addWanted } from './police.js';

let taxiTimer = 0;
let bountyTimer = 0;

export function spawnTaxiFare() {
  if (G.taxi) return;
  const pp = carPos();
  const cs = roadCoords();
  const road = cs[Math.floor(Math.random() * cs.length)];
  const mesh = makePersonMesh(0xffe135, 0x333333);
  const pos = new THREE.Vector3(pp.x + 14, 0.3, road + 9);
  mesh.position.copy(pos);
  G.scene.add(mesh);
  const dest = { x: (Math.random() * 2 - 1) * 140, z: (Math.random() * 2 - 1) * 140 };
  G.taxi = { mesh, pos, dest, passenger: false, marker: makeTaxiMarker() };
  G.taxi.marker.position.set(pos.x, 3, pos.z);
  G.scene.add(G.taxi.marker);
  G.messages.push('TAXI FARE — pick up the passenger in yellow.');
}

function makeTaxiMarker() {
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(1.6, 0.5, 1.6),
    new THREE.MeshBasicMaterial({ color: 0xffe135 }));
  m.userData.spin = true;
  return m;
}

export function spawnVigilante() {
  if (G.vigilante) return;
  const pp = carPos();
  const mesh = makeCarMesh(0x111111, 'sport');
  const pos = new THREE.Vector3(pp.x + 40, 0.3, pp.z + 30);
  mesh.position.copy(pos);
  G.scene.add(mesh);
  G.vigilante = { mesh, pos, yaw: 0, speed: 12, hp: 80 };
  G.messages.push('VIGILANTE BOUNTY — take down the black car. $400 + respect.');
}

export function updateActivities(dt) {
  // caches: walk or drive over a glowing package to collect it
  const pp = carPos();
  for (let i = 0; i < CACHE_SPOTS.length; i++) {
    if (G.cacheTaken.includes(i)) continue;
    const s = CACHE_SPOTS[i];
    const d = Math.hypot(pp.x - s.x, pp.z - s.z);
    if (d < 4) {
      G.cacheTaken.push(i);
      G.cachesFound = G.cacheTaken.length;
      G.cash += 250;
      addRespect(15, 'sunken cache found');
      playCash();
      G.messages.push('SUNKEN CACHE ' + G.cachesFound + '/10 — +$250');
      const m = G.cacheMeshes[i];
      if (m) m.visible = false;
    }
  }

  // taxi: pick up on foot or in the car, then drive to the dest
  if (G.taxi) {
    const t = G.taxi;
    t.marker.rotation.y += dt * 2;
    if (!t.passenger) {
      const d = Math.hypot(pp.x - t.pos.x, pp.z - t.pos.z);
      if (d < 4) {
        t.passenger = true;
        G.scene.remove(t.mesh);
        G.scene.remove(t.marker);
        t.marker = makeTaxiMarker();
        t.marker.position.set(t.dest.x, 3, t.dest.z);
        G.scene.add(t.marker);
        G.waypoint = { x: t.dest.x, z: t.dest.z };
        G.messages.push('Passenger aboard — drive to the marker.');
        playChime();
      }
    } else {
      const d = Math.hypot(pp.x - t.dest.x, pp.z - t.dest.z);
      if (d < 6 && G.car) {
        G.cash += 300;
        addRespect(20, 'taxi fare complete');
        playCash();
        G.messages.push('FARE COMPLETE — +$300');
        G.scene.remove(t.marker);
        G.taxi = null;
        G.waypoint = null;
        if (G.mission) G.mission.gigsDone = (G.mission.gigsDone || 0) + 1;
      }
    }
  } else {
    taxiTimer -= dt;
    if (taxiTimer <= 0 && G.mode === 'playing' && !G.mission) {
      spawnTaxiFare();
      taxiTimer = 45;
    }
  }

  // vigilante bounty car: flees, can be rammed or shot
  if (G.vigilante) {
    const v = G.vigilante;
    const dx = v.pos.x - pp.x;
    const dz = v.pos.z - pp.z;
    const dist = Math.hypot(dx, dz);
    v.yaw = Math.atan2(dx, dz);
    v.pos.x += Math.sin(v.yaw) * v.speed * dt;
    v.pos.z += Math.cos(v.yaw) * v.speed * dt;
    v.pos.x = Math.max(-185, Math.min(185, v.pos.x));
    v.pos.z = Math.max(-185, Math.min(185, v.pos.z));
    v.mesh.position.copy(v.pos);
    v.mesh.rotation.y = v.yaw;
    if (dist < 3.5 && G.car && Math.abs(G.car.speed) > 6) {
      v.hp -= 40;
      G.shake = Math.min(0.5, G.shake + 0.2);
    }
    if (v.hp <= 0) {
      G.scene.remove(v.mesh);
      G.vigilante = null;
      G.cash += 400;
      addRespect(30, 'vigilante takedown');
      playCash();
      G.messages.push('BOUNTY DOWN — +$400, +30 respect');
      G.stats.takedowns++;
      if (G.mission) G.mission.gigsDone = (G.mission.gigsDone || 0) + 1;
    }
  } else {
    bountyTimer -= dt;
    if (bountyTimer <= 0 && G.mode === 'playing' && !G.mission && G.wanted === 0) {
      spawnVigilante();
      bountyTimer = 60;
    }
  }
}

export function clearActivityMarkers() {
  if (G.taxi) { G.scene.remove(G.taxi.mesh); G.scene.remove(G.taxi.marker); G.taxi = null; }
  if (G.vigilante) { G.scene.remove(G.vigilante.mesh); G.vigilante = null; }
}
