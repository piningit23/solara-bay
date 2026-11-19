// Screenshot staging: a deterministic hook the game reads from the URL
// query string (?shot=cover|street|mission|start). Each value sets up a
// fixed scene for one screenshot. Real renders of the game, never edited.

import { PLACES } from './config.js';
import { startMission } from './missions.js';
import { spawnDante } from './crew.js';
import { spawnTaxi, spawnBounty } from './activities.js';
import { makeCar } from './models.js';

export function readShotParam() {
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get('shot');
  } catch (err) {
    return null;
  }
}

export function applyShot(G, shot) {
  G.shot = shot;
  if (!shot) return;
  if (shot === 'start') {
    // Title screen only; the game stays on the menu.
    G.mode = 'title';
    return;
  }
  // All other shots start the game immediately, with audio muted by default
  // (no user gesture in a headless screenshot run).
  G.mode = 'playing';
  document.getElementById('title-screen').classList.add('hidden');

  if (shot === 'cover') {
    // Player driving a stolen car mid-chase: 5 stars, helicopter overhead,
    // two police cars behind, a roadblock ahead, Dante's car beside the
    // player, mission banner active. Camera pulled further back and higher
    // so the player car is clearly visible in frame.
    G.camBoost = 2.0;
    G.camPitch = 0.42;
    G.camYaw = Math.PI;
    G.player.x = 0;
    G.player.z = 40;
    G.player.heading = Math.PI;
    G.wanted = 5;
    G.cash = 12450;
    G.respect = 860;
    G.cachesFound = 6;
    const mesh = makeCar(G.THREE, 0xd64545);
    mesh.position.set(0, 0, 40);
    G.scene.add(mesh);
    G.car = { mesh, x: 0, z: 40, heading: Math.PI, speed: 18, health: 100, color: 0xd64545 };
    G.player.onFoot = false;
    G.player.car = G.car;
    if (G.player.mesh) G.player.mesh.visible = false;
    spawnDante(G.THREE, G, 7, 46);
    startMission(G, 11); // QUEEN OF SOLARA, the 5-star finale
    G.wanted = 5;
    G.missionTimer = 0;
    // Two police cars flanking behind the player, inside the camera frame.
    for (const [x, z] of [[-10, 52], [10, 54]]) {
      const cop = makeCar(G.THREE, 0xf5f5f5, { police: true });
      cop.position.set(x, 0, z);
      G.scene.add(cop);
      G.policeCars.push({ mesh: cop, x, z, heading: Math.PI, speed: 16, lightPhase: 1 });
    }
    return;
  }

  if (shot === 'street') {
    // On foot at a clear street crossing: traffic, pedestrians and a taxi
    // fare marker, with no building or neon sign blocking the camera.
    G.player.x = 0;
    G.player.z = 0;
    G.player.heading = Math.PI / 2;
    G.camYaw = Math.PI / 2;
    G.camBoost = 1.2;
    G.cash = 3200;
    G.respect = 210;
    spawnTaxi(G.THREE, G);
    startMission(G, 0);
    G.missionActive = false;
    if (G.taxi) G.waypoint = { x: G.taxi.x, z: G.taxi.z, label: 'TAXI FARE' };
    return;
  }

  if (shot === 'mission') {
    // A mission moment: harbor crates, police closing in, helicopter in the sky.
    G.player.x = PLACES.docks.x - 30;
    G.player.z = PLACES.docks.z;
    G.player.heading = Math.PI / 2;
    G.camYaw = Math.PI / 2;
    G.camBoost = 1.35;
    G.wanted = 2;
    G.cash = 6800;
    G.respect = 420;
    startMission(G, 2); // HARBOR HEIST
    G.wanted = 3; // helicopter visible in the sky
    spawnBounty(G.THREE, G);
    // One police car staged ahead of the player, closing in on the docks.
    const cop = makeCar(G.THREE, 0xf5f5f5, { police: true });
    cop.position.set(PLACES.docks.x + 18, 0, PLACES.docks.z - 22);
    G.scene.add(cop);
    G.policeCars.push({ mesh: cop, x: PLACES.docks.x + 18, z: PLACES.docks.z - 22, heading: 0, speed: 10, lightPhase: 2 });
    return;
  }

  // Unknown ?shot= value: just play normally.
}
