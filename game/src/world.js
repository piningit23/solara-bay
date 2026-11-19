// Solara Bay — the island city itself: ground, water, roads, buildings,
// beach and palms, bridges, lighthouse, neon strip, props and the safehouse.
// Exports the road network and spawn points the other modules drive on.

import * as THREE from 'three';
import { G } from './state.js';
import { CITY, GARAGE, LIGHTHOUSE, DOCKS, NEON_STRIP, CACHE_SPOTS } from './config.js';
import { mulberry32, pick, range } from './random.js';
import { makePalm, makeLighthouse } from './models.js';

export const roads = [];        // road centre lines: { axis: 'x'|'z', at }
export const buildingBoxes = []; // { x, z, w, d, h } for collision
export const parkedSpots = [];  // { x, z, angle } where parked cars sit
export let lighthouseMesh = null;
export let garageMesh = null;
export let waypointMesh = null;
export let cacheMeshes = [];

const BUILDING_COLORS = [0xe8dcc8, 0xd9a066, 0x9fb8c8, 0xc98a8a, 0xa8c8a0, 0xe8e0d0, 0x7fa8c8, 0xd2b48c, 0xb8a8d0, 0xf0e0c0];
const NEON_COLORS = [0xff2a6d, 0x05d9e8, 0xffd319, 0xb967ff, 0x39ff6a];

export function roadCoords() {
  const out = [];
  for (let c = -CITY.half + 20; c <= CITY.half - 20; c += CITY.roadStep) out.push(c);
  return out;
}

export function nearestRoadCoord(v) {
  const cs = roadCoords();
  let best = cs[0];
  for (const c of cs) if (Math.abs(c - v) < Math.abs(best - v)) best = c;
  return best;
}

export function isOnRoad(x, z) {
  const cs = roadCoords();
  for (const c of cs) {
    if (Math.abs(x - c) < CITY.roadHalf + 1.5) return true;
    if (Math.abs(z - c) < CITY.roadHalf + 1.5) return true;
  }
  return false;
}

