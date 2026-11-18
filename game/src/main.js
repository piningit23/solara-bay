import * as THREE from 'three';
import { TITLE, GARAGE } from './config.js';
import { createRenderer } from './render.js';
import { buildIslandCity } from './world.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { createRadio } from './radio.js';
import { createEffects } from './effects.js';
import { createPlayer, updateOnFoot, syncPlayerMesh } from './player.js';
import { createDriving } from './driving.js';
import { createPedestrians } from './pedestrians.js';
import { createCombat } from './combat.js';
import { createMissions, STORY } from './missions.js';
import { createPolice } from './police.js';
import { createHelicopter } from './helicopter.js';
import { createHud, titleMenu } from './hud.js';
import { createSave } from './save.js';
import { openShop } from './shop.js';
import { stageScreenshot } from './shots.js';

const view = createRenderer();
const { scene } = view;
const world = buildIslandCity(scene);
const player = createPlayer(scene);
const state = { time: 0, player, world, wanted: 0, heatTimer: 0, missionIndex: 0, unlockedMissions: 1, damageFlash: 0, feedbackTimer: 0, shake: 0, missionTimer: 0, endGame: false, screenshotStage: null, toast: () => {}, raiseWanted: () => {}, bust: () => {}, save: () => {}, effects: null, audio: null, combat: null, police: null, missions: null, pedestrians: null, driving: null, helicopter: null, radio: null, crates: [] };
state.input = createInput();
state.audio = createAudio();
state.effects = createEffects(scene);
state.radio = createRadio(state.audio);
state.driving = createDriving(scene, state);
state.pedestrians = createPedestrians(scene, state);
state.combat = createCombat(scene, state);
state.missions = createMissions(state);
state.police = createPolice(scene, state);
state.helicopter = createHelicopter(scene);
state.saveSystem = createSave(state);
state.save = state.saveSystem.save;
state.missionIndex = 0;
state.raiseWanted = (amount, crime) => {
  state.wanted = Math.min(5, state.wanted + amount);
  state.heatTimer = 0;
  state.player.lastCrime = { x: state.player.x, z: state.player.z };
  state.toast(`${crime.toUpperCase()} · ${'★'.repeat(state.wanted)}`);
  state.police.update(0.01);
};
state.bust = reason => {
  if (state.paused || state.busted) return;
  state.busted = true;
  const menu = document.querySelector('#menu');
  menu.innerHTML = `<div class="menu-content"><div class="title-kicker">SOLARA BAY POLICE DEPARTMENT</div><h2>BUSTED</h2><p class="story">${reason}. Mara’s story isn’t over yet.</p><div class="buttons"><button class="primary" id="retry">RETRY FROM SAFEHOUSE</button><button id="save-exit">SAVE</button></div></div>`;
  menu.querySelector('#retry').onclick = () => { state.busted = false; player.health = 100; player.armor = 0; player.x = GARAGE.x; player.z = GARAGE.z; player.car = null; player.mesh.visible = true; state.wanted = 0; state.missions.start(state.missionIndex); menu.innerHTML = ''; };
  menu.querySelector('#save-exit').onclick = () => { state.save(); state.busted = false; menu.innerHTML = ''; };
};
const hud = createHud(state);
state.toast = text => hud.message(text);
const crates = [];
for (let i = 0; i < 3; i++) {
  const mesh = new THREE.Group();
  const crate = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.4, 2.6), new THREE.MeshStandardMaterial({ color: i % 2 ? '#d27e4b' : '#e7bc63', roughness: .82 }));
  crate.position.y = 1.4;
  crate.castShadow = true;
  mesh.add(crate);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.68, .22, 2.68), new THREE.MeshStandardMaterial({ color: '#496a69' }));
  stripe.position.y = 1.4;
  mesh.add(stripe);
  mesh.position.set(155 + i * 11, 0, -77 - i * 14);
  scene.add(mesh);
  crates.push({ x: mesh.position.x, z: mesh.position.z, mesh });
}
state.crates = crates;
const missionMarker = new THREE.Group();
const ring = new THREE.Mesh(new THREE.TorusGeometry(3.4, .24, 8, 36), new THREE.MeshBasicMaterial({ color: '#f3cd74' }));
ring.rotation.x = Math.PI / 2;
missionMarker.add(ring);
const beam = new THREE.Mesh(new THREE.CylinderGeometry(.15, 1.8, 18, 12, 1, true), new THREE.MeshBasicMaterial({ color: '#f8d77e', transparent: true, opacity: .15, side: THREE.DoubleSide, depthWrite: false }));
beam.position.y = 9;
missionMarker.add(beam);
scene.add(missionMarker);
const input = state.input;
state.missions.start(0);
state.saveSystem.load();
state.missionIndex = Math.min(state.missionIndex, STORY.length - 1);
state.missions.start(state.missionIndex);
const params = new URLSearchParams(location.search);
const staged = stageScreenshot(state, params);
if (params.get('debug') === '1') window.solaraDebug = state;
let running = false;
let last = performance.now();
let gameStarted = false;
const title = document.title;
document.title = TITLE;
function startGame(continueRun = false) {
  state.audio.start();
  gameStarted = true;
  state.paused = false;
  document.querySelector('#menu').innerHTML = '';
  if (!staged) {
    if (continueRun) state.saveSystem.load();
    else { state.missionIndex = 0; player.cash = 2200; player.health = 100; state.wanted = 0; }
    state.unlockedMissions = Math.max(state.unlockedMissions, state.missionIndex + 1);
    state.missions.start(state.missionIndex);
  }
  running = true;
  document.querySelector('#hud').hidden = false;
}
function showPause() {
  if (!gameStarted) return;
  state.paused = true;
  state.save();
  const menu = document.querySelector('#menu');
  menu.innerHTML = `<div class="menu-content"><div class="title-kicker">SOLARA BAY / PAUSED</div><h2>TAKE A BREATH.</h2><p class="story">Cash $${player.cash.toLocaleString()} · ${state.missions.current().name} · autosave on mission complete.</p><div class="buttons"><button class="primary" id="resume">BACK TO THE ISLAND</button><button id="save">SAVE GAME</button><button id="quit">TITLE SCREEN</button></div><p class="key-guide">ESC RESUME &nbsp;·&nbsp; The safehouse clears heat faster.</p></div>`;
  menu.querySelector('#resume').onclick = () => { state.paused = false; input.end(); menu.innerHTML = ''; };
  menu.querySelector('#save').onclick = () => { state.save(); menu.querySelector('.story').textContent = 'GAME SAVED TO THIS BROWSER.'; };
  menu.querySelector('#quit').onclick = () => { gameStarted = false; running = false; menu.innerHTML = ''; titleMenu(() => startGame(false), () => startGame(true), selectMissions); };
}
function selectMissions() {
  const menu = document.querySelector('#menu');
  menu.innerHTML = `<div class="menu-content"><div class="title-kicker">MARA VALE / STORY ARCHIVE</div><h2>MISSION SELECT</h2><p class="story">Completed runs unlock replay access. Current progress saves locally.</p><div id="mission-list"></div><div class="buttons"><button class="primary" id="back">BACK</button></div></div>`;
  const list = menu.querySelector('#mission-list');
  STORY.forEach((mission, index) => {
    const button = document.createElement('button');
    button.style.margin = '4px';
    button.disabled = index >= state.unlockedMissions;
    button.textContent = `${String(index + 1).padStart(2, '0')} · ${mission.name} ${button.disabled ? '🔒' : ''}`;
    button.onclick = () => { state.missions.select(index); startGame(true); };
    list.append(button);
  });
  menu.querySelector('#back').onclick = () => titleMenu(() => startGame(false), () => startGame(true), selectMissions);
}
if (staged === 'start') {
  titleMenu(() => startGame(false), () => startGame(true), selectMissions);
} else {
  startGame(true);
  state.paused = false;
}
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(.035, Math.max(0, (now - last) / 1000));
  last = now;
  if (!running || state.paused || state.busted || state.endGame) {
    if (state.endGame) {
      const menu = document.querySelector('#menu');
      if (!menu.querySelector('#ending')) menu.innerHTML = `<div class="menu-content" id="ending"><div class="title-kicker">SOLARA BAY / DAY SEVEN</div><h2>KING OF SOLARA</h2><p class="story">The lighthouse turns across the harbor. The ledger is home. The debt is gone. Mara Vale has her island back.</p><div class="buttons"><button class="primary" id="free-roam">FREE ROAM</button><button id="ending-save">SAVE</button></div></div>`;
      menu.querySelector('#free-roam').onclick = () => { state.endGame = false; gameStarted = true; running = true; menu.innerHTML = ''; };
      menu.querySelector('#ending-save').onclick = () => state.save();
    }
    view.draw();
    return;
  }
  state.time += dt;
  if (state.screenshotStage) {
    state.helicopter.update(dt, state);
    hud.update(dt);
    view.follow(state, dt);
    view.draw();
    input.end();
    return;
  }
  if (input.tap('Escape')) { if (state.paused) { state.paused = false; document.querySelector('#menu').innerHTML = ''; } else showPause(); }
  if (input.tap('KeyQ')) { state.radio.cycle(); state.toast(`TUNED TO ${state.radio.current.name}`); }
  if (input.tap('KeyF') && Math.hypot((state.player.car || player).x - GARAGE.x, (state.player.car || player).z - GARAGE.z) < 23) { state.paused = true; openShop(state); }
  if (input.tap('KeyE')) {
    if (player.car) state.driving.exit();
    else {
      const car = state.driving.nearParked();
      if (car && Math.hypot(player.x - car.x, player.z - car.z) < 11) { player.jacking = .65; state.raiseWanted(1, 'Vehicle theft'); window.setTimeout(() => { if (player.jacking > 0) { player.jacking = 0; state.driving.enter(car); } }, 500); }
      else state.toast('NO VEHICLE IN REACH');
    }
  }
  if (input.tap('KeyS') && input.down('ControlLeft')) { state.save(); state.toast('GAME SAVED'); }
  updateOnFoot(player, input, world, dt, state.time);
  state.driving.updateTraffic(dt);
  state.driving.updatePlayerCar(dt, input, world);
  syncPlayerMesh(player);
  state.pedestrians.update(dt);
  state.combat.update(dt, input);
  state.police.update(dt);
  state.helicopter.update(dt, state);
  state.missions.update(dt);
  state.effects.update(dt);
  state.radio.update(dt);
  state.audio.update(state, dt);
  view.setNight(state.missions.current().type === 'timed' && Math.sin(state.time * .025) < -.25);
  const waypoint = state.missions.position();
  if (waypoint) { missionMarker.position.set(waypoint.x, 0, waypoint.z); missionMarker.rotation.y += dt * .45; }
  for (const crate of crates) if (crate.mesh.visible) crate.mesh.rotation.y = Math.sin(state.time * 1.5 + crate.x) * .13;
  state.shake = Math.max(0, state.shake - dt * .55);
  state.damageFlash = Math.max(0, state.damageFlash - dt * 1.8);
  state.feedbackTimer = Math.max(0, state.feedbackTimer - dt);
  state.player.busting = Math.max(0, state.player.busting - dt * .4);
  hud.update(dt);
  view.follow(state, dt);
  view.draw();
  input.end();
}
requestAnimationFrame(frame);
