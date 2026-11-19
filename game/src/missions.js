// Solara Bay — the 12 story missions. Mara Vale settles a harbor debt in
// one week. Sequential, with on-screen story text, a waypoint marker plus
// distance readout, and cash + respect rewards. Progress persists in save.

import * as THREE from 'three';
import { G } from './state.js';
import { MISSIONS, GARAGE, LIGHTHOUSE, DOCKS, NEON_STRIP } from './config.js';
import { setDusk } from './world.js';
import { carPos } from './driving.js';
import { setWanted, addWanted } from './police.js';
import { spawnHelicopter } from './helicopter.js';
import { spawnCrew, despawnCrew } from './crew.js';
import { spawnEnemy, clearEnemies } from './combat.js';
import { spawnTaxiFare, spawnVigilante } from './activities.js';
import { addRespect } from './respect.js';
import { playCash, playChime } from './audio.js';
import { saveGame } from './save.js';

const RACE_CHECKPOINTS = [
  { x: -160, z: -160 }, { x: 160, z: -160 }, { x: 160, z: 160 }, { x: -160, z: 160 },
];
const NEON_CHECKPOINTS = [
  { x: -40, z: -40 }, { x: 40, z: -40 }, { x: 40, z: 40 }, { x: -40, z: 40 }, { x: 0, z: -80 },
];

export function currentMissionDef() {
  return G.missionIndex < MISSIONS.length ? MISSIONS[G.missionIndex] : null;
}

export function missionCount() { return MISSIONS.length; }

export function startMission(index) {
  const def = MISSIONS[index];
  if (!def) return;
  G.missionIndex = index;
  clearEnemies();
  const m = {
    def, stage: 0, timer: 0, crates: 0, guardsDown: 0, checkpoints: 0,
    gigsDone: 0, escaped: false, started: G.time,
  };
  G.mission = m;
  // per-type setup
  if (def.type === 'steal') {
    setObjective('Steal a car (press E near one)');
    G.waypoint = null;
  } else if (def.type === 'drop') {
    G.waypoint = { x: -140, z: -140 };
    setWanted(1);
    setObjective('Deliver the package to the marker');
  } else if (def.type === 'crate') {
    G.waypoint = { x: DOCKS.x, z: DOCKS.z };
    setWanted(2);
    for (let i = 0; i < 3; i++) spawnEnemy(DOCKS.x - 10 + i * 10, DOCKS.z + 14, 60);
    setObjective('Collect 3 crates at the docks (0/3)');
  } else if (def.type === 'timed') {
    G.waypoint = { x: 160, z: 160 };
    m.timer = 150;
    setWanted(2);
    setDusk(true);
    setObjective('Reach the far drop before the countdown ends');
  } else if (def.type === 'crew') {
    G.waypoint = { x: DOCKS.x, z: DOCKS.z };
    for (let i = 0; i < 4; i++) spawnEnemy(DOCKS.x - 12 + i * 8, DOCKS.z - 6 + (i % 2) * 12, 70);
    setObjective('Defeat the 4 dock guards (0/4)');
  } else if (def.type === 'escape') {
    setWanted(3);
    setObjective('Lose the cops — stay out of sight, then return to the garage');
  } else if (def.type === 'race') {
    m.checkpoints = 0;
    m.timer = def.id === 11 ? 120 : 150;
    if (def.id === 11) { setDusk(true); setWanted(3); }
    G.waypoint = RACE_POINTS(def)[0];
    setObjective('Race the checkpoints in order (0/' + RACE_POINTS(def).length + ')');
  } else if (def.type === 'final') {
    G.waypoint = { x: LIGHTHOUSE.x, z: LIGHTHOUSE.z };
    setWanted(def.id === 12 ? 5 : 4);
    if (def.id === 12) spawnCrew(G.scene);
    setObjective('Reach the lighthouse — ' + def.title);
  } else if (def.type === 'escort') {
    spawnCrew(G.scene);
    setDusk(true);
    G.waypoint = { x: -140, z: 140 };
    setWanted(2);
    setObjective('Escort Dante\u2019s car to the marker — rivals are chasing');
  } else if (def.type === 'gigs') {
    m.gigsDone = 0;
    spawnTaxiFare();
    spawnVigilante();
    G.waypoint = { x: -120, z: 120 };
    setObjective('Three gigs: taxi fare, vigilante takedown, package pickup (0/3)');
  }
  setWaypoint(G.waypoint);
  playChime();
  G.messages.push('MISSION ' + def.id + ' — ' + def.title);
  G.messages.push(def.brief);
}

function RACE_POINTS(def) { return def.id === 11 ? NEON_CHECKPOINTS : RACE_CHECKPOINTS; }

export function setObjective(text) {
  if (G.mission) G.mission.objective = text;
  if (G.hud.setObjective) G.hud.setObjective(text);
}

export function setWaypoint(wp) {
  G.waypoint = wp;
  if (G.waypointMesh) {
    if (wp) {
      G.waypointMesh.visible = true;
      G.waypointMesh.position.set(wp.x, 0.3, wp.z);
    } else {
      G.waypointMesh.visible = false;
    }
  }
}

