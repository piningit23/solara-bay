import * as THREE from 'three';
export const COLORS = { sky: 0x9dd8df, sand: 0xe9c88d, asphalt: 0x26333a, sidewalk: 0xb8a995, ocean: 0x2f9ab0, neon: 0xffd45c, police: 0x2d65b8 };
export const CITY = { size: 150, road: 10, blocks: [-60, -30, 0, 30, 60], garage: new THREE.Vector3(-60, 0, 60), dock: new THREE.Vector3(60, 0, -60), lighthouse: new THREE.Vector3(60, 0, 60) };
export const MISSIONS = [
  { title: 'FIRST WHEELS', objective: 'STEAL A CAR AND REACH THE GARAGE', target: 'garage', heat: 1, reward: 600 },
  { title: 'BAYFRONT DROP', objective: 'DELIVER THE PACKAGE TO THE NORTH PIER', target: 'pier', heat: 1, reward: 900 },
  { title: 'HARBOR HEIST', objective: 'COLLECT 3 CRATES AT THE DOCKS', target: 'dock', heat: 2, reward: 1400 },
  { title: 'THE GETAWAY', objective: 'LOSE THE 3-STAR HEAT', target: 'hide', heat: 3, reward: 1800 },
  { title: 'KING OF SOLARA', objective: 'REACH THE LIGHTHOUSE', target: 'lighthouse', heat: 4, reward: 3000 }
];
export const WAYPOINTS = { garage: new THREE.Vector3(-60, 0, 60), pier: new THREE.Vector3(-60, 0, -60), dock: new THREE.Vector3(60, 0, -60), lighthouse: new THREE.Vector3(60, 0, 60) };
