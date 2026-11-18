import { GARAGE, LIGHTHOUSE, distance } from './config.js';

export const STORY = [
  { name: 'FIRST WHEELS', story: 'A harbor debt is due in seven days. Mara needs wheels and a place to plan.', objective: 'Steal a parked car and reach Vale Auto safehouse.', type: 'steal', x: GARAGE.x, z: GARAGE.z, reward: 500 },
  { name: 'BAYFRONT DROP', story: 'A sealed package crosses the bayfront. Keep moving; the sirens are already awake.', objective: 'Deliver the package across town with 1-star heat.', type: 'drop', x: 144, z: 144, reward: 900, wanted: 1 },
  { name: 'HARBOR HEIST', story: 'Three cargo crates hold the records that can cancel the debt. The docks are watched.', objective: 'Collect 3 marked crates at the docks. Dock crew are armed.', type: 'crate', x: 165, z: -91, reward: 1500, wanted: 2 },
  { name: 'MIDNIGHT COURIER', story: 'The drop window closes at midnight. Cross the island before the tide turns.', objective: 'Reach the north-side drop before the clock hits zero.', type: 'timed', x: -144, z: -144, reward: 1800, wanted: 2, timer: 100 },
  { name: 'DOCKSIDE PAYBACK', story: 'Four crew members have Mara’s ledger. Get it back, and end the dockside account.', objective: 'Defeat the four armed dock guards and reclaim Mara’s ledger.', type: 'crew', x: 155, z: -108, reward: 2000 },
  { name: 'THE GETAWAY', story: 'The ledger is safe. Now lose the three-star search and get home.', objective: 'Lose 3-star pursuit, then return to the safehouse.', type: 'escape', x: GARAGE.x, z: GARAGE.z, reward: 2200, wanted: 3 },
  { name: 'ISLAND LOOP', story: 'One lap of Solara. Every checkpoint before the timer runs out.', objective: 'Race the island ring road through all checkpoints in order.', type: 'race', x: 0, z: 0, reward: 3000, timer: 110 },
  { name: 'KING OF SOLARA', story: 'One last run to the lighthouse. Mara’s week ends at North Point.', objective: 'Reach the lighthouse with 4-star heat.', type: 'final', x: LIGHTHOUSE.x, z: LIGHTHOUSE.z, reward: 5000, wanted: 4 }
];
const RACE_POINTS = [[0, -160], [150, -144], [160, 0], [144, 150], [0, 160], [-150, 144], [-160, 0], [-144, -150]];
export function createMissions(state) {
  let crateCount = 0;
  let checkpoints = [];
  let checkpoint = 0;
  let timer = 0;
  let activeGuards = [];
  let mission = 0;
  function current() { return STORY[Math.min(mission, STORY.length - 1)]; }
  function start(index = mission) {
    mission = Math.max(0, Math.min(STORY.length - 1, index));
    crateCount = 0;
    checkpoint = 0;
    timer = current().timer || 0;
    state.wanted = Math.max(state.wanted, current().wanted || 0);
    if (current().type === 'crew') {
      activeGuards = [[145, -92], [171, -119], [184, -96], [151, -132]].map(([x, z]) => state.combat.spawnGuard(x, z));
    }
    if (current().type === 'crate') {
      crateCount = 0;
      state.crates?.forEach(crate => crate.mesh.visible = true);
    } else state.crates?.forEach(crate => crate.mesh.visible = false);
    if (current().type === 'race') checkpoints = RACE_POINTS.map(([x, z]) => ({ x, z }));
    state.save();
  }
  function position() {
    const m = current();
    if (m.type === 'race' && checkpoints[checkpoint]) return checkpoints[checkpoint];
    if (m.type === 'crate' && state.crates?.find(crate => crate.mesh.visible)) return state.crates.find(crate => crate.mesh.visible);
    return m;
  }
  function update(dt) {
    if (mission >= STORY.length) return;
    const m = current();
    const p = state.player.car || state.player;
    if (m.type === 'timed' || m.type === 'race') {
      timer -= dt;
      if (timer <= 0) { timer = 0; state.toast('CLOCK RAN OUT — MISSION RESTARTED'); start(mission); return; }
    }
    if (m.type === 'steal' && state.player.car && distance(p, GARAGE) < 13) complete();
    else if (m.type === 'drop' && distance(p, m) < 11) complete();
    else if (m.type === 'crate') {
      const target = position();
      if (target && distance(p, target) < 7) { target.mesh.visible = false; crateCount++; state.audio.effect('pickup'); state.toast(`CARGO SECURED ${crateCount}/3`); if (crateCount >= 3) complete(); }
    } else if (m.type === 'timed' && distance(p, m) < 12) complete();
    else if (m.type === 'crew' && activeGuards.every(g => g.down) && distance(p, m) < 10) complete();
    else if (m.type === 'escape' && state.wanted === 0 && distance(p, GARAGE) < 12) complete();
    else if (m.type === 'race' && distance(p, checkpoints[checkpoint]) < 13) {
      checkpoint++;
      state.audio.effect('pickup');
      state.toast(`CHECKPOINT ${checkpoint}/${checkpoints.length}`);
      if (checkpoint >= checkpoints.length) complete();
    } else if (m.type === 'final' && distance(p, LIGHTHOUSE) < 14) complete(true);
    state.missionTimer = timer;
  }
  function complete(ending = false) {
    state.player.cash += current().reward;
    state.toast(`${current().name} COMPLETE  +$${current().reward.toLocaleString()}`);
    state.audio.effect('pickup');
    mission++;
    state.missionIndex = mission;
    state.unlockedMissions = Math.min(STORY.length, Math.max(state.unlockedMissions, mission + 1));
    state.save();
    if (ending) state.endGame = true;
    else start(mission);
  }
  function onKill(enemy) { if (activeGuards.includes(enemy)) state.toast(`DOCK CREW DOWN / ${Math.max(0, activeGuards.filter(g => !g.down).length - 1)} TO GO`); }
  function select(index) { if (index < state.unlockedMissions) start(index); }
  return { start, update, current, position, onKill, select, get index() { return mission; }, get timer() { return timer; }, get crateCount() { return crateCount; }, get checkpoint() { return checkpoint; }, get checkpointCount() { return checkpoints.length; } };
}
