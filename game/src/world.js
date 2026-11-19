// The island city of Solara Bay: water all around, a street grid, blocks of
// low-poly buildings, a beach promenade, palms, two bridges, a neon strip and
// the lighthouse on the north point.

import { WORLD, PLACES } from './config.js';
import { mulberry32, range, pick } from './random.js';
import { makePalm, makeLighthouse } from './models.js';

const BUILDING_COLORS = [
  0xe8dcc8, 0xd9a066, 0xc96f4a, 0x7fb3d5, 0x85c1a3,
  0xf2e6c9, 0xb56576, 0x6a8caf, 0xe0a458, 0x9b8ec4,
];
const NEON_COLORS = [0xff2e88, 0x00e5ff, 0xffd23f, 0x7cff4f, 0xff6a00, 0xb45cff];

export function buildWorld(THREE, scene, seed) {
  const rand = mulberry32(seed);
  const world = {
    buildings: [],
    neonSigns: [],
    palms: [],
    lighthouse: null,
    garagePos: { x: PLACES.garage.x, z: PLACES.garage.z },
  };

  // Water surrounds the whole island on all sides.
  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(1400, 1400),
    new THREE.MeshLambertMaterial({ color: 0x1e6f9e }),
  );
  water.rotation.x = -Math.PI / 2;
  water.position.y = WORLD.waterLevel;
  scene.add(water);

  // Sand ring: the beach edge of the island.
  const sand = new THREE.Mesh(
    new THREE.PlaneGeometry(440, 440),
    new THREE.MeshLambertMaterial({ color: 0xe6d3a3 }),
  );
  sand.rotation.x = -Math.PI / 2;
  sand.position.y = -0.2;
  scene.add(sand);

  // Grass / ground slab inside the beach.
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(400, 400),
    new THREE.MeshLambertMaterial({ color: 0x7fae62 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0.0;
  scene.add(ground);

  // Roads: dark strips along every street line, both directions.
  const roadMat = new THREE.MeshLambertMaterial({ color: 0x333a42 });
  const walkMat = new THREE.MeshLambertMaterial({ color: 0x9aa0a6 });
  for (const s of WORLD.streets) {
    const roadH = new THREE.Mesh(new THREE.PlaneGeometry(400, 9), roadMat);
    roadH.rotation.x = -Math.PI / 2;
    roadH.position.set(0, 0.05, s);
    scene.add(roadH);
    const roadV = new THREE.Mesh(new THREE.PlaneGeometry(9, 400), roadMat);
    roadV.rotation.x = -Math.PI / 2;
    roadV.position.set(s, 0.05, 0);
    scene.add(roadV);
    const walkH = new THREE.Mesh(new THREE.PlaneGeometry(400, 12), walkMat);
    walkH.rotation.x = -Math.PI / 2;
    walkH.position.set(0, 0.03, s + 7.5);
    scene.add(walkH);
    const walkV = new THREE.Mesh(new THREE.PlaneGeometry(12, 400), walkMat);
    walkV.rotation.x = -Math.PI / 2;
    walkV.position.set(s + 7.5, 0.03, 0);
    scene.add(walkV);
  }

  // Building blocks between the streets, with varied heights and colors.
  const blockCenters = [];
  for (let i = 0; i < WORLD.streets.length - 1; i++) {
    for (let j = 0; j < WORLD.streets.length - 1; j++) {
      const cx = (WORLD.streets[i] + WORLD.streets[i + 1]) / 2;
      const cz = (WORLD.streets[j] + WORLD.streets[j + 1]) / 2;
      blockCenters.push({ x: cx, z: cz });
    }
  }
  for (const block of blockCenters) {
    // Keep the garage corner, the plaza and the docks open.
    if (Math.hypot(block.x - PLACES.garage.x, block.z - PLACES.garage.z) < 35) continue;
    if (Math.hypot(block.x - PLACES.plaza.x, block.z - PLACES.plaza.z) < 30) continue;
    if (block.x > 140 && block.z > 90) continue;
    const count = 1 + Math.floor(rand() * 2);
    for (let k = 0; k < count; k++) {
      const w = range(rand, 10, 18);
      const d = range(rand, 10, 18);
      const h = range(rand, 6, 26);
      const x = block.x + range(rand, -8, 8) + (k === 1 ? 10 : -6);
      const z = block.z + range(rand, -8, 8) + (k === 1 ? -8 : 6);
      const color = pick(rand, BUILDING_COLORS);
      const tower = new THREE.Mesh(new THREE.BoxGeometry(w, h, d),
        new THREE.MeshLambertMaterial({ color }));
      tower.position.set(x, h / 2, z);
      scene.add(tower);
      world.buildings.push(tower);
      // Rooftop box and a few lit windows.
      const roof = new THREE.Mesh(new THREE.BoxGeometry(w * 0.5, 1.2, d * 0.5),
        new THREE.MeshLambertMaterial({ color: 0x555c66 }));
      roof.position.set(x, h + 0.6, z);
      scene.add(roof);
      const winMat = new THREE.MeshBasicMaterial({ color: 0xffe9a0 });
      const winCount = Math.floor(h / 4);
      for (let wi = 0; wi < winCount; wi++) {
        const win = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.2), winMat);
        win.position.set(x - w / 2 + 2 + rand() * (w - 4), 3 + wi * 3.4, z + d / 2 + 0.06);
        scene.add(win);
      }
    }
  }

  // Neon strip district along x = 40: glowing sign boxes and colored lights.
  const stripZ = [-70, -50, -30, -10, 10, 30, 50, 70];
  for (let i = 0; i < stripZ.length; i++) {
    const color = NEON_COLORS[i % NEON_COLORS.length];
    const sign = new THREE.Mesh(new THREE.BoxGeometry(1.2, 3.2, 6),
      new THREE.MeshLambertMaterial({ color, emissive: color }));
    sign.position.set(48, 4.5, stripZ[i]);
    sign.name = 'neonSign';
    scene.add(sign);
    world.neonSigns.push(sign);
    const light = new THREE.PointLight(color, 18, 26);
    light.position.set(46, 5, stripZ[i]);
    scene.add(light);
    const sign2 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.4, 4.5),
      new THREE.MeshLambertMaterial({ color, emissive: color }));
    sign2.position.set(32, 3.8, stripZ[i] + 8);
    scene.add(sign2);
    world.neonSigns.push(sign2);
  }

  // Palms along the beach promenade and a few on the streets.
  for (let x = -190; x <= 190; x += 24) {
    const palm = makePalm(THREE);
    palm.position.set(x + range(rand, -4, 4), 0, 192 + range(rand, -3, 3));
    scene.add(palm);
    world.palms.push(palm);
  }
  for (let i = 0; i < 14; i++) {
    const palm = makePalm(THREE);
    palm.position.set(range(rand, -180, 180), 0, range(rand, -180, 180));
    scene.add(palm);
    world.palms.push(palm);
  }

  // Two bridges at the map edges, crossing the water to the mainland edge.
  const bridgeMat = new THREE.MeshLambertMaterial({ color: 0x6b7280 });
  for (const [x, z, rot] of [[0, -212, 0], [212, 0, Math.PI / 2]]) {
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(14, 1.2, 34), bridgeMat);
    bridge.position.set(x, 0.4, z);
    bridge.rotation.y = rot;
    scene.add(bridge);
    for (let k = -1; k <= 1; k++) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 7, 8),
        new THREE.MeshLambertMaterial({ color: 0x9aa0a6 }));
      const along = k * 12;
      post.position.set(rot === 0 ? x + k * 5 : x + along, 3.5, rot === 0 ? z + along : z + k * 5);
      scene.add(post);
    }
  }

  // Lighthouse on the north point — the final mission target.
  const lighthouse = makeLighthouse(THREE);
  lighthouse.position.set(PLACES.lighthouse.x, 0, PLACES.lighthouse.z);
  scene.add(lighthouse);
  world.lighthouse = lighthouse;

  // The old garage safehouse: a low building with a big door and a sign.
  const garage = new THREE.Group();
  const gBody = new THREE.Mesh(new THREE.BoxGeometry(22, 7, 14),
    new THREE.MeshLambertMaterial({ color: 0xb5651d }));
  gBody.position.y = 3.5;
  garage.add(gBody);
  const gDoor = new THREE.Mesh(new THREE.BoxGeometry(12, 5, 0.4),
    new THREE.MeshLambertMaterial({ color: 0x3a3f46 }));
  gDoor.position.set(0, 2.5, 7.1);
  garage.add(gDoor);
  const gSign = new THREE.Mesh(new THREE.BoxGeometry(14, 2, 0.6),
    new THREE.MeshLambertMaterial({ color: 0xffd23f, emissive: 0x7a5c00 }));
  gSign.position.set(0, 8, 7.1);
  garage.add(gSign);
  const gLight = new THREE.PointLight(0xffd23f, 22, 30);
  gLight.position.set(0, 6, 10);
  garage.add(gLight);
  garage.position.set(PLACES.garage.x, 0, PLACES.garage.z);
  scene.add(garage);

  // Harbor docks: wooden piers and stacked containers on the east edge.
  const pierMat = new THREE.MeshLambertMaterial({ color: 0x6b4f2a });
  for (let i = 0; i < 3; i++) {
    const pier = new THREE.Mesh(new THREE.BoxGeometry(10, 1, 30), pierMat);
    pier.position.set(PLACES.docks.x - 12 + i * 12, 0.4, PLACES.docks.z);
    scene.add(pier);
  }
  const containerColors = [0xc0392b, 0x2980b9, 0x27ae60, 0xe67e22];
  for (let i = 0; i < 8; i++) {
    const cont = new THREE.Mesh(new THREE.BoxGeometry(6, 2.6, 2.6),
      new THREE.MeshLambertMaterial({ color: containerColors[i % 4] }));
    cont.position.set(150 + (i % 4) * 8, 1.3 + Math.floor(i / 4) * 2.7, 95 + (i % 2) * 8);
    scene.add(cont);
  }

  return world;
}

// The nearest street coordinate to a position (for lane driving).
export function nearestStreet(v) {
  let best = WORLD.streets[0];
  let bestD = Infinity;
  for (const s of WORLD.streets) {
    const d = Math.abs(v - s);
    if (d < bestD) { bestD = d; best = s; }
  }
  return best;
}

export function clampToIsland(x, z) {
  const lim = WORLD.half - 6;
  return {
    x: Math.max(-lim, Math.min(lim, x)),
    z: Math.max(-lim, Math.min(lim, z)),
  };
}
