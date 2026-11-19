// Solara Bay — main game loop: wires every module together, runs the
// renderer, the camera, input actions and the per-frame updates.

import * as THREE from 'three';
import { createState } from './state.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { createRadio } from './radio.js';
import { buildWorld } from './world.js';
import { createPlayer, updatePlayerOnFoot } from './player.js';
import { createParkedCars, nearestParkedCar, stealCar, exitCar, updateDriving } from './driving.js';
import { createTraffic, updateTraffic } from './traffic.js';
import { createPedestrians, updatePedestrians } from './pedestrians.js';
import { createPolice, updatePolice, addWanted } from './police.js';
import { createHelicopter, updateHelicopter, heliPosition } from './helicopter.js';
import { createCrew, updateCrew, setCrewActive } from './crew.js';
import { createCombat, updateCombat, fireWeapon, spawnBurst } from './combat.js';
import { createMissions, startMission, updateMission, currentMission } from './missions.js';
import { createActivities, updateActivities } from './activities.js';
import { createHud, updateHud, renderTitle, renderPause, renderShop, updateShop, renderWheel, renderEnd } from './hud.js';
import { nearGarage, buyItem, buyUpgrade } from './shop.js';
import { saveGame, loadGame, applySave } from './save.js';
import { applyShotStaging } from './shots.js';

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');

const state = createState();
const canvas = document.createElement('canvas');
canvas.id = 'game';
document.body.appendChild(canvas);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87bfe8);
const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 800);

const world = buildWorld(scene);
const input = createInput(canvas);
const audio = createAudio();
const radio = createRadio(audio);
const player = createPlayer(scene);
const parked = createParkedCars(scene, 14);
const traffic = createTraffic(scene, 16);
const peds = createPedestrians(scene, 26);
const police = createPolice(scene);
const heli = createHelicopter(scene);
const crew = createCrew(scene);
const combat = createCombat(scene);
const missions = createMissions(scene);
const activities = createActivities(scene, state);
const hud = createHud(document, state, radio);

const ctx = {
  state, police, heli, crew, combat, missions, activities, parked, traffic, peds,
  saveGame: () => saveGame(state),
};

// HUD callbacks
hud.onStart = (useContinue) => {
  audio.init();
  audio.resume();
  radio.start();
  if (useContinue) {
    const data = loadGame();
    if (data) applySave(state, data);
  }
  if (state.selectedMission > 0 && state.selectedMission <= state.missionIndex) {
    state.missionIndex = state.selectedMission;
  }
  state.screen = 'playing';
  state.health = 100;
  renderTitle(hud);
};
hud.onResume = () => { state.screen = 'playing'; };
hud.onSave = () => {
  saveGame(state);
  state.message = 'GAME SAVED';
  state.messageTimer = 2;
};
hud.onQuit = () => {
  state.screen = 'title';
  renderTitle(hud);
};
hud.onBuy = (id) => {
  const res = buyItem(state, id, audio);
  updateShop(hud, res);
};
hud.onBuyUpgrade = (id) => {
  const res = buyUpgrade(state, id, audio);
  updateShop(hud, res);
};
hud.onRetry = () => {
  state.health = 100;
  state.wantedFloat = 0;
  state.wanted = 0;
  state.screen = 'playing';
  state.playerPos = { x: -40, z: -40 };
  player.mesh.position.set(-40, 0, -40);
};
hud.onFreeRoam = () => { state.screen = 'playing'; };

renderTitle(hud);
applyShotStaging(shot, ctx);
if (shot === 'cover') {
  // keep the staged chase frozen in a good frame: hold the camera wide
  state.cameraAngle = Math.PI / 2;
}

// test hook for the play-test harness
window.__solara = { state, police, heli, crew, combat, missions, parked, traffic, peds, radio };

const clock = new THREE.Clock();
let shopResult = '';
let titleRendered = false;

function exhaustFlame(pos, angle) {
  const p = new THREE.Vector3(
    pos.x - Math.sin(angle) * 2.2, 0.6, pos.z - Math.cos(angle) * 2.2);
  spawnBurst(combat, p, 0xff8800, 3);
}

function updateCamera(dt) {
  const target = state.playerPos;
  let dist = state.onFoot ? 9 : 12;
  let height = state.onFoot ? 4.5 : 5.5;
  if (state.shotCover) { dist = 20; height = 9; }
  else if (state.shotWide) { dist = 18; height = 12; }
  const camA = state.onFoot ? state.cameraAngle : state.playerAngle;
  const cx = target.x - Math.sin(camA) * dist;
  const cz = target.z - Math.cos(camA) * dist;
  camera.position.set(cx, height, cz);
  camera.lookAt(target.x, 1.6, target.z);
  if (state.boosting) camera.fov = 72;
  else camera.fov = 62;
  camera.updateProjectionMatrix();
}

