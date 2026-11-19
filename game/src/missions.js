// Solara Bay — 12 sequential story missions for Mara Vale.
// Each mission sets up its stage, checks progress every frame, and pays out.

import * as THREE from 'three';
import { MISSIONS, GARAGE, LIGHTHOUSE } from './config.js';
import { makeCrateMesh } from './models.js';
import { addRespect } from './respect.js';
import { addWanted } from './police.js';
import { spawnEnemy, clearEnemies } from './combat.js';
import { setCrewActive } from './crew.js';
import { spawnTaxi, spawnVigilante } from './activities.js';

const DOCKS = [[152, 100], [154, 112], [152, 124]];
const RING = [[0, -120], [120, -120], [140, 0], [120, 120], [0, 140], [-120, 120], [-140, 0], [-120, -120]];
const NEON_LOOP = [[30, 50], [60, 60], [85, 45], [85, 65], [40, 70], [25, 55]];

export function createMissions(scene) {
  const markerGroup = new THREE.Group();
  scene.add(markerGroup);
  return {
    scene,
    markerGroup,
    crateMeshes: [],
    checkpointMeshes: [],
    beacon: null,
    packagePos: null,
    dropPos: null,
    escortTarget: null,
    stage: 0,
  };
}

function clearMarkers(m) {
  for (const c of m.crateMeshes) m.markerGroup.remove(c);
  for (const c of m.checkpointMeshes) m.markerGroup.remove(c);
  if (m.beacon) m.markerGroup.remove(m.beacon);
  m.crateMeshes = [];
  m.checkpointMeshes = [];
  m.beacon = null;
}

function makeBeacon(m, x, z, color) {
  const beacon = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 26, 8),
    new THREE.MeshBasicMaterial({ color: color || 0xffd700, transparent: true, opacity: 0.55 }));
  pole.position.y = 13;
  beacon.add(pole);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(3, 0.35, 8, 24),
    new THREE.MeshBasicMaterial({ color: color || 0xffd700 }));
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.3;
  beacon.add(ring);
  beacon.position.set(x, 0, z);
  m.markerGroup.add(beacon);
  m.beacon = beacon;
  return beacon;
}

function makeCheckpoints(m, points) {
  clearMarkers(m);
  m.checkpointMeshes = points.map(([x, z], i) => {
    const mesh = new THREE.Mesh(new THREE.TorusGeometry(3.4, 0.4, 8, 24),
      new THREE.MeshBasicMaterial({ color: i === 0 ? 0x00ff66 : 0xffaa00 }));
    mesh.rotation.x = Math.PI / 2;
    mesh.position.set(x, 1.2, z);
    m.markerGroup.add(mesh);
    return mesh;
  });
}

export function currentMission(state) {
  return MISSIONS[state.missionIndex] || null;
}

export function missionWaypoint(state, m) {
  const id = (currentMission(state) || {}).id;
  const p = state.playerPos;
  switch (id) {
    case 1: return { x: GARAGE.x, z: GARAGE.z, label: 'OLD GARAGE' };
    case 2: return { x: 120, z: 120, label: 'DROP POINT' };
    case 3: {
      const left = m.crateMeshes.filter((c) => c.visible);
      if (left.length) return { x: left[0].position.x, z: left[0].position.z, label: `CRATES ${3 - left.length}/3` };
      return { x: GARAGE.x, z: GARAGE.z, label: 'RETURN TO GARAGE' };
    }
    case 4: return { x: -120, z: 120, label: 'NIGHT DROP' };
    case 5: {
      const alive = state.guardsLeft;
      if (alive > 0) return { x: 153, z: 112, label: `GUARDS LEFT: ${alive}` };
      return { x: 153, z: 112, label: 'GRAB THE LEDGER' };
    }
    case 6:
      if (state.missionStage === 0) return { x: p.x, z: p.z, label: 'LOSE THE HEAT' };
      return { x: GARAGE.x, z: GARAGE.z, label: 'RETURN TO SAFEHOUSE' };
    case 7:
    case 11: {
      const pts = id === 7 ? RING : NEON_LOOP;
      const cp = pts[state.checkpointIndex] || pts[pts.length - 1];
      return { x: cp[0], z: cp[1], label: `CHECKPOINT ${state.checkpointIndex + 1}/${pts.length}` };
    }
    case 8:
    case 12: return { x: LIGHTHOUSE.x, z: LIGHTHOUSE.z, label: 'LIGHTHOUSE' };
    case 9: return { x: 120, z: -100, label: 'ESCORT DANTE' };
    case 10: {
      if (!state.gigs.taxi) return state.taxi
        ? { x: state.taxi.passenger ? state.taxi.drop.x : state.taxi.pickup.x, z: state.taxi.passenger ? state.taxi.drop.z : state.taxi.pickup.z, label: 'TAXI FARE' }
        : { x: p.x, z: p.z, label: 'FIND A TAXI FARE' };
      if (!state.gigs.vigilante) return state.vigilante
        ? { x: state.vigilante.x, z: state.vigilante.z, label: 'VIGILANTE TARGET' }
        : { x: p.x, z: p.z, label: 'FIND A BOUNTY' };
      if (!state.gigs.package) return { x: 60, z: 60, label: 'PACKAGE PICKUP' };
      return { x: GARAGE.x, z: GARAGE.z, label: 'RETURN TO GARAGE' };
    }
    default: return { x: GARAGE.x, z: GARAGE.z, label: 'SOLARA BAY' };
  }
}

