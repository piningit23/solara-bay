// Driving: stealing parked cars, arcade handling, NOS boost, exiting,
// and the short "jacking" moment that bumps the wanted level.

import { keyDown, takeMouse } from './input.js';
import { clampToIsland } from './world.js';
import { makeCar } from './models.js';
import { mulberry32, pick, range } from './random.js';

const PARKED_COLORS = [0xd64545, 0x3f6fb5, 0xe0e0e0, 0x7a9e4f, 0xd9a066, 0x2ecc71, 0xe67e22];

export function spawnParkedCars(THREE, G, count) {
  const rand = mulberry32(G.seed + 55);
  const streets = [-160, -120, -80, -40, 0, 40, 80, 120, 160];
  for (let i = 0; i < count; i++) {
    const color = pick(rand, PARKED_COLORS);
    const mesh = makeCar(THREE, color);
    const horizontal = rand() > 0.5;
    const street = pick(rand, streets);
    const along = range(rand, -170, 170);
    const x = horizontal ? along : street + 3.4;
    const z = horizontal ? street + 3.4 : along;
    mesh.position.set(x, 0, z);
    mesh.rotation.y = horizontal ? Math.PI / 2 : 0;
    G.scene.add(mesh);
    G.parkedCars.push({ mesh, x, z, color, taken: false });
  }
}

export function nearestParkedCar(G, maxDist) {
  let best = null;
  let bestD = maxDist;
  for (const car of G.parkedCars) {
    if (car.taken) continue;
    const d = Math.hypot(car.x - G.player.x, car.z - G.player.z);
    if (d < bestD) { bestD = d; best = car; }
  }
  return best;
}

// Try to steal the nearest parked car. Returns the car or null.
export function tryStealCar(G) {
  const parked = nearestParkedCar(G, 4);
  if (!parked) return null;
  parked.taken = true;
  G.scene.remove(parked.mesh);
  const mesh = makeCar(G.THREE, parked.color);
  mesh.position.set(parked.x, 0, parked.z);
  G.scene.add(mesh);
  const car = {
    mesh, x: parked.x, z: parked.z,
    heading: Math.atan2(Math.sin(G.player.heading), Math.cos(G.player.heading)),
    speed: 0, health: 100, color: parked.color,
  };
  car.heading = G.player.heading;
  G.car = car;
  G.player.onFoot = false;
  G.player.car = car;
  if (G.player.mesh) G.player.mesh.visible = false;
  // The short jacking moment: a wanted bump, a chime of breaking glass.
  G.wanted = Math.min(5, G.wanted + 1);
  G.toast = 'Car jacked! The law is on you now.';
  G.toastUntil = G.time + 2.5;
  if (G.audio) G.audio.thud();
  return car;
}

export function exitCar(G) {
  if (!G.car) return;
  const car = G.car;
  G.player.x = car.x - Math.sin(car.heading) * 3;
  G.player.z = car.z - Math.cos(car.heading) * 3;
  G.player.heading = car.heading;
  G.player.onFoot = true;
  G.player.car = null;
  if (G.player.mesh) {
    G.player.mesh.visible = true;
    G.player.mesh.position.set(G.player.x, 0, G.player.z);
  }
  // Leave the car parked where it stopped, stealable again.
  G.parkedCars.push({ mesh: car.mesh, x: car.x, z: car.z, color: car.color, taken: false });
  G.car = null;
}

export function updateDriving(G, dt) {
  const car = G.car;
  if (!car) return;
  const input = G.input;
  const mouse = takeMouse(input);
  G.camYaw -= mouse.dx * 0.0035;
  G.camPitch = Math.max(0.08, Math.min(1.1, G.camPitch + mouse.dy * 0.002));

  const accel = G.upgrades.engine ? 20 : 15;
  const topSpeed = G.upgrades.engine ? 38 : 29;
  const grip = G.upgrades.tires ? 3.4 : 2.6;
  if (keyDown(input, 'KeyW') || keyDown(input, 'ArrowUp')) {
    car.speed += accel * dt;
  } else if (keyDown(input, 'KeyS') || keyDown(input, 'ArrowDown')) {
    car.speed -= accel * 0.9 * dt;
  } else {
    car.speed *= Math.max(0, 1 - 0.6 * dt);
  }
  if (keyDown(input, 'Space')) car.speed *= Math.max(0, 1 - 3.2 * dt);

  // NOS boost: hold Shift while driving for a burst, flames and an FOV kick.
  const wantBoost = (keyDown(input, 'ShiftLeft') || keyDown(input, 'ShiftRight'))
    && car.speed > 4 && G.nos > 1;
  G.boosting = wantBoost;
  if (wantBoost) {
    car.speed += 14 * dt;
    G.nos = Math.max(0, G.nos - 34 * dt);
    spawnExhaustFlame(G);
  } else {
    G.nos = Math.min(100, G.nos + 9 * dt);
  }
  car.speed = Math.max(-12, Math.min(wantBoost ? topSpeed + 12 : topSpeed, car.speed));

  // Steering scales with speed, and grip upgrades sharpen it.
  const steer = (keyDown(input, 'KeyA') || keyDown(input, 'ArrowLeft') ? 1 : 0)
    - (keyDown(input, 'KeyD') || keyDown(input, 'ArrowRight') ? 1 : 0);
  const steerFactor = Math.min(1, Math.abs(car.speed) / 9) * grip;
  car.heading += steer * steerFactor * dt * (car.speed >= 0 ? 1 : -1);
  car.x += Math.sin(car.heading) * car.speed * dt;
  car.z += Math.cos(car.heading) * car.speed * dt;
  const clamped = clampToIsland(car.x, car.z);
  if (clamped.x !== car.x || clamped.z !== car.z) {
    car.speed *= 0.4;
    car.x = clamped.x;
    car.z = clamped.z;
  }
  car.mesh.position.set(car.x, 0, car.z);
  car.mesh.rotation.y = car.heading;
  G.player.x = car.x;
  G.player.z = car.z;
  G.player.heading = car.heading;
  // Armor plating halves ram damage.
  if (car.health <= 0) {
    G.toast = 'Your car is wrecked! Press E to get out.';
    G.toastUntil = G.time + 2;
  }
  if (G.audio) G.audio.setEngine(car.speed, true);
}

function spawnExhaustFlame(G) {
  const flame = {
    x: G.car.x - Math.sin(G.car.heading) * 2.2,
    z: G.car.z - Math.cos(G.car.heading) * 2.2,
    life: 0.35,
    mesh: null,
  };
  const geo = new (G.THREE.SphereGeometry)(0.35, 6, 6);
  const mat = new (G.THREE.MeshBasicMaterial)({ color: Math.random() > 0.5 ? 0xff7b00 : 0xffd23f });
  flame.mesh = new (G.THREE.Mesh)(geo, mat);
  flame.mesh.position.set(flame.x, 0.7, flame.z);
  G.scene.add(flame.mesh);
  G.particles.push(flame);
}

export function updateParticles(G, dt) {
  for (let i = G.particles.length - 1; i >= 0; i--) {
    const p = G.particles[i];
    p.life -= dt;
    if (p.mesh) p.mesh.scale.setScalar(Math.max(0.01, p.life * 3));
    if (p.life <= 0) {
      if (p.mesh) G.scene.remove(p.mesh);
      G.particles.splice(i, 1);
    }
  }
}
