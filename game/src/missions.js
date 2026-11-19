// Missions and story: 12 sequential missions for Mara Vale, with on-screen
// story text, a waypoint marker + distance readout, and cash rewards.
// Types: steal, drop, crate, timed, crew, escape, race, escort, gigs, final.

import { MISSIONS, PLACES } from './config.js';
import { makeCrate, makePerson } from './models.js';
import { addRespect } from './respect.js';
import { spawnDante, despawnDante } from './crew.js';
import { spawnTaxi, spawnBounty, spawnPickup, checkPickup } from './activities.js';
import { clearPolice } from './police.js';

export function currentMission(G) {
  return MISSIONS[G.missionIndex] || null;
}

export function missionName(G) {
  const m = currentMission(G);
  return m ? `${m.id}. ${m.name}` : 'STORY COMPLETE';
}

export function startMission(G, index) {
  const m = MISSIONS[index];
  if (!m) return false;
  G.missionIndex = index;
  G.missionActive = true;
  G.missionStep = 0;
  G.missionCrates = 0;
  G.missionGuardsDown = 0;
  G.missionGigs = { taxi: false, vigilante: false, pickup: false };
  G.missionCheckpoint = 0;
  G.missionTimer = m.time || 0;
  G._pickup = null;
  // Clean the board from the last mission.
  for (const crate of G.crates) G.scene.remove(crate.mesh);
  G.crates = [];
  for (const guard of G.guards) G.scene.remove(guard.mesh);
  G.guards = [];
  G.missionCheckpoints = [];
  // Dusk lighting for the night missions.
  G.dusk = index === 3 || index === 8 || index === 10;
  applyLighting(G);

  if (m.type === 'crate') {
    for (let i = 0; i < m.count; i++) {
      const mesh = makeCrate(G.THREE);
      const x = PLACES.docks.x - 20 + i * 12;
      const z = PLACES.docks.z - 6 + (i % 2) * 12;
      mesh.position.set(x, 0, z);
      G.scene.add(mesh);
      G.crates.push({ mesh, x, z, taken: false });
    }
    spawnGuards(G, 2, PLACES.docks.x - 10, PLACES.docks.z);
  }
  if (m.type === 'crew') {
    spawnGuards(G, 4, PLACES.docks.x - 10, PLACES.docks.z);
  }
  if (m.type === 'escape') {
    G.wanted = 3;
  }
  if (m.type === 'race') {
    G.missionCheckpoints = raceCheckpoints(m.id);
    G.waypoint = { ...G.missionCheckpoints[0], label: 'CHECKPOINT 1' };
  }
  if (m.type === 'escort') {
    spawnDante(G.THREE, G, G.player.x + 6, G.player.z + 4);
    G.wanted = Math.max(G.wanted, 2);
    G.dusk = true;
    applyLighting(G);
  }
  if (m.type === 'gigs') {
    spawnTaxi(G.THREE, G);
    spawnBounty(G.THREE, G);
    G._pickup = spawnPickup(G.THREE, G);
  }
  if (m.type === 'final') {
    G.wanted = m.id === 12 ? 5 : 4;
    if (m.id === 12) spawnDante(G.THREE, G, G.player.x + 6, G.player.z + 4);
  }
  if (m.type === 'drop' || m.type === 'timed') {
    G.wanted = Math.max(G.wanted, m.id === 4 ? 2 : 1);
  }
  if (m.type !== 'race') {
    G.waypoint = {
      x: m.target.x, z: m.target.z,
      label: m.type === 'final' ? 'REACH THE LIGHTHOUSE' : m.name,
    };
  }
  G.toast = `MISSION ${m.id}: ${m.name} — ${m.brief}`;
  G.toastUntil = G.time + 5;
  return true;
}

function raceCheckpoints(missionId) {
  if (missionId === 7) {
    return [
      { x: 160, z: 0 }, { x: 160, z: 160 }, { x: 0, z: 160 },
      { x: -160, z: 160 }, { x: -160, z: -160 }, { x: 0, z: -160 },
    ];
  }
  // Neon Loop: through the strip and around the north ring.
  return [
    { x: 40, z: -80 }, { x: 40, z: 80 }, { x: 120, z: 80 },
    { x: 120, z: -120 }, { x: -80, z: -120 }, { x: -80, z: 40 },
  ];
}

