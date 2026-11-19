// Solara Bay — combat: four weapons, weapon wheel, shooting, enemies that
// shoot back, tracers, muzzle particles and floating hit feedback.

import * as THREE from 'three';
import { WEAPONS } from './config.js';
import { makePersonMesh } from './models.js';
import { addWanted } from './police.js';

export function createCombat(scene) {
  const group = new THREE.Group();
  scene.add(group);
  return {
    scene,
    group,
    enemies: [],   // {mesh, health, dead, shootTimer, x, z}
    tracers: [],   // {mesh, life}
    particles: [], // {mesh, vel, life}
    cooldown: 0,
    fireHeld: false,
  };
}

export function spawnEnemy(combat, x, z, health) {
  const mesh = makePersonMesh(0x8b0000, 0xd9a066);
  mesh.position.set(x, 0, z);
  combat.scene.add(mesh);
  const e = { mesh, health: health || 60, dead: false, shootTimer: 1 + Math.random() };
  combat.enemies.push(e);
  return e;
}

export function clearEnemies(combat) {
  for (const e of combat.enemies) combat.scene.remove(e.mesh);
  combat.enemies = [];
}

function spawnTracer(combat, from, to) {
  const dir = new THREE.Vector3().subVectors(to, from);
  const len = dir.length();
  const geo = new THREE.BoxGeometry(0.06, 0.06, len);
  const mat = new THREE.MeshBasicMaterial({ color: 0xffe14d });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.copy(from).addScaledVector(dir, 0.5);
  mesh.lookAt(to);
  combat.group.add(mesh);
  combat.tracers.push({ mesh, life: 0.09 });
}

export function spawnBurst(combat, pos, color, count) {
  for (let i = 0; i < count; i++) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.14),
      new THREE.MeshBasicMaterial({ color }));
    m.position.copy(pos);
    combat.group.add(m);
    combat.particles.push({
      mesh: m,
      vel: new THREE.Vector3((Math.random() - 0.5) * 8, Math.random() * 5, (Math.random() - 0.5) * 8),
      life: 0.5 + Math.random() * 0.3,
    });
  }
}

export function fireWeapon(combat, state, fromPos, aimAngle, audio) {
  const w = state.weapons[state.weaponIndex];
  if (combat.cooldown > 0 || w.ammoLeft <= 0) return false;
  combat.cooldown = w.rate;
  w.ammoLeft -= 1;
  state.shotsFired += 1;
  const from = new THREE.Vector3(fromPos.x, 1.4, fromPos.z);
  for (let p = 0; p < w.pellets; p++) {
    const a = aimAngle + (Math.random() - 0.5) * w.spread * 2;
    const to = new THREE.Vector3(
      from.x + Math.sin(a) * w.range,
      1.2,
      from.z + Math.cos(a) * w.range);
    spawnTracer(combat, from, to);
    // hit an enemy along the ray (rough: closest enemy within a cone)
    let best = null;
    let bestD = w.range;
    for (const e of combat.enemies) {
      if (e.dead) continue;
      const ex = e.mesh.position.x - from.x;
      const ez = e.mesh.position.z - from.z;
      const d = Math.hypot(ex, ez);
      if (d > w.range) continue;
      const ea = Math.atan2(ex, ez);
      let diff = Math.abs(ea - a);
      if (diff > Math.PI) diff = Math.PI * 2 - diff;
      if (diff < 0.12 && d < bestD) { bestD = d; best = e; }
    }
    if (best) {
      best.health -= w.damage;
      spawnBurst(combat, new THREE.Vector3(best.mesh.position.x, 1.4, best.mesh.position.z), 0xff4444, 6);
      if (best.health <= 0) {
        best.dead = true;
        best.mesh.visible = false;
        state.kills += 1;
      }
    }
    // hit the vigilante car
    if (state.vigilante && state.vigilante.alive) {
      const v = state.vigilante;
      const vx = v.x - from.x;
      const vz = v.z - from.z;
      const d = Math.hypot(vx, vz);
      const va = Math.atan2(vx, vz);
      let diff = Math.abs(va - a);
      if (diff > Math.PI) diff = Math.PI * 2 - diff;
      if (d < w.range && diff < 0.1) v.health -= w.damage;
    }
  }
  spawnBurst(combat, from.clone().add(new THREE.Vector3(Math.sin(aimAngle) * 1.2, 0, Math.cos(aimAngle) * 1.2)), 0xffcc33, 4);
  if (audio) audio.shot();
  addWanted(state, 0.25);
  return true;
}

export function updateCombat(combat, dt, state, playerPos, aimAngle) {
  combat.cooldown -= dt;
  // tracers fade
  for (let i = combat.tracers.length - 1; i >= 0; i--) {
    const t = combat.tracers[i];
    t.life -= dt;
    if (t.life <= 0) {
      combat.group.remove(t.mesh);
      combat.tracers.splice(i, 1);
    }
  }
  // particles fall and fade
  for (let i = combat.particles.length - 1; i >= 0; i--) {
    const p = combat.particles[i];
    p.life -= dt;
    p.mesh.position.addScaledVector(p.vel, dt);
    p.vel.y -= 12 * dt;
    if (p.life <= 0) {
      combat.group.remove(p.mesh);
      combat.particles.splice(i, 1);
    }
  }
  // enemies shoot back at the player
  for (const e of combat.enemies) {
    if (e.dead) continue;
    const dx = playerPos.x - e.mesh.position.x;
    const dz = playerPos.z - e.mesh.position.z;
    const dist = Math.hypot(dx, dz);
    e.mesh.rotation.y = Math.atan2(dx, dz);
    e.shootTimer -= dt;
    if (dist < 42 && e.shootTimer <= 0) {
      e.shootTimer = 1.4 + Math.random() * 0.8;
      const from = new THREE.Vector3(e.mesh.position.x, 1.4, e.mesh.position.z);
      const to = new THREE.Vector3(playerPos.x, 1.2, playerPos.z);
      spawnTracer(combat, from, to);
      if (Math.random() < 0.45) {
        const dmg = 6;
        if (state.armor > 0) {
          state.armor = Math.max(0, state.armor - dmg);
        } else {
          state.health -= dmg;
        }
        state.message = 'You are taking fire!';
        state.messageTimer = 1;
      }
    }
  }
}
