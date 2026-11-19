// Side activities, free-roam and part of the RESPECT RUN mission:
// (1) taxi fares, (2) vigilante bounties on a marked criminal car,
// (3) ten hidden sunken caches. All pay cash and respect.

import { CACHE_SPOTS, PLACES } from './config.js';
import { makeCache, makeCar, makePerson } from './models.js';
import { addRespect } from './respect.js';

export function spawnCaches(THREE, G) {
  for (const spot of CACHE_SPOTS) {
    const mesh = makeCache(THREE);
    mesh.position.set(spot.x, 0, spot.z);
    G.scene.add(mesh);
    G.caches.push({ mesh, x: spot.x, z: spot.z, taken: false });
  }
}

export function updateCaches(G, dt) {
  for (const cache of G.caches) {
    if (cache.taken) continue;
    cache.mesh.rotation.y += dt * 1.5;
    cache.mesh.position.y = 0.15 + Math.sin(G.time * 2 + cache.x) * 0.12;
    const d = Math.hypot(cache.x - G.player.x, cache.z - G.player.z);
    if (d < 2.6) {
      cache.taken = true;
      G.scene.remove(cache.mesh);
      G.cachesFound += 1;
      G.cash += 250;
      addRespect(G, 20, 'sunken cache found');
      if (G.audio) G.audio.chime();
      G.toast = `Sunken cache found! CACHES ${G.cachesFound}/10 — +$250`;
      G.toastUntil = G.time + 3;
    }
  }
}

export function spawnTaxi(THREE, G) {
  if (G.taxi) return;
  const spots = [
    { x: 40, z: -40 }, { x: -80, z: 40 }, { x: 120, z: -80 }, { x: 0, z: 120 },
  ];
  const spot = spots[Math.floor(Math.random() * spots.length)];
  const mesh = makePerson(THREE, 0xf1c40f);
  mesh.position.set(spot.x, 0, spot.z);
  G.scene.add(mesh);
  const drop = { x: -120 + Math.random() * 240, z: -120 + Math.random() * 240 };
  G.taxi = {
    mesh, x: spot.x, z: spot.z, dropX: drop.x, dropZ: drop.z,
    pickedUp: false, marker: null,
  };
  G.toast = 'TAXI fare waiting — drive to the yellow marker and press E.';
  G.toastUntil = G.time + 3;
}

export function updateTaxi(G, dt) {
  const taxi = G.taxi;
  if (!taxi) return;
  // Bob the fare marker so it reads at a glance.
  taxi.mesh.position.y = Math.abs(Math.sin(G.time * 4)) * 0.15;
  if (!taxi.pickedUp) {
    const d = Math.hypot(taxi.x - G.player.x, taxi.z - G.player.z);
    if (d < 3 && G.car) {
      taxi.pickedUp = true;
      G.scene.remove(taxi.mesh);
      G.waypoint = { x: taxi.dropX, z: taxi.dropZ, label: 'TAXI DROP' };
      G.toast = 'Passenger aboard — drive to the TAXI DROP marker!';
      G.toastUntil = G.time + 3;
    }
  } else {
    const d = Math.hypot(taxi.dropX - G.player.x, taxi.dropZ - G.player.z);
    if (d < 6) {
      const fare = 120 + Math.floor(Math.random() * 130);
      G.cash += fare;
      addRespect(G, 15, 'taxi fare complete');
      if (G.audio) G.audio.chime();
      G.toast = `Taxi fare paid: +$${fare}`;
      G.toastUntil = G.time + 3;
      if (G.missionActive && G.missionIndex === 9) G.missionGigs.taxi = true;
      G.taxi = null;
      G.waypoint = null;
    }
  }
}

export function spawnBounty(THREE, G) {
  if (G.bounty) return;
  const mesh = makeCar(THREE, 0x111111);
  const x = G.player.x + (Math.random() > 0.5 ? 70 : -70);
  const z = G.player.z + (Math.random() > 0.5 ? 70 : -70);
  mesh.position.set(x, 0, z);
  G.scene.add(mesh);
  G.bounty = { mesh, x, z, heading: Math.random() * Math.PI * 2, speed: 10, health: 120 };
  G.toast = 'VIGILANTE bounty: a marked criminal car is on the run. Ram or shoot it down!';
  G.toastUntil = G.time + 3.5;
}

export function updateBounty(G, dt) {
  const bounty = G.bounty;
  if (!bounty) return;
  // The criminal car flees from the player.
  const dx = bounty.x - G.player.x;
  const dz = bounty.z - G.player.z;
  const dist = Math.hypot(dx, dz) || 1;
  const targetHeading = Math.atan2(dx, dz);
  let dh = targetHeading - bounty.heading;
  while (dh > Math.PI) dh -= Math.PI * 2;
  while (dh < -Math.PI) dh += Math.PI * 2;
  bounty.heading += Math.max(-2 * dt, Math.min(2 * dt, dh));
  bounty.speed = Math.min(24, bounty.speed + 10 * dt);
  bounty.x += Math.sin(bounty.heading) * bounty.speed * dt;
  bounty.z += Math.cos(bounty.heading) * bounty.speed * dt;
  bounty.x = Math.max(-200, Math.min(200, bounty.x));
  bounty.z = Math.max(-200, Math.min(200, bounty.z));
  bounty.mesh.position.set(bounty.x, 0, bounty.z);
  bounty.mesh.rotation.y = bounty.heading;
  // Ramming it down counts.
  if (G.car && dist < 3.4 && Math.abs(G.car.speed) > 6) {
    bounty.health -= 45 * dt;
    if (G.audio) G.audio.thud();
  }
  if (bounty.health <= 0) {
    G.scene.remove(bounty.mesh);
    G.bounty = null;
    G.cash += 400;
    addRespect(G, 30, 'vigilante takedown');
    if (G.audio) G.audio.chime();
    G.toast = 'Bounty down! +$400, +30 respect.';
    G.toastUntil = G.time + 3;
    if (G.missionActive && G.missionIndex === 9) G.missionGigs.vigilante = true;
  }
}

// A free-roam package pickup, used by the RESPECT RUN gigs.
export function spawnPickup(THREE, G) {
  const mesh = makeCache(THREE);
  const x = PLACES.market.x;
  const z = PLACES.market.z;
  mesh.position.set(x, 0, z);
  G.scene.add(mesh);
  G.waypoint = { x, z, label: 'PACKAGE PICKUP' };
  return { mesh, x, z };
}

export function checkPickup(G, pickup) {
  if (!pickup) return false;
  const d = Math.hypot(pickup.x - G.player.x, pickup.z - G.player.z);
  if (d < 3) {
    G.scene.remove(pickup.mesh);
    G.cash += 200;
    addRespect(G, 15, 'package pickup');
    if (G.missionActive && G.missionIndex === 9) G.missionGigs.pickup = true;
    G.toast = 'Package picked up! +$200';
    G.toastUntil = G.time + 3;
    return true;
  }
  return false;
}
