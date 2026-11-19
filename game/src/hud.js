// Solara Bay — HUD: cash, health, wanted stars, mission banner, speed,
// ammo, weapon, radio station, NOS meter, mission timer, respect bar with
// rank name, crew indicator, cache counter, and the live 2D minimap canvas.

import { G } from './state.js';
import { CITY, GARAGE, LIGHTHOUSE } from './config.js';
import { currentRank, respectProgress, nextRank } from './respect.js';
import { currentWeapon } from './combat.js';
import { stationLabel } from './radio.js';
import { carPos } from './driving.js';

let els = {};
let minimap = null;
let mctx = null;
let objectiveText = '';

export function initHud() {
  els = {
    cash: document.getElementById('hud-cash'),
    health: document.getElementById('hud-health-fill'),
    healthText: document.getElementById('hud-health-text'),
    stars: document.getElementById('hud-stars'),
    mission: document.getElementById('hud-mission-title'),
    objective: document.getElementById('hud-objective'),
    speed: document.getElementById('hud-speed'),
    ammo: document.getElementById('hud-ammo'),
    weapon: document.getElementById('hud-weapon'),
    radio: document.getElementById('hud-radio'),
    ticker: document.getElementById('hud-ticker'),
    nos: document.getElementById('hud-nos-fill'),
    timer: document.getElementById('hud-timer'),
    respectFill: document.getElementById('hud-respect-fill'),
    respectText: document.getElementById('hud-respect-text'),
    crew: document.getElementById('hud-crew'),
    caches: document.getElementById('hud-caches'),
    prompt: document.getElementById('hud-prompt'),
    messages: document.getElementById('hud-messages'),
    wheel: document.getElementById('weapon-wheel'),
    vignette: document.getElementById('damage-vignette'),
  };
  minimap = document.getElementById('minimap');
  if (minimap) mctx = minimap.getContext('2d');
  G.hud.setObjective = (t) => { objectiveText = t; };
}

function starString(n) {
  let s = '';
  for (let i = 0; i < 5; i++) s += i < n ? '★' : '☆';
  return s;
}

