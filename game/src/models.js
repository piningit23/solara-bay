// Solara Bay — low-poly mesh builders: cars, people, helicopter, crates.

import * as THREE from 'three';

export function makeCarMesh(color, isPolice) {
  const g = new THREE.Group();
  const paint = new THREE.MeshLambertMaterial({ color });
  const dark = new THREE.MeshLambertMaterial({ color: 0x1a1a22 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.55, 4.1), paint);
  body.position.y = 0.55;
  g.add(body);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.5, 2.1), dark);
  cabin.position.set(0, 1.05, -0.2);
  g.add(cabin);
  const wheelGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.3, 10);
  const wheelMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
  [[-0.95, 1.35], [0.95, 1.35], [-0.95, -1.35], [0.95, -1.35]].forEach(([x, z]) => {
    const w = new THREE.Mesh(wheelGeo, wheelMat);
    w.rotation.z = Math.PI / 2;
    w.position.set(x, 0.36, z);
    g.add(w);
  });
  // headlights
  const lightMat = new THREE.MeshBasicMaterial({ color: 0xfff6c0 });
  [-0.6, 0.6].forEach((x) => {
    const l = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.12, 0.08), lightMat);
    l.position.set(x, 0.6, 2.06);
    g.add(l);
  });
  if (isPolice) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.14, 0.3),
      new THREE.MeshBasicMaterial({ color: 0xff2233 }));
    bar.position.set(0, 1.38, -0.2);
    bar.name = 'lightbar';
    g.add(bar);
    const bar2 = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.14, 0.3),
      new THREE.MeshBasicMaterial({ color: 0x2266ff }));
    bar2.position.set(0.55, 1.38, -0.2);
    bar2.name = 'lightbar2';
    g.add(bar2);
  }
  g.userData.wheels = [];
  return g;
}

export function makePersonMesh(shirtColor, skinColor) {
  const g = new THREE.Group();
  const shirt = new THREE.MeshLambertMaterial({ color: shirtColor });
  const skin = new THREE.MeshLambertMaterial({ color: skinColor || 0xd9a066 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.75, 0.32), shirt);
  body.position.y = 1.05;
  g.add(body);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.34, 0.34), skin);
  head.position.y = 1.62;
  g.add(head);
  const legMat = new THREE.MeshLambertMaterial({ color: 0x2c3e50 });
  [-0.14, 0.14].forEach((x) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.65, 0.2), legMat);
    leg.position.set(x, 0.33, 0);
    leg.name = x < 0 ? 'legL' : 'legR';
    g.add(leg);
  });
  return g;
}

export function makeHelicopterMesh() {
  const g = new THREE.Group();
  const bodyMat = new THREE.MeshLambertMaterial({ color: 0x223344 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.4, 4.2), bodyMat);
  g.add(body);
  const glass = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.8, 1.2),
    new THREE.MeshLambertMaterial({ color: 0x9fd8e8 }));
  glass.position.set(0, 0.2, 1.8);
  g.add(glass);
  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 4.5), bodyMat);
  tail.position.set(0, 0.3, -4.0);
  g.add(tail);
  const rotor = new THREE.Group();
  rotor.name = 'rotor';
  const bladeMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
  const b1 = new THREE.Mesh(new THREE.BoxGeometry(9, 0.08, 0.35), bladeMat);
  const b2 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.08, 9), bladeMat);
  rotor.add(b1); rotor.add(b2);
  rotor.position.y = 0.95;
  g.add(rotor);
  const skidMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
  [-0.8, 0.8].forEach((x) => {
    const skid = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.1, 3.0), skidMat);
    skid.position.set(x, -0.85, 0);
    g.add(skid);
  });
  // spotlight cone under the heli
  const cone = new THREE.Mesh(
    new THREE.ConeGeometry(3.2, 18, 16, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0xfff6c0, transparent: true, opacity: 0.16,
      side: THREE.DoubleSide, depthWrite: false,
    }));
  cone.position.y = -9.5;
  cone.rotation.x = Math.PI;
  cone.name = 'spotcone';
  g.add(cone);
  return g;
}

export function makeCrateMesh() {
  const g = new THREE.Group();
  const mat = new THREE.MeshLambertMaterial({ color: 0xb8860b });
  const box = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.4, 1.4), mat);
  box.position.y = 0.7;
  g.add(box);
  const lid = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.12, 1.5),
    new THREE.MeshLambertMaterial({ color: 0x8b6508 }));
  lid.position.y = 1.45;
  g.add(lid);
  return g;
}

export function makeLighthouseMesh() {
  const g = new THREE.Group();
  const tower = new THREE.Mesh(
    new THREE.CylinderGeometry(2.2, 3.4, 26, 12),
    new THREE.MeshLambertMaterial({ color: 0xf5f5f0 }));
  tower.position.y = 13;
  g.add(tower);
  for (let i = 0; i < 3; i++) {
    const band = new THREE.Mesh(
      new THREE.CylinderGeometry(2.55 - i * 0.2, 2.75 - i * 0.2, 2.2, 12),
      new THREE.MeshLambertMaterial({ color: 0xd23c3c }));
    band.position.y = 6 + i * 8;
    g.add(band);
  }
  const lamp = new THREE.Mesh(new THREE.BoxGeometry(3, 2.4, 3),
    new THREE.MeshLambertMaterial({ color: 0x222222 }));
  lamp.position.y = 27;
  g.add(lamp);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.9, 10, 8),
    new THREE.MeshBasicMaterial({ color: 0xfff2a0 }));
  bulb.position.y = 27;
  bulb.name = 'bulb';
  g.add(bulb);
  return g;
}

export function makePalmMesh() {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.3, 4.4, 7),
    new THREE.MeshLambertMaterial({ color: 0x8a6a42 }));
  trunk.position.y = 2.2;
  trunk.rotation.z = 0.08;
  g.add(trunk);
  const leafMat = new THREE.MeshLambertMaterial({ color: 0x2e8b3a });
  for (let i = 0; i < 6; i++) {
    const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 2.6), leafMat);
    const a = (i / 6) * Math.PI * 2;
    leaf.position.set(Math.cos(a) * 1.1, 4.5, Math.sin(a) * 1.1);
    leaf.rotation.y = -a;
    leaf.rotation.x = 0.35;
    g.add(leaf);
  }
  return g;
}
