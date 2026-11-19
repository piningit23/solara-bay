// Solara Bay — the single shared game state object.
// Every module reads and writes this one object, so there are no circular imports.

export const G = {
  // three.js handles, filled by world.js / main.js
  scene: null, camera: null, renderer: null, clock: null,
  sun: null, hemi: null, neonLights: [],
  // run mode: 'title' | 'playing' | 'paused' | 'busted' | 'ending'
  mode: 'title',
  time: 0, dt: 0, seed: 1,
  dusk: false,               // night-mission lighting
  // player
  player: null,              // { mesh, pos, yaw, health, armor, speed }
  onFoot: true,
  car: null,                 // current driven car object or null
  // progression (saved)
  cash: 0,
  missionIndex: 0,           // 0-based index into MISSIONS; 12 = all done
  respect: 0,
  upgrades: {},              // { tires: true, armor: true, engine: true }
  cachesFound: 0,
  cacheTaken: [],            // indices of CACHE_SPOTS collected
  // live run state
  wanted: 0,
  wantedHeat: 0,             // 0..1, decays when hidden
  health: 100,
  armor: 0,
  nos: 100,
  busted: false,
  mission: null,             // live mission runtime state (see missions.js)
  // world entities
  cars: [],                  // parked + traffic + police car objects
  traffic: [],
  peds: [],
  police: [],                // police car objects chasing the player
  officers: [],              // on-foot officers
  roadblocks: [],
  enemies: [],               // armed mission enemies
  heli: null,                // helicopter object or null
  crew: null,                // Dante ally object or null
  taxi: null,                // active taxi fare { ped, dest }
  vigilante: null,           // active bounty car
  waypoint: null,            // { x, z } current objective marker
  waypointMesh: null,
  // combat
  weaponIndex: 0,
  weapons: [],               // per-weapon runtime { ammo, mag, reloading }
  wheelOpen: false,
  // radio
  station: 0,
  // ui hooks filled by hud.js
  hud: {},
  // misc
  shake: 0,
  messages: [],
  stats: { shots: 0, hits: 0, carsStolen: 0, takedowns: 0 },
};

export function resetRunState() {
  G.wanted = 0; G.wantedHeat = 0; G.health = 100; G.armor = 0; G.nos = 100;
  G.busted = false; G.mission = null; G.waypoint = null; G.onFoot = true; G.car = null;
}
