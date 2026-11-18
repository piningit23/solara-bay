import { clamp, distance } from './config.js';
import { createPerson } from './models.js';

export const WEAPONS = [
  { name: 'PISTOL', capacity: 12, damage: 34, shots: 1, spread: .025, delay: .28, range: 80 },
  { name: 'SCATTERGUN', capacity: 6, damage: 22, shots: 6, spread: .14, delay: .72, range: 35 },
  { name: 'RAPID SMG', capacity: 32, damage: 13, shots: 1, spread: .065, delay: .095, range: 62 }
];
export function createCombat(scene, state) {
  const enemies = [];
  const firearms = [];
  let fireClock = 0;
  function spawnGuard(x, z, name = 'DOCK CREW') {
    const mesh = createPerson('#943f38', true);
    mesh.position.set(x, 0, z);
    scene.add(mesh);
    const enemy = { x, z, mesh, health: 75, cooldown: .5 + Math.random() * 2, name, down: false };
    enemies.push(enemy);
    return enemy;
  }
  function shoot() {
    if (state.player.car) return;
    const weapon = WEAPONS[state.player.weapon];
    const from = { x: state.player.x, y: 1.5, z: state.player.z };
    state.effects.burst(from.x, from.y, from.z, '#ffd28a', 5, 2.2);
    state.audio.effect('shot');
    state.pedestrians.fleeNear(from.x, from.z);
    state.raiseWanted(1, 'Discharge of firearm');
    for (let i = 0; i < weapon.shots; i++) {
      let angle = state.player.angle + (Math.random() - .5) * weapon.spread * 2;
      if (i === 0) angle = state.player.angle;
      const ray = { x: from.x + Math.sin(angle) * weapon.range, z: from.z + Math.cos(angle) * weapon.range };
      let nearest = null;
      let best = weapon.range;
      for (const target of [...enemies, ...state.police.officers, ...state.pedestrians.list.filter(p => !p.down)]) {
        const d = distance(from, target);
        if (d >= best) continue;
        const aim = Math.atan2(target.x - from.x, target.z - from.z);
        const diff = Math.abs(Math.atan2(Math.sin(aim - angle), Math.cos(aim - angle)));
        if (diff < .055 + weapon.spread * .4) { nearest = target; best = d; }
      }
      if (nearest) {
        nearest.health -= weapon.damage;
        state.effects.tracer(from, nearest, '#ffe98a');
        state.effects.burst(nearest.x, 1.4, nearest.z, '#ffc66c', 5, 3);
        state.feedback(`-${weapon.damage}`, nearest.x, nearest.z);
        if (nearest.health <= 0 && !nearest.down) {
          if (nearest.name) { nearest.down = true; nearest.mesh.rotation.z = Math.PI / 2; state.player.kills++; }
          else if (state.police.officers.includes(nearest)) { nearest.down = true; nearest.mesh.rotation.z = Math.PI / 2; state.raiseWanted(1, 'Officer down'); }
          else state.pedestrians.hit(nearest);
          state.missions.onKill(nearest);
        }
      } else state.effects.tracer(from, ray, '#ffe98a');
    }
  }
  function update(dt, input) {
    fireClock -= dt;
    if ((input.fire || input.tap('Space')) && fireClock <= 0 && !state.player.car) {
      const weapon = WEAPONS[state.player.weapon];
      if (state.player.ammo[state.player.weapon] > 0) {
        state.player.ammo[state.player.weapon]--;
        fireClock = weapon.delay;
        shoot();
      } else state.toast('OUT OF AMMO — R TO RELOAD AT THE SAFEHOUSE');
    }
    if (input.tap('Digit1')) state.player.weapon = 0;
    if (input.tap('Digit2')) state.player.weapon = 1;
    if (input.tap('Digit3')) state.player.weapon = 2;
    if (input.tap('KeyR')) {
      const weapon = WEAPONS[state.player.weapon];
      const missing = Math.max(0, weapon.capacity - state.player.ammo[state.player.weapon]);
      if (state.player.cash >= 15 && missing) {
        state.player.cash -= 15;
        state.player.ammo[state.player.weapon] = weapon.capacity;
        state.audio.effect('reload');
        state.toast(`${weapon.name} RELOADED`);
      }
    }
    for (const enemy of enemies) {
      if (enemy.down) continue;
      const d = distance(enemy, state.player.car || state.player);
      enemy.cooldown -= dt;
      if (d < 31 && enemy.cooldown <= 0) {
        enemy.cooldown = 1.3 + Math.random() * .8;
        hitPlayer(8);
        state.effects.tracer(enemy, state.player, '#ff9f75');
      }
    }
  }
  function hitPlayer(amount) {
    const reduction = Math.min(amount * .82, state.player.armor * .35);
    state.player.armor = Math.max(0, state.player.armor - amount * .2);
    state.player.health = Math.max(0, state.player.health - amount + reduction);
    state.damageFlash = .34;
    if (state.player.health <= 0 && state.wanted) state.bust('Mara was taken down in the pursuit');
  }
  function feedback(text, x, z) {
    const node = document.querySelector('#feedback');
    node.textContent = text;
    node.style.left = `${42 + Math.random() * 16}%`;
    node.style.top = `${48 + Math.random() * 10}%`;
    state.feedbackTimer = .5;
  }
  return { enemies, firearms, spawnGuard, update, hitPlayer, shoot };
}