export function updateHud(dt) {
  if (!els.cash) return;
  els.cash.textContent = '$' + Math.floor(G.cash).toLocaleString('en-US');
  els.health.style.width = Math.max(0, G.health) + '%';
  els.healthText.textContent = 'HP ' + Math.ceil(G.health) + (G.armor > 0 ? '  +' + Math.ceil(G.armor) + ' ARMOR' : '');
  els.stars.textContent = starString(G.wanted);
  els.stars.style.color = G.wanted > 0 ? '#ffd319' : '#888888';
  const def = G.mission ? G.mission.def : null;
  els.mission.textContent = def ? 'MISSION ' + def.id + '/12 — ' + def.title : 'FREE ROAM — Solara Bay';
  els.objective.textContent = objectiveText || (def ? def.brief : 'Explore the island. Missions, fares and caches pay.');
  if (G.car) {
    els.speed.textContent = Math.round(Math.abs(G.car.speed) * 3.6) + ' km/h';
    els.speed.style.display = 'block';
  } else {
    els.speed.style.display = 'none';
  }
  const w = currentWeapon();
  if (w) {
    els.weapon.textContent = w.name.toUpperCase();
    els.ammo.textContent = w.reloading > 0 ? 'RELOADING…' : 'AMMO ' + w.mag + ' / ' + w.ammo;
  }
  els.radio.textContent = '♪ ' + stationLabel();
  els.ticker.textContent = G.station === 0 ? 'Now playing: Sunset Drive — The Palms'
    : G.station === 1 ? 'Now playing: Full Throttle — Neon Coast'
    : 'Now playing: Harbor Lights — Mara\u2019s Theme';
  els.nos.style.width = G.nos + '%';
  els.timer.style.display = G.mission && G.mission.timer > 0 ? 'block' : 'none';
  if (G.mission && G.mission.timer > 0) {
    els.timer.textContent = '⏱ ' + Math.ceil(G.mission.timer) + 's';
  }
  const rank = currentRank();
  const nxt = nextRank();
  els.respectFill.style.width = Math.round(respectProgress() * 100) + '%';
  els.respectText.textContent = 'RESPECT — ' + rank.name.toUpperCase() + '  (' + G.respect + (nxt ? ' / ' + nxt.min : ' MAX') + ')';
  els.crew.style.display = G.crew && G.crew.active ? 'block' : 'none';
  els.caches.textContent = 'CACHES ' + G.cachesFound + '/10';
  // contextual prompt
  let prompt = '';
  if (G.onFoot) {
    const near = G.cars.find((c) => c.kind === 'parked' && !c.stolen &&
      Math.hypot(c.pos.x - G.player.pos.x, c.pos.z - G.player.pos.z) < 5);
    if (near) prompt = 'E — STEAL CAR';
  } else {
    prompt = 'E — EXIT CAR   •   SHIFT — NOS   •   Q — RADIO';
  }
  const pp = carPos();
  if (Math.hypot(pp.x - GARAGE.x, pp.z - GARAGE.z) < 22) {
    prompt = (prompt ? prompt + '   •   ' : '') + 'F — SHOP (garage safehouse)';
  }
  els.prompt.textContent = prompt;
  // messages feed (last 3)
  const recent = G.messages.slice(-3);
  els.messages.innerHTML = recent.map((m) => '<div>' + escapeHtml(m) + '</div>').join('');
  // weapon wheel
  if (els.wheel) {
    els.wheel.style.display = G.wheelOpen ? 'flex' : 'none';
    if (G.wheelOpen) {
      els.wheel.innerHTML = G.weapons.map((ww, i) =>
        '<div class="wheel-slot' + (i === G.weaponIndex ? ' active' : '') + '">' +
        '<b>' + (i + 1) + ' ' + ww.name + '</b><span>' + ww.mag + ' / ' + ww.ammo + '</span></div>'
      ).join('');
    }
  }
  if (els.vignette) els.vignette.style.opacity = G.health < 35 ? String((35 - G.health) / 35 * 0.7) : '0';
  drawMinimap();
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function drawMinimap() {
  if (!mctx) return;
  const S = 180;
  const scale = S / (CITY.half * 2 + 40);
  const toX = (x) => (x + CITY.half + 20) * scale;
  const toY = (z) => (z + CITY.half + 20) * scale;
  mctx.fillStyle = '#0e2a3a';
  mctx.fillRect(0, 0, S, S);
  // island
  mctx.fillStyle = '#274b5e';
  mctx.fillRect(toX(-CITY.half), toY(-CITY.half), CITY.half * 2 * scale, CITY.half * 2 * scale);
  // roads
  mctx.strokeStyle = '#4a4a52';
  mctx.lineWidth = 3;
  for (let c = -CITY.half + 20; c <= CITY.half - 20; c += 40) {
    mctx.beginPath(); mctx.moveTo(toX(-CITY.half), toY(c)); mctx.lineTo(toX(CITY.half), toY(c)); mctx.stroke();
    mctx.beginPath(); mctx.moveTo(toX(c), toY(-CITY.half)); mctx.lineTo(toX(c), toY(CITY.half)); mctx.stroke();
  }
  // garage + lighthouse
  mctx.fillStyle = '#ffd319';
  mctx.fillRect(toX(GARAGE.x) - 3, toY(GARAGE.z) - 3, 6, 6);
  mctx.fillStyle = '#ffffff';
  mctx.beginPath(); mctx.arc(toX(LIGHTHOUSE.x), toY(LIGHTHOUSE.z), 4, 0, Math.PI * 2); mctx.fill();
  // waypoint
  if (G.waypoint) {
    mctx.fillStyle = '#ffd319';
    mctx.beginPath(); mctx.arc(toX(G.waypoint.x), toY(G.waypoint.z), 5, 0, Math.PI * 2); mctx.fill();
    mctx.strokeStyle = '#ffd319'; mctx.lineWidth = 1.5;
    mctx.beginPath(); mctx.arc(toX(G.waypoint.x), toY(G.waypoint.z), 8, 0, Math.PI * 2); mctx.stroke();
  }
  // traffic + parked cars
  mctx.fillStyle = '#9fb8c8';
  for (const c of G.traffic) mctx.fillRect(toX(c.pos.x) - 1.5, toY(c.pos.z) - 1.5, 3, 3);
  // police
  mctx.fillStyle = '#ff3b30';
  for (const c of G.police) {
    mctx.beginPath(); mctx.arc(toX(c.pos.x), toY(c.pos.z), 3.5, 0, Math.PI * 2); mctx.fill();
  }
  // helicopter "H"
  if (G.heli) {
    mctx.fillStyle = '#ff3b30';
    mctx.font = 'bold 11px sans-serif';
    mctx.fillText('H', toX(G.heli.pos.x) - 4, toY(G.heli.pos.z) + 4);
  }
  // crew ally "D"
  if (G.crew) {
    mctx.fillStyle = '#b967ff';
    mctx.font = 'bold 11px sans-serif';
    mctx.fillText('D', toX(G.crew.pos.x) - 4, toY(G.crew.pos.z) + 4);
  }
  // taxi marker
  if (G.taxi) {
    mctx.fillStyle = '#ffe135';
    mctx.beginPath(); mctx.arc(toX(G.taxi.pos.x), toY(G.taxi.pos.z), 4, 0, Math.PI * 2); mctx.fill();
  }
  // player (white triangle)
  const pp = carPos();
  mctx.fillStyle = '#ffffff';
  mctx.beginPath();
  mctx.moveTo(toX(pp.x), toY(pp.z) - 6);
  mctx.lineTo(toX(pp.x) - 4.5, toY(pp.z) + 4);
  mctx.lineTo(toX(pp.x) + 4.5, toY(pp.z) + 4);
  mctx.closePath(); mctx.fill();
}
