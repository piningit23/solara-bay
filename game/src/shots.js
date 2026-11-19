// Solara Bay — deterministic screenshot staging from the URL query string.
// ?shot=cover | on-foot | police | start  (plus ?seed=N for the city seed).
// Each value builds one fixed, busy scene so the screenshots are real
// renders of the game, never edited or composited.

import * as THREE from 'three';
import { G } from './state.js';
import { setWanted } from './police.js';
import { spawnHelicopter } from './helicopter.js';
import { spawnCrew } from './crew.js';
import { spawnRoadblock } from './police.js';
import { startMission } from './missions.js';
import { setDusk } from './world.js';
import { enterCar, nearestParkedCar } from './driving.js';
import { setCam } from './player.js';
import { spawnEnemy } from './combat.js';
import { GARAGE, LIGHTHOUSE, DOCKS } from './config.js';

export function applyShot(scene) {
  const q = new URLSearchParams(window.location.search);
  const shot = q.get('shot');
  const seed = Number(q.get('seed') || 1);
  G.seed = seed;
  if (!shot) return null;

  if (shot === 'start') {
    // title screen stays up; nothing to stage in-world
    return 'start';
  }

  if (shot === 'cover') {
    // Player driving a stolen car mid-chase on the east ring road (water on
    // one side, city on the other): 5 stars, helicopter overhead, two police
    // cars behind, roadblock ahead, Dante beside the player.
    setDusk(true);
    const car = nearestParkedCar(500) || G.cars[0];
    if (car) {
      car.pos.set(140, 0.3, 40);
      car.yaw = Math.PI;
      car.mesh.position.copy(car.pos);
      car.mesh.rotation.y = car.yaw;
      enterCar(car);
      car.speed = 18;
    }
    setWanted(5);
    spawnHelicopter(scene);
    if (G.heli) {
      // low and ahead-left so the helicopter is inside the frame
      G.heli.pos.set(136, 13, 6);
      G.heli.mesh.position.copy(G.heli.pos);
      G.heliFrozen = true;
    }
    spawnRoadblock();
    spawnCrew(scene);
    if (G.crew) {
      G.crew.pos.set(134, 0.3, 40);
      G.crew.mesh.position.copy(G.crew.pos);
      G.crew.yaw = Math.PI;
      G.crew.mesh.rotation.y = Math.PI;
    }
    // mission banner active
    G.missionIndex = 11;
    startMission(11);
    setCam(0, 0.32);
    G.coverCam = true;
    G.camBack = 15;
    G.camHeight = 6.5;
    return 'cover';
  }

  if (shot === 'on-foot') {
    // Busy street: player on foot at an intersection, traffic and
    // pedestrians placed ahead so the frame is full.
    G.player.pos.set(20, 0.3, 60);
    G.player.yaw = Math.PI;
    setCam(Math.PI, 0.4);
    G.camBack = 8;
    G.camHeight = 4;
    // pull traffic cars and pedestrians into the frame ahead of the player
    for (let i = 0; i < 3 && i < G.traffic.length; i++) {
      const t = G.traffic[i];
      t.pos.set(20, 0.3, 74 + i * 14);
      t.mesh.position.copy(t.pos);
      t.yaw = 0; t.mesh.rotation.y = 0; t.speed = 0;
    }
    for (let i = 0; i < 5 && i < G.peds.length; i++) {
      const p = G.peds[i];
      p.pos.set(28 + (i % 2) * 3, 0.3, 66 + i * 5);
      p.mesh.position.copy(p.pos);
      p.pause = 99;
    }
    // a taxi fare marker nearby
    import('./activities.js').then((a) => a.spawnTaxiFare());
    return 'on-foot';
  }

  if (shot === 'police') {
    // Mission moment: harbor crates, police closing in, helicopter in the sky.
    G.missionIndex = 2;
    startMission(2);
    G.player.pos.set(DOCKS.x - 6, 0.3, DOCKS.z + 20);
    setCam(0.4, 0.35);
    spawnEnemy(DOCKS.x - 10, DOCKS.z + 14, 60);
    spawnEnemy(DOCKS.x + 8, DOCKS.z + 10, 60);
    setWanted(3);
    spawnHelicopter(scene);
    if (G.heli) {
      G.heli.pos.set(DOCKS.x + 6, 10, DOCKS.z - 20);
      G.heli.mesh.position.copy(G.heli.pos);
      G.heliFrozen = true;
    }
    return 'police';
  }

  return shot;
}
