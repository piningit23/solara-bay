import * as THREE from 'three';
import { LANDMARKS, distance } from './config.js';
import { box, label } from './render.js';
import { createPerson } from './render.js';

export function createStory(game) {
  const marker = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.TorusGeometry(3, .2, 8, 36), new THREE.MeshBasicMaterial({ color: '#ffd570' }));
  ring.rotation.x = Math.PI / 2;
  ring.position.y = .5;
  marker.add(ring);
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(.3, 3, 12, 16, 1, true), new THREE.MeshBasicMaterial({ color: '#ffd570', transparent: true, opacity: .13, side: THREE.DoubleSide }));
  beam.position.y = 6;
  marker.add(beam);
  game.scene.add(marker);
  const missions = [
    { title: 'FIRST WHEELS', story: 'Mara Vale has one night to settle her harbor debt. Take a car and reach the old garage.', place: 'VALE AUTO GARAGE', target: LANDMARKS.garage, type: 'steal', reward: 500 },
    { title: 'BAYFRONT DROP', story: 'A sealed package needs to cross town. The Bay patrol already knows your borrowed plates.', place: 'BAYFRONT RENDEZVOUS', target: LANDMARKS.drop, type: 'drop', reward: 900 },
    { title: 'HARBOR HEIST', story: 'Three ledgers are hidden in the container yard. The dock crew is armed and the sirens are close.', place: 'PORT SOLARA • CONTAINER YARD', target: LANDMARKS.harbor, type: 'crate', reward: 1500, crates: [] },
    { title: 'THE GETAWAY', story: 'The whole coast is on alert. Break the chase, then make it back to the safehouse.', place: 'LOSE THE POLICE', target: LANDMARKS.garage, type: 'escape', reward: 2200 },
    { title: 'KING OF SOLARA', story: 'One last run. Take the north road through the heat and reach the lighthouse above the bay.', place: 'SOLARA POINT LIGHTHOUSE', target: LANDMARKS.lighthouse, type: 'final', reward: 5000 },
  ];
  const crates = missions[2].crates;
  for (let i = 0; i < 3; i++) {
    const crate = box(game.scene, 103 + i * 14, 1, 137, 3.4, 2, 3.2, '#e0a950');
    label(crate, `LEDGER 0${i + 1}`, 0, 0, 1.7, 2.6, '#fff0ba', '#694c37');
    crate.visible = false;
    crates.push(crate);
  }
  game.missions = missions;
  game.marker = marker;
  game.storyNPC = createPerson('#edb765');
  game.storyNPC.position.set(-8, 0, 21);
  game.scene.add(game.storyNPC);
  game.enemies = [];
  game.storyNPC.userData.label = label(game.storyNPC, 'MARA VALE', 0, 3, 0, 3);
  game.missionIndex = 0;
  game.cratesCollected = 0;
  game.storyLoaded = false;
  applySavedProgress(game);
}

function applySavedProgress(game) {
  try {
    const data = JSON.parse(localStorage.getItem('solara-bay-story-v4') || 'null');
    if (!data) return;
    game.cash = Math.max(0, Number(data.cash) || 0);
    game.missionIndex = Math.min(game.missions.length - 1, Math.max(0, Number(data.missionIndex) || 0));
    game.completed = Math.min(game.missions.length, Math.max(0, Number(data.completed) || 0));
    game.health = Math.max(1, Math.min(100, Number(data.health) || 100));
    game.player.health = game.health;
    game.player.x = Number(data.x) || game.player.x;
    game.player.z = Number(data.z) || game.player.z;
    game.wanted = Math.min(5, Math.max(0, Number(data.wanted) || 0));
    game.storyLoaded = true;
  } catch {
    game.notify('SAVE FILE COULD NOT BE READ');
  }
}

export function saveProgress(game) {
  const data = {
    cash: game.cash, missionIndex: game.missionIndex, completed: game.completed || 0,
    health: game.player.health, x: game.player.x, z: game.player.z, wanted: game.wanted,
  };
  localStorage.setItem('solara-bay-story-v4', JSON.stringify(data));
  game.notify('PROGRESS SAVED');
  return data;
}

export function updateMission(game, dt) {
  const mission = game.missions[game.missionIndex];
  if (!mission || game.mode !== 'play') return;
  game.marker.position.set(mission.target.x, 0, mission.target.z);
  game.marker.rotation.y += dt * .5;
  if (mission.type === 'crate') mission.crates.forEach(crate => crate.visible = true);
  if (mission.type === 'drop' && game.wanted === 0) game.wanted = 1;
  if (mission.type === 'escape' && game.wanted < 3) game.crime(3 - game.wanted, 'THREE-STAR PURSUIT');
  if (mission.type === 'final' && game.wanted < 4) game.crime(4 - game.wanted, 'FINAL RUN • FOUR-STAR HEAT');
  if (mission.type === 'crate' && !mission.crewSpawned) {
    mission.crewSpawned = true;
    spawnHarborCrew(game);
  }
  if (mission.type === 'steal' && game.car && distance(game.player, mission.target) < 15) finishMission(game);
  else if (mission.type === 'crate') {
    const next = mission.crates.find(crate => crate.visible);
    if (next && distance(game.player, next.position) < 5 && !game.car && game.enemies.length === 0) {
      next.visible = false;
      game.cratesCollected++;
      game.notify(`LEDGER RECOVERED • ${game.cratesCollected}/3`);
      if (game.cratesCollected >= 3) finishMission(game);
    }
  } else if (mission.type === 'escape') {
    if (game.wanted === 0) finishMission(game);
  } else if (distance(game.player, mission.target) < (mission.type === 'drop' ? 11 : 8)) {
    if (mission.type !== 'final' || game.wanted >= 4) finishMission(game);
  }
}

function spawnHarborCrew(game) {
  game.enemies = [];
  for (let i = 0; i < 4; i++) {
    const mesh = createPerson(i % 2 ? '#644741' : '#39474a');
    const x = 105 + (i % 2) * 25;
    const z = 127 + Math.floor(i / 2) * 19;
    mesh.position.set(x, 0, z);
    game.scene.add(mesh);
    game.enemies.push({ x, z, mesh, health: 2, lastShot: i * .5 });
  }
  game.notify('DOCK CREW • CLEAR THE YARD');
}

function finishMission(game) {
  const mission = game.missions[game.missionIndex];
  game.cash += mission.reward;
  game.completed = game.missionIndex + 1;
  game.audio.chime();
  game.effects.burst(game.player.x, 2, game.player.z, '#ffd56c', 30);
  game.notify(`${mission.title} COMPLETE • +$${mission.reward.toLocaleString()}`);
  saveProgress(game);
  game.missionIndex++;
  if (game.missionIndex >= game.missions.length) {
    game.mode = 'ending';
    game.showResult('SOLARA POINT', 'KING OF SOLARA', 'The last light sweeps across the bay. Mara walks away with the coast behind her and the whole city ahead.\n\nSOLARA BAY IS YOURS.');
  }
}
