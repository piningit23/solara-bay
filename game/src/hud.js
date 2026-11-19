// HUD: cash, health, wanted stars, mission banner, speed, ammo, weapon,
// radio station, NOS meter, timer, respect bar with rank name, crew indicator,
// and a live 2D top-down minimap canvas.

import { WEAPONS, STATIONS, MISSIONS } from './config.js';
import { rankFor, respectProgress } from './respect.js';
import { objectiveText, missionName } from './missions.js';

export function buildHud(G) {
  G.hud = {
    cash: document.getElementById('hud-cash'),
    health: document.getElementById('hud-health-fill'),
    healthText: document.getElementById('hud-health-text'),
    stars: document.getElementById('hud-stars'),
    mission: document.getElementById('hud-mission'),
    speed: document.getElementById('hud-speed'),
    ammo: document.getElementById('hud-ammo'),
    weapon: document.getElementById('hud-weapon'),
    radio: document.getElementById('hud-radio'),
    ticker: document.getElementById('hud-ticker'),
    nos: document.getElementById('hud-nos-fill'),
    timer: document.getElementById('hud-timer'),
    respect: document.getElementById('hud-respect-fill'),
    respectText: document.getElementById('hud-respect-text'),
    crew: document.getElementById('hud-crew'),
    toast: document.getElementById('hud-toast'),
    prompt: document.getElementById('hud-prompt'),
    minimap: document.getElementById('minimap'),
    wheel: document.getElementById('weapon-wheel'),
    caches: document.getElementById('hud-caches'),
  };
}

export function updateHud(G) {
  const h = G.hud;
  if (!h) return;
  h.cash.textContent = `$${Math.floor(G.cash)}`;
  h.health.style.width = `${Math.max(0, G.health)}%`;
  h.healthText.textContent = `HP ${Math.max(0, Math.ceil(G.health))}`;
  let stars = '';
  for (let i = 0; i < 5; i++) stars += i < G.wanted ? '★' : '☆';
  h.stars.textContent = stars;
  h.stars.style.color = G.wanted >= 3 ? '#ff4444' : '#ffd23f';
  h.mission.textContent = objectiveText(G);
  const speed = G.car ? Math.abs(G.car.speed) * 3.6 : 0;
  h.speed.textContent = G.car ? `${Math.round(speed)} km/h` : '';
  const def = WEAPONS[G.weaponIndex];
  const slot = G.weapons[G.weaponIndex];
  h.weapon.textContent = def.name;
  h.ammo.textContent = `AMMO ${slot.ammo}/${slot.reserve}`;
  h.radio.textContent = G.radio ? G.radio.station().name : STATIONS[0].name;
  h.ticker.textContent = G.radio ? G.radio.ticker : '';
  h.nos.style.width = `${Math.round(G.nos)}%`;
  h.timer.textContent = G.missionActive && G.missionTimer > 0
    ? `⏱ ${Math.ceil(G.missionTimer)}s` : '';
  const rank = rankFor(G.respect);
  h.respect.style.width = `${Math.round(respectProgress(G) * 100)}%`;
  h.respectText.textContent = `${rank.name} · ${G.respect} respect`;
  h.crew.style.display = G.dante && G.dante.active ? 'block' : 'none';
  h.caches.textContent = `CACHES ${G.cachesFound}/10`;
  // Toast message.
  if (G.time < G.toastUntil && G.toast) {
    h.toast.textContent = G.toast;
    h.toast.style.opacity = '1';
  } else {
    h.toast.style.opacity = '0';
  }
  // Context prompt near the garage / near a car.
  let prompt = '';
  const garageD = Math.hypot(G.player.x + 140, G.player.z + 140);
  if (garageD < 16 && G.player.onFoot) prompt = 'F — SHOP · garage clears wanted faster';
  else if (G.player.onFoot && nearestCarDistance(G) < 4) prompt = 'E — STEAL CAR';
  else if (G.car) prompt = 'E — EXIT CAR · Shift — NOS · Q — RADIO · Tab — WEAPONS';
  else prompt = 'WASD — MOVE · Shift — RUN · E — STEAL CAR · Q — RADIO';
  h.prompt.textContent = prompt;
  // Weapon wheel overlay.
  h.wheel.style.display = G.wheelOpen ? 'flex' : 'none';
  if (G.wheelOpen) {
    const items = h.wheel.querySelectorAll('.wheel-item');
    items.forEach((item, i) => {
      const slotW = G.weapons[i];
      item.textContent = `${i + 1} · ${WEAPONS[i].name} — ${slotW.ammo}/${slotW.reserve}`;
      item.classList.toggle('selected', i === G.weaponIndex);
    });
  }
  drawMinimap(G);
}

