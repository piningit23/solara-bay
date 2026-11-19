// Solara Bay — configuration and constants.
// One job: every number, name and story beat the rest of the game reads.

export const CITY = {
  half: 200,            // island ground extends +/-200 on x and z
  roadStep: 40,         // distance between parallel roads
  roadHalf: 5,          // half width of a road
  waterSize: 1400,      // water plane size (surrounds the island)
  blockSize: 28,        // building block footprint
};

export const GARAGE = { x: 60, z: 60 };          // safehouse / shop position
export const LIGHTHOUSE = { x: 0, z: -196 };     // north point, final target
export const DOCKS = { x: 180, z: 40 };          // harbor crates area
export const NEON_STRIP = { x: 0, z: -40 };      // neon district centre

export const WEAPONS = [
  { id: 'pistol',  name: 'Pistol',        key: '1', damage: 34, range: 60,  rate: 0.28, spread: 0.02, pellets: 1, ammo: 60,  mag: 12, reload: 0.9,  color: 0xffd27a },
  { id: 'scatter', name: 'Scattergun',    key: '2', damage: 16, range: 26,  rate: 0.85, spread: 0.14, pellets: 6, ammo: 36,  mag: 6,  reload: 1.6,  color: 0xff9a3d },
  { id: 'smg',     name: 'Rapid SMG',     key: '3', damage: 14, range: 48,  rate: 0.09, spread: 0.06, pellets: 1, ammo: 150, mag: 30, reload: 1.1,  color: 0x7ae2ff },
  { id: 'rifle',   name: 'Hunting Rifle', key: '4', damage: 95, range: 140, rate: 1.1,  spread: 0.005, pellets: 1, ammo: 24, mag: 5,  reload: 1.8,  color: 0xb6ff7a },
];

export const RANKS = [
  { name: 'Drifter',        min: 0 },
  { name: 'Street',         min: 150 },
  { name: 'Respected',      min: 400 },
  { name: 'Queen of Solara', min: 800 },
];

export const UPGRADES = [
  { id: 'tires',  name: 'Racing Tires',  price: 400, rank: 'Street',          desc: 'Better grip, tighter turns' },
  { id: 'armor',  name: 'Armor Plating', price: 600, rank: 'Respected',       desc: 'Car takes much less damage' },
  { id: 'engine', name: 'Engine',        price: 800, rank: 'Queen of Solara', desc: 'Higher top speed' },
];

export const SHOP_ITEMS = [
  { id: 'armor',  name: 'Body Armor', price: 300, desc: '+50 armor' },
  { id: 'ammo',   name: 'Ammo Pack',  price: 150, desc: 'Refill all weapons' },
  { id: 'repair', name: 'Repair Car', price: 200, desc: 'Fix your car to full' },
];

// The 12 story missions. Mara Vale is settling a harbor debt in one week.
export const MISSIONS = [
  { id: 1,  title: 'FIRST WHEELS',     type: 'steal',  reward: 500,  respect: 40,
    brief: 'Mara Vale owes the harbor crew. First: wheels. Steal a car and bring it to the old garage.',
    outro: 'Wheels secured. The garage is yours now, Mara.' },
  { id: 2,  title: 'BAYFRONT DROP',    type: 'drop',   reward: 900,  respect: 50,
    brief: 'Deliver the sealed package across town. One star of heat is already on you. Do not stop.',
    outro: 'Package delivered. The harbor notices people who deliver.' },
  { id: 3,  title: 'HARBOR HEIST',     type: 'crate',  reward: 1500, respect: 70,
    brief: 'Three crates at the docks belong to Mara now. The dock crew is armed. Two stars of heat.',
    outro: 'Crates collected. The docks are watching you, Mara.' },
  { id: 4,  title: 'MIDNIGHT COURIER', type: 'timed',  reward: 1800, respect: 80,
    brief: 'Night delivery. Reach the far drop before the countdown ends. Two stars of heat.',
    outro: 'Made it with time to spare. The night belongs to you.' },
  { id: 5,  title: 'DOCKSIDE PAYBACK', type: 'crew',   reward: 2000, respect: 90,
    brief: 'Four armed dock guards took Mara\u2019s ledger. Take it back. All of them.',
    outro: 'Ledger recovered. The debt ledger is yours again.' },
  { id: 6,  title: 'THE GETAWAY',      type: 'escape', reward: 2200, respect: 90,
    brief: 'Three stars of heat. Lose the cops completely, then get back to the safehouse.',
    outro: 'Clean. Not even the harbor cameras saw you.' },
  { id: 7,  title: 'ISLAND LOOP',      type: 'race',   reward: 3000, respect: 110,
    brief: 'Checkpoint race around the island ring road. Beat the clock.',
    outro: 'Fastest loop on the island. They are talking about you.' },
  { id: 8,  title: 'KING OF SOLARA',   type: 'final',  reward: 5000, respect: 150,
    brief: 'Run to the lighthouse with four stars of heat on you. Finish this week.',
    outro: 'You stood at the lighthouse and the island saw you.' },
  { id: 9,  title: 'THE CREW',         type: 'escort', reward: 2800, respect: 120,
    brief: 'Recruit Dante Reyes. Escort his car across town while rivals chase. He joins your crew.',
    outro: 'Dante is in. You are not alone anymore, Mara.' },
  { id: 10, title: 'RESPECT RUN',      type: 'gigs',   reward: 3200, respect: 130,
    brief: 'Three side gigs in one run: a taxi fare, a vigilante takedown, a package pickup.',
    outro: 'Three gigs, one run. The streets respect that.' },
  { id: 11, title: 'NEON LOOP',        type: 'race',   reward: 4000, respect: 140,
    brief: 'Night checkpoint race through the neon strip. Three stars of heat. Beat the clock.',
    outro: 'Neon champion. The strip lights up for you now.' },
  { id: 12, title: 'QUEEN OF SOLARA',  type: 'final',  reward: 8000, respect: 200,
    brief: 'The finale. Reach the lighthouse with five stars, the helicopter and roadblocks. Dante has your back.',
    outro: 'QUEEN OF SOLARA. The debt is paid. The island is yours.' },
];

export const CACHE_SPOTS = [
  { x: -180, z: 180 }, { x: 180, z: 180 }, { x: -180, z: -180 }, { x: 0, z: -196 },
  { x: 180, z: 40 }, { x: -120, z: 120 }, { x: 120, z: -120 }, { x: -40, z: 180 },
  { x: 180, z: -100 }, { x: 40, z: -180 },
];

export const RADIO_STATIONS = [
  { name: 'BAY FM 88',      tag: 'chill synthwave' },
  { name: 'SOLARA ROCK 101', tag: 'driving rock riff' },
  { name: 'HARBOR NIGHT 76', tag: 'moody night bass' },
];