export function startMission(state, ctx) {
  const m = ctx.missions;
  const mission = currentMission(state);
  if (!mission) return;
  state.missionActive = true;
  state.missionStage = 0;
  state.missionTimer = 0;
  state.checkpointIndex = 0;
  clearMarkers(m);
  clearEnemies(ctx.combat);
  state.banner = `MISSION ${mission.id}/12 — ${mission.name}`;
  state.bannerTimer = 5;
  state.message = mission.text;
  state.messageTimer = 6;
  const id = mission.id;
  if (id === 2) addWanted(state, 1);
  if (id === 3) {
    state.cratesLeft = 3;
    m.crateMeshes = DOCKS.map(([x, z]) => {
      const c = makeCrateMesh();
      c.position.set(x, 0, z);
      m.markerGroup.add(c);
      return c;
    });
    spawnEnemy(ctx.combat, 150, 106, 60);
    spawnEnemy(ctx.combat, 154, 118, 60);
    makeBeacon(m, 153, 112, 0xffaa00);
  }
  if (id === 4) {
    state.missionTimer = 90;
    state.night = true;
    addWanted(state, 2);
    makeBeacon(m, -120, 120, 0x00e5ff);
  }
  if (id === 5) {
    state.guardsLeft = 4;
    [[150, 106], [154, 118], [150, 100], [154, 124]].forEach(([x, z]) => spawnEnemy(ctx.combat, x, z, 80));
    makeBeacon(m, 153, 112, 0xff3333);
  }
  if (id === 6) {
    addWanted(state, 3);
    state.missionStage = 0;
  }
  if (id === 7) {
    state.missionTimer = 120;
    makeCheckpoints(m, RING);
  }
  if (id === 8) {
    addWanted(state, 4);
    makeBeacon(m, LIGHTHOUSE.x, LIGHTHOUSE.z, 0xffd700);
  }
  if (id === 9) {
    state.night = true;
    addWanted(state, 2);
    setCrewActive(ctx.crew, state, true, state.playerPos);
    makeBeacon(m, 120, -100, 0xffd700);
  }
  if (id === 10) {
    state.gigs = { taxi: false, vigilante: false, package: false };
    spawnTaxi(ctx.activities, state.playerPos);
    spawnVigilante(ctx.activities, state.playerPos);
    makeBeacon(m, 60, 60, 0xffd700);
  }
  if (id === 11) {
    state.missionTimer = 100;
    state.night = true;
    addWanted(state, 3);
    makeCheckpoints(m, NEON_LOOP);
  }
  if (id === 12) {
    addWanted(state, 5);
    setCrewActive(ctx.crew, state, true, state.playerPos);
    makeBeacon(m, LIGHTHOUSE.x, LIGHTHOUSE.z, 0xffd700);
  }
}

function completeMission(state, ctx) {
  const mission = currentMission(state);
  if (!mission) return;
  state.cash += mission.reward;
  addRespect(state, 60 + mission.id * 10, 'mission');
  state.missionDone.push(mission.id);
  state.missionActive = false;
  state.banner = `MISSION COMPLETE — ${mission.name}  +$${mission.reward}`;
  state.bannerTimer = 5;
  state.message = `Cash $${state.cash}. Respect ${state.respect} (${state.missionIndex + 1}/12 done).`;
  state.messageTimer = 5;
  clearMarkers(ctx.missions);
  clearEnemies(ctx.combat);
  if (mission.id === 8 || mission.id === 12) {
    state.screen = 'ended';
    state.endingText = mission.id === 12
      ? 'QUEEN OF SOLARA — Mara Vale owns the island. The harbor debt is paid, the crew is hers, and the lighthouse beam is hers too.'
      : 'KING OF SOLARA — Mara made it to the lighthouse. The week is won, but the island still has stories left.';
  }
  if (mission.id === 9) setCrewActive(ctx.crew, state, false);
  if (mission.id === 12) setCrewActive(ctx.crew, state, false);
  state.night = false;
  state.missionIndex += 1;
  ctx.saveGame();
}

