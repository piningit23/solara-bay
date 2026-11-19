// Low-poly model builders: cars, people, the police helicopter, crates, palms.
// Every mesh is built from boxes and cylinders so the game needs no art files.

export function makeCar(THREE, color, opts = {}) {
  const car = new THREE.Group();
  const paint = new THREE.MeshLambertMaterial({ color });
  const dark = new THREE.MeshLambertMaterial({ color: 0x1a2028 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.55, 4.2), paint);
  body.position.y = 0.55;
  car.add(body);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.5, 2.1), dark);
  cabin.position.set(0, 1.05, -0.2);
  car.add(cabin);
  const wheelGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.3, 10);
  const wheelMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
  const wheelPositions = [[-0.95, 1.35], [0.95, 1.35], [-0.95, -1.35], [0.95, -1.35]];
  for (const [x, z] of wheelPositions) {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(x, 0.36, z);
    car.add(wheel);
  }
  if (opts.police) {
    const bar = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.16, 0.4),
      new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0x223344 }),
    );
    bar.position.set(0, 1.4, -0.2);
    bar.name = 'lightbar';
    car.add(bar);
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.02, 0.2, 4.22),
      new THREE.MeshLambertMaterial({ color: 0x0b3d91 }));
    stripe.position.y = 0.62;
    car.add(stripe);
  }
  if (opts.taxi) {
    const sign = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.18, 0.4),
      new THREE.MeshLambertMaterial({ color: 0xffd23f, emissive: 0x8a6d00 }));
    sign.position.set(0, 1.42, -0.2);
    car.add(sign);
  }
  car.userData.wheels = [];
  return car;
}

export function makePerson(THREE, color) {
  const person = new THREE.Group();
  const skin = new THREE.MeshLambertMaterial({ color: 0xd9a066 });
  const shirt = new THREE.MeshLambertMaterial({ color });
  const legs = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.7, 0.26),
    new THREE.MeshLambertMaterial({ color: 0x2b3442 }));
  legs.position.y = 0.35;
  person.add(legs);
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.65, 0.32), shirt);
  torso.position.y = 1.02;
  person.add(torso);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.34, 0.34), skin);
  head.position.y = 1.55;
  person.add(head);
  const armGeo = new THREE.BoxGeometry(0.14, 0.6, 0.14);
  const armL = new THREE.Mesh(armGeo, shirt);
  armL.position.set(-0.36, 1.0, 0);
  person.add(armL);
  const armR = new THREE.Mesh(armGeo, shirt);
  armR.position.set(0.36, 1.0, 0);
  person.add(armR);
  return person;
}

export function makeHelicopter(THREE) {
  const heli = new THREE.Group();
  const bodyMat = new THREE.MeshLambertMaterial({ color: 0x1e3a5f });
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.4, 4.6), bodyMat);
  heli.add(body);
  const glass = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.7, 1.2),
    new THREE.MeshLambertMaterial({ color: 0x9fd8ff, emissive: 0x224455 }));
  glass.position.set(0, 0.25, 2.0);
  heli.add(glass);
  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 4.2), bodyMat);
  tail.position.set(0, 0.3, -4.0);
  heli.add(tail);
  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.4, 0.9), bodyMat);
  fin.position.set(0, 0.8, -5.8);
  heli.add(fin);
  const rotor = new THREE.Group();
  const bladeGeo = new THREE.BoxGeometry(9.5, 0.08, 0.5);
  const bladeMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
  rotor.add(new THREE.Mesh(bladeGeo, bladeMat));
  const blade2 = new THREE.Mesh(bladeGeo, bladeMat);
  blade2.rotation.y = Math.PI / 2;
  rotor.add(blade2);
  rotor.position.y = 1.0;
  rotor.name = 'rotor';
  heli.add(rotor);
  const skidGeo = new THREE.BoxGeometry(0.15, 0.15, 3.4);
  const skidMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
  for (const x of [-0.9, 0.9]) {
    const skid = new THREE.Mesh(skidGeo, skidMat);
    skid.position.set(x, -0.9, 0);
    heli.add(skid);
  }
  // Visible spotlight cone shining down at the street.
  const cone = new THREE.Mesh(
    new THREE.ConeGeometry(6, 26, 20, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0xfff6c0, transparent: true, opacity: 0.14,
      side: THREE.DoubleSide, depthWrite: false,
    }),
  );
  cone.position.y = -13;
  cone.rotation.x = Math.PI;
  cone.name = 'spotcone';
  heli.add(cone);
  const spot = new THREE.Mesh(new THREE.CircleGeometry(5.5, 20),
    new THREE.MeshBasicMaterial({ color: 0xfff2a0, transparent: true, opacity: 0.25 }));
  spot.rotation.x = -Math.PI / 2;
  spot.position.y = -25.5;
  spot.name = 'spotpool';
  heli.add(spot);
  return heli;
}

