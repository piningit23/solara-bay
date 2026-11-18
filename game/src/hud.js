import { distance, GARAGE } from './config.js';
import { STATIONS } from './radio.js';

export function createHud(state) {
  const root = document.querySelector('#hud');
  const objective = document.querySelector('#objective');
  const status = document.querySelector('#status');
  const telemetry = document.querySelector('#telemetry');
  const radio = document.querySelector('#radio');
  const prompt = document.querySelector('#prompt');
  const toast = document.querySelector('#toast');
  const minimap = document.querySelector('#minimap');
  const ctx = minimap.getContext('2d');
  let toastTimer = 0;
  function message(text) { toast.textContent = text; toastTimer = 3; }
  function mapPoint(x, z) { return { x: 115 + x * .58, y: 115 + z * .58 }; }
  function drawMap() {
    ctx.fillStyle = '#123f47'; ctx.fillRect(0, 0, 230, 230);
    ctx.fillStyle = '#36a2a1'; ctx.fillRect(3, 3, 224, 224);
    ctx.fillStyle = '#b8b18d'; ctx.fillRect(14, 14, 202, 202);
    ctx.strokeStyle = '#52656a'; ctx.lineWidth = 6;
    for (let n = -144; n <= 144; n += 72) { const p = mapPoint(n, 0); ctx.beginPath(); ctx.moveTo(p.x, 14); ctx.lineTo(p.x, 216); ctx.stroke(); const q = mapPoint(0, n); ctx.beginPath(); ctx.moveTo(14, q.y); ctx.lineTo(216, q.y); ctx.stroke(); }
    ctx.strokeStyle = '#f0d9a5'; ctx.lineWidth = 2;
    for (let n = -144; n <= 144; n += 72) { const p = mapPoint(n, 0); ctx.beginPath(); ctx.moveTo(p.x - 5, 14); ctx.lineTo(p.x - 5, 216); ctx.stroke(); const q = mapPoint(0, n); ctx.beginPath(); ctx.moveTo(14, q.y - 5); ctx.lineTo(216, q.y - 5); ctx.stroke(); }
    for (const car of state.driving.traffic) { const p = mapPoint(car.x, car.z); ctx.fillStyle = '#f1db84'; ctx.fillRect(p.x - 2, p.y - 2, 4, 4); }
    for (const car of state.police.cars) { const p = mapPoint(car.x, car.z); ctx.fillStyle = '#ff6153'; ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2); ctx.fill(); }
    if (state.helicopter.active) { const p = mapPoint(state.helicopter.root.position.x, state.helicopter.root.position.z); ctx.fillStyle = '#ffe674'; ctx.font = 'bold 14px Arial'; ctx.fillText('H', p.x - 5, p.y + 5); }
    const waypoint = state.missions.position(); if (waypoint) { const p = mapPoint(waypoint.x, waypoint.z); ctx.strokeStyle = '#f6ce72'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p.x, p.y, 7 + Math.sin(state.time * 5) * 2, 0, Math.PI * 2); ctx.stroke(); }
    const player = state.player.car || state.player; const p = mapPoint(player.x, player.z); ctx.fillStyle = '#73f2c4'; ctx.beginPath(); ctx.arc(p.x, p.y, 6, 0, Math.PI * 2); ctx.fill();
  }
  function update(dt) {
    root.hidden = false;
    const mission = state.missions.current();
    const waypoint = state.missions.position();
    const p = state.player.car || state.player;
    const d = waypoint ? Math.round(distance(p, waypoint)) : 0;
    objective.innerHTML = `<div class="eyebrow">${String(state.missions.index + 1).padStart(2, '0')} / 08 &nbsp; ${mission.type.toUpperCase()}</div><h2>${mission.name}</h2><p>${mission.objective}</p><div class="distance">◎ ${d}M TO WAYPOINT ${mission.type === 'race' ? `· CP ${state.missions.checkpoint}/${state.missions.checkpointCount}` : ''}</div>`;
    status.innerHTML = `<div class="stars">${'★'.repeat(state.wanted)}<span style="opacity:.2">${'★'.repeat(5 - state.wanted)}</span></div><div class="cash">$${state.player.cash.toLocaleString()}</div><div class="health"><i style="width:${state.player.health}%"></i></div><div class="micro">HEALTH ${Math.ceil(state.player.health)} / ARMOR ${Math.ceil(state.player.armor)}</div>`;
    const weapon = ['PISTOL', 'SCATTERGUN', 'RAPID SMG'][state.player.weapon];
    telemetry.innerHTML = state.player.car ? `<div class="speed">${Math.round(state.player.speed)}<small> KM/H</small></div><div class="micro">${state.player.car.health > 0 ? 'VEHICLE CONDITION' : 'DISABLED'}</div><div class="meter"><i style="width:${state.player.car.health}%"></i></div><div class="micro">NOS BOOST</div><div class="meter"><i style="width:${state.player.car.nos}%"></i></div>` : `<div class="weapon">${weapon}</div><div class="micro">AMMO ${state.player.ammo[state.player.weapon]} / ${[12, 6, 32][state.player.weapon]}</div><div class="meter"><i style="width:${state.player.ammo[state.player.weapon] / [12, 6, 32][state.player.weapon] * 100}%"></i></div>`;
    radio.innerHTML = `<strong>◉ ${STATIONS[state.radio.index].name}</strong><small>${STATIONS[state.radio.index].song} &nbsp;·&nbsp; Q TUNE</small>`;
    const atGarage = Math.hypot(p.x - GARAGE.x, p.z - GARAGE.z) < 20;
    prompt.textContent = atGarage ? `F — SHOP &nbsp; · &nbsp; ${state.player.car ? 'E — EXIT' : 'E — ENTER VEHICLE'}` : state.player.car ? 'E — EXIT VEHICLE' : 'E — STEAL / ENTER VEHICLE';
    drawMap();
    toastTimer -= dt;
    if (toastTimer <= 0) toast.textContent = '';
    document.querySelector('#vignette').style.opacity = state.damageFlash * 1.6;
    document.querySelector('#feedback').style.opacity = Math.min(1, state.feedbackTimer * 4);
  }
  return { update, message };
}

