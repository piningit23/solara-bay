// Solara Bay — main game loop. Wires every module together: the island city,
// the player, cars, police, missions, HUD and menus, in one frame loop.

import * as THREE from 'three';
import { createState } from './state.js';
import { createInput, keyDown } from './input.js';
import { createAudio } from './audio.js';
import { createRadio } from './radio.js';
import { buildWorld } from './world.js';
import { makePerson } from './models.js';
import { spawnTraffic, updateTraffic } from './traffic.js';
import { spawnPedestrians, updatePedestrians } from './pedestrians.js';
import { updatePolice, nearestPoliceDistance, clearPolice } from './police.js';
import { updateHelicopter } from './helicopter.js';
import { updateCrew } from './crew.js';
import { spawnCaches, updateCaches, spawnTaxi, updateTaxi, spawnBounty, updateBounty } from './activities.js';
import { updateOnFoot } from './player.js';
import { spawnParkedCars, tryStealCar, exitCar, updateDriving, updateParticles } from './driving.js';
import { updateCombatInput, updateGuards } from './combat.js';
import { startMission, updateMissions, applyLighting, saveProgress } from './missions.js';
import { buildHud, updateHud, setTitleRank, refreshMissionSelect } from './hud.js';
import { saveGame, loadGame, hasSave } from './save.js';
import { openShop, closeShop, nearGarage } from './shop.js';
import { readShotParam, applyShot } from './shots.js';
import { TITLE } from './config.js';

const G = createState();
G.THREE = THREE;

const canvas = document.getElementById('game-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
G.renderer = renderer;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87b5d6);
scene.fog = new THREE.Fog(0xbfd9ea, 120, 520);
G.scene = scene;

const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1200);
G.camera = camera;

const sun = new THREE.DirectionalLight(0xfff2d9, 1.35);
sun.position.set(120, 180, 60);
scene.add(sun);
G.sun = sun;
const hemi = new THREE.HemisphereLight(0xbfd9ff, 0x8a7a5a, 0.85);
scene.add(hemi);
G.hemi = hemi;

G.input = createInput();
G.audio = createAudio();
G.radio = createRadio(G.audio);
G.world = buildWorld(THREE, scene, G.seed);

// The player on foot.
const playerMesh = makePerson(THREE, 0xe74c3c);
playerMesh.position.set(G.player.x, 0, G.player.z);
scene.add(playerMesh);
G.player.mesh = playerMesh;

spawnParkedCars(THREE, G, 14);
spawnTraffic(THREE, G, 16);
spawnPedestrians(THREE, G, 22);
spawnCaches(THREE, G);
buildHud(G);
setTitleRank(G);
refreshMissionSelect(G);

// Mission waypoint marker: a tall golden beam the player can see across town.
const beaconGeo = new THREE.CylinderGeometry(0.5, 0.5, 60, 8);
const beaconMat = new THREE.MeshBasicMaterial({ color: 0xffd23f, transparent: true, opacity: 0.35 });
const beacon = new THREE.Mesh(beaconGeo, beaconMat);
beacon.visible = false;
scene.add(beacon);

// Edge-triggered keys: E, F, Q, Escape and Enter fire once per press.
const held = {};
function pressed(code) {
  const down = keyDown(G.input, code);
  const was = held[code] || false;
  held[code] = down;
  return down && !was;
}

function startGame(missionIndex) {
  G.audio.resume();
  document.getElementById('title-screen').classList.add('hidden');
  document.getElementById('pause-screen').classList.add('hidden');
  document.getElementById('busted-screen').classList.add('hidden');
  document.getElementById('ending-screen').classList.add('hidden');
  G.mode = 'playing';
  G.health = Math.max(G.health, 60);
  startMission(G, missionIndex);
  setTitleRank(G);
}

G.onSelectMission = (i) => startGame(i);

