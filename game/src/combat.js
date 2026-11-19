// Combat: four weapons, per-weapon ammo, reload, enemies that shoot back,
// damage flashes and floating feedback. Tab holds the weapon wheel.

import { WEAPONS } from './config.js';
import { keyDown, takeClick } from './input.js';

export function currentWeapon(G) {
  return WEAPONS[G.weaponIndex];
}

export function currentAmmo(G) {
  return G.weapons[G.weaponIndex];
}

export function selectWeapon(G, index) {
  if (index < 0 || index >= WEAPONS.length) return;
  G.weaponIndex = index;
  G.toast = `${WEAPONS[index].name} ready — ${G.weapons[index].ammo} in the mag`;
  G.toastUntil = G.time + 1.5;
}

export function reloadWeapon(G) {
  const slot = G.weapons[G.weaponIndex];
  const def = WEAPONS[G.weaponIndex];
  const need = def.mag - slot.ammo;
  const take = Math.min(need, slot.reserve);
  if (take <= 0) {
    G.toast = 'No reserve ammo — visit the safehouse shop (F).';
    G.toastUntil = G.time + 2;
    return;
  }
  slot.ammo += take;
  slot.reserve -= take;
  G.toast = `${def.name} reloaded — ${slot.ammo}/${slot.reserve} left`;
  G.toastUntil = G.time + 1.5;
  if (G.audio) G.audio.chime();
}

// Hitscan shooting from the camera direction. Returns true if a shot fired.
export function tryShoot(G) {
  const now = G.time;
  const def = currentWeapon(G);
  const slot = currentAmmo(G);
  if (G._shootCooldown && now < G._shootCooldown) return false;
  G._shootCooldown = now + def.rate;
  if (slot.ammo <= 0) {
    G.toast = 'Empty! Press R to reload.';
    G.toastUntil = G.time + 1.5;
    return false;
  }
  slot.ammo -= 1;
  if (G.audio) G.audio.shot(def.id);
  // Muzzle flash particle at the player.
  spawnMuzzle(G);
  // Fire a hitscan along the camera forward direction.
  const dirX = Math.sin(G.player.heading);
  const dirZ = Math.cos(G.player.heading);
  const pellets = def.pellets || 1;
  for (let p = 0; p < pellets; p++) {
    const spread = (Math.random() - 0.5) * def.spread * 2;
    const sx = Math.sin(G.player.heading + spread);
    const sz = Math.cos(G.player.heading + spread);
    void dirX; void dirZ;
    hitTargets(G, sx, sz, def);
  }
  // Firing a weapon in public is a crime.
  if (G.wanted < 5 && Math.random() < 0.6) G.wanted = Math.min(5, G.wanted + 1);
  return true;
}

function hitTargets(G, dirX, dirZ, def) {
  const targets = [];
  for (const guard of G.guards) targets.push({ x: guard.x, z: guard.z, obj: guard, kind: 'guard' });
  for (const off of G.officers) targets.push({ x: off.x, z: off.z, obj: off, kind: 'officer' });
  for (const cop of G.policeCars) targets.push({ x: cop.x, z: cop.z, obj: cop, kind: 'copcar' });
  if (G.bounty) targets.push({ x: G.bounty.x, z: G.bounty.z, obj: G.bounty, kind: 'bounty' });
  for (const t of targets) {
    const dx = t.x - G.player.x;
    const dz = t.z - G.player.z;
    const dist = Math.hypot(dx, dz);
    if (dist > def.range) continue;
    const dot = (dx * dirX + dz * dirZ) / (dist || 1);
    if (dot < 0.94) continue;
    // A hit lands.
    if (t.kind === 'guard' || t.kind === 'officer') {
      t.obj.health -= def.damage;
      flashTarget(G, t.obj);
      if (t.obj.health <= 0) {
        if (t.kind === 'guard') {
          G.scene.remove(t.obj.mesh);
          G.guards.splice(G.guards.indexOf(t.obj), 1);
          G.missionGuardsDown += 1;
          G.toast = 'Guard down!';
          G.toastUntil = G.time + 1.5;
        } else {
          G.scene.remove(t.obj.mesh);
          G.officers.splice(G.officers.indexOf(t.obj), 1);
          G.wanted = Math.min(5, G.wanted + 1);
          G.toast = 'Cop down! Wanted up.';
          G.toastUntil = G.time + 2;
        }
      }
    } else if (t.kind === 'copcar') {
      t.obj.speed = Math.max(4, t.obj.speed - 8);
      if (G.audio) G.audio.thud();
    } else if (t.kind === 'bounty') {
      t.obj.health -= def.damage;
      if (G.audio) G.audio.thud();
    }
    return;
  }
}

function spawnMuzzle(G) {
  const geo = new (G.THREE.SphereGeometry)(0.3, 6, 6);
  const mat = new (G.THREE.MeshBasicMaterial)({ color: 0xffe9a0 });
  const mesh = new (G.THREE.Mesh)(geo, mat);
  mesh.position.set(
    G.player.x + Math.sin(G.player.heading) * 1.2,
    1.4,
    G.player.z + Math.cos(G.player.heading) * 1.2,
  );
  G.scene.add(mesh);
  G.particles.push({ mesh, life: 0.12 });
}

function flashTarget(G, target) {
  if (!target.mesh) return;
  target.mesh.traverse((child) => {
    if (child.material && child.material.emissive) {
      child.material.emissive.setHex(0xaa0000);
      setTimeout(() => child.material.emissive.setHex(0x000000), 120);
    }
  });
}

// Mission guards shoot back at the player when close enough.
export function updateGuards(G, dt) {
  for (const guard of G.guards) {
    const dx = G.player.x - guard.x;
    const dz = G.player.z - guard.z;
    const dist = Math.hypot(dx, dz) || 1;
    guard.mesh.rotation.y = Math.atan2(dx, dz);
    guard.shootCooldown -= dt;
    if (dist < 45 && guard.shootCooldown <= 0) {
      guard.shootCooldown = 1.6 + Math.random();
      if (dist < 38) {
        G.health -= 6 + Math.random() * 4;
        G.toast = 'Taking fire from the dock crew!';
        G.toastUntil = G.time + 1.5;
        if (G.audio) G.audio.shot('pistol');
      }
    }
    // Guards hold their ground but step toward the player when far.
    if (dist > 30) {
      guard.x += (dx / dist) * 2.2 * dt;
      guard.z += (dz / dist) * 2.2 * dt;
      guard.mesh.position.set(guard.x, 0, guard.z);
    }
  }
}

// Per-frame combat input: wheel, weapon keys, reload, firing.
export function updateCombatInput(G, dt) {
  const input = G.input;
  G.wheelOpen = keyDown(input, 'Tab');
  if (keyDown(input, 'Digit1')) selectWeapon(G, 0);
  if (keyDown(input, 'Digit2')) selectWeapon(G, 1);
  if (keyDown(input, 'Digit3')) selectWeapon(G, 2);
  if (keyDown(input, 'Digit4')) selectWeapon(G, 3);
  if (keyDown(input, 'KeyR')) {
    if (!G._reloadHeld) { reloadWeapon(G); G._reloadHeld = true; }
  } else {
    G._reloadHeld = false;
  }
  const def = currentWeapon(G);
  const firing = def.auto ? input.mouseDown : takeClick(input);
  if (firing && G.mode === 'playing') tryShoot(G);
}
