// Solara Bay — main game loop: renderer, camera, menus, mode machine
// (title / playing / paused / busted / ending) and per-frame updates.

import * as THREE from 'three';
import { G } from './state.js';
import { MISSIONS } from './config.js';
import { mulberry32 } from './random.js';
import { initInput, keys, pressed, consumeMouse, clearPressed, mouseDown } from './input.js';
import { initAudio, resumeAudio, setEngine, startStation } from './audio.js';
import { initRadio, cycleStation } from './radio.js';
import { buildWorld, setDusk } from './world.js';
import { createPlayer, updatePlayer, camYaw, camPitch, setCam } from './player.js';
import { spawnParkedCars, updateDriving, updateJacking, enterCar, exitCar, nearestParkedCar, jacking } from './driving.js';
import { spawnTraffic, updateTraffic } from './traffic.js';
import { spawnPedestrians, updatePedestrians } from './pedestrians.js';
import { updatePolice, setWanted, addWanted } from './police.js';
import { updateHelicopter } from './helicopter.js';
import { updateCrew } from './crew.js';
import { updateActivities } from './activities.js';
import { initWeapons, updateCombat, setMouseHeld, queueClick } from './combat.js';
import { startMission, updateMissions, currentMissionDef, abandonMission } from './missions.js';
import { initHud, updateHud } from './hud.js';
import { openShop, closeShop, isShopOpen } from './shop.js';
import { saveGame, loadGame, hasSave } from './save.js';
import { applyShot } from './shots.js';
import { GARAGE } from './config.js';
import { carPos } from './driving.js';

let renderer, scene, camera;
let rng;
let shotMode = null;

function $(id) { return document.getElementById(id); }

export function init() {
  const q = new URLSearchParams(window.location.search);
  const seed = Number(q.get('seed') || 1);
  G.seed = seed;
  rng = mulberry32(seed);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  $('game-canvas').appendChild(renderer.domElement);
  G.renderer = renderer;

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(68, window.innerWidth / window.innerHeight, 0.1, 900);
  G.scene = scene;
  G.camera = camera;

  buildWorld(scene, seed);
  createPlayer(scene);
  spawnParkedCars(scene, rng);
  spawnTraffic(scene, 16, rng);
  spawnPedestrians(scene, 26, rng);
  initWeapons();
  initRadio();
  initHud();
  initInput(renderer.domElement);
  initAudio();

  // expose a tiny debug handle for the play-test (state only, no cheats in UI)
  window.__solara = { G, startMission, setWanted };

  bindMenus();
  buildMissionSelect();
  updateTitleRank();

  shotMode = applyShot(scene);
  if (shotMode && shotMode !== 'start') {
    // staged screenshots start straight in play
    G.mode = 'playing';
    showScreen(null);
    if (!G.mission && G.missionIndex < MISSIONS.length) startMission(G.missionIndex);
  } else {
    G.mode = 'title';
    showScreen('title-screen');
  }

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  renderer.setAnimationLoop(tick);
}

function bindMenus() {
  $('btn-start').addEventListener('click', () => { beginGame(false); });
  $('btn-continue').addEventListener('click', () => { beginGame(true); });
  $('btn-resume').addEventListener('click', () => { G.mode = 'playing'; showScreen(null); });
  $('btn-save').addEventListener('click', () => { saveGame(); flash('Game saved.'); });
  $('btn-quit-title').addEventListener('click', () => { G.mode = 'title'; showScreen('title-screen'); updateTitleRank(); });
  $('btn-retry').addEventListener('click', () => { retryAfterBusted(); });
  $('btn-ending').addEventListener('click', () => { G.mode = 'title'; showScreen('title-screen'); });
  $('btn-mission-select').addEventListener('click', () => {
    $('mission-select').style.display = $('mission-select').style.display === 'block' ? 'none' : 'block';
  });
  document.querySelectorAll('#mission-select button').forEach((b) => {
    b.addEventListener('click', () => {
      const idx = Number(b.getAttribute('data-mission'));
      if (idx > G.missionIndex) return; // locked
      beginGame(false, idx);
    });
  });
}

function buildMissionSelect() {
  const box = $('mission-select-list');
  box.innerHTML = MISSIONS.map((m, i) =>
    '<button data-mission="' + i + '" ' + (i > G.missionIndex ? 'disabled' : '') + '>' +
    (i > G.missionIndex ? '🔒 ' : '✓ ') + (i + 1) + '. ' + m.title + ' — $' + m.reward + '</button>'
  ).join('');
}

function updateTitleRank() {
  const el = $('title-rank');
  if (!el) return;
  import('./respect.js').then((r) => {
    el.textContent = 'Respect rank: ' + r.currentRank().name + ' (' + G.respect + ' pts)  •  Cash $' + Math.floor(G.cash) + '  •  Missions ' + Math.min(G.missionIndex, 12) + '/12';
  });
  $('btn-continue').style.display = hasSave() ? 'inline-block' : 'none';
}

