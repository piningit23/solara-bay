import * as THREE from 'three';
import { createCar, createPerson, label } from './models.js';
import { GARAGE } from './config.js';

export function stageScreenshot(state, params) {
  const shot = params.get('shot');
  if (!shot || shot === 'start') return shot;
  state.screenshotStage = shot;
  state.wanted = 0;
  state.player.health = 100;
  state.player.armor = 70;
  const player = state.player;
  player.x = shot === 'police' ? 144 : shot === 'on-foot' ? -72 : 0;
  player.z = shot === 'police' ? -60 : shot === 'on-foot' ? 40 : 0;
  if (shot !== 'on-foot' && shot !== 'police') {
    const car = state.driving.parked[6];
    car.x = player.x;
    car.z = player.z;
    car.angle = 0;
    car.mesh.position.set(car.x, 0, car.z);
    car.mesh.rotation.y = car.angle;
    state.driving.enter(car);
  }
  if (shot === 'on-foot') {
    player.mesh.position.set(player.x, 0, player.z);
    state.player.angle = Math.PI / 2;
  }
  if (shot === 'police') {
    state.missions.start(2);
  }
  if (shot === 'cover') {
    state.driving.parked[0].x = 0;
    state.driving.parked[0].z = 0;
    state.driving.parked[0].mesh.position.set(0, 0, 0);
    state.driving.parked[0].mesh.rotation.y = Math.PI / 2;
    state.driving.parked[0].angle = Math.PI / 2;
    state.wanted = 3;
    state.missions.start(1);
    state.wanted = 3;
    state.player.car.speed = 11;
    state.player.car.angle = Math.PI / 2;
    state.player.car.mesh.rotation.y = Math.PI / 2;
    state.player.cash = 4650;
    state.radio.cycle();
    state.radio.cycle();
    state.screenshotStage = null;
    state.police.update(0.01);
    state.screenshotStage = shot;
    state.police.cars.forEach((cop, i) => {
      if (i < 2) { cop.x = player.x + (i ? 8 : -8); cop.z = player.z - 42 - i * 9; cop.angle = 0; cop.mesh.position.set(cop.x, 0, cop.z); cop.mesh.rotation.y = 0; }
    });
    state.helicopter.active = true;
    state.helicopter.root.visible = true;
    state.helicopter.root.position.set(player.x + 17, 31, player.z - 8);
    state.helicopter.root.rotation.y = -.8;
  }
  if (shot === 'police') {
    state.wanted = 3;
    state.screenshotStage = null;
    state.police.update(.01);
    state.screenshotStage = shot;
    state.helicopter.active = true;
    state.helicopter.root.visible = true;
    state.helicopter.root.position.set(player.x + 20, 34, player.z - 17);
    state.player.mesh.visible = true;
    for (let i = 0; i < 4; i++) {
      const guard = state.combat.spawnGuard(139 + i * 5, -111 - (i % 2) * 9);
      guard.name = 'DOCK CREW';
    }
  }
  return shot;
}