export function makeCrate(THREE) {
  const crate = new THREE.Group();
  const box = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.4, 1.4),
    new THREE.MeshLambertMaterial({ color: 0x8a6d3b }));
  box.position.y = 0.7;
  crate.add(box);
  const band = new THREE.Mesh(new THREE.BoxGeometry(1.44, 0.25, 1.44),
    new THREE.MeshLambertMaterial({ color: 0x5d4a22 }));
  band.position.y = 0.7;
  crate.add(band);
  return crate;
}

export function makeCache(THREE) {
  const cache = new THREE.Group();
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.6, 0.9),
    new THREE.MeshLambertMaterial({ color: 0xffd23f, emissive: 0x6b5200 }));
  box.position.y = 0.3;
  cache.add(box);
  const lid = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.12, 0.95),
    new THREE.MeshLambertMaterial({ color: 0xfff0a0, emissive: 0x554400 }));
  lid.position.y = 0.66;
  cache.add(lid);
  return cache;
}

export function makePalm(THREE) {
  const palm = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.3, 4.5, 7),
    new THREE.MeshLambertMaterial({ color: 0x7a5a36 }));
  trunk.position.y = 2.25;
  trunk.rotation.z = 0.08;
  palm.add(trunk);
  const leafMat = new THREE.MeshLambertMaterial({ color: 0x2e8b57 });
  for (let i = 0; i < 6; i++) {
    const leaf = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.08, 0.7), leafMat);
    const angle = (i / 6) * Math.PI * 2;
    leaf.position.set(Math.cos(angle) * 1.1, 4.6, Math.sin(angle) * 1.1);
    leaf.rotation.y = -angle;
    leaf.rotation.z = 0.35;
    palm.add(leaf);
  }
  return palm;
}

export function makeLighthouse(THREE) {
  const tower = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 4.2, 2.5, 12),
    new THREE.MeshLambertMaterial({ color: 0x8a8f96 }));
  base.position.y = 1.25;
  tower.add(base);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 3.0, 16, 12),
    new THREE.MeshLambertMaterial({ color: 0xf2ede4 }));
  shaft.position.y = 10.5;
  tower.add(shaft);
  for (let i = 0; i < 3; i++) {
    const band = new THREE.Mesh(new THREE.CylinderGeometry(2.55 - i * 0.25, 2.75 - i * 0.25, 1.6, 12),
      new THREE.MeshLambertMaterial({ color: 0xc0392b }));
    band.position.y = 5.5 + i * 5;
    tower.add(band);
  }
  const lamp = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.2, 2.4),
    new THREE.MeshLambertMaterial({ color: 0x222222, emissive: 0x444400 }));
  lamp.position.y = 19.5;
  tower.add(lamp);
  const glow = new THREE.Mesh(new THREE.SphereGeometry(1.1, 10, 10),
    new THREE.MeshBasicMaterial({ color: 0xfff6a0 }));
  glow.position.y = 19.5;
  glow.name = 'lampGlow';
  tower.add(glow);
  const cap = new THREE.Mesh(new THREE.ConeGeometry(2.0, 1.6, 12),
    new THREE.MeshLambertMaterial({ color: 0x222222 }));
  cap.position.y = 21.4;
  tower.add(cap);
  return tower;
}