function spawnGuards(G, count, cx, cz) {
  for (let i = 0; i < count; i++) {
    const mesh = makePerson(G.THREE, 0x8b0000);
    const x = cx + (Math.random() - 0.5) * 24;
    const z = cz + (Math.random() - 0.5) * 24;
    mesh.position.set(x, 0, z);
    G.scene.add(mesh);
    G.guards.push({ mesh, x, z, health: 100, shootCooldown: 1 + Math.random() });
  }
}

export function applyLighting(G) {
  if (!G.sun || !G.hemi) return;
  if (G.dusk) {
    G.sun.intensity = 0.7;
    G.sun.color.setHex(0xff9a5c);
    G.hemi.intensity = 0.5;
    G.scene.background.setHex(0x2c1e3f);
    G.scene.fog.color.setHex(0x2c1e3f);
  } else {
    G.sun.intensity = 1.35;
    G.sun.color.setHex(0xfff2d9);
    G.hemi.intensity = 0.85;
    G.scene.background.setHex(0x87b5d6);
    G.scene.fog.color.setHex(0xbfd9ea);
  }
}

export function completeMission(G) {
  const m = currentMission(G);
  if (!m) return;
  G.cash += m.reward;
  addRespect(G, 40 + m.id * 5, `mission ${m.id} complete`);
  if (G.audio) G.audio.chime();
  G.toast = `MISSION COMPLETE: ${m.name} — +$${m.reward}!`;
  G.toastUntil = G.time + 4;
  G.missionActive = false;
  G.missionDone = true;
  G.waypoint = null;
  if (m.id === 12) {
    G.mode = 'ended';
    showEnding(G);
  } else {
    G.missionIndex = m.id; // next mission (0-based index of the next id)
    saveProgress(G);
    setTimeout(() => {
      if (G.mode === 'playing') startMission(G, G.missionIndex);
    }, 2500);
  }
  saveProgress(G);
}

export function updateMissions(G, dt) {
  if (!G.missionActive) return;
  const m = currentMission(G);
  if (!m) return;
  if (m.time) {
    G.missionTimer -= dt;
    if (G.missionTimer <= 0) {
      G.missionTimer = 0;
      failMission(G, 'Out of time!');
      return;
    }
  }
  const px = G.player.x;
  const pz = G.player.z;
  const distTo = (x, z) => Math.hypot(x - px, z - pz);

  if (m.type === 'steal') {
    if (G.car) completeMission(G);
  } else if (m.type === 'drop' || m.type === 'timed') {
    if (distTo(m.target.x, m.target.z) < 8) completeMission(G);
  } else if (m.type === 'crate') {
    for (const crate of G.crates) {
      if (!crate.taken && distTo(crate.x, crate.z) < 3) {
        crate.taken = true;
        G.scene.remove(crate.mesh);
        G.missionCrates += 1;
        if (G.audio) G.audio.chime();
        G.toast = `Crate ${G.missionCrates}/${m.count} collected`;
        G.toastUntil = G.time + 2;
      }
    }
    if (G.missionCrates >= m.count) completeMission(G);
  } else if (m.type === 'crew') {
    if (G.missionGuardsDown >= m.count && distTo(PLACES.docks.x, PLACES.docks.z) < 8) {
      completeMission(G);
    } else if (G.missionGuardsDown >= m.count) {
      G.waypoint = { x: PLACES.docks.x, z: PLACES.docks.z, label: 'GRAB THE LEDGER' };
    }
  } else if (m.type === 'escape') {
    if (G.wanted <= 0 && distTo(PLACES.garage.x, PLACES.garage.z) < 10) {
      completeMission(G);
    } else if (G.wanted <= 0) {
      G.waypoint = { x: PLACES.garage.x, z: PLACES.garage.z, label: 'GET TO THE GARAGE' };
    }
  } else if (m.type === 'race') {
    const cp = G.missionCheckpoints[G.missionCheckpoint];
    if (cp && distTo(cp.x, cp.z) < 9) {
      G.missionCheckpoint += 1;
      if (G.audio) G.audio.chime();
      if (G.missionCheckpoint >= G.missionCheckpoints.length) {
        completeMission(G);
      } else {
        const next = G.missionCheckpoints[G.missionCheckpoint];
        G.waypoint = { ...next, label: `CHECKPOINT ${G.missionCheckpoint + 1}` };
        G.toast = `Checkpoint ${G.missionCheckpoint}/${G.missionCheckpoints.length}!`;
        G.toastUntil = G.time + 2;
      }
    }
  } else if (m.type === 'escort') {
    if (G.dante) {
      const dd = Math.hypot(G.dante.x - px, G.dante.z - pz);
      if (dd > 60) {
        failMission(G, 'You lost Dante! Stay close to his car.');
        return;
      }
    }
    if (distTo(m.target.x, m.target.z) < 9) {
      despawnDante(G);
      completeMission(G);
    }
  } else if (m.type === 'gigs') {
    if (G._pickup) {
      if (checkPickup(G, G._pickup)) G._pickup = null;
    }
    const done = G.missionGigs.taxi && G.missionGigs.vigilante && G.missionGigs.pickup;
    if (done && distTo(m.target.x, m.target.z) < 9) {
      completeMission(G);
    } else if (done) {
      G.waypoint = { x: m.target.x, z: m.target.z, label: 'REPORT TO THE NEON STRIP' };
    }
  } else if (m.type === 'final') {
    if (distTo(m.target.x, m.target.z) < 9) {
      if (m.id === 12) despawnDante(G);
      completeMission(G);
    }
  }
}

