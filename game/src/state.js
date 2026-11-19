// The single shared game state. Every module reads and writes this object,
// so there is one place to see what the game is doing right now.

import { WEAPONS } from './config.js';

export function createState() {
  return {
    // Flow: 'title' | 'playing' | 'paused' | 'busted' | 'ended'
    mode: 'title',
    time: 0,
    dusk: false,
    cash: 200,
    health: 100,
    wanted: 0,
    wantedHeat: 0, // 0..1, builds while police can see the player
    respect: 0,
    cachesFound: 0,
    upgrades: { tires: false, armor: false, engine: false },
    missionIndex: 0, // 0-based into MISSIONS; 12 means the story is done
    missionActive: false,
    missionStep: 0,
    missionTimer: 0,
    missionCrates: 0,
    missionGuardsDown: 0,
    missionGigs: { taxi: false, vigilante: false, pickup: false },
    missionCheckpoints: [],
    missionCheckpoint: 0,
    missionDone: false,
    // Player on foot
    player: {
      x: -140, z: -120, heading: 0, speed: 0,
      onFoot: true, car: null, mesh: null,
    },
    // The car the player is driving (null on foot)
    car: null,
    // Weapon state, one entry per weapon in WEAPONS
    weapons: WEAPONS.map((w) => ({ id: w.id, ammo: w.mag, reserve: w.mag * 3 })),
    weaponIndex: 0,
    wheelOpen: false,
    nos: 100,
    boosting: false,
    // Entities the world updates
    traffic: [],
    peds: [],
    policeCars: [],
    officers: [],
    roadblocks: [],
    guards: [],
    crates: [],
    caches: [],
    parkedCars: [],
    taxi: null,
    bounty: null,
    dante: null, // crew ally, { mesh, car, active }
    heli: null,
    particles: [],
    // Waypoint the mission banner points at
    waypoint: null,
    // Camera orbit offsets from the mouse
    camYaw: 0,
    camPitch: 0.32,
    camBoost: 1, // staging can pull the camera further back
    // Transient messages
    toast: '',
    toastUntil: 0,
    bustedReason: '',
    // Three.js handles, filled in by main.js
    scene: null,
    camera: null,
    renderer: null,
    sun: null,
    hemi: null,
    world: null,
    // Subsystem handles
    audio: null,
    radio: null,
    input: null,
    shot: null, // ?shot= value, or null
    seed: 1,
  };
}
