// Crew ally: Dante Reyes. During crew missions (9 and 12) he follows the
// player in his own car, rams chasing police cars and shoots at enemies on
// foot. He shows as a "D" marker on the minimap and a DANTE — CREW indicator
// on the HUD, and his car is staged beside the player's in the cover shot.

import { makeCar, makePerson } from './models.js';

const DANTE_COLOR = 0x8e44ad;

export function spawnDante(THREE, G, x, z) {
  if (G.dante) return G.dante;
  const mesh = makeCar(THREE, DANTE_COLOR);
  mesh.position.set(x, 0, z);
  G.scene.add(mesh);
  const driver = makePerson(THREE, 0x2c3e50);
  driver.position.set(x + 3, 0, z);
  G.scene.add(driver);
  G.dante = {
    mesh, driver, x, z, heading: 0, speed: 0, active: true,
    shootCooldown: 0,
  };
  return G.dante;
}

export function despawnDante(G) {
  if (!G.dante) return;
  G.scene.remove(G.dante.mesh);
  G.scene.remove(G.dante.driver);
  G.dante = null;
}

export function updateCrew(G, dt) {
  const dante = G.dante;
  if (!dante || !dante.active) return;
  // Cover staging: keep Dante's car parked beside the player in frame.
  if (G.shot === 'cover') {
    dante.x = G.player.x + 6;
    dante.z = G.player.z + 6;
    dante.heading = G.player.heading;
    dante.mesh.position.set(dante.x, 0, dante.z);
    dante.mesh.rotation.y = dante.heading;
    dante.driver.position.set(dante.x + 3, 0, dante.z);
    return;
  }
  // Follow a point just behind and beside the player.
  const followX = G.player.x - Math.sin(G.player.heading) * 7 + Math.cos(G.player.heading) * 5;
  const followZ = G.player.z - Math.cos(G.player.heading) * 7 - Math.sin(G.player.heading) * 5;
  const dx = followX - dante.x;
  const dz = followZ - dante.z;
  const dist = Math.hypot(dx, dz) || 1;
  const targetHeading = Math.atan2(dx, dz);
  let dh = targetHeading - dante.heading;
  while (dh > Math.PI) dh -= Math.PI * 2;
  while (dh < -Math.PI) dh += Math.PI * 2;
  dante.heading += Math.max(-2.6 * dt, Math.min(2.6 * dt, dh));
  const top = dist > 25 ? 30 : 20;
  dante.speed = Math.min(top, dante.speed + 18 * dt);
  if (dist < 3) dante.speed = Math.max(0, dante.speed - 20 * dt);
  dante.x += Math.sin(dante.heading) * dante.speed * dt;
  dante.z += Math.cos(dante.heading) * dante.speed * dt;
  dante.mesh.position.set(dante.x, 0, dante.z);
  dante.mesh.rotation.y = dante.heading;
  dante.driver.position.set(dante.x + 3, 0, dante.z);
  // Ram chasing police cars that get close to the player.
  for (const cop of G.policeCars) {
    const cd = Math.hypot(cop.x - dante.x, cop.z - dante.z);
    if (cd < 4) {
      const push = Math.atan2(cop.x - dante.x, cop.z - dante.z);
      cop.x += Math.sin(push) * 26 * dt;
      cop.z += Math.cos(push) * 26 * dt;
      cop.speed = Math.max(4, cop.speed - 14 * dt);
      if (G.audio) G.audio.thud();
    }
  }
  // Shoot at mission guards on foot while Dante is active.
  dante.shootCooldown -= dt;
  if (dante.shootCooldown <= 0 && G.guards.length > 0) {
    const guard = G.guards[0];
    const gd = Math.hypot(guard.x - dante.x, guard.z - dante.z);
    if (gd < 55) {
      guard.health -= 18;
      dante.shootCooldown = 1.4;
      if (G.audio) G.audio.shot('pistol');
      if (guard.health <= 0) {
        G.scene.remove(guard.mesh);
        G.guards.splice(G.guards.indexOf(guard), 1);
        G.missionGuardsDown += 1;
      }
    }
  }
}
