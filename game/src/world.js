import * as THREE from 'three';
import { box, cylinder, label } from './render.js';
import { between, pick, random } from './random.js';
import { ROADS, LANDMARKS } from './config.js';

export function buildCoastalCity(scene) {
  const obstacles = [];
  box(scene, 0, -.8, 0, 350, 1.2, 350, '#b6bb9c');
  box(scene, 260, -1.1, 0, 185, .5, 650, '#299fae');
  box(scene, 180, -.5, 0, 30, .6, 350, '#efd39b');
  box(scene, 162, 0, 0, 9, .5, 350, '#f0dfbb');
  for (let z = -165; z < 170; z += 12) {
    box(scene, 169, .5, z, .3, 1, 6, '#f9ecc7');
    box(scene, 169, .9, z, .3, .12, 12, '#f9ecc7');
    box(scene, 234, -.77, z, 85, .02, .35, '#a9e1d5');
  }
  for (const road of ROADS) {
    box(scene, road, -.05, 0, 19, .2, 340, '#46585c');
    box(scene, 0, -.04, road, 340, .2, 19, '#46585c');
    for (let along = -163; along < 165; along += 9) {
      if (ROADS.every(cross => Math.abs(along - cross) > 12)) {
        box(scene, road, .08, along, .18, .03, 4, '#f7d47d');
        box(scene, along, .09, road, 4, .03, .18, '#f7d47d');
      }
    }
    for (const cross of ROADS) {
      for (let stripe = -6; stripe <= 6; stripe += 2) {
        box(scene, road + stripe, .1, cross + 11, .95, .04, 3, '#eee8ce');
        box(scene, road + 11, .1, cross + stripe, 3, .04, .95, '#eee8ce');
      }
    }
  }
  const colors = ['#eed6aa', '#f1a68c', '#b7d5bd', '#e6c778', '#a1c8d0', '#dbbdc6', '#e5e1ca'];
  for (let x = -96; x <= 96; x += 64) {
    for (let z = -96; z <= 96; z += 64) {
      box(scene, x, .05, z, 44, .45, 44, '#d7cdb6');
      if (x === -32 && z === 32) continue;
      for (const dx of [-11, 11]) {
        for (const dz of [-11, 11]) {
          const height = between(8, 26) + (z < -50 ? between(0, 16) : 0);
          const bx = x + dx;
          const bz = z + dz;
          const width = between(15, 18);
          const depth = between(15, 18);
          box(scene, bx, height / 2, bz, width, height, depth, pick(colors));
          box(scene, bx, height + .3, bz, width + .6, .6, depth + .6, '#fff0d0');
          box(scene, bx + 2, height + 1.2, bz, 4, 1.6, 3, '#9faaa1');
          obstacles.push({ x: bx, z: bz, w: width / 2 + .8, d: depth / 2 + .8 });
          for (let floor = 3; floor < height - 1; floor += 4.2) {
            for (const offset of [-5, 0, 5]) {
              box(scene, bx + offset, floor, bz + depth / 2 + .03, 2.1, 1.7, .08, '#39717e');
              box(scene, bx + offset, floor, bz - depth / 2 - .03, 2.1, 1.7, .08, '#39717e');
            }
            box(scene, bx + width / 2 + .03, floor, bz, .08, 1.7, 2.1, '#39717e');
            box(scene, bx - width / 2 - .03, floor, bz, .08, 1.7, 2.1, '#39717e');
          }
          if (random() > .5) {
            box(scene, bx, 2.6, bz + depth / 2 + 1, width - 2, .3, 2.6, pick(['#f07860', '#6aafab', '#f6c565']));
          }
        }
      }
    }
  }
  buildGarage(scene);
  buildHarbor(scene);
  buildLighthouse(scene);
  label(scene, 'SOLARA BAY', 21, 20, -18, 21);
  label(scene, 'PALM HOTEL', -85, 29, 13, 14, '#ffdd9b', '#b86863');
  label(scene, 'BAY MARKET', 86, 8, 13, 13);
  label(scene, 'SUNSET DINER', -85, 7, 77, 14, '#fff5dc', '#cd795b');
  for (const road of ROADS) {
    for (let t = -150; t < 155; t += 31) {
      if (ROADS.every(c => Math.abs(t - c) > 15)) {
        palm(scene, road + 13, t);
        if (random() > .4) palm(scene, t, road - 14);
        lamp(scene, road - 12, t);
        box(scene, road + 13, .8, t + 7, 1.2, 1.6, 1.2, '#427e77');
        box(scene, road + 14, .65, t - 5, 1.1, .2, 3.8, '#b67b54');
        box(scene, road + 14, 1.25, t - 6.5, 1.1, 1.1, .16, '#b67b54');
      }
    }
  }
  for (let z = -155; z <= 155; z += 24) {
    palm(scene, 158, z);
    const umbrella = new THREE.Mesh(new THREE.ConeGeometry(3.3, 1.1, 9), new THREE.MeshStandardMaterial({ color: pick(['#ee9978', '#f5e5b5', '#73baba']) }));
    umbrella.position.set(183, 3.2, z);
    scene.add(umbrella);
    cylinder(scene, 183, 1.5, z, .1, 3, '#e3d6ab');
    box(scene, 181, .2, z + 3, 1.5, .25, 3.5, '#fcf0d3');
  }
  for (let i = 0; i < 12; i++) {
    const cloud = box(scene, between(-220, 220), between(85, 110), between(-230, -170), between(15, 35), 2, 5, '#eef3de');
    cloud.castShadow = false;
  }
  return {
    obstacles,
    blocked(x, z, radius = .7) {
      return Math.abs(x) > 204 || Math.abs(z) > 169 || obstacles.some(o => Math.abs(x - o.x) < o.w + radius && Math.abs(z - o.z) < o.d + radius);
    },
  };
}

