// Solara Bay — shared constants, mission story, ranks and shop prices.
// Every number the rest of the game uses lives here, so tuning stays in one place.

export const WORLD = {
  half: 210, // island ground extends +/-210 on x and z
  streetSpacing: 40,
  streets: [-160, -120, -80, -40, 0, 40, 80, 120, 160],
  waterLevel: -0.6,
};

export const PLACES = {
  garage: { x: -140, z: -140, name: 'Old Garage Safehouse' },
  lighthouse: { x: 0, z: -192, name: 'North Lighthouse' },
  docks: { x: 168, z: 120, name: 'Harbor Docks' },
  neonStrip: { x: 40, z: 0, name: 'Neon Strip' },
  beach: { x: -80, z: 185, name: 'South Beach' },
  market: { x: -120, z: 80, name: 'Bay Market' },
  plaza: { x: 80, z: -120, name: 'Solara Plaza' },
  airport: { x: 160, z: -160, name: 'Old Airfield' },
};

// Mara Vale settles a harbor debt in one week. Twelve sequential story missions.
export const MISSIONS = [
  { id: 1, name: 'FIRST WHEELS', type: 'steal', reward: 500,
    brief: 'Mara Vale owes the harbor crew. First step: steal a car and bring it to the old garage.',
    target: PLACES.garage, hint: 'Press E near a parked car to steal it, then drive to the garage.' },
  { id: 2, name: 'BAYFRONT DROP', type: 'drop', reward: 900,
    brief: 'A sealed package has to cross town. One star of heat is already on your tail.',
    target: PLACES.market, hint: 'Deliver the package to Bay Market. Keep moving.' },
  { id: 3, name: 'HARBOR HEIST', type: 'crate', reward: 1500,
    brief: 'Three crates wait at the docks. The dock crew is armed and the heat is 2 stars.',
    target: PLACES.docks, hint: 'Collect 3 crates at the docks. Watch the armed guards.', count: 3 },
  { id: 4, name: 'MIDNIGHT COURIER', type: 'timed', reward: 1800,
    brief: 'A night delivery across the island. The clock is running and so is the heat.',
    target: PLACES.airport, hint: 'Reach the old airfield before the countdown ends.', time: 90 },
  { id: 5, name: 'DOCKSIDE PAYBACK', type: 'crew', reward: 2000,
    brief: 'Four armed dock guards took Mara\u2019s ledger. Take it back.',
    target: PLACES.docks, hint: 'Defeat all 4 dock guards and grab the ledger.', count: 4 },
  { id: 6, name: 'THE GETAWAY', type: 'escape', reward: 2200,
    brief: 'Three stars and every siren in Solara Bay. Lose the heat, then come home.',
    target: PLACES.garage, hint: 'Lose your wanted level, then reach the garage.' },
  { id: 7, name: 'ISLAND LOOP', type: 'race', reward: 3000,
    brief: 'A checkpoint race around the island ring road. Beat the clock.',
    target: PLACES.lighthouse, hint: 'Hit every checkpoint in order before time runs out.', time: 120 },
  { id: 8, name: 'KING OF SOLARA', type: 'final', reward: 5000,
    brief: 'Run to the lighthouse with 4 stars of heat. Finish the week on top.',
    target: PLACES.lighthouse, hint: 'Reach the lighthouse with the heat on you.' },
  { id: 9, name: 'THE CREW', type: 'escort', reward: 2800,
    brief: 'Dante Reyes will join you — if you get his car across town while rivals chase.',
    target: PLACES.plaza, hint: 'Escort Dante\u2019s car to Solara Plaza. He rams rivals for you.' },
  { id: 10, name: 'RESPECT RUN', type: 'gigs', reward: 3200,
    brief: 'Three side gigs in one run: a taxi fare, a vigilante takedown, a package pickup.',
    target: PLACES.neonStrip, hint: 'Finish all three gigs, then report to the Neon Strip.' },
  { id: 11, name: 'NEON LOOP', type: 'race', reward: 4000,
    brief: 'A night checkpoint race through the neon strip. Three stars of heat, no mistakes.',
    target: PLACES.neonStrip, hint: 'Hit every checkpoint in order before time runs out.', time: 110 },
  { id: 12, name: 'QUEEN OF SOLARA', type: 'final', reward: 8000,
    brief: 'The finale. Reach the lighthouse with 5 stars, a helicopter and roadblocks — with Dante beside you.',
    target: PLACES.lighthouse, hint: 'Reach the lighthouse. Dante has your back.' },
];

export const RANKS = [
  { name: 'Drifter', min: 0 },
  { name: 'Street', min: 150 },
  { name: 'Respected', min: 400 },
  { name: 'Queen of Solara', min: 800 },
];

export const UPGRADES = [
  { id: 'tires', name: 'Racing Tires', price: 400, rank: 'Street',
    desc: 'Better grip — sharper turns at speed.' },
  { id: 'armor', name: 'Armor Plating', price: 600, rank: 'Respected',
    desc: 'Your car takes much less damage.' },
  { id: 'engine', name: 'Engine Tune', price: 800, rank: 'Queen of Solara',
    desc: 'Higher top speed and faster acceleration.' },
];

export const SHOP_ITEMS = [
  { id: 'armorKit', name: 'Body Armor', price: 300, desc: 'Restore 50 health.' },
  { id: 'ammo', name: 'Ammo Pack', price: 150, desc: 'Refill ammo for all weapons.' },
  { id: 'repair', name: 'Repair Car', price: 200, desc: 'Fix your current car to full health.' },
];

export const WEAPONS = [
  { id: 'pistol', name: 'Pistol', key: '1', damage: 25, range: 60, rate: 0.28, spread: 0.02, mag: 12, auto: false },
  { id: 'scattergun', name: 'Scattergun', key: '2', damage: 14, range: 30, rate: 0.8, spread: 0.12, mag: 6, auto: false, pellets: 6 },
  { id: 'smg', name: 'Rapid SMG', key: '3', damage: 12, range: 45, rate: 0.09, spread: 0.06, mag: 30, auto: true },
  { id: 'rifle', name: 'Hunting Rifle', key: '4', damage: 70, range: 120, rate: 1.1, spread: 0.005, mag: 5, auto: false },
];

export const STATIONS = [
  { name: 'BAY FM 88', tag: 'slow chill synthwave', bpm: 76, root: 220, mood: 'chill' },
  { name: 'SOLARA ROCK 101', tag: 'driving guitar-like riff', bpm: 132, root: 110, mood: 'rock' },
  { name: 'HARBOR NIGHT 76', tag: 'moody night bass', bpm: 96, root: 82.4, mood: 'night' },
];

// Ten hidden sunken caches around the island: beach, docks, rooftops edge, lighthouse base.
export const CACHE_SPOTS = [
  { x: -120, z: 192 }, { x: 40, z: 192 }, { x: 160, z: 180 },
  { x: 185, z: 60 }, { x: 185, z: 150 }, { x: -185, z: 40 },
  { x: -185, z: -120 }, { x: 120, z: -185 }, { x: -60, z: -188 },
  { x: 12, z: -178 },
];

export const SAVE_KEY = 'solara-bay-v3-save';
export const TITLE =
  'SOLARA BAY: island-city crime game \u2014 12 story missions, 5-star police and helicopter chases, crew and respect ranks, garage upgrades, car radio, safehouse saves';