export function updateMission(state, ctx, dt) {
  if (!state.missionActive) return;
  const mission = currentMission(state);
  if (!mission) return;
  const p = state.playerPos;
  const dist = (x, z) => Math.hypot(p.x - x, p.z - z);
  const id = mission.id;

  if ((id === 4 || id === 7 || id === 11) && state.missionTimer > 0) {
    state.missionTimer -= dt;
    if (state.missionTimer <= 0) {
      state.missionActive = false;
      state.banner = 'MISSION FAILED — out of time';
      state.bannerTimer = 4;
      clearMarkers(ctx.missions);
      state.night = false;
      return;
    }
  }

  switch (id) {
    case 1:
      if (!state.onFoot && dist(GARAGE.x, GARAGE.z) < 15) completeMission(state, ctx);
      break;
    case 2:
      if (dist(120, 120) < 6) completeMission(state, ctx);
      break;
    case 3: {
      let took = false;
      ctx.missions.crateMeshes.forEach((c) => {
        if (c.visible && dist(c.position.x, c.position.z) < 3) {
          c.visible = false;
          state.cratesLeft -= 1;
          took = true;
        }
      });
      if (took) {
        state.message = `CRATE ${3 - state.cratesLeft}/3 collected`;
        state.messageTimer = 2;
      }
      if (state.cratesLeft <= 0) completeMission(state, ctx);
      break;
    }
    case 4:
      if (dist(-120, 120) < 6) completeMission(state, ctx);
      break;
    case 5: {
      const alive = ctx.combat.enemies.filter((e) => !e.dead).length;
      state.guardsLeft = alive;
      if (alive === 0 && dist(153, 112) < 4) completeMission(state, ctx);
      break;
    }
    case 6:
      if (state.missionStage === 0 && state.wantedFloat < 0.5) {
        state.missionStage = 1;
        state.message = 'Heat lost — now get back to the safehouse';
        state.messageTimer = 4;
      } else if (state.missionStage === 1 && dist(GARAGE.x, GARAGE.z) < 15) {
        completeMission(state, ctx);
      }
      break;
    case 7:
    case 11: {
      const pts = id === 7 ? RING : NEON_LOOP;
      const cp = pts[state.checkpointIndex];
      if (cp && dist(cp[0], cp[1]) < 7) {
        const mesh = ctx.missions.checkpointMeshes[state.checkpointIndex];
        if (mesh) mesh.material.color.set(0x00ff66);
        state.checkpointIndex += 1;
        if (state.checkpointIndex >= pts.length) completeMission(state, ctx);
        else {
          const next = ctx.missions.checkpointMeshes[state.checkpointIndex];
          if (next) next.material.color.set(0x00ff66);
          state.message = `CHECKPOINT ${state.checkpointIndex}/${pts.length}`;
          state.messageTimer = 2;
        }
      }
      break;
    }
    case 8:
      if (dist(LIGHTHOUSE.x, LIGHTHOUSE.z) < 10) completeMission(state, ctx);
      break;
    case 9: {
      const d = state.dantePos;
      if (dist(120, -100) < 10 && Math.hypot(d.x - 120, d.z + 100) < 18) {
        completeMission(state, ctx);
      }
      break;
    }
    case 10: {
      if (!state.gigs.package && state.gigs.taxi && state.gigs.vigilante && dist(60, 60) < 4) {
        state.gigs.package = true;
        state.cash += 400;
        addRespect(state, 30, 'package');
        state.message = 'PACKAGE PICKED UP — +$400';
        state.messageTimer = 3;
      }
      if (state.gigs.taxi && state.gigs.vigilante && state.gigs.package) {
        completeMission(state, ctx);
      }
      break;
    }
    case 12:
      if (dist(LIGHTHOUSE.x, LIGHTHOUSE.z) < 10) completeMission(state, ctx);
      break;
    default:
      break;
  }
}
