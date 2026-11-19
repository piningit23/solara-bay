// Solara Bay — side activities in free roam: taxi fares, vigilante bounties,
// and 10 hidden sunken caches around the island.

import * as THREE from 'three';
import { CACHE_SPOTS } from './config.js';
import { addRespect } from './respect.js';

export function createActivities(scene, state) {
  const group = new THREE.Group();
  scene.add(group);
  // cache markers: small glowing gold boxes
  const cacheMeshes = CACHE_SPOTS.map(([x, z]) => {
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 0.9, 0.9),
      new THREE.MeshBasicMaterial({ color: 0xffd700 }));
    m.position.set(x, 0.9, z);
    m.visible = false;
    group.add(m);
    return m;
  });
  return {
    scene, state, group, cacheMeshes,
    taxiMarker: null,
    taxiTimer: 0,
    vigilanteTimer: 0,
  };
}

export function spawnTaxi(act, playerPos) {
  // A pedestrian nearby wants a ride; drop is across town.
  const a = Math.random() * Math.PI * 2;
  const px = playerPos.x + Math.cos(a) * 18;
  const pz = playerPos.z + Math.sin(a) * 18;
  const dx = -px + (Math.random() * 60 - 30);
  const dz = -pz + (Math.random() * 60 - 30);
  act.state.taxi = {
    pickup: { x: px, z: pz },
    drop: { x: Math.max(-140, Math.min(140, dx)), z: Math.max(-140, Math.min(140, dz)) },
    passenger: false,
    fare: 180,
  };
  act.state.message = 'TAXI FARE — pick up the rider at the TAXI marker';
  act.state.messageTimer = 4;
}

export function spawnVigilante(act, playerPos) {
  // A marked criminal car appears; ram or shoot it down.
  const a = Math.random() * Math.PI * 2;
  act.state.vigilante = {
    x: playerPos.x + Math.cos(a) * 40,
    z: playerPos.z + Math.sin(a) * 40,
    health: 100,
    alive: true,
    reward: 350,
  };
  act.state.message = 'VIGILANTE BOUNTY — take down the marked criminal car';
  act.state.messageTimer = 4;
}

export function updateActivities(act, dt, playerPos, inCar, carSpeed) {
  const s = act.state;
  // caches: collect by walking/driving over one
  CACHE_SPOTS.forEach(([x, z], i) => {
    if (s.cacheFound.includes(i)) { act.cacheMeshes[i].visible = false; return; }
    act.cacheMeshes[i].visible = true;
    act.cacheMeshes[i].rotation.y += dt;
    if (Math.hypot(playerPos.x - x, playerPos.z - z) < 2.5) {
      s.cacheFound.push(i);
      s.caches = s.cacheFound.length;
      s.cash += 250;
      addRespect(s, 20, 'cache');
      s.message = `SUNKEN CACHE ${s.caches}/10 — +$250, +20 respect`;
      s.messageTimer = 3;
    }
  });
  // taxi
  if (s.taxi) {
    const t = s.taxi;
    const target = t.passenger ? t.drop : t.pickup;
    if (Math.hypot(playerPos.x - target.x, playerPos.z - target.z) < 4) {
      if (!t.passenger) {
        t.passenger = true;
        s.message = 'Rider aboard — drive to the drop marker';
        s.messageTimer = 3;
      } else {
        s.cash += t.fare;
        addRespect(s, 25, 'taxi');
        s.message = `FARE COMPLETE — +$${t.fare}, +25 respect`;
        s.messageTimer = 3;
        if (s.missionIndex === 9 && s.missionActive) s.gigs.taxi = true;
        s.taxi = null;
        act.taxiTimer = 20;
      }
    }
  } else {
    act.taxiTimer -= dt;
    if (act.taxiTimer <= 0) spawnTaxi(act, playerPos);
  }
  // vigilante
  if (s.vigilante && s.vigilante.alive) {
    const v = s.vigilante;
    // criminal car drives away from the player
    const dx = v.x - playerPos.x;
    const dz = v.z - playerPos.z;
    const d = Math.hypot(dx, dz) || 1;
    v.x += (dx / d) * 10 * dt;
    v.z += (dz / d) * 10 * dt;
    v.x = Math.max(-148, Math.min(148, v.x));
    v.z = Math.max(-148, Math.min(148, v.z));
    // rammed at speed = damage
    if (inCar && d < 3.2 && Math.abs(carSpeed) > 8) {
      v.health -= 40 * dt * 4;
    }
    if (v.health <= 0) {
      v.alive = false;
      s.cash += v.reward;
      addRespect(s, 40, 'vigilante');
      s.message = `BOUNTY DOWN — +$${v.reward}, +40 respect`;
      s.messageTimer = 3;
      if (s.missionIndex === 9 && s.missionActive) s.gigs.vigilante = true;
      s.vigilante = null;
      act.vigilanteTimer = 25;
    }
  } else {
    act.vigilanteTimer -= dt;
    if (act.vigilanteTimer <= 0) spawnVigilante(act, playerPos);
  }
}