function showScreen(id) {
  for (const s of ['title-screen', 'pause-screen', 'busted-screen', 'ending-screen']) {
    const el = $(s);
    if (el) el.style.display = s === id ? 'flex' : 'none';
  }
  $('hud').style.display = id ? 'none' : 'block';
}

function beginGame(continued, missionIdx) {
  resumeAudio();
  startStation(G.station);
  if (continued) loadGame();
  else if (typeof missionIdx === 'number') { G.missionIndex = missionIdx; }
  G.mode = 'playing';
  G.health = 100;
  showScreen(null);
  buildMissionSelect();
  if (!G.mission && G.missionIndex < MISSIONS.length) startMission(G.missionIndex);
}

function retryAfterBusted() {
  G.health = 100;
  G.busted = false;
  setWanted(0);
  G.player.pos.set(20, 0.3, 80);
  if (G.car) { exitCar(); }
  G.mode = 'playing';
  showScreen(null);
  if (!G.mission && G.missionIndex < MISSIONS.length) startMission(G.missionIndex);
}

function flash(text) { G.messages.push(text); }

let lastTime = 0;
function tick(t) {
  const dt = Math.min(0.05, (t - lastTime) / 1000 || 0.016);
  lastTime = t;
  G.dt = dt;
  G.time += dt;

  const mouse = consumeMouse();
  setMouseHeld(mouseDown);
  if (mouse.click) queueClick();

  if (G.mode === 'playing') {
    // global keys
    if (pressed['Escape']) {
      if (isShopOpen()) closeShop();
      else { G.mode = 'paused'; showScreen('pause-screen'); }
    }
    if (pressed['KeyF']) {
      const pp = carPos();
      if (Math.hypot(pp.x - GARAGE.x, pp.z - GARAGE.z) < 22) {
        if (isShopOpen()) closeShop(); else openShop();
      }
    }
    if (pressed['KeyQ']) {
      const s = cycleStation();
      flash('Radio: ' + s);
    }
    if (pressed['KeyE'] && !isShopOpen()) {
      if (G.onFoot) {
        const car = nearestParkedCar(5);
        if (car) enterCar(car);
      } else {
        exitCar();
      }
    }
    if (pressed['KeyM']) {
      if (!G.mission && G.missionIndex < MISSIONS.length) startMission(G.missionIndex);
    }

    updateJacking(dt);
    if (G.onFoot) updatePlayer(dt, mouse);
    else updateDriving(dt, mouse);
    updateTraffic(dt);
    updatePedestrians(dt);
    updatePolice(dt);
    updateHelicopter(dt);
    updateCrew(dt);
    updateActivities(dt);
    updateCombat(dt);
    updateMissions(dt);
    updateCamera(dt, mouse);
    updateHud(dt);
    setEngine(G.car ? Math.abs(G.car.speed) / 30 : 0, !!G.car);
    // waypoint beacon spin
    if (G.waypointMesh && G.waypointMesh.visible) G.waypointMesh.rotation.y += dt;
    // NOS exhaust flames
    if (G.boosting && G.car) {
      G.shake = Math.min(0.3, G.shake + 0.05);
      camera.fov = Math.min(78, camera.fov + dt * 20);
      camera.updateProjectionMatrix();
    } else if (camera.fov > 68) {
      camera.fov = Math.max(68, camera.fov - dt * 30);
      camera.updateProjectionMatrix();
    }
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 1.5);
  } else if (G.mode === 'paused') {
    if (pressed['Escape']) { G.mode = 'playing'; showScreen(null); }
  } else if (G.mode === 'busted') {
    showScreen('busted-screen');
  } else if (G.mode === 'ending') {
    showScreen('ending-screen');
    $('ending-text').textContent = 'Mara Vale paid the harbor debt. 12 missions, $' +
      Math.floor(G.cash) + ' earned, ' + G.respect + ' respect. QUEEN OF SOLARA.';
  } else {
    // title screen: slow orbit over the city
    const a = G.time * 0.05;
    camera.position.set(Math.cos(a) * 160, 70, Math.sin(a) * 160);
    camera.lookAt(0, 0, 0);
  }

  // keep the world animating behind menus
  if (G.mode !== 'playing') {
    updateTraffic(dt * 0.5);
    updatePedestrians(dt * 0.5);
  }

  renderer.render(scene, camera);
  clearPressed();
}

function updateCamera(dt, mouse) {
  const target = G.onFoot ? G.player.pos : G.car.pos;
  // forward direction the camera looks along
  const fx = G.onFoot ? Math.sin(camYaw) : Math.sin(G.car.yaw);
  const fz = G.onFoot ? -Math.cos(camYaw) : Math.cos(G.car.yaw);
  const back = G.coverCam ? 26 : 11;
  const height = G.coverCam ? 9 : 5;
  const cx = target.x - fx * back;
  const cz = target.z - fz * back;
  const cy = target.y + height;
  camera.position.set(cx, cy, cz);
  if (G.shake > 0) {
    camera.position.x += (Math.random() - 0.5) * G.shake;
    camera.position.y += (Math.random() - 0.5) * G.shake;
  }
  camera.lookAt(target.x, target.y + 2, target.z);
}

init();