document.getElementById('btn-start').addEventListener('click', () => startGame(0));
document.getElementById('btn-continue').addEventListener('click', () => {
  loadGame(G);
  startGame(G.missionIndex);
});
document.getElementById('btn-resume').addEventListener('click', () => {
  G.mode = 'playing';
  document.getElementById('pause-screen').classList.add('hidden');
});
document.getElementById('btn-save').addEventListener('click', () => saveGame(G));
document.getElementById('btn-restart-mission').addEventListener('click', () => {
  document.getElementById('pause-screen').classList.add('hidden');
  G.mode = 'playing';
  startMission(G, G.missionIndex);
});
document.getElementById('btn-quit-title').addEventListener('click', () => {
  saveGame(G);
  G.mode = 'title';
  document.getElementById('pause-screen').classList.add('hidden');
  document.getElementById('title-screen').classList.remove('hidden');
  setTitleRank(G);
  refreshMissionSelect(G);
});
document.getElementById('btn-retry').addEventListener('click', () => {
  respawnAfterBusted();
});
document.getElementById('btn-close-shop').addEventListener('click', () => closeShop(G));
document.getElementById('btn-ending-roam').addEventListener('click', () => {
  document.getElementById('ending-screen').classList.add('hidden');
  G.mode = 'playing';
});
document.getElementById('title-name').textContent = 'SOLARA BAY';
document.getElementById('title-tagline').textContent = TITLE;
if (!hasSave()) document.getElementById('btn-continue').disabled = true;

function respawnAfterBusted() {
  document.getElementById('busted-screen').classList.add('hidden');
  clearPolice(G);
  G.wanted = 0;
  G.health = 100;
  G.cash = Math.floor(G.cash * 0.9);
  G.player.x = -140;
  G.player.z = -120;
  G.player.onFoot = true;
  if (G.car) {
    G.scene.remove(G.car.mesh);
    G.car = null;
  }
  if (G.player.mesh) {
    G.player.mesh.visible = true;
    G.player.mesh.position.set(G.player.x, 0, G.player.z);
  }
  G.mode = 'playing';
  startMission(G, G.missionIndex);
}

function showBusted(reason) {
  G.mode = 'busted';
  G.bustedReason = reason;
  const el = document.getElementById('busted-screen');
  el.querySelector('.busted-body').textContent =
    `${reason} Mara lost 10% of her cash to the harbor crew's bail.`;
  el.classList.remove('hidden');
  if (G.audio) G.audio.setSiren(false);
}

// Wanted decay: stay out of police sight and the heat cools off;
// the garage safehouse clears it three times faster.
let decayTimer = 0;
function updateWanted(dt) {
  if (G.wanted <= 0) return;
  const near = nearestPoliceDistance(G);
  const inGarage = nearGarage(G);
  if (near > 70 || inGarage) {
    decayTimer += dt * (inGarage ? 3 : 1);
    if (decayTimer > 5) {
      decayTimer = 0;
      G.wanted = Math.max(0, G.wanted - 1);
      if (G.wanted === 0) {
        clearPolice(G);
        G.toast = 'You lost the heat. Lay low.';
        G.toastUntil = G.time + 3;
      }
    }
  } else {
    decayTimer = 0;
  }
}

// Free-roam activity spawns: a taxi fare and a vigilante bounty appear
// on their own timers when none is active.
let taxiTimer = 20;
let bountyTimer = 45;
function updateFreeRoam(dt) {
  taxiTimer -= dt;
  if (taxiTimer <= 0) {
    taxiTimer = 50;
    if (!G.taxi) spawnTaxi(THREE, G);
  }
  bountyTimer -= dt;
  if (bountyTimer <= 0) {
    bountyTimer = 70;
    if (!G.bounty) spawnBounty(THREE, G);
  }
}

let camYawSmooth = 0;
let lastFov = 65;
let shake = 0;

function updateCamera(dt) {
  // While driving the camera eases behind the car; on foot it follows the orbit.
  const targetYaw = G.car ? G.car.heading : G.camYaw;
  let dy = targetYaw - camYawSmooth;
  while (dy > Math.PI) dy -= Math.PI * 2;
  while (dy < -Math.PI) dy += Math.PI * 2;
  camYawSmooth += dy * Math.min(1, (G.car ? 2.2 : 8) * dt);
  const dist = 9 * G.camBoost + (G.car ? 3 : 0);
  const height = 4.2 * G.camBoost + (G.car ? 1 : 0);
  const cx = G.player.x - Math.sin(camYawSmooth) * dist;
  const cz = G.player.z - Math.cos(camYawSmooth) * dist;
  const shakeX = shake > 0 ? (Math.random() - 0.5) * shake : 0;
  const shakeY = shake > 0 ? (Math.random() - 0.5) * shake : 0;
  camera.position.set(cx + shakeX, height + shakeY, cz);
  camera.lookAt(G.player.x, 1.6, G.player.z);
  shake = Math.max(0, shake - dt * 2);
  const fov = G.boosting ? 76 : 65;
  if (fov !== lastFov) {
    camera.fov = fov;
    camera.updateProjectionMatrix();
    lastFov = fov;
  }
}