function nearestCarDistance(G) {
  let best = Infinity;
  for (const car of G.parkedCars) {
    if (car.taken) continue;
    best = Math.min(best, Math.hypot(car.x - G.player.x, car.z - G.player.z));
  }
  return best;
}

export function drawMinimap(G) {
  const canvas = G.hud.minimap;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const scale = W / 440;
  const toX = (x) => (x + 220) * scale;
  const toY = (z) => (z + 220) * scale;
  ctx.fillStyle = '#123a5c';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#5d7d4a';
  ctx.fillRect(toX(-200), toY(-200), 400 * scale, 400 * scale);
  ctx.strokeStyle = '#3a3f46';
  ctx.lineWidth = 2;
  const streets = [-160, -120, -80, -40, 0, 40, 80, 120, 160];
  for (const s of streets) {
    ctx.beginPath(); ctx.moveTo(toX(s), 0); ctx.lineTo(toX(s), H); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, toY(s)); ctx.lineTo(W, toY(s)); ctx.stroke();
  }
  // Lighthouse.
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(toX(0), toY(-192), 3, 0, Math.PI * 2); ctx.fill();
  // Waypoint.
  if (G.waypoint) {
    ctx.fillStyle = '#ffd23f';
    ctx.beginPath(); ctx.arc(toX(G.waypoint.x), toY(G.waypoint.z), 5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#ffd23f';
    ctx.beginPath(); ctx.arc(toX(G.waypoint.x), toY(G.waypoint.z), 8, 0, Math.PI * 2); ctx.stroke();
  }
  // Traffic (gray), police (blue), helicopter (H), crew (D), taxi (T).
  ctx.fillStyle = '#cccccc';
  for (const car of G.traffic) {
    ctx.fillRect(toX(car.mesh.position.x) - 1.5, toY(car.mesh.position.z) - 1.5, 3, 3);
  }
  ctx.fillStyle = '#3f8cff';
  for (const cop of G.policeCars) {
    ctx.beginPath(); ctx.arc(toX(cop.x), toY(cop.z), 3.5, 0, Math.PI * 2); ctx.fill();
  }
  if (G.heli) {
    ctx.fillStyle = '#ff4444';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('H', toX(G.heli.mesh.position.x) - 4, toY(G.heli.mesh.position.z) + 4);
  }
  if (G.dante) {
    ctx.fillStyle = '#7cff4f';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('D', toX(G.dante.x) - 4, toY(G.dante.z) + 4);
  }
  if (G.taxi && !G.taxi.pickedUp) {
    ctx.fillStyle = '#ffd23f';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('T', toX(G.taxi.x) - 4, toY(G.taxi.z) + 4);
  }
  if (G.bounty) {
    ctx.fillStyle = '#ff2222';
    ctx.beginPath(); ctx.arc(toX(G.bounty.x), toY(G.bounty.z), 4, 0, Math.PI * 2); ctx.fill();
  }
  // Player: white triangle pointing along the heading.
  const px = toX(G.player.x);
  const py = toY(G.player.z);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(px + Math.sin(G.player.heading) * 7, py + Math.cos(G.player.heading) * 7);
  ctx.lineTo(px + Math.sin(G.player.heading + 2.5) * 5, py + Math.cos(G.player.heading + 2.5) * 5);
  ctx.lineTo(px + Math.sin(G.player.heading - 2.5) * 5, py + Math.cos(G.player.heading - 2.5) * 5);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#000000';
  ctx.stroke();
}

export function setTitleRank(G) {
  const el = document.getElementById('title-rank');
  if (el) el.textContent = `Rank: ${rankFor(G.respect).name} · ${G.respect} respect · $${Math.floor(G.cash)}`;
}

export function refreshMissionSelect(G) {
  const list = document.getElementById('mission-list');
  if (!list) return;
  list.innerHTML = '';
  MISSIONS.forEach((m, i) => {
    const unlocked = i <= G.missionIndex;
    const btn = document.createElement('button');
    btn.className = 'mission-item' + (unlocked ? '' : ' locked');
    btn.textContent = `${m.id}. ${m.name} — $${m.reward}${unlocked ? '' : ' (locked)'}`;
    if (unlocked) {
      btn.addEventListener('click', () => {
        document.getElementById('title-screen').classList.add('hidden');
        if (G.onSelectMission) G.onSelectMission(i);
      });
    }
    list.appendChild(btn);
  });
}