function handleActions() {
  // E: steal / exit car
  if (input.wasPressed('KeyE')) {
    if (state.onFoot) {
      const car = nearestParkedCar(parked, state.playerPos.x, state.playerPos.z, 4);
      if (car) stealCar(state, car, audio);
    } else {
      exitCar(state);
    }
  }
  // M: start current mission
  if (input.wasPressed('KeyM') && !state.missionActive && currentMission(state)) {
    startMission(state, ctx);
  }
  // F: shop at garage
  if (input.wasPressed('KeyF') && nearGarage(state)) {
    state.shopOpen = !state.shopOpen;
    if (state.shopOpen) { shopResult = ''; renderShop(hud, ''); }
  }
  // Q: radio station
  if (input.wasPressed('KeyQ')) {
    const name = radio.cycle();
    state.message = `RADIO — ${name}`;
    state.messageTimer = 2;
  }
  // 1-4: weapons
  ['Digit1', 'Digit2', 'Digit3', 'Digit4'].forEach((code, i) => {
    if (input.wasPressed(code)) {
      state.weaponIndex = i;
      state.wheelOpen = false;
    }
  });
  // R: reload
  if (input.wasPressed('KeyR')) {
    const w = state.weapons[state.weaponIndex];
    w.ammoLeft = w.ammo;
    state.message = `${w.name} reloaded`;
    state.messageTimer = 1.5;
  }
  // Tab: weapon wheel (hold) — render only on the open transition
  const wheelNow = !!input.isDown('Tab');
  if (wheelNow && !state.wheelOpen) renderWheel(hud);
  state.wheelOpen = wheelNow;
  // Esc: pause / close overlays
  if (input.wasPressed('Escape')) {
    if (state.shopOpen) state.shopOpen = false;
    else if (state.screen === 'playing') { state.screen = 'paused'; renderPause(hud); }
    else if (state.screen === 'paused') state.screen = 'playing';
  }
  // Mouse: shoot
  if (input.mouseDown && state.screen === 'playing' && !state.shopOpen && !state.wheelOpen) {
    const aim = state.onFoot ? state.cameraAngle : state.playerAngle;
    fireWeapon(combat, state, state.playerPos, aim, audio);
  }
}

function promptText() {
  if (state.shopOpen) return '';
  if (state.onFoot) {
    if (nearGarage(state)) return 'F — SHOP (safehouse)';
    const car = nearestParkedCar(parked, state.playerPos.x, state.playerPos.z, 4);
    if (car) return 'E — STEAL CAR';
    if (state.taxi && !state.taxi.passenger) return 'TAXI FARE nearby — walk to the blue marker';
  } else if (nearGarage(state)) {
    return 'F — SHOP (safehouse)';
  }
  return '';
}

function loop() {
  requestAnimationFrame(loop);
  const dt = Math.min(clock.getDelta(), 0.05);
  state.time += dt;

  if (state.screen === 'title' && !titleRendered) {
    renderTitle(hud);
    titleRendered = true;
  }
  if (state.screen === 'title') {
    // idle camera orbit over the city behind the title
    const t = state.time * 0.05;
    camera.position.set(Math.sin(t) * 90, 42, Math.cos(t) * 90);
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
    updateHud(hud, { missions, police, heliPos: null });
    input.endFrame();
    return;
  }

  if (state.screen === 'playing') {
    handleActions();
    if (!state.shopOpen && !state.wheelOpen) {
    if (state.onFoot) updatePlayerOnFoot(player, dt, state, input, world.colliders);
    else updateDriving(dt, state, input, world.colliders, audio, exhaustFlame);
    updateTraffic(traffic, dt, state.playerPos, !state.onFoot);
    const danger = state.shotsFired > 0;
    updatePedestrians(peds, dt, state.playerPos, danger ? 14 : (state.onFoot ? 4 : 9));
    updatePolice(police, dt, state, state.playerPos, state.onFoot, audio);
    updateHelicopter(heli, dt, state, state.playerPos, audio);
    updateCrew(crew, dt, state, state.playerPos, police, combat.enemies);
    updateCombat(combat, dt, state, state.playerPos, state.playerAngle);
    updateMission(state, ctx, dt);
    updateActivities(activities, dt, state.playerPos, !state.onFoot, state.carSpeed);
    radio.update(dt);
    if (state.messageTimer > 0) state.messageTimer -= dt;
    if (state.bannerTimer > 0) state.bannerTimer -= dt;
    // night / dusk lighting for night missions
    if (state.night) {
      world.sun.intensity = 0.35;
      scene.background = new THREE.Color(0x1a2340);
      scene.fog = new THREE.Fog(0x1a2340, 90, 260);
    } else {
      world.sun.intensity = 1.25;
      scene.background = new THREE.Color(0x87bfe8);
      scene.fog = new THREE.Fog(0xd8c49a, 120, 320);
    }
    // busted?
    if (state.health <= 0 && state.screen === 'playing') {
      state.screen = 'busted';
      if (!state.bustedReason) state.bustedReason = 'You were taken down.';
      audio.busted();
      renderEnd(hud);
    }
    if (state.screen === 'ended') renderEnd(hud);
    } // end of frozen-updates block
  } else if (state.screen === 'paused') {
    if (input.wasPressed('Escape')) state.screen = 'playing';
    // frozen frame
  }

  // cover staging: keep the staged cars parked in frame
  if (state.shotCover) {
    state.carSpeed = 0;
  }

  updateCamera(dt);
  renderer.render(scene, camera);
  updateHud(hud, {
    missions, police, heliPos: heliPosition(heli), prompt: promptText(),
  });
  input.endFrame();
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

loop();