export function buildWorld(scene, seed) {
  const rng = mulberry32(seed);
  G.scene = scene;

  // --- sky, sun, haze ---
  scene.background = new THREE.Color(0x87b5d9);
  scene.fog = new THREE.Fog(0xa8c8de, 180, 520);
  const sun = new THREE.DirectionalLight(0xffe8b0, 2.4);
  sun.position.set(120, 180, 60);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -260; sun.shadow.camera.right = 260;
  sun.shadow.camera.top = 260; sun.shadow.camera.bottom = -260;
  sun.shadow.camera.far = 600;
  scene.add(sun);
  G.sun = sun;
  const hemi = new THREE.HemisphereLight(0xbfd9ff, 0x8a7a5a, 0.9);
  scene.add(hemi);
  G.hemi = hemi;

  // --- water: surrounds the whole island on all sides ---
  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(CITY.waterSize, CITY.waterSize),
    new THREE.MeshStandardMaterial({ color: 0x1e6f8e, roughness: 0.25, metalness: 0.35 }));
  water.rotation.x = -Math.PI / 2; water.position.y = -0.6; water.receiveShadow = true;
  scene.add(water);
  G.water = water;

  // --- island ground (sand edge + city slab) ---
  const sand = new THREE.Mesh(
    new THREE.BoxGeometry(CITY.half * 2 + 24, 1.2, CITY.half * 2 + 24),
    new THREE.MeshStandardMaterial({ color: 0xe0c98f, roughness: 1 }));
  sand.position.y = -0.6; sand.receiveShadow = true; scene.add(sand);
  const slab = new THREE.Mesh(
    new THREE.BoxGeometry(CITY.half * 2, 1.4, CITY.half * 2),
    new THREE.MeshStandardMaterial({ color: 0x9a9a92, roughness: 1 }));
  slab.position.y = -0.5; slab.receiveShadow = true; scene.add(slab);

  // --- roads ---
  const roadMat = new THREE.MeshStandardMaterial({ color: 0x3a3a40, roughness: 0.95 });
  const lineMat = new THREE.MeshStandardMaterial({ color: 0xe8d44d, roughness: 0.8 });
  for (const c of roadCoords()) {
    roads.push({ axis: 'x', at: c }, { axis: 'z', at: c });
    const r1 = new THREE.Mesh(new THREE.BoxGeometry(CITY.half * 2, 0.2, CITY.roadHalf * 2), roadMat);
    r1.position.set(0, 0.25, c); r1.receiveShadow = true; scene.add(r1);
    const r2 = new THREE.Mesh(new THREE.BoxGeometry(CITY.roadHalf * 2, 0.2, CITY.half * 2), roadMat);
    r2.position.set(c, 0.25, 0); r2.receiveShadow = true; scene.add(r2);
    // dashed centre lines
    for (let d = -CITY.half + 10; d < CITY.half - 10; d += 12) {
      const dash = new THREE.Mesh(new THREE.BoxGeometry(4, 0.05, 0.5), lineMat);
      dash.position.set(d, 0.38, c); scene.add(dash);
      const dash2 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 4), lineMat);
      dash2.position.set(c, 0.38, d); scene.add(dash2);
    }
  }

  // --- sidewalks ---
  const walkMat = new THREE.MeshStandardMaterial({ color: 0xb8b8ae, roughness: 1 });
  for (const c of roadCoords()) {
    const w1 = new THREE.Mesh(new THREE.BoxGeometry(CITY.half * 2, 0.15, 3), walkMat);
    w1.position.set(0, 0.3, c + CITY.roadHalf + 2.5); scene.add(w1);
    const w2 = new THREE.Mesh(new THREE.BoxGeometry(3, 0.15, CITY.half * 2), walkMat);
    w2.position.set(c + CITY.roadHalf + 2.5, 0.3, 0); scene.add(w2);
  }

  // --- buildings: varied heights and colours on every block ---
  const cs = roadCoords();
  for (let i = 0; i < cs.length - 1; i++) {
    for (let j = 0; j < cs.length - 1; j++) {
      const bx = (cs[i] + cs[i + 1]) / 2;
      const bz = (cs[j] + cs[j + 1]) / 2;
      // keep the garage lot, docks yard and neon plaza open
      if (Math.hypot(bx - GARAGE.x, bz - GARAGE.z) < 26) continue;
      if (Math.hypot(bx - DOCKS.x, bz - DOCKS.z) < 24) continue;
      if (Math.hypot(bx - NEON_STRIP.x, bz - NEON_STRIP.z) < 22) continue;
      if (Math.hypot(bx - LIGHTHOUSE.x, bz - LIGHTHOUSE.z) < 16) continue;
      if (rng() < 0.12) continue; // empty lots / parks
      const h = range(rng, 6, 34);
      const w = range(rng, 16, 24);
      const d = range(rng, 16, 24);
      const color = pick(rng, BUILDING_COLORS);
      const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.85 });
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      b.position.set(bx, h / 2 + 0.3, bz);
      b.castShadow = true; b.receiveShadow = true;
      scene.add(b);
      buildingBoxes.push({ x: bx, z: bz, w, d, h });
      // roof box + window strips
      const roof = new THREE.Mesh(new THREE.BoxGeometry(w * 0.5, 1.2, d * 0.5),
        new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 1 }));
      roof.position.set(bx, h + 0.9, bz); scene.add(roof);
      const winMat = new THREE.MeshStandardMaterial({ color: 0x2a3a4a, roughness: 0.3, metalness: 0.4 });
      const floors = Math.max(1, Math.floor(h / 4));
      for (let f = 0; f < floors; f++) {
        const win = new THREE.Mesh(new THREE.BoxGeometry(w * 0.8, 0.8, 0.2), winMat);
        win.position.set(bx, 3 + f * 4, bz + d / 2 + 0.05); scene.add(win);
      }
      // neon district gets glowing signs
      if (Math.abs(bz - NEON_STRIP.z) < 45 && Math.abs(bx) < 60 && rng() < 0.7) {
        const neon = pick(rng, NEON_COLORS);
        const sign = new THREE.Mesh(new THREE.BoxGeometry(0.4, range(rng, 2, 5), range(rng, 4, 9)),
          new THREE.MeshStandardMaterial({ color: neon, emissive: neon, emissiveIntensity: 1.6 }));
        sign.position.set(bx + w / 2 + 0.4, range(rng, 4, 10), bz);
        scene.add(sign);
        if (G.dusk) {
          const pl = new THREE.PointLight(neon, 12, 30);
          pl.position.copy(sign.position); scene.add(pl); G.neonLights.push(pl);
        }
      }
    }
  }

  // --- neon strip: glowing sign boxes + plaza ---
  const plaza = new THREE.Mesh(new THREE.BoxGeometry(44, 0.3, 44),
    new THREE.MeshStandardMaterial({ color: 0x6a5a8a, roughness: 0.9 }));
  plaza.position.set(NEON_STRIP.x, 0.35, NEON_STRIP.z); scene.add(plaza);
  for (let i = 0; i < 8; i++) {
    const neon = NEON_COLORS[i % NEON_COLORS.length];
    const sign = new THREE.Mesh(new THREE.BoxGeometry(3, 2.2, 0.5),
      new THREE.MeshStandardMaterial({ color: neon, emissive: neon, emissiveIntensity: 2 }));
    const a = (i / 8) * Math.PI * 2;
    sign.position.set(NEON_STRIP.x + Math.cos(a) * 18, 5, NEON_STRIP.z + Math.sin(a) * 18);
    sign.rotation.y = -a + Math.PI / 2; scene.add(sign);
  }

  // --- beach promenade + palms around the island edge ---
  for (let i = 0; i < 46; i++) {
    const side = i % 4;
    const t = range(rng, -CITY.half + 8, CITY.half - 8);
    let x = t, z = t;
    if (side === 0) { x = t; z = CITY.half - 6; }
    if (side === 1) { x = t; z = -CITY.half + 6; }
    if (side === 2) { x = CITY.half - 6; z = t; }
    if (side === 3) { x = -CITY.half + 6; z = t; }
    const palm = makePalm();
    palm.position.set(x, 0.3, z);
    palm.rotation.y = rng() * Math.PI * 2;
    scene.add(palm);
  }

  // --- two bridges at the map edges (east and west) ---
  for (const sx of [-1, 1]) {
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(60, 1.0, 14),
      new THREE.MeshStandardMaterial({ color: 0x8a8a80, roughness: 0.9 }));
    bridge.position.set(sx * (CITY.half + 26), 0.4, 0); bridge.castShadow = true; scene.add(bridge);
    for (const bx of [-14, 14]) {
      const pylon = new THREE.Mesh(new THREE.BoxGeometry(2, 12, 2),
        new THREE.MeshStandardMaterial({ color: 0xd23c2e, roughness: 0.7 }));
      pylon.position.set(sx * (CITY.half + 26) + bx, 5, 0); scene.add(pylon);
    }
  }

  // --- lighthouse on the north point ---
  lighthouseMesh = makeLighthouse();
  lighthouseMesh.position.set(LIGHTHOUSE.x, 0.3, LIGHTHOUSE.z);
  scene.add(lighthouseMesh);

  // --- docks: crates yard + containers ---
  const contColors = [0xc96a2e, 0x2e7d6a, 0x7a4a9e, 0x9e2e2e];
  for (let i = 0; i < 10; i++) {
    const cont = new THREE.Mesh(new THREE.BoxGeometry(8, 2.6, 2.6),
      new THREE.MeshStandardMaterial({ color: pick(rng, contColors), roughness: 0.8 }));
    cont.position.set(DOCKS.x - 14 + (i % 5) * 9, 1.6 + Math.floor(i / 5) * 2.7, DOCKS.z + 8 + (i % 2) * 5);
    cont.rotation.y = (i % 2) * 0.12; cont.castShadow = true; scene.add(cont);
  }

  // --- garage safehouse: building + sign + lot ---
  garageMesh = new THREE.Group();
  const gBase = new THREE.Mesh(new THREE.BoxGeometry(20, 7, 14),
    new THREE.MeshStandardMaterial({ color: 0x4a6a8a, roughness: 0.8 }));
  gBase.position.y = 3.5; gBase.castShadow = true; garageMesh.add(gBase);
  const gDoor = new THREE.Mesh(new THREE.BoxGeometry(12, 4.5, 0.4),
    new THREE.MeshStandardMaterial({ color: 0x2a2a30, roughness: 0.6, metalness: 0.4 }));
  gDoor.position.set(0, 2.3, 7.1); garageMesh.add(gDoor);
  const gSign = new THREE.Mesh(new THREE.BoxGeometry(10, 1.6, 0.5),
    new THREE.MeshStandardMaterial({ color: 0xffd319, emissive: 0xcc9900, emissiveIntensity: 0.8 }));
  gSign.position.set(0, 8, 7.2); garageMesh.add(gSign);
  const lot = new THREE.Mesh(new THREE.BoxGeometry(30, 0.2, 22),
    new THREE.MeshStandardMaterial({ color: 0x555550, roughness: 1 }));
  lot.position.set(0, 0.3, 12); garageMesh.add(lot);
  garageMesh.position.set(GARAGE.x, 0.3, GARAGE.z);
  scene.add(garageMesh);

  // --- street props: lamps and hydrants ---
  const lampMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.6, metalness: 0.5 });
  const lampHeadMat = new THREE.MeshStandardMaterial({ color: 0xfff6c0, emissive: 0xccaa44, emissiveIntensity: 0.7 });
  for (let i = 0; i < 40; i++) {
    const c = pick(rng, cs);
    const d = pick(rng, cs);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 5, 6), lampMat);
    pole.position.set(c + 8, 2.5, d + 8); scene.add(pole);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.25, 0.6), lampHeadMat);
    head.position.set(c + 8, 5.1, d + 8); scene.add(head);
  }

  // --- parked car spots: in the road lane, clear of buildings ---
  for (let i = 0; i < 26; i++) {
    const c = pick(rng, cs);
    const d = range(rng, -CITY.half + 20, CITY.half - 20);
    const alongX = rng() < 0.5;
    parkedSpots.push({
      x: alongX ? d : c + 3.5,
      z: alongX ? c + 3.5 : d,
      angle: alongX ? (rng() < 0.5 ? 0 : Math.PI) : (rng() < 0.5 ? Math.PI / 2 : -Math.PI / 2),
    });
  }

  // --- waypoint beacon (reused by missions) ---
  waypointMesh = new THREE.Group();
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 40, 12, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xffd319, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false }));
  beam.position.y = 20; waypointMesh.add(beam);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.25, 8, 24),
    new THREE.MeshBasicMaterial({ color: 0xffd319 }));
  ring.rotation.x = Math.PI / 2; ring.position.y = 0.5; waypointMesh.add(ring);
  waypointMesh.visible = false;
  scene.add(waypointMesh);
  G.waypointMesh = waypointMesh;

  // --- sunken cache packages (glowing crates) ---
  cacheMeshes = [];
  for (let i = 0; i < CACHE_SPOTS.length; i++) {
    const s = CACHE_SPOTS[i];
    const m = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 1.2),
      new THREE.MeshStandardMaterial({ color: 0x39ff6a, emissive: 0x1a8a3a, emissiveIntensity: 1.2 }));
    m.position.set(s.x, 1.0, s.z);
    scene.add(m);
    cacheMeshes.push(m);
  }
  G.cacheMeshes = cacheMeshes;
}

export function setDusk(on) {
  G.dusk = on;
  if (!G.scene) return;
  if (on) {
    G.scene.background = new THREE.Color(0x2a2140);
    G.scene.fog = new THREE.Fog(0x3a2a55, 120, 420);
    if (G.sun) { G.sun.intensity = 0.7; G.sun.color.setHex(0xff9a5a); }
    if (G.hemi) G.hemi.intensity = 0.35;
  } else {
    G.scene.background = new THREE.Color(0x87b5d9);
    G.scene.fog = new THREE.Fog(0xa8c8de, 180, 520);
    if (G.sun) { G.sun.intensity = 2.4; G.sun.color.setHex(0xffe8b0); }
    if (G.hemi) G.hemi.intensity = 0.9;
  }
}

export function collidesWithBuilding(x, z, pad) {
  for (const b of buildingBoxes) {
    if (Math.abs(x - b.x) < b.w / 2 + pad && Math.abs(z - b.z) < b.d / 2 + pad) return true;
  }
  return false;
}

export function clampToIsland(x, z, pad) {
  const lim = CITY.half - 4 - pad;
  return { x: Math.max(-lim, Math.min(lim, x)), z: Math.max(-lim, Math.min(lim, z)) };
}
