// Solara Bay — low-poly mesh builders for cars, people and the helicopter.
// One job: turn a colour and a size into a THREE.Group the game can move.

import * as THREE from 'three';

const CAR_COLORS = [0xd23c2e, 0x2e7dd2, 0xe8b93c, 0x3cb371, 0x8e44ad, 0xe8e8e8, 0x222831, 0xff7f2a];

export function carColor(i) { return CAR_COLORS[i % CAR_COLORS.length]; }

export function makeCarMesh(color, kind) {
  const g = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.4 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x1a2a3a, roughness: 0.15, metalness: 0.7 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.55, 4.2), bodyMat);
  body.position.y = 0.55; body.castShadow = true; g.add(body);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.5, 2.0), glassMat);
  cabin.position.set(0, 1.05, -0.2); cabin.castShadow = true; g.add(cabin);
  if (kind === 'sport') {
    const spoiler = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.08, 0.4), bodyMat);
    spoiler.position.set(0, 1.0, -2.0); g.add(spoiler);
  }
  if (kind === 'taxi') {
    const sign = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.25, 0.5),
      new THREE.MeshStandardMaterial({ color: 0xffe135, emissive: 0xaa8800 }));
    sign.position.set(0, 1.45, -0.2); g.add(sign);
  }
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
  const wheelGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.3, 10);
  wheelGeo.rotateZ(Math.PI / 2);
  for (const [x, z] of [[-0.95, 1.35], [0.95, 1.35], [-0.95, -1.35], [0.95, -1.35]]) {
    const w = new THREE.Mesh(wheelGeo, wheelMat);
    w.position.set(x, 0.36, z); g.add(w);
  }
  // headlights
  const lightMat = new THREE.MeshStandardMaterial({ color: 0xfff6c0, emissive: 0xccbb55 });
  for (const x of [-0.6, 0.6]) {
    const h = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.15, 0.1), lightMat);
    h.position.set(x, 0.6, 2.12); g.add(h);
  }
  return g;
}

export function makePoliceMesh() {
  const g = makeCarMesh(0x1a1a2e, 'sport');
  const barMat = new THREE.MeshStandardMaterial({ color: 0xff2222, emissive: 0xaa0000 });
  const barMat2 = new THREE.MeshStandardMaterial({ color: 0x2244ff, emissive: 0x0000aa });
  const b1 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.15, 0.3), barMat);
  b1.position.set(-0.4, 1.35, -0.2); g.add(b1);
  const b2 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.15, 0.3), barMat2);
  b2.position.set(0.4, 1.35, -0.2); g.add(b2);
  g.userData.lightBars = [b1, b2];
  return g;
}

export function makePersonMesh(shirt, pants) {
  const g = new THREE.Group();
  const skin = new THREE.MeshStandardMaterial({ color: 0xc98a5e, roughness: 0.8 });
  const shirtMat = new THREE.MeshStandardMaterial({ color: shirt, roughness: 0.8 });
  const pantsMat = new THREE.MeshStandardMaterial({ color: pants, roughness: 0.9 });
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.7, 0.32), shirtMat);
  torso.position.y = 1.05; torso.castShadow = true; g.add(torso);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.34, 0.34), skin);
  head.position.y = 1.6; g.add(head);
  for (const x of [-0.14, 0.14]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.55, 0.2), pantsMat);
    leg.position.set(x, 0.45, 0); g.add(leg);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.6, 0.14), shirtMat);
    arm.position.set(x * 2.2, 1.05, 0); g.add(arm);
  }
  return g;
}

export function makePlayerMesh() {
  // Mara Vale: teal jacket, dark jeans, red bandana strip.
  const g = makePersonMesh(0x0e7c7b, 0x223344);
  const band = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.08, 0.36),
    new THREE.MeshStandardMaterial({ color: 0xd23c2e }));
  band.position.y = 1.78; g.add(band);
  return g;
}

export function makeHelicopterMesh() {
  const g = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x223344, roughness: 0.5, metalness: 0.4 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.4, 3.6), bodyMat);
  body.castShadow = true; g.add(body);
  const nose = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.0, 1.0),
    new THREE.MeshStandardMaterial({ color: 0x1a2a3a, roughness: 0.2, metalness: 0.6 }));
  nose.position.set(0, -0.1, 2.1); g.add(nose);
  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 3.4), bodyMat);
  tail.position.set(0, 0.2, -3.2); g.add(tail);
  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.2, 0.8), bodyMat);
  fin.position.set(0, 0.7, -4.7); g.add(fin);
  const rotor = new THREE.Group();
  const bladeMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.6 });
  for (let i = 0; i < 2; i++) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(7.5, 0.06, 0.35), bladeMat);
    blade.rotation.y = (i * Math.PI) / 2; rotor.add(blade);
  }
  rotor.position.y = 1.0; g.add(rotor);
  g.userData.rotor = rotor;
  // searchlight cone
  const coneMat = new THREE.MeshBasicMaterial({
    color: 0xfff6c0, transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false,
  });
  const cone = new THREE.Mesh(new THREE.ConeGeometry(4.5, 22, 16, 1, true), coneMat);
  cone.position.y = -11; cone.rotation.x = Math.PI; g.add(cone);
  g.userData.cone = cone;
  return g;
}

export function makePalm() {
  const g = new THREE.Group();
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8a6b46, roughness: 1 });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.3, 4.2, 7), trunkMat);
  trunk.position.y = 2.1; trunk.rotation.z = 0.08; trunk.castShadow = true; g.add(trunk);
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x2e9e4f, roughness: 0.9, side: THREE.DoubleSide });
  for (let i = 0; i < 6; i++) {
    const leaf = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.06, 0.6), leafMat);
    leaf.position.set(Math.cos(i) * 0.9, 4.3, Math.sin(i) * 0.9);
    leaf.rotation.y = (i * Math.PI) / 3;
    leaf.rotation.z = -0.5; leaf.castShadow = true; g.add(leaf);
  }
  return g;
}

export function makeLighthouse() {
  const g = new THREE.Group();
  const stripeWhite = new THREE.MeshStandardMaterial({ color: 0xf5f5f0, roughness: 0.7 });
  const stripeRed = new THREE.MeshStandardMaterial({ color: 0xd23c2e, roughness: 0.7 });
  for (let i = 0; i < 6; i++) {
    const seg = new THREE.Mesh(new THREE.CylinderGeometry(2.6 - i * 0.25, 2.9 - i * 0.25, 4, 12),
      i % 2 === 0 ? stripeWhite : stripeRed);
    seg.position.y = 2 + i * 4; seg.castShadow = true; g.add(seg);
  }
  const lamp = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 2.4, 10),
    new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.4, metalness: 0.6 }));
  lamp.position.y = 26; g.add(lamp);
  const beam = new THREE.Mesh(new THREE.SphereGeometry(1.0, 10, 10),
    new THREE.MeshStandardMaterial({ color: 0xfff6c0, emissive: 0xffee88, emissiveIntensity: 2 }));
  beam.position.y = 26; g.add(beam);
  g.userData.beam = beam;
  const roof = new THREE.Mesh(new THREE.ConeGeometry(2.0, 1.6, 10),
    new THREE.MeshStandardMaterial({ color: 0x223344 }));
  roof.position.y = 28; g.add(roof);
  return g;
}
