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
    // Player driving a stolen car mid-chase: 5 stars, helicopter overhead,
    // two police cars behind, roadblock ahead, Dante beside the player.
    setDusk(true);
    const car = nearestParkedCar(500) || G.cars[0];
    if (car) {
      car.pos.set(-20, 0.3, 40);
      car.yaw = Math.PI;
      car.mesh.position.copy(car.pos);
      car.mesh.rotation.y = car.yaw;
      enterCar(car);
      car.speed = 18;
    }
    setWanted(5);
    spawnHelicopter(scene);
    if (G.heli) {
      G.heli.pos.set(-14, 30, 18);
      G.heli.mesh.position.copy(G.heli.pos);
    }
    spawnRoadblock();
    spawnCrew(scene);
    if (G.crew) {
      G.crew.pos.set(-14, 0.3, 40);
      G.crew.mesh.position.copy(G.crew.pos);
      G.crew.yaw = Math.PI;
      G.crew.mesh.rotation.y = Math.PI;
    }
    // mission banner active
    G.missionIndex = 11;
    startMission(11);
    setCam(0, 0.32);
    G.coverCam = true;
    return 'cover';
  }

  if (shot === 'on-foot') {
    // Busy street: player on foot, traffic and pedestrians around, taxi marker.
    G.player.pos.set(0, 0.3, 9);
    G.player.yaw = Math.PI;
    setCam(2.6, 0.4);
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
    return 'police';
  }

  return shot;
}
