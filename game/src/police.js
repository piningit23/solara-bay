import * as THREE from 'three';
import { clamp, distance } from './config.js';
import { createCar, createPerson, animatePerson } from './models.js';

export function createPolice(scene, state) {
  const cars = [];
  const officers = [];
  const roadblocks = [];
  let spawnClock = 0;
  let roadblockCount = 0;
  function spawnCar(block = false, index = 0) {
    const target = state.player.car || state.player;
    const crime = state.player.lastCrime || { x: target.x, z: target.z };
    const angle = Math.atan2(target.x - crime.x, target.z - crime.z);
    const base = { x: target.x - Math.sin(angle) * (block ? 38 : 65), z: target.z - Math.cos(angle) * (block ? 38 : 65) };
    const offset = block ? (index - 1) * 6 : (cars.length % 3 - 1) * 6;
    const x = clamp(base.x + Math.sin(angle + Math.PI / 2) * offset, -169, 169);
    const z = clamp(base.z + Math.cos(angle + Math.PI / 2) * offset, -169, 169);
    const mesh = createCar('#eeeece', true, 1);
    mesh.position.set(x, 0, z);
    mesh.rotation.y = block ? angle : Math.atan2(target.x - x, target.z - z);
    scene.add(mesh);
    const car = { x, z, angle: mesh.rotation.y, speed: 0, mesh, block, health: 120, cooldown: 0, age: 0, ramTimer: 0, target: null };
    cars.push(car);
    if (block) roadblocks.push(car);
  }
  function spawnOfficer() {
    const player = state.player;
    const mesh = createPerson('#223e59', true);
    mesh.position.set(player.x + 16, 0, player.z - 14);
    scene.add(mesh);
    officers.push({ x: mesh.position.x, z: mesh.position.z, angle: Math.PI, mesh, health: 70, cooldown: 1, down: false });
  }
  function ensureUnits() {
    const desired = state.wanted ? Math.min(5, state.wanted + 1) : 0;
    while (cars.filter(car => !car.block && car.health > 0).length < desired) spawnCar();
    while (officers.filter(officer => !officer.down).length < (state.wanted >= 2 && !state.player.car ? Math.min(4, state.wanted) : 0)) spawnOfficer();
    if (state.wanted < 4) {
      for (const block of roadblocks) scene.remove(block.mesh);
      roadblocks.length = 0;
      roadblockCount = 0;
    } else if (roadblocks.length < (state.wanted >= 5 ? 3 : 2)) {
      const count = state.wanted >= 5 ? 3 : 2;
      for (let i = roadblocks.length; i < count; i++) spawnCar(true, i);
      roadblockCount++;
    }
  }
  function update(dt) {
    spawnClock -= dt;
    if (state.screenshotStage) {
      for (const cop of cars) {
        cop.mesh.userData.red.material.emissiveIntensity = 1.2 + Math.sin(state.time * 12) * 1.2;
        cop.mesh.userData.blue.material.emissiveIntensity = 1.2 + Math.sin(state.time * 12 + Math.PI) * 1.2;
      }
      return;
    }
    ensureUnits();
    const target = state.player.car || state.player;
    for (let index = cars.length - 1; index >= 0; index--) {
      const cop = cars[index];
      cop.age += dt;
      if (cop.health <= 0 || (state.wanted === 0 && cop.age > 4) || cop.age > 180) {
        scene.remove(cop.mesh);
        cars.splice(index, 1);
        const blockIndex = roadblocks.indexOf(cop);
        if (blockIndex >= 0) roadblocks.splice(blockIndex, 1);
        continue;
      }
      const d = distance(cop, target);
      if (!cop.block) {
        const desired = Math.atan2(target.x - cop.x, target.z - cop.z);
        const delta = Math.atan2(Math.sin(desired - cop.angle), Math.cos(desired - cop.angle));
        cop.angle += clamp(delta, -dt * 1.3, dt * 1.3);
        const speed = d < 9 ? 5 : 14 + state.wanted * 1.5;
        cop.speed += (speed - cop.speed) * dt * .7;
        if (d > 6) { cop.x += Math.sin(cop.angle) * cop.speed * dt; cop.z += Math.cos(cop.angle) * cop.speed * dt; }
        cop.ramTimer -= dt;
        if (state.player.car && d < 5.5 && cop.ramTimer <= 0) {
          const car = state.player.car;
          car.speed *= .52;
          car.health -= 16;
          state.player.health -= Math.max(2, 15 - state.player.armor * .05);
          state.shake = .35;
          state.audio.effect('hit');
          state.effects.burst(target.x, 1, target.z, '#ffc35d', 16, 7);
          cop.ramTimer = 2.2;
          state.toast('SBPD RAM / VEHICLE DAMAGE');
          if (car.health <= 0) state.bust('Vehicle disabled by SBPD');
        }
      } else {
        cop.speed = 0;
        cop.mesh.userData.red.material.emissiveIntensity = 1.2 + Math.sin(state.time * 12) * 1.2;
        cop.mesh.userData.blue.material.emissiveIntensity = 1.2 + Math.sin(state.time * 12 + Math.PI) * 1.2;
      }
      cop.mesh.position.set(cop.x, 0, cop.z);
      cop.mesh.rotation.y = cop.angle;
      cop.cooldown -= dt;
      if (!cop.block && d < 37 && cop.cooldown <= 0 && state.player.health > 0) {
        cop.cooldown = 1.7;
        state.combat.hitPlayer(7);
        state.effects.tracer(cop, target, '#ff7272');
        state.toast('SBPD: STOP THE VEHICLE!');
      }
    }
    for (const officer of officers) {
      if (officer.down) continue;
      const d = distance(officer, target);
      const angle = Math.atan2(target.x - officer.x, target.z - officer.z);
      officer.angle = angle;
      if (d > 2.6) { officer.x += Math.sin(angle) * 3.6 * dt; officer.z += Math.cos(angle) * 3.6 * dt; }
      officer.mesh.position.set(officer.x, 0, officer.z);
      officer.mesh.rotation.y = angle;
      animatePerson(officer.mesh, state.time, true);
      officer.cooldown -= dt;
      if (d < 27 && officer.cooldown <= 0) {
        officer.cooldown = 2.3;
        state.combat.hitPlayer(9);
        state.effects.tracer(officer, target, '#ffd39c');
      }
      if (d < 2.2 && !state.player.car) {
        state.player.busting += dt;
        if (state.player.busting > 3) state.bust('Mara was detained');
      }
    }
    const safehouse = Math.hypot(target.x + 144, target.z - 74) < 22;
    const outOfSight = safehouse || (cars.every(car => distance(car, target) > 42) && !state.helicopter.active);
    if (state.wanted && outOfSight) {
      state.heatTimer += dt;
      if (state.heatTimer > (safehouse ? 4 : 14)) { state.wanted--; state.heatTimer = 0; state.toast(safehouse ? 'SAFEHOUSE: HEAT CLEARED' : 'SEARCH GRID COOLING'); }
    } else state.heatTimer = 0;
  }
  return { cars, officers, roadblocks, update, spawnOfficer };
}
