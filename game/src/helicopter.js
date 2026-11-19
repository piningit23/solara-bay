// Police helicopter: spawns at 3+ stars, circles above the player, follows
// at speed, shines a visible spotlight cone, plays rotor sound and shows as
// an "H" marker on the minimap. Despawns below 3 stars.

import { makeHelicopter } from './models.js';

export function updateHelicopter(THREE, G, dt) {
  const want = G.wanted >= 3;
  if (want && !G.heli) {
    const mesh = makeHelicopter(THREE);
    G.scene.add(mesh);
    G.heli = { mesh, angle: Math.random() * Math.PI * 2, rotor: mesh.getObjectByName('rotor') };
    if (G.audio) G.audio.setRotor(true);
    G.toast = 'Police helicopter overhead!';
    G.toastUntil = G.time + 2.5;
  }
  if (!want && G.heli) {
    G.scene.remove(G.heli.mesh);
    G.heli = null;
    if (G.audio) G.audio.setRotor(false);
  }
  if (!G.heli) return;
  const heli = G.heli;
  // Staged shots park the helicopter at a fixed spot inside the frame,
  // so the cover and mission screenshots actually show it.
  if (G.shot === 'cover') {
    heli.mesh.position.set(G.player.x - 14, 14, G.player.z - 14);
    heli.mesh.rotation.y = Math.atan2(G.player.x - heli.mesh.position.x, G.player.z - heli.mesh.position.z);
    if (heli.rotor) heli.rotor.rotation.y += dt * 28;
    return;
  }
  if (G.shot === 'mission') {
    heli.mesh.position.set(G.player.x + 20, 13, G.player.z - 8);
    heli.mesh.rotation.y = Math.atan2(G.player.x - heli.mesh.position.x, G.player.z - heli.mesh.position.z);
    if (heli.rotor) heli.rotor.rotation.y += dt * 28;
    return;
  }
  heli.angle += dt * 0.45;
  const radius = 26;
  const hx = G.player.x + Math.cos(heli.angle) * radius;
  const hz = G.player.z + Math.sin(heli.angle) * radius;
  heli.mesh.position.set(hx, 30, hz);
  heli.mesh.rotation.y = Math.atan2(G.player.x - hx, G.player.z - hz);
  if (heli.rotor) heli.rotor.rotation.y += dt * 28;
  // The spotlight pool stays under the helicopter, sweeping the street.
  const cone = heli.mesh.getObjectByName('spotcone');
  if (cone) cone.material.opacity = 0.12 + Math.sin(G.time * 3) * 0.04;
}