export function titleMenu(onStart, onContinue, onSelect) {
  const menu = document.querySelector('#menu');
  menu.innerHTML = `<div class="menu-content"><div class="title-kicker">MARA VALE PRESENTS</div><div class="title">SOLARA<span>BAY</span></div><div class="full-title">SOLARA BAY: island-city crime game — 8 story missions, 5-star police and helicopter chases, car radio, safehouse saves</div><div class="features"><div><b>08</b><small>STORY MISSIONS</small></div><div><b>05</b><small>HEAT LEVELS</small></div><div><b>03</b><small>RADIO STATIONS</small></div><div><b>∞</b><small>ISLAND NIGHTS</small></div></div><p class="story">A sunlit island. A harbor debt. Seven days to make Solara remember the name Mara Vale.</p><div class="buttons"><button class="primary" id="start">START NEW RUN</button><button id="continue">CONTINUE</button><button id="missions">MISSION SELECT</button></div><div class="key-guide"><b>CONTROLS</b> &nbsp; WASD move/drive · mouse orbit · Shift run/NOS · E enter/exit · click fire · 1/2/3 weapons · R reload · Q radio · Esc pause<br><b>V2 SYSTEMS</b> &nbsp; helicopter pursuit · flashing roadblocks · safehouse shop · synthesized radio · island ring race</div></div>`;
  menu.querySelector('#start').onclick = () => { menu.innerHTML = ''; onStart(); };
  menu.querySelector('#continue').onclick = () => { menu.innerHTML = ''; onContinue(); };
  menu.querySelector('#missions').onclick = onSelect;
  return menu;
}