function frame(dt) {
  G.time += dt;
  if (G.mode === 'playing') {
    // Edge keys.
    if (pressed('KeyE')) {
      if (G.player.onFoot) tryStealCar(G);
      else exitCar(G);
    }
    const fPressed = pressed('KeyF');
    if (fPressed && !G.shopOpen && nearGarage(G) && G.player.onFoot) openShop(G);
    else if (fPressed && G.shopOpen) closeShop(G);
    if (pressed('KeyQ')) {
      const st = G.radio.cycle();
      G.toast = `Radio: ${st.name} — ${st.tag}`;
      G.toastUntil = G.time + 2.5;
    }
    if (pressed('Escape')) {
      G.mode = 'paused';
      document.getElementById('pause-screen').classList.remove('hidden');
    }
    if (G.shopOpen && pressed('KeyF')) closeShop(G);

    if (G.car) updateDriving(G, dt);
    else updateOnFoot(G, dt);
    updateCombatInput(G, dt);
    updateTraffic(G, dt);
    updatePedestrians(G, dt, false);
    updatePolice(G, dt);
    updateHelicopter(THREE, G, dt);
    updateCrew(G, dt);
    updateGuards(G, dt);
    updateCaches(G, dt);
    updateTaxi(G, dt);
    updateBounty(G, dt);
    updateMissions(G, dt);
    updateWanted(dt);
    updateFreeRoam(dt);
    updateParticles(G, dt);
    G.radio.tick(G.time);
    if (G.audio) {
      G.audio.setSiren(G.wanted > 0);
      if (!G.car) G.audio.setEngine(0, false);
    }
    // Wrecked car: force the player out on foot.
    if (G.car && G.car.health <= 0) {
      G.scene.remove(G.car.mesh);
      G.car = null;
      G.player.onFoot = true;
      if (G.player.mesh) G.player.mesh.visible = true;
      G.toast = 'Your car is wrecked!';
      G.toastUntil = G.time + 3;
      shake = 1.2;
    }
    // Waypoint beacon follows the active waypoint.
    if (G.waypoint) {
      beacon.visible = true;
      beacon.position.set(G.waypoint.x, 30, G.waypoint.z);
    } else {
      beacon.visible = false;
    }
    // Busted when health runs out.
    if (G.health <= 0) {
      G.health = 0;
      showBusted('BUSTED — the Solara Bay police caught Mara Vale.');
    }
    // Damage vignette.
    const vig = document.getElementById('damage-vignette');
    if (vig) vig.style.opacity = String(Math.max(0, (55 - G.health) / 55) * 0.55);
  } else if (G.mode === 'title') {
    // Slow orbit around the city behind the title screen.
    const t = G.time * 0.05;
    camera.position.set(Math.sin(t) * 150, 60, Math.cos(t) * 150);
    camera.lookAt(0, 0, 0);
  } else if (G.mode === 'paused') {
    if (pressed('Escape')) {
      G.mode = 'playing';
      document.getElementById('pause-screen').classList.add('hidden');
    }
  }
  if (G.mode === 'playing') updateCamera(dt);
  updateHud(G);
  renderer.render(scene, camera);
}

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  frame(dt);
  // Debug/test hook: lets the play-test script read live game state.
window.__solara = G;

requestAnimationFrame(loop);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
window.addEventListener('pointerdown', () => G.audio.resume(), { once: true });
window.addEventListener('keydown', () => G.audio.resume(), { once: true });

// Staging hook for screenshots (?shot=cover|street|mission|start).
applyLighting(G);
applyShot(G, readShotParam());
// Start the smoothed camera yaw at the staged orbit so the first frame is framed.
camYawSmooth = G.camYaw;
if (G.shot === 'cover' || G.shot === 'mission') {
  // Let the helicopter and police settle into the frame before the shot.
  updateHelicopter(THREE, G, 0.016);
  updatePolice(G, 0.016);
}

requestAnimationFrame(loop);
