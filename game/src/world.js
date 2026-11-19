// Solara Bay — builds the island city: ground, water, roads, buildings,
// beach and palms, bridges, lighthouse, neon strip, garage, props.
// Seeded so the layout is identical every run.

import * as THREE from 'three';
import { CITY, COLORS, GARAGE, LIGHTHOUSE, NEON_STRIP } from './config.js';
import { mulberry32, pick, range } from './random.js';
import { makePalmMesh, makeLighthouseMesh } from './models.js';

export function roadAt(x, z) {
  // Roads run every 30 units (block centres at multiples of 30).
  const rx = Math.abs(((x + 15) % 30 + 30) % 30 - 15);
  const rz = Math.abs(((z + 15) % 30 + 30) % 30 - 15);
  return rx > 10 || rz > 10;
}

export function buildWorld(scene) {
  const rand = mulberry32(20261119);
  const colliders = [];   // {x,z,r} circles the player/car cannot pass
  const buildings = [];

  const sun = new THREE.DirectionalLight(0xffe8b8, 1.25);
  sun.position.set(80, 120, 40);
  scene.add(sun);
  scene.add(new THREE.AmbientLight(0xbfd4e6, 0.75));
  scene.fog = new THREE.Fog(0xd8c49a, 120, 320);

  // Water plane surrounding the island
  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(900, 900),
    new THREE.MeshLambertMaterial({ color: COLORS.water }));
  water.rotation.x = -Math.PI / 2;
  water.position.y = CITY.waterLevel;
  scene.add(water);

  // Island ground (sand base slightly bigger than the city)
  const sand = new THREE.Mesh(
    new THREE.PlaneGeometry(340, 340),
    new THREE.MeshLambertMaterial({ color: COLORS.sand }));
  sand.rotation.x = -Math.PI / 2;
  sand.position.y = -0.1;
  scene.add(sand);

  // Grass / city base
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(310, 310),
    new THREE.MeshLambertMaterial({ color: COLORS.grass }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0;
  scene.add(ground);

  // Roads: grid strips
  const roadMat = new THREE.MeshLambertMaterial({ color: COLORS.road });
  for (let i = -150; i <= 150; i += 30) {
    const h = new THREE.Mesh(new THREE.PlaneGeometry(310, CITY.road), roadMat);
    h.rotation.x = -Math.PI / 2; h.position.set(0, 0.02, i);
    scene.add(h);
    const v = new THREE.Mesh(new THREE.PlaneGeometry(CITY.road, 310), roadMat);
    v.rotation.x = -Math.PI / 2; v.position.set(i, 0.02, 0);
    scene.add(v);
  }
  // Sidewalk strips
  const walkMat = new THREE.MeshLambertMaterial({ color: COLORS.sidewalk });
  for (let i = -150; i <= 150; i += 30) {
    const h = new THREE.Mesh(new THREE.PlaneGeometry(310, 2.4), walkMat);
    h.rotation.x = -Math.PI / 2; h.position.set(0, 0.03, i + 6.2);
    scene.add(h);
    const v = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 310), walkMat);
    v.rotation.x = -Math.PI / 2; v.position.set(i + 6.2, 0.03, 0);
    scene.add(v);
  }
  // Centre dashes on the main roads
  const dashMat = new THREE.MeshBasicMaterial({ color: 0xf5d76e });
  for (let i = -150; i <= 150; i += 30) {
    for (let d = -140; d <= 140; d += 12) {
      const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 3), dashMat);
      dash.rotation.x = -Math.PI / 2; dash.position.set(d, 0.04, i);
      scene.add(dash);
    }
  }

  // Buildings: one or two per block, varied heights and colours
  const neon = (x, z) => x >= NEON_STRIP.x0 && x <= NEON_STRIP.x1 && z >= NEON_STRIP.z0 && z <= NEON_STRIP.z1;
  for (let bx = -135; bx <= 135; bx += 30) {
    for (let bz = -135; bz <= 135; bz += 30) {
      if (Math.abs(bx - GARAGE.x) < 20 && Math.abs(bz - GARAGE.z) < 20) continue; // garage lot
      if (Math.abs(bx - LIGHTHOUSE.x) < 20 && Math.abs(bz - LIGHTHOUSE.z) < 20) continue;
      const n = rand() < 0.55 ? 2 : 1;
      for (let k = 0; k < n; k++) {
        const ox = k === 0 ? -4 : 4;
        const oz = k === 0 ? 4 : -4;
        const w = range(rand, 9, 14);
        const d = range(rand, 9, 14);
        const h = neon(bx, bz) ? range(rand, 14, 30) : range(rand, 5, 18);
        const color = pick(rand, COLORS.buildingPalette);
        const mat = new THREE.MeshLambertMaterial({ color });
        const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
        b.position.set(bx + ox, h / 2, bz + oz);
        scene.add(b);
        buildings.push(b);
        colliders.push({ x: bx + ox, z: bz + oz, r: Math.max(w, d) * 0.62 });
        // window strips
        const winMat = new THREE.MeshBasicMaterial({ color: 0x2b3a4a });
        const floors = Math.max(1, Math.floor(h / 3.5));
        for (let f = 0; f < floors; f++) {
          const win = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.7, 0.9), winMat);
          win.position.set(bx + ox, 2 + f * 3.5, bz + oz + d / 2 + 0.06);
          scene.add(win);
        }
        // neon signs in the strip district
        if (neon(bx, bz)) {
          const signColor = pick(rand, COLORS.neon);
          const sign = new THREE.Mesh(
            new THREE.BoxGeometry(0.4, range(rand, 1.2, 2.4), range(rand, 3, 6)),
            new THREE.MeshBasicMaterial({ color: signColor }));
          sign.position.set(bx + ox + w / 2 + 0.3, range(rand, 4, 9), bz + oz);
          scene.add(sign);
          const glow = new THREE.PointLight(signColor, 12, 26);
          glow.position.set(bx + ox + w / 2 + 2, 6, bz + oz);
          scene.add(glow);
        }
      }
    }
  }

  // Beach palms around the island edge
  for (let i = 0; i < 46; i++) {
    const side = i % 4;
    const t = range(rand, -145, 145);
    let x, z;
    if (side === 0) { x = t; z = -152; } else if (side === 1) { x = t; z = 152; }
    else if (side === 2) { x = -152; z = t; } else { x = 152; z = t; }
    const palm = makePalmMesh();
    palm.position.set(x, 0, z);
    palm.rotation.y = rand() * Math.PI * 2;
    scene.add(palm);
  }
  // A few palms inside the city
  for (let i = 0; i < 18; i++) {
    const x = range(rand, -140, 140);
    const z = range(rand, -140, 140);
    if (roadAt(x, z)) continue;
    const palm = makePalmMesh();
    palm.position.set(x, 0, z);
    scene.add(palm);
  }

  // Two bridges at the map edges (east and west)
  const bridgeMat = new THREE.MeshLambertMaterial({ color: 0x8a8a80 });
  [-1, 1].forEach((s) => {
    const deck = new THREE.Mesh(new THREE.BoxGeometry(60, 1.2, 12), bridgeMat);
    deck.position.set(s * 175, 1.5, 0);
    scene.add(deck);
    for (let p = -2; p <= 2; p++) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(1.2, 9, 1.2),
        new THREE.MeshLambertMaterial({ color: 0x5a5a52 }));
      post.position.set(s * 175 + p * 12, 5, 5.4);
      scene.add(post);
      const post2 = post.clone();
      post2.position.z = -5.4;
      scene.add(post2);
    }
  });

  // Lighthouse on the north point
  const light = makeLighthouseMesh();
  light.position.set(LIGHTHOUSE.x, 0, LIGHTHOUSE.z);
  scene.add(light);
  colliders.push({ x: LIGHTHOUSE.x, z: LIGHTHOUSE.z, r: 5 });
  const beam = new THREE.PointLight(0xfff2a0, 60, 90);
  beam.position.set(LIGHTHOUSE.x, 28, LIGHTHOUSE.z);
  beam.name = 'lighthouseBeam';
  scene.add(beam);

  // Garage safehouse: low building + open lot + sign
  const garage = new THREE.Group();
  const gBody = new THREE.Mesh(new THREE.BoxGeometry(22, 7, 14),
    new THREE.MeshLambertMaterial({ color: 0x7a4a2b }));
  gBody.position.y = 3.5;
  garage.add(gBody);
  const gRoof = new THREE.Mesh(new THREE.BoxGeometry(23, 0.6, 15),
    new THREE.MeshLambertMaterial({ color: 0x3a2a1a }));
  gRoof.position.y = 7.3;
  garage.add(gRoof);
  const gSign = new THREE.Mesh(new THREE.BoxGeometry(10, 2, 0.5),
    new THREE.MeshBasicMaterial({ color: 0xff6a00 }));
  gSign.position.set(0, 8.6, 7.2);
  garage.add(gSign);
  const gDoor = new THREE.Mesh(new THREE.BoxGeometry(8, 5, 0.4),
    new THREE.MeshLambertMaterial({ color: 0x2a2a2a }));
  gDoor.position.set(0, 2.5, 7.1);
  garage.add(gDoor);
  garage.position.set(GARAGE.x, 0, GARAGE.z);
  scene.add(garage);
  colliders.push({ x: GARAGE.x, z: GARAGE.z, r: 12 });

  // Street props: lamps along roads
  const lampMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
  for (let i = -140; i <= 140; i += 30) {
    [-1, 1].forEach((s) => {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 5, 6), lampMat);
      pole.position.set(i + s * 6, 2.5, -60);
      scene.add(pole);
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.25, 0.4),
        new THREE.MeshBasicMaterial({ color: 0xffe9a0 }));
      head.position.set(i + s * 6, 5.05, -60);
      scene.add(head);
    });
  }

  // Docks area: wooden piers on the east beach
  const pierMat = new THREE.MeshLambertMaterial({ color: 0x6b4a26 });
  for (let p = 0; p < 3; p++) {
    const pier = new THREE.Mesh(new THREE.BoxGeometry(4, 0.8, 26), pierMat);
    pier.position.set(148 - p * 4, 0.4, 100 + p * 12);
    scene.add(pier);
  }

  return { colliders, buildings, sun, beam };
}
