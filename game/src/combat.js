import * as THREE from 'three';
import { cylinder } from './render.js';
import { distance } from './config.js';

export class Effects {
  constructor(scene) {
    this.scene = scene;
    this.items = [];
  }
  burst(x, y, z, color, count = 10) {
    const geometry = new THREE.SphereGeometry(.16, 5, 4);
    const material = new THREE.MeshBasicMaterial({ color, transparent: true });
    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(x, y, z);
      this.scene.add(mesh);
      this.items.push({ mesh, vx: (Math.random() - .5) * 8, vy: Math.random() * 6, vz: (Math.random() - .5) * 8, life: .5 + Math.random() * .8 });
    }
  }
  update(dt) {
    for (const item of this.items) {
      item.life -= dt;
      item.vy -= dt * 8;
      item.mesh.position.x += item.vx * dt;
      item.mesh.position.y += item.vy * dt;
      item.mesh.position.z += item.vz * dt;
      item.mesh.material.opacity = Math.max(0, item.life);
      if (item.life <= 0) {
        this.scene.remove(item.mesh);
        this.items.splice(this.items.indexOf(item), 1);
      }
    }
  }
}

export function fireWeapon(game) {
  const { player } = game;
  if (player.reload > 0 || player.ammo <= 0) return;
  player.ammo--;
  player.lastShot = game.time;
  game.gunNoise = .4;
  game.audio.shot();
  game.effects.burst(player.x + Math.sin(player.heading) * 1.2, 1.7, player.z + Math.cos(player.heading) * 1.2, '#ffdc75', 8);
  game.cameraShake = .1;
  let target = null;
  let best = Infinity;
  for (const officer of [...game.police, ...game.enemies]) {
    const d = distance(officer, player);
    const alignment = Math.cos(player.headingTowardTarget(officer));
    if (alignment > .94 && d < best && d < 52) {
      target = officer;
      best = d;
    }
  }
  if (target) {
    target.health = (target.health ?? 3) - 1;
    game.effects.burst(target.x, 1.5, target.z, '#ff715d', 9);
    if (target.health <= 0) {
      if (target.police || target.onFoot) game.crime(1, 'OFFICER DOWN');
      else game.cash += 50;
      if (target.police) game.police = game.police.filter(item => item !== target);
      else game.enemies = game.enemies.filter(item => item !== target);
      if (target.mesh.parent) target.mesh.parent.remove(target.mesh);
    }
  }
  if (player.ammo === 0) game.notify('MAGAZINE EMPTY • R TO RELOAD');
}

export function reloadWeapon(game) {
  const p = game.player;
  if (p.reload > 0 || p.ammo >= 12 || p.reserve <= 0) return;
  p.reload = 1.1;
  game.notify('RELOADING');
  const fill = () => {
    const amount = Math.min(12 - p.ammo, p.reserve);
    p.ammo += amount;
    p.reserve -= amount;
  };
  p.completeReload = fill;
}

export function updateCombat(game, dt) {
  const p = game.player;
  if (p.reload > 0) {
    p.reload -= dt;
    if (p.reload <= 0) p.completeReload?.();
  }
  game.gunNoise = Math.max(0, game.gunNoise - dt);
  if (game.input.fire && !game.car && game.time - (p.lastShot || -1) > .23) fireWeapon(game);
  for (const enemy of game.enemies) {
    const d = distance(enemy, game.player);
    if (d < 34 && game.time - (enemy.lastShot || 0) > 1.6) {
      enemy.lastShot = game.time;
      game.hurt(game.car ? 2 : 5);
      game.effects.burst(game.player.x, 1, game.player.z, '#ff4945', 3);
    }
  }
  for (const mission of game.missions) {
    if (mission.type !== 'crate') continue;
    for (const crate of mission.crates) {
      crate.rotation.y += dt * .6;
      crate.position.y = 1.1 + Math.sin(game.time * 2 + crate.position.x) * .2;
    }
  }
}

export function addPickup(scene, x, z) {
  const pickup = cylinder(scene, x, .8, z, .8, 1.6, '#f6bd5b', .8);
  pickup.rotation.z = Math.PI / 2;
  return pickup;
}
