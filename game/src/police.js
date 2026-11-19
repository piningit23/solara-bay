// Police: chase cars that ram the player, on-foot officers, and roadblocks
// at 4–5 stars. Wanted level drives how many spawn and how hard they chase.

import { makeCar, makePerson } from './models.js';
import { clampToIsland } from './world.js';

function spawnPoliceCar(THREE, G, x, z) {
  const mesh = makeCar(THREE, 0xf5f5f5, { police: true });
  mesh.position.set(x, 0, z);
  G.scene.add(mesh);
  const car = { mesh, x, z, heading: 0, speed: 0, lightPhase: Math.random() * 6 };
  G.policeCars.push(car);
  return car;
}

function spawnOfficer(THREE, G, x, z) {
  const mesh = makePerson(THREE, 0x1e3a5f);
  mesh.position.set(x, 0, z);
  G.scene.add(mesh);
  const officer = { mesh, x, z, speed: 5.6, hitCooldown: 0 };
  G.officers.push(officer);
  return officer;
}

export function policeCountFor(wanted) {
  if (wanted <= 0) return 0;
  if (wanted === 1) return 1;
  if (wanted === 2) return 2;
  if (wanted === 3) return 3;
  return 4;
}

export function updatePolice(G, dt) {
  const want = policeCountFor(G.wanted);
  // Spawn chase cars up to the wanted level's count.
  while (G.policeCars.length < want) {
    const angle = Math.random() * Math.PI * 2;
    spawnPoliceCar(G.THREE, G,
      G.player.x + Math.cos(angle) * 55, G.player.z + Math.sin(angle) * 55);
  }
  while (G.policeCars.length > want) {
    const car = G.policeCars.pop();
    G.scene.remove(car.mesh);
  }
  // On-foot officers when the player is on foot and wanted.
  const wantOfficers = G.player.onFoot && G.wanted >= 1 ? Math.min(2, G.wanted) : 0;
  while (G.officers.length < wantOfficers) {
    spawnOfficer(G.THREE, G,
      G.player.x + (Math.random() - 0.5) * 50, G.player.z + (Math.random() - 0.5) * 50);
  }
  while (G.officers.length > wantOfficers) {
    const off = G.officers.pop();
    G.scene.remove(off.mesh);
  }

  // Chase cars steer toward the player and ram.
  for (let ci = 0; ci < G.policeCars.length; ci++) {
    const car = G.policeCars[ci];
    // Cover staging: hold the chase cars at fixed flanking spots behind the
    // player so the screenshot keeps them in frame instead of at the camera.
    if (G.shot === 'cover') {
      const side = ci % 2 === 0 ? -8 : 8;
      car.x = G.player.x + side;
      car.z = G.player.z + 12;
      car.heading = G.player.heading;
      car.speed = 16;
      car.mesh.position.set(car.x, 0, car.z);
      car.mesh.rotation.y = car.heading;
      car.lightPhase += dt * 8;
      const bar = car.mesh.getObjectByName('lightbar');
      if (bar) bar.material.emissive.setHex(Math.sin(car.lightPhase) > 0 ? 0xff0000 : 0x0000ff);
      continue;
    }
    const dx = G.player.x - car.x;
    const dz = G.player.z - car.z;
    const dist = Math.hypot(dx, dz) || 1;
    const targetHeading = Math.atan2(dx, dz);
    let dh = targetHeading - car.heading;
    while (dh > Math.PI) dh -= Math.PI * 2;
    while (dh < -Math.PI) dh += Math.PI * 2;
    car.heading += Math.max(-2.4 * dt, Math.min(2.4 * dt, dh));
    const top = 22 + G.wanted * 1.6;
    car.speed = Math.min(top, car.speed + 16 * dt);
    car.x += Math.sin(car.heading) * car.speed * dt;
    car.z += Math.cos(car.heading) * car.speed * dt;
    const clamped = clampToIsland(car.x, car.z);
    car.x = clamped.x;
    car.z = clamped.z;
    car.mesh.position.set(car.x, 0, car.z);
    car.mesh.rotation.y = car.heading;
    car.lightPhase += dt * 8;
    const bar = car.mesh.getObjectByName('lightbar');
    if (bar) {
      bar.material.emissive.setHex(Math.sin(car.lightPhase) > 0 ? 0xff0000 : 0x0000ff);
    }
    // Ram damage.
    if (dist < 3.2) {
      if (G.car) {
        G.car.health = Math.max(0, (G.car.health || 100) - 22 * dt);
        if (G.audio) G.audio.thud();
        if (G.car.health <= 0) {
          G.toast = 'Your car is wrecked! Get out and run.';
          G.toastUntil = G.time + 3;
        }
      } else {
        G.health -= 14 * dt;
        if (G.audio) G.audio.thud();
      }
    }
  }

  // Officers chase on foot and beat the player down up close.
  for (const off of G.officers) {
    const dx = G.player.x - off.x;
    const dz = G.player.z - off.z;
    const dist = Math.hypot(dx, dz) || 1;
    off.x += (dx / dist) * off.speed * dt;
    off.z += (dz / dist) * off.speed * dt;
    off.mesh.position.set(off.x, 0, off.z);
    off.mesh.rotation.y = Math.atan2(dx, dz);
    off.hitCooldown -= dt;
    if (dist < 1.6 && off.hitCooldown <= 0) {
      G.health -= 8;
      off.hitCooldown = 1.0;
      if (G.audio) G.audio.thud();
      G.toast = 'A cop is beating you down!';
      G.toastUntil = G.time + 1.5;
    }
  }

  // Roadblocks at 4–5 stars: 2–3 police cars parked across the road ahead.
  const wantBlock = G.wanted >= 4;
  if (wantBlock && G.roadblocks.length === 0) {
    const ahead = 34;
    const hx = Math.sin(G.player.heading);
    const hz = Math.cos(G.player.heading);
    const bx = G.player.x + hx * ahead;
    const bz = G.player.z + hz * ahead;
    const px = Math.cos(G.player.heading);
    const pz = -Math.sin(G.player.heading);
    for (let i = -1; i <= 1; i++) {
      const mesh = makeCar(G.THREE, 0xf5f5f5, { police: true });
      mesh.position.set(bx + px * i * 5, 0, bz + pz * i * 5);
      mesh.rotation.y = G.player.heading + Math.PI / 2;
      G.scene.add(mesh);
      G.roadblocks.push({ mesh, x: mesh.position.x, z: mesh.position.z });
    }
    G.toast = 'ROADBLOCK AHEAD — ram through or go around!';
    G.toastUntil = G.time + 3;
  }
  if (!wantBlock && G.roadblocks.length > 0) {
    for (const rb of G.roadblocks) G.scene.remove(rb.mesh);
    G.roadblocks = [];
  }
  // Flash the roadblock lightbars too.
  for (const rb of G.roadblocks) {
    const bar = rb.mesh.getObjectByName('lightbar');
    if (bar) bar.material.emissive.setHex(Math.sin(G.time * 9) > 0 ? 0xff0000 : 0x0000ff);
  }
}

export function nearestPoliceDistance(G) {
  let best = Infinity;
  for (const car of G.policeCars) {
    best = Math.min(best, Math.hypot(car.x - G.player.x, car.z - G.player.z));
  }
  for (const off of G.officers) {
    best = Math.min(best, Math.hypot(off.x - G.player.x, off.z - G.player.z));
  }
  return best;
}

export function clearPolice(G) {
  for (const car of G.policeCars) G.scene.remove(car.mesh);
  for (const off of G.officers) G.scene.remove(off.mesh);
  for (const rb of G.roadblocks) G.scene.remove(rb.mesh);
  G.policeCars = [];
  G.officers = [];
  G.roadblocks = [];
}
