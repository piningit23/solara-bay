import * as THREE from 'three';
import { createRenderer, box } from './render.js';
import { buildCoastalCity } from './world.js';
import { Input } from './input.js';
import { SynthAudio } from './audio.js';
import { createPlayer, updateOnFoot } from './player.js';
import { populateParkedCars, updateDriving, addVehicle } from './driving.js';
import { createTraffic, updateTraffic } from './traffic.js';
import { createPedestrians, updatePedestrians } from './pedestrians.js';
import { updatePolice } from './police.js';
import { Effects, updateCombat, reloadWeapon } from './combat.js';
import { createStory, updateMission, saveProgress } from './missions.js';
import { GameHUD } from './hud.js';
import { shotMode, stageScreenshot } from './shots.js';
import { distance } from './config.js';

const { renderer, scene, camera } = createRenderer();
const input = new Input(renderer.domElement);
const audio = new SynthAudio();
const world = buildCoastalCity(scene);
const player = createPlayer(scene);
const game = {
  renderer, scene, camera, input, audio, world, player,
  cars: [], police: [], pedestrians: [], enemies: [], missions: [],
  cash: 1500, wanted: 0, mode: 'menu', time: 0, heatTimer: 0,
  lastCrime: 0, lastSpawn: 0, randomAngle: 0, cameraYaw: 0,
  gunNoise: 0, shake: 0, cameraShake: 0, completed: 0,
};
game.effects = new Effects(scene);
game.hud = new GameHUD();
game.notify = message => game.hud.notify(message);
game.crime = (amount, message) => {
  game.wanted = Math.min(5, game.wanted + amount);
  game.lastCrime = game.time;
  game.heatTimer = 0;
  game.notify(message);
};
game.hurt = amount => {
  player.health = Math.max(0, player.health - amount);
  game.vignette = .5;
};
game.bust = (title = 'BUSTED') => {
  if (game.mode !== 'play') return;
  game.mode = 'busted';
  game.showResult('BAY PATROL', title, 'The coast closes in. Your story can start again from the beginning.');
};
game.showResult = (tag, title, text) => {
  document.querySelector('#resultTag').textContent = tag;
  document.querySelector('#resultTitle').textContent = title;
  document.querySelector('#resultText').textContent = text;
  document.querySelector('#result').classList.remove('hidden');
};
game.headingTowardTarget = target => Math.atan2(target.x - player.x, target.z - player.z) - player.heading;
game.addPoliceCar = (x, z, heading) => {
  const cruiser = addVehicle(game, x, z, heading, { police: true, parked: false });
  game.police.push(cruiser);
  return cruiser;
};

populateParkedCars(game);
createTraffic(game);
createPedestrians(game);
createStory(game);

function startGame(continuing = false) {
  audio.start();
  game.mode = 'play';
  document.querySelector('#menu').classList.add('hidden');
  if (!continuing) {
    game.cash = 1500;
    game.missionIndex = 0;
    game.completed = 0;
    game.wanted = 0;
    player.health = 100;
    player.x = -4;
    player.z = 19;
    player.mesh.position.set(player.x, 0, player.z);
    game.notify('MARA VALE • PALM QUARTER');
  }
  game.pointerReady = true;
}

document.querySelector('#start').addEventListener('click', () => startGame(false));
document.querySelector('#continue').addEventListener('click', () => startGame(true));
document.querySelector('#resume').addEventListener('click', () => {
  game.mode = 'play';
  document.querySelector('#pause').classList.add('hidden');
});
document.querySelector('#save').addEventListener('click', () => {
  saveProgress(game);
  document.querySelector('#saved').textContent = 'SAVED TO THIS BROWSER';
});
document.querySelector('#retry').addEventListener('click', () => location.reload());
window.addEventListener('keydown', event => {
  if (event.code === 'Escape' && input.tap('Escape')) {
    if (game.mode === 'play') {
      game.mode = 'pause';
      document.querySelector('#pause').classList.remove('hidden');
    } else if (game.mode === 'pause') {
      game.mode = 'play';
      document.querySelector('#pause').classList.add('hidden');
    }
  }
});

for (let index = 0; index < 5; index++) {
  const button = document.createElement('button');
  button.className = 'secondary';
  button.textContent = `MISSION ${String(index + 1).padStart(2, '0')}`;
  button.disabled = index > game.completed;
  button.addEventListener('click', () => {
    game.missionIndex = index;
    startGame(true);
  });
  document.querySelector('#select').append(button);
}
if (game.storyLoaded) document.querySelector('#continue').classList.remove('hidden');
document.querySelector('#hint').textContent = 'WASD MOVE  •  SHIFT RUN  •  E ENTER / EXIT  •  RIGHT MOUSE ORBIT  •  CLICK FIRE  •  R RELOAD  •  ESC PAUSE';

const stage = shotMode();
stageScreenshot(game, game.hud, stage);
let previous = performance.now();
function frame(now) {
  const dt = Math.min((now - previous) / 1000, .04);
  previous = now;
  game.time += dt;
  if (game.mode === 'play') {
    if (input.tap('KeyR')) reloadWeapon(game);
    if (input.tap('Escape')) {}
    updateOnFoot(game, dt);
    updateDriving(game, dt);
    updateTraffic(game, dt);
    updatePedestrians(game, dt);
    updatePolice(game, dt);
    updateCombat(game, dt);
    updateMission(game, dt);
    audio.update(dt, game);
  }
  game.effects.update(dt);
  game.hud.update(game, dt);
  if (game.mode !== 'menu') followCamera(dt);
  game.vignette = Math.max(0, (game.vignette || 0) - dt);
  document.querySelector('#vignette').style.opacity = game.vignette;
  input.end();
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

function followCamera(dt) {
  const subject = game.car || player;
  const heading = game.car?.heading ?? player.heading;
  const yaw = input.yaw + heading;
  game.cameraYaw += (input.yaw - game.cameraYaw) * Math.min(1, dt * 5);
  const distanceBack = game.car ? 15 : 9;
  const height = game.car ? 7.2 : 5.5;
  const look = new THREE.Vector3(subject.x, game.car ? 1.5 : 1.8, subject.z);
  const desired = new THREE.Vector3(subject.x - Math.sin(yaw) * distanceBack, height, subject.z - Math.cos(yaw) * distanceBack);
  camera.position.lerp(desired, 1 - Math.exp(-dt * 5));
  if (game.cameraShake > 0) {
    game.cameraShake -= dt;
    camera.position.x += (Math.random() - .5) * game.cameraShake;
    camera.position.y += (Math.random() - .5) * game.cameraShake;
  }
  camera.lookAt(look);
}

requestAnimationFrame(frame);