export function failMission(G, reason) {
  G.missionActive = false;
  G.toast = `MISSION FAILED: ${reason} — retrying ${currentMission(G).name}.`;
  G.toastUntil = G.time + 4;
  clearPolice(G);
  G.wanted = 0;
  setTimeout(() => {
    if (G.mode === 'playing') startMission(G, G.missionIndex);
  }, 2000);
}

export function objectiveText(G) {
  const m = currentMission(G);
  if (!m) return 'Story complete — free roam Solara Bay!';
  if (!G.missionActive) return `${m.name} — starting…`;
  const d = G.waypoint ? Math.round(Math.hypot(G.waypoint.x - G.player.x, G.waypoint.z - G.player.z)) : 0;
  const label = G.waypoint ? G.waypoint.label : m.name;
  let extra = '';
  if (m.type === 'crate') extra = ` — crates ${G.missionCrates}/${m.count}`;
  if (m.type === 'crew') extra = ` — guards down ${G.missionGuardsDown}/${m.count}`;
  if (m.type === 'race') extra = ` — checkpoint ${G.missionCheckpoint + 1}/${G.missionCheckpoints.length}`;
  if (m.type === 'gigs') {
    const g = G.missionGigs;
    extra = ` — taxi ${g.taxi ? '✓' : '✗'} · vigilante ${g.vigilante ? '✓' : '✗'} · pickup ${g.pickup ? '✓' : '✗'}`;
  }
  if (m.time) extra += ` — ${Math.ceil(G.missionTimer)}s left`;
  return `${m.name}: ${label} — ${d}m${extra}`;
}

function showEnding(G) {
  const el = document.getElementById('ending-screen');
  if (!el) return;
  el.querySelector('.ending-title').textContent = 'QUEEN OF SOLARA';
  el.querySelector('.ending-body').textContent =
    `Mara Vale paid the harbor debt, kept her crew and took the crown. Final cash: $${G.cash}. ` +
    `Respect: ${G.respect}. Caches: ${G.cachesFound}/10. Free roam continues — Solara Bay is yours.`;
  el.classList.remove('hidden');
}

export function saveProgress(G) {
  try {
    const save = {
      cash: G.cash,
      respect: G.respect,
      cachesFound: G.cachesFound,
      upgrades: G.upgrades,
      missionIndex: G.missionIndex,
      weapons: G.weapons,
    };
    localStorage.setItem('solara-bay-v3-save', JSON.stringify(save));
  } catch (err) {
    // Storage may be unavailable; the game still plays.
  }
}
