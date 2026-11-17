import * as THREE from 'three';
import { Input } from './input.js';
import { AudioSystem } from './audio.js';
import { buildCity, distance } from './world.js';
import { createPlayer, updatePlayer } from './player.js';
import { createTraffic, updateTraffic } from './traffic.js';
import { createPedestrians, updatePedestrians } from './pedestrians.js';
import { createPolice, updatePolice } from './police.js';
import { Driving } from './driving.js';
import { createWeapon } from './combat.js';
import { MissionSystem } from './missions.js';
import { HUD } from './hud.js';
import { stage } from './staging.js';

const canvas = document.querySelector('#game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5)); renderer.setSize(innerWidth, innerHeight); renderer.shadowMap.enabled = true;
const camera = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, .1, 300); const scene = new THREE.Scene(); buildCity(scene);
const input = new Input(canvas); const audio = new AudioSystem(); const hud = new HUD(); const player = createPlayer(scene); const traffic = createTraffic(scene); const people = createPedestrians(scene); const police = createPolice(scene); const driving = new Driving(scene); const weapon = createWeapon(scene); const missions = new MissionSystem(); const wanted = { value: 0 }; const state = { player, cash: missions.cash, health: 100, wanted: 0, ammo: 12, inCar: false, speed: 0, mission: missions.mission, distance: 0 }; let playing = false; let paused = false; let last = performance.now(); let fireCooldown = 0; let cameraYaw = 0;

function show(id, visible) { document.querySelector(id).classList.toggle('hidden', !visible); }
function toast(text) { hud.toast(text); }
function startGame() { audio.start(); show('#title', false); show('#hud', true); playing = true; }
function save() { localStorage.setItem('solara-mission', missions.index); localStorage.setItem('solara-cash', missions.cash); toast('PROGRESS SAVED'); }
document.querySelector('#start').onclick = startGame; document.querySelector('#continue').onclick = startGame; document.querySelector('#resume').onclick = () => { paused = false; show('#pause', false); }; document.querySelector('#save').onclick = save; document.querySelector('#retry').onclick = () => location.reload(); document.querySelector('#ending-replay').onclick = () => { localStorage.clear(); location.reload(); };
const staged = stage(location.search, player, driving, wanted, missions, traffic, police); if (staged === 'start') { show('#title', true); } else { startGame(); }

function updateMission() { const target = missions.waypoint(); state.distance = target ? distance(player.position, target) : 0; if (missions.index === 0 && driving.car && target && state.distance < 11) missions.complete(toast); else if (missions.index === 1 && driving.car && target && state.distance < 11) missions.complete(toast); else if (missions.index === 2 && distance(player.position, { x: 60, z: -60 }) < 14) { missions.crates++; toast(`DOCK CRATE ${missions.crates}/3`); player.position.x -= 5; if (missions.crates >= 3) missions.complete(toast); } else if (missions.index === 3 && wanted.value === 0) missions.complete(toast); else if (missions.index === 4 && target && state.distance < 12) { show('#hud', false); show('#ending', true); playing = false; } }
function updateCamera(dt) { const subject = driving.car || player; cameraYaw += input.pointer.x * .002; input.pointer.x = 0; const follow = new THREE.Vector3(Math.sin(cameraYaw) * 15, driving.car ? 8 : 6, Math.cos(cameraYaw) * 15); camera.position.lerp(subject.position.clone().add(follow), 1 - Math.pow(.001, dt)); camera.lookAt(subject.position.clone().add(new THREE.Vector3(0, 1.8, 0))); }
function frame(now) { const dt = Math.min(.05, (now - last) / 1000); last = now; if (input.consume('Escape') && playing) { paused = !paused; show('#pause', paused); } if (playing && !paused) { if (input.consume('KeyE')) { driving.toggle(player, wanted, audio); toast(driving.car ? 'VEHICLE STOLEN  +1 HEAT' : 'ON FOOT'); } if (driving.car) driving.update(player, input, dt); else updatePlayer(player, input, dt); if (input.pointer.down && fireCooldown <= 0) { weapon.fire(player, audio, () => { wanted.value = Math.min(5, wanted.value + 1); }); state.ammo = state.ammo > 0 ? state.ammo - 1 : 0; fireCooldown = .25; } if (input.consume('KeyR')) state.ammo = 12; fireCooldown -= dt; updateTraffic(traffic, dt, player); updatePedestrians(people, dt, player, input.pointer.down || wanted.value > 0); updatePolice(police, scene, player, wanted.value, dt, audio); updateMission(); state.cash = missions.cash; state.health = player.userData.health; state.wanted = wanted.value; state.inCar = Boolean(driving.car); state.speed = player.userData.speed; state.mission = missions.mission; hud.update(state, missions.waypoint()); hud.drawMap(state, traffic, police, missions.waypoint()); if (wanted.value > 0 && Math.random() < dt * .04) wanted.value--; if (player.userData.health <= 0) { show('#hud', false); show('#busted', true); playing = false; } } updateCamera(dt); renderer.render(scene, camera); requestAnimationFrame(frame); }
addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });
requestAnimationFrame(frame);