function completeMission() {
  const m = G.mission;
  if (!m) return;
  const def = m.def;
  G.cash += def.reward;
  addRespect(def.respect, 'mission complete');
  G.messages.push('MISSION COMPLETE — ' + def.title + ' +$' + def.reward);
  G.messages.push(def.outro);
  playCash();
  G.missionIndex++;
  G.mission = null;
  setWaypoint(null);
  setWanted(0);
  setDusk(false);
  clearEnemies();
  if (def.id !== 9 && def.id !== 12) despawnCrew();
  saveGame();
  if (G.missionIndex >= MISSIONS.length) {
    G.mode = 'ending';
    return;
  }
  // next mission starts when the player is ready: auto-start after a beat
  setTimeout(() => { if (G.mode === 'playing' && !G.mission) startMission(G.missionIndex); }, 2500);
}

export function failMission(reason) {
  if (!G.mission) return;
  G.messages.push('MISSION FAILED — ' + reason + '. Restarting it.');
  const idx = G.missionIndex;
  G.mission = null;
  setWaypoint(null);
  setWanted(0);
  setDusk(false);
  clearEnemies();
  setTimeout(() => { if (G.mode === 'playing') startMission(idx); }, 1500);
}

export function updateMissions(dt) {
  const m = G.mission;
  if (!m) return;
  const pp = carPos();
  const def = m.def;

  if (m.timer > 0) {
    m.timer -= dt;
    if (m.timer <= 0) { failMission('Out of time'); return; }
  }

  const distTo = (wp) => wp ? Math.hypot(pp.x - wp.x, pp.z - wp.z) : 9999;

  if (def.type === 'steal') {
    if (!G.onFoot) {
      m.stage = 1;
      G.waypoint = { x: GARAGE.x, z: GARAGE.z };
      setWaypoint(G.waypoint);
      setObjective('Drive to the old garage');
    }
    if (m.stage === 1 && distTo(G.waypoint) < 8) completeMission();
  } else if (def.type === 'drop' || def.type === 'timed') {
    if (distTo(G.waypoint) < 8) completeMission();
  } else if (def.type === 'crate') {
    if (m.crateCooldown > 0) m.crateCooldown -= dt;
    else if (distTo(G.waypoint) < 12) {
      m.crates++;
      m.crateCooldown = 2;
      const spots = [{ x: DOCKS.x - 12, z: DOCKS.z + 10 }, { x: DOCKS.x + 12, z: DOCKS.z - 8 }, { x: DOCKS.x, z: DOCKS.z + 16 }];
      if (m.crates < 3) {
        G.waypoint = spots[m.crates];
        setWaypoint(G.waypoint);
        setObjective('Collect crates at the docks (' + m.crates + '/3)');
      } else {
        completeMission();
      }
    }
  } else if (def.type === 'crew') {
    const down = 4 - G.enemies.length;
    if (down !== m.guardsDown) {
      m.guardsDown = down;
      setObjective('Defeat the 4 dock guards (' + down + '/4)');
    }
    if (G.enemies.length === 0) completeMission();
  } else if (def.type === 'escape') {
    if (G.wanted === 0 && !m.escaped) {
      m.escaped = true;
      G.waypoint = { x: GARAGE.x, z: GARAGE.z };
      setWaypoint(G.waypoint);
      setObjective('Heat lost — get back to the safehouse');
    }
    if (m.escaped && distTo(G.waypoint) < 8) completeMission();
  } else if (def.type === 'race') {
    const points = RACE_POINTS(def);
    if (distTo(points[m.checkpoints]) < 10) {
      m.checkpoints++;
      if (m.checkpoints >= points.length) { completeMission(); return; }
      G.waypoint = points[m.checkpoints];
      setWaypoint(G.waypoint);
      setObjective('Race the checkpoints in order (' + m.checkpoints + '/' + points.length + ')');
    }
  } else if (def.type === 'final') {
    if (distTo(G.waypoint) < 10) completeMission();
  } else if (def.type === 'escort') {
    // Dante follows; complete when both reach the marker
    const d = G.crew ? Math.hypot(G.crew.pos.x - G.waypoint.x, G.crew.pos.z - G.waypoint.z) : 999;
    if (distTo(G.waypoint) < 10 && d < 30) completeMission();
  } else if (def.type === 'gigs') {
    // taxi + vigilante count via gigsDone; package pickup is the waypoint
    if (distTo(G.waypoint) < 8 && m.gigsDone >= 0) {
      m.gigsDone = Math.max(m.gigsDone, 1);
      if (m.gigsDone >= 3) { completeMission(); return; }
      G.waypoint = { x: 120, z: -120 };
      setWaypoint(G.waypoint);
      setObjective('Package pickup marked — finish the gigs (' + m.gigsDone + '/3)');
    }
    if (m.gigsDone >= 3) completeMission();
  }
}

export function abandonMission() {
  if (!G.mission) return;
  G.mission = null;
  setWaypoint(null);
  setWanted(0);
  setDusk(false);
  clearEnemies();
}
