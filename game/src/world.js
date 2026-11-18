import * as THREE from 'three';
import { ROADS, randomSource, GARAGE } from './config.js';
import { box, cylinder, label, material } from './models.js';

export function buildIslandCity(scene) {
  const random = randomSource();
  const solids = [];
  const windowCanvas = document.createElement('canvas');
  windowCanvas.width = 320;
  windowCanvas.height = 320;
  const windowContext = windowCanvas.getContext('2d');
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      const x = 13 + col * 62;
      const y = 12 + row * 62;
      windowContext.fillStyle = '#b49e80';
      windowContext.fillRect(x - 3, y - 3, 42, 46);
      windowContext.fillStyle = (row + col) % 4 === 0 ? '#dfc28d' : '#477481';
      windowContext.fillRect(x, y, 36, 40);
      windowContext.fillStyle = '#b9d2ce';
      windowContext.fillRect(x + 4, y + 4, 5, 30);
      windowContext.fillStyle = '#304c54';
      windowContext.fillRect(x, y + 29, 36, 3);
    }
  }
  const windowMaterial = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(windowCanvas), transparent: true, side: THREE.DoubleSide, depthWrite: false });
  const water = box(scene, 0, -2.7, 0, 2400, 1, 2400, '#209da7', { roughness: .27, metalness: .3 });
  box(scene, 0, -1.1, 0, 390, 2, 390, '#ead29b');
  box(scene, 0, -.12, 0, 348, .2, 348, '#bfc1a9');
  for (const axis of [0, 1]) {
    for (const road of ROADS) {
      box(scene, axis ? 0 : road, .015, axis ? road : 0, axis ? 365 : 18, .12, axis ? 18 : 365, '#475960');
      for (const edge of [-10.1, 10.1]) box(scene, axis ? 0 : road + edge, .16, axis ? road + edge : 0, axis ? 363 : 1, .3, axis ? 1 : 363, '#f2ddba');
      for (let k = -174; k <= 174; k += 9) {
        if (ROADS.some(r => Math.abs(r - k) < 12)) continue;
        box(scene, axis ? k : road, .09, axis ? road : k, axis ? 4.2 : .16, .02, axis ? .16 : 4.2, '#eedda2');
      }
    }
  }
  const palette = ['#edbfa2', '#f3d6b0', '#92c3bb', '#d78c78', '#c4d7c4', '#ebd2bd', '#b5b8c5'];
  for (let ix = 0; ix < 4; ix++) {
    for (let iz = 0; iz < 4; iz++) {
      const cx = -108 + ix * 72;
      const cz = -108 + iz * 72;
      for (const dx of [-16, 15]) for (const dz of [-16, 16]) {
        const x = cx + dx;
        const z = cz + dz;
        const height = 7 + random() * 19 + (ix === 1 && iz === 1 ? 15 : 0);
        const w = 20 + random() * 4;
        const d = 20 + random() * 4;
        const col = palette[Math.floor(random() * palette.length)];
        box(scene, x, height / 2, z, w, height, d, col);
        box(scene, x, height + .3, z, w + .9, .7, d + .9, '#f4dfbd');
        box(scene, x + 3, height + 1, z - 4, 5, 1.6, 4, '#749297');
        solids.push({ x, z, w: w / 2 + .5, d: d / 2 + .5 });
        const facade = new THREE.PlaneGeometry(w - 2, height - 3);
        const front = new THREE.Mesh(facade, windowMaterial);
        front.position.set(x, height / 2 + .8, z + d / 2 + .04);
        scene.add(front);
        const back = new THREE.Mesh(facade, windowMaterial);
        back.position.set(x, height / 2 + .8, z - d / 2 - .04);
        scene.add(back);
        const sideFacade = new THREE.PlaneGeometry(d - 2, height - 3);
        const left = new THREE.Mesh(sideFacade, windowMaterial);
        left.position.set(x - w / 2 - .04, height / 2 + .8, z);
        left.rotation.y = Math.PI / 2;
        scene.add(left);
        const right = new THREE.Mesh(sideFacade, windowMaterial);
        right.position.set(x + w / 2 + .04, height / 2 + .8, z);
        right.rotation.y = Math.PI / 2;
        scene.add(right);
        if (random() > .45) {
          box(scene, x, 2.5, z + d / 2 + 1.3, w * .85, .28, 2.8, random() > .5 ? '#dc795f' : '#407f7e');
          label(scene, ['CAFÉ LUNA', 'SOLARA MOTEL', 'MERCADO', 'BAY RECORDS', 'MARINA CLUB'][Math.floor(random() * 5)], x, 4.7, z + d / 2 + .08, w * .8);
        }
      }
    }
  }
  function palm(x, z, height = 9) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    cylinder(group, 0, height / 2, 0, .27, .47, height, '#a18458', 7);
    for (let k = 0; k < 7; k++) {
      const leaf = new THREE.Mesh(new THREE.ConeGeometry(1.3, 6.3, 4), material(k % 2 ? '#428d66' : '#65a575'));
      leaf.position.set(Math.sin(k * .9) * 2, height, Math.cos(k * .9) * 2);
      leaf.rotation.set(Math.cos(k * .9) * 1.1, k * .9, Math.sin(k * .9) * -1.1);
      leaf.castShadow = true;
      group.add(leaf);
    }
    scene.add(group);
  }
  for (let n = -174; n <= 174; n += 22) {
    for (const edge of [-174, 174]) { palm(edge, n, 8 + random() * 3); palm(n, edge, 8 + random() * 3); }
  }
  for (const x of ROADS) for (let z = -165; z <= 165; z += 36) {
    if (ROADS.some(r => Math.abs(r - z) < 13)) continue;
    cylinder(scene, x + 11.6, 3, z, .1, .16, 6, '#496068', 6);
    box(scene, x + 10.5, 6.1, z, 2.7, .2, .7, '#f5e4b4');
    box(scene, x - 12.5, .65, z + 2, 1.8, 1.3, .75, '#516d62');
    if (random() > .4) palm(x - 13, z - 7, 7);
  }
  // The west-side workshop is the safehouse and supplies shop.
  box(scene, -165, 3.6, 74, 18, 7, 27, '#b9c6af');
  box(scene, -155.9, 2, 74, .08, 4, 17, '#29464b');
  const garageSign = label(scene, 'VALE AUTO / SAFEHOUSE', -155.8, 6, 74, 20, '#8ff0ca');
  garageSign.rotation.y = Math.PI / 2;
  box(scene, GARAGE.x, .11, GARAGE.z, 14, .05, 17, '#618878');
  // Two bridges leave the island at the eastern and western ends.
  for (const side of [-1, 1]) {
    box(scene, side * 252, .3, 0, 133, .8, 17, '#6d8384');
    for (const z of [-8.5, 8.5]) {
      box(scene, side * 252, 1.2, z, 133, .7, .6, '#ead8b9');
      for (let x = 195; x < 315; x += 24) cylinder(scene, side * x, -2, z, 1.2, 1.4, 8, '#7e9790');
    }
    box(scene, side * 365, -1.3, 0, 95, 2, 130, '#91ae83');
  }
  // Harbor boardwalk, stacked cargo, bollards and a working crane.
  box(scene, 165, .05, -93, 36, .5, 96, '#a6a38b');
  for (let z = -132; z < -50; z += 15) {
    box(scene, 178, 1.6, z, 8, 3, 11, z % 2 ? '#d28052' : '#688e8d');
    for (let k = -3; k <= 3; k++) box(scene, 182.1, 1.6, z + k, .1, 2.8, .13, '#e0b485');
    cylinder(scene, 188, .6, z, .4, .5, 1, '#3f5660');
  }
  box(scene, 184, 12, -133, 2, 24, 2, '#e4b452');
  box(scene, 172, 24, -133, 31, 1.4, 1.8, '#e4b452');
  cylinder(scene, 160, 18, -133, .08, .08, 12, '#344d58');
  // A tall lighthouse anchors the northern skyline.
  cylinder(scene, 0, 0, -180, 14, 17, 2, '#b0af91');
  cylinder(scene, 0, 13, -180, 3.4, 5.2, 26, '#f5dfbd', 16);
  cylinder(scene, 0, 17, -180, 3.8, 4.1, 4, '#d47462', 16);
  cylinder(scene, 0, 27, -180, 5.6, 5.6, 1, '#214852', 16);
  cylinder(scene, 0, 29.2, -180, 3.3, 3.3, 3.4, '#fbe8ab', 12);
  cylinder(scene, 0, 32, -180, 0, 5, 3, '#d17b5e', 12);
  label(scene, 'NORTH POINT', 0, 5, -173, 15);
  // Sand, parasols, boats and a promenade make the island edge legible.
  for (let z = 24; z < 160; z += 21) {
    cylinder(scene, 184, 1.7, z, .08, .08, 3.4, '#ba9b71');
    cylinder(scene, 184, 3.1, z, 0, 3.7, 1.5, z % 2 ? '#f3a47a' : '#75c0b7', 8);
    box(scene, 181, .35, z + 4, 1.5, .4, 4.5, '#fbddae');
  }
  for (const [x, z] of [[210, 50], [221, -90], [-220, 90]]) {
    const boat = new THREE.Group();
    box(boat, 0, -.3, 0, 4, 1.6, 11, '#f4e4c3');
    box(boat, 0, .8, -1, 3.1, 1.2, 4, '#587e84');
    cylinder(boat, 0, 5, 0, .09, .09, 10, '#d6c5a6');
    boat.position.set(x, 0, z);
    boat.rotation.y = .4;
    scene.add(boat);
  }
  return { solids, water, collides(x, z, radius = 1) {
    return solids.some(b => Math.abs(x - b.x) < b.w + radius && Math.abs(z - b.z) < b.d + radius);
  } };
}
