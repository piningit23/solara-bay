// Solara Bay — combat: four weapons (pistol, scattergun, rapid SMG,
// hunting rifle), weapon wheel on Tab, reload on R, ammo, enemies that
// shoot back, muzzle particles, damage flashes and floating feedback.

import * as THREE from 'three';
import { G } from './state.js';
import { WEAPONS } from './config.js';
import { makePersonMesh } from './models.js';
import { keys, pressed } from './input.js';
import { playShot, playHit } from './audio.js';
import { scarePedestrians } from './pedestrians.js';
import { addWanted, hurtPlayer } from './police.js';
import { carPos } from './driving.js';

export function initWeapons() {
  G.weapons = WEAPONS.map((w) => ({ ...w, ammo: w.ammo, mag: w.mag, reloading: 0, cooldown: 0 }));
  G.weaponIndex = 0;
}

export function currentWeapon() { return G.weapons[G.weaponIndex]; }

export function spawnEnemy(x, z, hp) {
  const mesh = makePersonMesh(0x8a2a2a, 0x222222);
  mesh.position.set(x, 0.3, z);
  G.scene.add(mesh);
  const e = { mesh, pos: mesh.position, yaw: 0, hp: hp || 60, shootTimer: 1 + Math.random() };
  G.enemies.push(e);
  return e;
}

export function clearEnemies() {
  for (const e of G.enemies) G.scene.remove(e.mesh);
  G.enemies = [];
}

// tracer line + muzzle flash, removed after a short life
const tracers = [];
export function spawnTracer(from, to, color) {
  const geo = new THREE.BufferGeometry().setFromPoints([from.clone(), to.clone()]);
  const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.9 }));
  G.scene.add(line);
  tracers.push({ line, life: 0.12 });
}

export function updateTracers(dt) {
  for (let i = tracers.length - 1; i >= 0; i--) {
    tracers[i].life -= dt;
    if (tracers[i].life <= 0) {
      G.scene.remove(tracers[i].line);
      tracers.splice(i, 1);
    }
  }
}

function shoot() {
  const w = currentWeapon();
  if (!w || w.cooldown > 0 || w.reloading > 0) return;
  if (w.mag <= 0) { startReload(); return; }
  w.mag--;
  w.cooldown = w.rate;
  G.stats.shots++;
  playShot(w.id);
  const origin = G.onFoot ? G.player.pos.clone().setY(1.5) : G.car.pos.clone().setY(1.2);
  // aim from the camera: forward ray from the camera through screen centre
  const dir = new THREE.Vector3();
  G.camera.getWorldDirection(dir);
  const pp = carPos();
  scarePedestrians(pp.x, pp.z, 30);
  if (G.wanted < 1) addWanted(1, 'Shots fired');
  for (let p = 0; p < w.pellets; p++) {
    const d = dir.clone();
    d.x += (Math.random() - 0.5) * w.spread * 2;
    d.y += (Math.random() - 0.5) * w.spread * 2;
    d.z += (Math.random() - 0.5) * w.spread * 2;
    d.normalize();
    const end = origin.clone().addScaledVector(d, w.range);
    // hit test: enemies, officers, vigilante car, police cars
    let hit = null, hitDist = w.range;
    const targets = [];
    for (const e of G.enemies) targets.push({ pos: e.pos, radius: 1.2, obj: e, kind: 'enemy' });
    for (const o of G.officers) targets.push({ pos: o.pos, radius: 1.2, obj: o, kind: 'officer' });
    if (G.vigilante) targets.push({ pos: G.vigilante.pos, radius: 2.2, obj: G.vigilante, kind: 'vigilante' });
    for (const t of targets) {
      const to = t.pos.clone().sub(origin);
      const along = to.dot(d);
      if (along < 0 || along > w.range) continue;
      const perp = to.clone().addScaledVector(d, -along).length();
      if (perp < t.radius && along < hitDist) { hit = t; hitDist = along; }
    }
    if (hit) {
      end.copy(origin).addScaledVector(d, hitDist);
      hit.obj.hp -= w.damage;
      G.stats.hits++;
      playHit();
      G.messages.push('HIT — ' + w.name + ' ' + w.damage + ' dmg');
      if (hit.kind === 'enemy' && hit.obj.hp <= 0) {
        G.scene.remove(hit.obj.mesh);
        G.enemies.splice(G.enemies.indexOf(hit.obj), 1);
        G.stats.takedowns++;
        G.messages.push('Guard down.');
      }
      if (hit.kind === 'officer' && hit.obj.hp <= 0) {
        G.scene.remove(hit.obj.mesh);
        G.officers.splice(G.officers.indexOf(hit.obj), 1);
        addWanted(1, 'Officer down');
      }
      if (hit.kind === 'vigilante') {
        hit.obj.hp -= w.damage;
      }
    }
    spawnTracer(origin, end, w.color);
  }
  G.shake = Math.min(0.4, G.shake + 0.08);
}

function startReload() {
  const w = currentWeapon();
  if (w.reloading > 0 || w.ammo <= 0 || w.mag >= w.magSize) return;
  w.reloading = w.reload;
}

export function updateCombat(dt) {
  const w = currentWeapon();
  if (!w) return;
  w.cooldown = Math.max(0, w.cooldown - dt);
  if (w.reloading > 0) {
    w.reloading -= dt;
    if (w.reloading <= 0) {
      const need = WEAPONS[G.weaponIndex].mag - w.mag;
      const take = Math.min(need, w.ammo);
      w.mag += take;
      w.ammo -= take;
      w.reloading = 0;
    }
  }
  // weapon switching 1–4
  for (let i = 0; i < 4; i++) {
    if (pressed['Digit' + (i + 1)]) { G.weaponIndex = i; G.wheelOpen = false; }
  }
  if (pressed['KeyR']) startReload();
  // weapon wheel: hold Tab
  G.wheelOpen = !!keys['Tab'];
  // fire on click (hold for SMG)
  if (clickPending || (mouseDownHeld() && w.id === 'smg')) shoot();
  clickPending = false;
  // enemies shoot back
  for (const e of [...G.enemies]) {
    const pp = carPos();
    const d = Math.hypot(e.pos.x - pp.x, e.pos.z - pp.z);
    e.yaw = Math.atan2(pp.x - e.pos.x, pp.z - e.pos.z);
    e.mesh.rotation.y = e.yaw;
    e.shootTimer -= dt;
    if (d < 40 && e.shootTimer <= 0) {
      e.shootTimer = 1.4 + Math.random();
      const from = e.pos.clone().setY(1.4);
      const to = pp.clone().setY(1.2);
      spawnTracer(from, to, 0xff5544);
      if (Math.random() < 0.55) hurtPlayer(7);
    }
    // guards close in slowly
    if (d > 12 && d < 50) {
      e.pos.x += Math.sin(e.yaw) * 2.2 * dt;
      e.pos.z += Math.cos(e.yaw) * 2.2 * dt;
      e.mesh.position.copy(e.pos);
    }
  }
  updateTracers(dt);
}

let mouseHeld = false;
let clickPending = false;
export function setMouseHeld(v) { mouseHeld = v; }
export function queueClick() { clickPending = true; }
function mouseDownHeld() { return mouseHeld; }
