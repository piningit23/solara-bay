// Solara Bay — the one shared mutable game state object.
// Every module reads and writes through this so nothing drifts apart.

import { WEAPONS } from './config.js';

export function createState() {
  return {
    // flow: 'title' | 'playing' | 'paused' | 'busted' | 'ended'
    screen: 'title',
    time: 0,
    dayTime: 0.55,            // 0..1 sun position; dusk when < 0.3 or night missions
    night: false,
    cash: 250,
    health: 100,
    armor: 0,
    wanted: 0,
    wantedFloat: 0,
    hiddenTimer: 0,
    respect: 0,
    caches: 0,
    cacheFound: [],
    missionIndex: 0,          // 0-based into MISSIONS
    missionStage: 0,
    missionTimer: 0,
    missionActive: false,
    missionDone: [],
    selectedMission: 0,
    onFoot: true,
    playerPos: { x: -40, z: -40 },
    playerAngle: 0,
    cameraAngle: 0,
    cameraPitch: 0.32,
    car: null,                // the car the player is driving
    carSpeed: 0,
    nos: 100,
    boosting: false,
    weaponIndex: 0,
    weapons: WEAPONS.map((w) => ({ ...w, ammoLeft: w.ammo })),
    wheelOpen: false,
    shopOpen: false,
    shopTab: 'items',
    upgrades: { tires: false, armor: false, engine: false },
    danteActive: false,
    dantePos: { x: -30, z: -30 },
    danteHealth: 100,
    taxi: null,               // { pickup:{x,z}, drop:{x,z}, passenger:false }
    vigilante: null,          // { car, alive }
    cratesLeft: 0,
    guardsLeft: 0,
    checkpoints: [],          // race checkpoints [{x,z,hit}]
    checkpointIndex: 0,
    gigs: { taxi: false, vigilante: false, package: false },
    message: '',
    messageTimer: 0,
    banner: '',
    bannerTimer: 0,
    kills: 0,
    bustedReason: '',
    endingText: '',
    shotsFired: 0,
    carsStolen: 0,
    save: null,
  };
}

export function rankFor(respect) {
  if (respect >= 800) return 'Queen of Solara';
  if (respect >= 400) return 'Respected';
  if (respect >= 150) return 'Street';
  return 'Drifter';
}

export function rankIndexFor(respect) {
  if (respect >= 800) return 3;
  if (respect >= 400) return 2;
  if (respect >= 150) return 1;
  return 0;
}