function palm(scene, x, z) {
  const height = between(8, 12);
  const trunk = cylinder(scene, x, height / 2, z, .36, height, '#9c7f56', .23);
  trunk.rotation.z = .07;
  for (let i = 0; i < 7; i++) {
    const angle = i * Math.PI * 2 / 7;
    const leaf = box(scene, x + Math.sin(angle) * 2.2, height, z + Math.cos(angle) * 2.2, 1.2, .23, 6, i % 2 ? '#478f68' : '#32785b');
    leaf.rotation.y = angle;
    leaf.rotation.x = .2;
    leaf.rotation.z = Math.sin(angle) * .15;
  }
}

function lamp(scene, x, z) {
  cylinder(scene, x, 3.7, z, .13, 7.4, '#52686b');
  box(scene, x + 1, 7.4, z, 2.2, .15, .18, '#52686b');
  box(scene, x + 1.9, 7.3, z, .8, .18, .6, '#fff4b9');
}

function buildGarage(scene) {
  box(scene, -42, 3, 27, 25, 6, 23, '#549c95');
  box(scene, -42, 6.2, 27, 26, .5, 24, '#f3d9a5');
  box(scene, -42, 2.3, 39, 17, 4.6, .2, '#274f5a');
  label(scene, 'VALE AUTO / LAY LOW', -42, 5, 39.2, 21);
  box(scene, -47, .05, 46, 22, .1, 11, '#778a7c');
  label(scene, 'SAFEHOUSE', -47, 2, 47, 6, '#bff7c9');
}

function buildHarbor(scene) {
  box(scene, 133, .1, 147, 72, .8, 40, '#a4a896');
  for (let i = 0; i < 6; i++) {
    const x = 105 + (i % 3) * 16;
    const z = 148 + Math.floor(i / 3) * 10;
    box(scene, x, 2.4, z, 13, 4.5, 7, pick(['#ba6757', '#3c8290', '#d2a44d']));
    for (let rib = -5; rib < 6; rib += 2) box(scene, x + rib, 2.4, z - 3.55, .13, 4.4, .13, '#e0ba8e');
  }
  for (let x = 145; x <= 165; x += 20) {
    box(scene, x, 12, 153, 1.2, 24, 1.2, '#d6ab54');
    box(scene, x - 7, 24, 153, 20, 1.1, 1.1, '#d6ab54');
    box(scene, x - 15, 18, 153, .15, 12, .15, '#46595b');
  }
  label(scene, 'PORT SOLARA', 119, 10, 146, 24);
  box(scene, 189, .7, 144, 13, 3, 32, '#e9e6cd');
  box(scene, 189, 3.5, 140, 10, 3, 13, '#f6e7c9');
}

function buildLighthouse(scene) {
  box(scene, 180, -.1, -148, 48, 1, 30, '#d5cba5');
  cylinder(scene, 192, 10, -148, 3.5, 20, '#fff0d1', 2.5);
  cylinder(scene, 192, 11, -148, 3.4, 4, '#d97763', 3.1);
  cylinder(scene, 192, 21.5, -148, 3.8, 2, '#304d59');
  cylinder(scene, 192, 24, -148, 2.7, 3, '#ffdc83');
  cylinder(scene, 192, 26, -148, 3.8, 1, '#b96353', 0);
  label(scene, 'SOLARA POINT', 185, 5, -135, 16);
}
