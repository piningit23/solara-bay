// Solara Bay — shared constants for the whole game.
// One place for every number the other modules agree on.

export const CITY = {
  half: 150,          // city extends -150..150 on x and z
  block: 30,          // block size
  road: 10,           // road width
  waterLevel: -0.4,
};

export const PLAYER = {
  walkSpeed: 7,
  runSpeed: 12,
  radius: 0.6,
  maxHealth: 100,
};

export const CAR = {
  accel: 22,
  brake: 34,
  maxSpeed: 34,
  maxSpeedEngine: 44,
  reverseSpeed: 10,
  turnRate: 1.9,
  grip: 0.92,
  gripTires: 0.97,
};

export const WANTED = {
  max: 5,
  decayDelay: 6,      // seconds out of police sight before decay starts
  decayRate: 0.12,    // stars per second while hidden
  safehouseRate: 0.6, // stars per second inside the garage zone
};

export const GARAGE = { x: -52, z: -52, radius: 18 };

export const LIGHTHOUSE = { x: 0, z: -138 };

export const NEON_STRIP = { x0: 20, z0: 40, x1: 90, z1: 70 };

export const RESPECT_RANKS = [
  { name: 'Drifter', min: 0 },
  { name: 'Street', min: 150 },
  { name: 'Respected', min: 400 },
  { name: 'Queen of Solara', min: 800 },
];

export const UPGRADES = [
  { id: 'tires', name: 'Racing Tires', price: 400, rank: 'Street',
    desc: 'Better grip in corners' },
  { id: 'armor', name: 'Armor Plating', price: 600, rank: 'Respected',
    desc: 'Car takes less damage' },
  { id: 'engine', name: 'Engine Tune', price: 800, rank: 'Queen of Solara',
    desc: 'Higher top speed' },
];

export const SHOP_ITEMS = [
  { id: 'armor', name: 'Body Armor', price: 300, desc: 'Restore 50 armor' },
  { id: 'ammo', name: 'Ammo Pack', price: 150, desc: 'Refill all weapons' },
  { id: 'repair', name: 'Repair Car', price: 200, desc: 'Fix your car to full' },
];

export const WEAPONS = [
  { id: 'pistol', name: 'Pistol', key: '1', damage: 25, rate: 0.28,
    range: 60, spread: 0.02, pellets: 1, ammo: 120, auto: false },
  { id: 'scattergun', name: 'Scattergun', key: '2', damage: 14, rate: 0.9,
    range: 26, spread: 0.09, pellets: 6, ammo: 36, auto: false },
  { id: 'smg', name: 'Rapid SMG', key: '3', damage: 11, rate: 0.09,
    range: 45, spread: 0.05, pellets: 1, ammo: 240, auto: true },
  { id: 'rifle', name: 'Hunting Rifle', key: '4', damage: 80, rate: 1.1,
    range: 140, spread: 0.004, pellets: 1, ammo: 24, auto: false },
];

export const MISSIONS = [
  { id: 1, name: 'FIRST WHEELS', type: 'steal', reward: 500,
    text: 'Mara Vale owes the harbor crew. First: steal a car and bring it to the old garage.',
    hint: 'Press E near a parked car to steal it, then drive to the garage marker.' },
  { id: 2, name: 'BAYFRONT DROP', type: 'drop', reward: 900,
    text: 'A sealed package has to cross town. One star of heat is already on you.',
    hint: 'Drive to the drop marker across town. Stay out of police sight.' },
  { id: 3, name: 'HARBOR HEIST', type: 'crate', reward: 1500,
    text: 'Three crates wait at the docks. The dock crew is armed and watching.',
    hint: 'Collect all 3 crates at the docks. Watch for armed guards.' },
  { id: 4, name: 'MIDNIGHT COURIER', type: 'timed', reward: 1800,
    text: 'A night delivery, timed. Reach the far drop before the countdown ends.',
    hint: 'Reach the drop marker before the timer hits zero. 2-star heat.' },
  { id: 5, name: 'DOCKSIDE PAYBACK', type: 'crew', reward: 2000,
    text: 'The dock crew took Mara\'s ledger. Take it back — all four guards.',
    hint: 'Defeat the 4 armed guards at the docks and grab the ledger.' },
  { id: 6, name: 'THE GETAWAY', type: 'escape', reward: 2200,
    text: 'Three stars and the whole island is looking for you. Lose them, then come home.',
    hint: 'Lose the 3-star wanted level, then return to the safehouse garage.' },
  { id: 7, name: 'ISLAND LOOP', type: 'race', reward: 3000,
    text: 'A checkpoint race around the island ring road. Beat the clock.',
    hint: 'Hit every checkpoint in order before time runs out.' },
  { id: 8, name: 'KING OF SOLARA', type: 'final', reward: 5000,
    text: 'Run to the lighthouse with 4-star heat on your tail. Finish the week.',
    hint: 'Reach the lighthouse with 4-star heat. Survive the chase.' },
  { id: 9, name: 'THE CREW', type: 'escort', reward: 2800,
    text: 'Dante Reyes wants in. Escort his car across town while rivals chase.',
    hint: 'Stay close to Dante\'s car. Rivals will try to ram him off the road.' },
  { id: 10, name: 'RESPECT RUN', type: 'gigs', reward: 3200,
    text: 'Three side gigs in one run: a taxi fare, a vigilante takedown, a package pickup.',
    hint: 'Finish all three gigs: taxi, vigilante, package.' },
  { id: 11, name: 'NEON LOOP', type: 'race', reward: 4000,
    text: 'A night checkpoint race through the neon strip. 3-star heat, full throttle.',
    hint: 'Hit every neon checkpoint in order before time runs out.' },
  { id: 12, name: 'QUEEN OF SOLARA', type: 'final', reward: 8000,
    text: 'The finale. The lighthouse, 5-star heat, helicopter and roadblocks — with Dante at your back.',
    hint: 'Reach the lighthouse with 5-star heat. Dante is backing you up.' },
];

export const CACHE_SPOTS = [
  [-120, -120], [120, -110], [-135, 40], [135, 90], [-90, 120],
  [60, -125], [-30, 135], [100, 20], [-140, -30], [0, -132],
];

export const COLORS = {
  sky: 0x87bfe8, haze: 0xf2c98a, water: 0x1e6f8e, sand: 0xe8d29a,
  road: 0x3a3a40, sidewalk: 0x9a9a92, grass: 0x5d9b4a,
  buildingPalette: [0xd8b48f, 0xb8c4d0, 0xe8a87c, 0x9fb8a0, 0xd0a0a0, 0x8fb8d8, 0xe0d0a0, 0xc0b0d0],
  neon: [0xff2d78, 0x00e5ff, 0xffe600, 0x7cff00, 0xff6a00, 0xc44dff],
};
