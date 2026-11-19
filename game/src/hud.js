// Solara Bay — HUD: cash, health, stars, mission banner, speed, ammo,
// weapon, radio, NOS, respect bar, crew indicator, minimap canvas,
// plus title / pause / shop / wheel / busted / ending overlays.

import { MISSIONS } from './config.js';
import { rankFor } from './state.js';
import { respectProgress } from './respect.js';
import { missionWaypoint, currentMission } from './missions.js';
import { shopLines } from './shop.js';

export function createHud(document, state, radio) {
  const root = document.createElement('div');
  root.id = 'hud';
  document.body.appendChild(root);

  const el = (id, cls, parent) => {
    const d = document.createElement('div');
    d.id = id;
    if (cls) d.className = cls;
    (parent || root).appendChild(d);
    return d;
  };

  const topLeft = el('hud-topleft', 'hud-box');
  const cashEl = el('hud-cash', '', topLeft);
  const healthEl = el('hud-health', '', topLeft);
  const armorEl = el('hud-armor', '', topLeft);
  const starsEl = el('hud-stars', '', topLeft);
  const respectEl = el('hud-respect', '', topLeft);

  const topRight = el('hud-topright', 'hud-box');
  const radioEl = el('hud-radio', '', topRight);
  const songEl = el('hud-song', '', topRight);
  const cacheEl = el('hud-cache', '', topRight);
  const crewEl = el('hud-crew', '', topRight);

  const bannerEl = el('hud-banner', '');
  const objectiveEl = el('hud-objective', 'hud-box');
  const timerEl = el('hud-timer', '');
  const msgEl = el('hud-message', '');
  const bottomLeft = el('hud-bottomleft', 'hud-box');
  const weaponEl = el('hud-weapon', '', bottomLeft);
  const ammoEl = el('hud-ammo', '', bottomLeft);
  const speedEl = el('hud-speed', '', bottomLeft);
  const nosEl = el('hud-nos', '', bottomLeft);
  const promptEl = el('hud-prompt', '');

  const map = document.createElement('canvas');
  map.id = 'minimap';
  map.width = 190;
  map.height = 190;
  root.appendChild(map);

  // overlays live on document.body (not inside #hud, which hides on the title screen)
  const titleEl = el('title-screen', 'overlay', document.body);
  const pauseEl = el('pause-screen', 'overlay', document.body);
  const shopEl = el('shop-screen', 'overlay', document.body);
  const wheelEl = el('wheel-screen', 'overlay', document.body);
  const endEl = el('end-screen', 'overlay', document.body);

  const hud = {
    root, cashEl, healthEl, armorEl, starsEl, respectEl, radioEl, songEl,
    cacheEl, crewEl, bannerEl, objectiveEl, timerEl, msgEl, weaponEl,
    ammoEl, speedEl, nosEl, promptEl, map, titleEl, pauseEl, shopEl,
    wheelEl, endEl, state, radio,
  };
  return hud;
}

function drawMinimap(hud, ctx) {
  const map = hud.map;
  const g = map.getContext('2d');
  const S = 190;
  const toMap = (x, z) => [S / 2 + (x / 155) * (S / 2), S / 2 + (z / 155) * (S / 2)];
  g.fillStyle = '#0d2b3d';
  g.fillRect(0, 0, S, S);
  g.fillStyle = '#3f7a3a';
  g.fillRect(6, 6, S - 12, S - 12);
  // roads
  g.strokeStyle = '#3a3a40';
  g.lineWidth = 4;
  for (let i = -150; i <= 150; i += 30) {
    const [x1, y1] = toMap(i, -150);
    const [x2, y2] = toMap(i, 150);
    g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
    const [x3, y3] = toMap(-150, i);
    const [x4, y4] = toMap(150, i);
    g.beginPath(); g.moveTo(x3, y3); g.lineTo(x4, y4); g.stroke();
  }
  // lighthouse
  const [lx, ly] = toMap(0, -138);
  g.fillStyle = '#fff2a0';
  g.beginPath(); g.arc(lx, ly, 4, 0, Math.PI * 2); g.fill();
  // garage
  const [gx, gy] = toMap(-52, -52);
  g.fillStyle = '#ff6a00';
  g.fillRect(gx - 4, gy - 4, 8, 8);
  // waypoint
  const wp = ctx.waypoint;
  if (wp) {
    const [wx, wy] = toMap(wp.x, wp.z);
    g.fillStyle = '#ffd700';
    g.beginPath(); g.arc(wx, wy, 5, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#ffd700';
    g.beginPath(); g.arc(wx, wy, 9, 0, Math.PI * 2); g.stroke();
  }
  // taxi / vigilante markers
  if (ctx.taxi) {
    const t = ctx.taxi.passenger ? ctx.taxi.drop : ctx.taxi.pickup;
    const [tx, ty] = toMap(t.x, t.z);
    g.fillStyle = '#00e5ff';
    g.fillRect(tx - 4, ty - 4, 8, 8);
  }
  if (ctx.vigilante) {
    const [vx, vy] = toMap(ctx.vigilante.x, ctx.vigilante.z);
    g.fillStyle = '#ff2222';
    g.beginPath(); g.arc(vx, vy, 5, 0, Math.PI * 2); g.fill();
  }
  // police
  g.fillStyle = '#2266ff';
  for (const c of ctx.policeCars || []) {
    const [px, py] = toMap(c.mesh.position.x, c.mesh.position.z);
    g.beginPath(); g.arc(px, py, 3.5, 0, Math.PI * 2); g.fill();
  }
  // helicopter
  if (ctx.heli) {
    const [hx, hy] = toMap(ctx.heli.x, ctx.heli.z);
    g.fillStyle = '#ffffff';
    g.font = 'bold 13px sans-serif';
    g.fillText('H', hx - 4, hy + 5);
  }
  // Dante
  if (ctx.dante) {
    const [dx, dy] = toMap(ctx.dante.x, ctx.dante.z);
    g.fillStyle = '#ffd700';
    g.font = 'bold 13px sans-serif';
    g.fillText('D', dx - 4, dy + 5);
  }
  // player arrow
  const [px, py] = toMap(ctx.player.x, ctx.player.z);
  g.save();
  g.translate(px, py);
  g.rotate(-ctx.angle + Math.PI);
  g.fillStyle = '#ffffff';
  g.beginPath();
  g.moveTo(0, -7); g.lineTo(5, 6); g.lineTo(-5, 6); g.closePath();
  g.fill();
  g.restore();
}

export function updateHud(hud, ctx) {
  const s = hud.state;
  const mission = currentMission(s);
  hud.cashEl.textContent = `$${s.cash.toLocaleString()}`;
  const hpPct = Math.max(0, s.health);
  hud.healthEl.textContent = `HEALTH ${Math.round(hpPct)}`;
  hud.healthEl.style.color = hpPct > 50 ? '#7cff00' : hpPct > 25 ? '#ffaa00' : '#ff3333';
  hud.armorEl.textContent = s.armor > 0 ? `ARMOR ${Math.round(s.armor)}` : '';
  let stars = '';
  for (let i = 0; i < 5; i++) stars += i < s.wanted ? '★' : '☆';
  hud.starsEl.textContent = stars;
  const rp = respectProgress(s);
  hud.respectEl.textContent = `RESPECT ${rp.rank} ${Math.round(rp.pct * 100)}%`;
  hud.radioEl.textContent = `♪ ${hud.radio.current().name}`;
  hud.songEl.textContent = hud.radio.song();
  hud.cacheEl.textContent = `CACHES ${s.caches}/10`;
  hud.crewEl.textContent = s.danteActive ? 'DANTE — CREW ★' : '';
  hud.crewEl.style.color = '#ffd700';

  if (s.bannerTimer > 0) {
    hud.bannerEl.textContent = s.banner;
    hud.bannerEl.style.display = 'block';
  } else {
    hud.bannerEl.style.display = 'none';
  }
  if (mission && s.missionActive) {
    const wp = missionWaypoint(s, ctx.missions);
    const d = Math.round(Math.hypot(s.playerPos.x - wp.x, s.playerPos.z - wp.z));
    hud.objectiveEl.textContent = `MISSION ${mission.id}/12 ${mission.name} — ${wp.label} · ${d}m · $${mission.reward}`;
    hud.objectiveEl.style.display = 'block';
  } else if (mission) {
    hud.objectiveEl.textContent = `NEXT: MISSION ${mission.id}/12 ${mission.name} — press M to start · $${mission.reward}`;
    hud.objectiveEl.style.display = 'block';
  } else {
    hud.objectiveEl.textContent = 'ALL 12 MISSIONS COMPLETE — free roam Solara Bay';
    hud.objectiveEl.style.display = 'block';
  }
  if (s.missionTimer > 0 && s.missionActive) {
    hud.timerEl.textContent = `⏱ ${Math.ceil(s.missionTimer)}s`;
    hud.timerEl.style.display = 'block';
  } else {
    hud.timerEl.style.display = 'none';
  }
  if (s.messageTimer > 0) {
    hud.msgEl.textContent = s.message;
    hud.msgEl.style.display = 'block';
  } else {
    hud.msgEl.style.display = 'none';
  }
  const w = s.weapons[s.weaponIndex];
  hud.weaponEl.textContent = `WEAPON: ${w.name}  [${s.weaponIndex + 1}/4]`;
  hud.ammoEl.textContent = `AMMO ${w.ammoLeft}  (R reload · hold TAB wheel)`;
  hud.speedEl.textContent = s.onFoot
    ? 'ON FOOT — WASD move · Shift run · E steal car'
    : `SPEED ${Math.round(Math.abs(s.carSpeed) * 3.2)} km/h${s.car && s.car.damage ? ` · CAR ${Math.round(100 - s.car.damage)}%` : ''}`;
  hud.nosEl.textContent = s.onFoot ? '' : `NOS ${Math.round(s.nos)}% (hold Shift)${s.boosting ? ' — BOOST!' : ''}`;
  hud.promptEl.textContent = ctx.prompt || '';
  hud.promptEl.style.display = ctx.prompt ? 'block' : 'none';

  drawMinimap(hud, {
    waypoint: mission && s.missionActive ? missionWaypoint(s, ctx.missions) : null,
    taxi: s.taxi,
    vigilante: s.vigilante,
    policeCars: ctx.police ? ctx.police.cars : [],
    heli: ctx.heliPos,
    dante: s.danteActive ? s.dantePos : null,
    player: s.playerPos,
    angle: s.playerAngle,
  });

  // overlays by screen
  hud.titleEl.style.display = s.screen === 'title' ? 'flex' : 'none';
  hud.pauseEl.style.display = s.screen === 'paused' ? 'flex' : 'none';
  hud.shopEl.style.display = s.shopOpen ? 'flex' : 'none';
  hud.wheelEl.style.display = s.wheelOpen ? 'flex' : 'none';
  hud.endEl.style.display = s.screen === 'ended' || s.screen === 'busted' ? 'flex' : 'none';
  hud.root.style.display = s.screen === 'title' ? 'none' : 'block';
  if (s.screen === 'title') hud.titleEl.style.display = 'flex';
}

export function renderTitle(hud) {
  const s = hud.state;
  const mission = currentMission(s);
  const list = MISSIONS.map((mi) => {
    const done = s.missionDone.includes(mi.id);
    const locked = mi.id > s.missionIndex + 1;
    return `<div class="mission-row ${done ? 'done' : ''} ${locked ? 'locked' : ''}">${done ? '✓' : locked ? '🔒' : '○'} ${mi.id}. ${mi.name} — $${mi.reward}</div>`;
  }).join('');
  hud.titleEl.innerHTML = `
    <div class="panel">
      <h1>SOLARA BAY</h1>
      <p class="tagline">island-city crime game — 12 story missions, 5-star police and helicopter chases, crew and respect ranks, garage upgrades, car radio, safehouse saves</p>
      <p class="rank-line">Respect rank: <b>${rankFor(s.respect)}</b> · Cash $${s.cash} · Missions ${s.missionDone.length}/12</p>
      <div class="buttons">
        <button id="btn-start">▶ START</button>
        <button id="btn-continue">CONTINUE</button>
      </div>
      <div class="mission-list">${list}</div>
      <p class="controls">WASD move / drive · Mouse orbit camera · E steal / exit car · Space brake · Shift run / NOS boost<br>
      1-4 weapons · Tab weapon wheel · R reload · Q radio · F shop at garage · M start mission · Esc pause<br>
      Click a mission above to select it, then START.</p>
      <p class="hero">Mara Vale owes the harbor crew. One week. Twelve jobs. Own the island.</p>
    </div>`;
  hud.titleEl.querySelector('#btn-start').onclick = () => { hud.onStart && hud.onStart(false); };
  hud.titleEl.querySelector('#btn-continue').onclick = () => { hud.onStart && hud.onStart(true); };
  hud.titleEl.querySelectorAll('.mission-row').forEach((row, i) => {
    row.onclick = () => {
      if (MISSIONS[i].id <= s.missionIndex + 1) s.selectedMission = i;
    };
  });
}

export function renderPause(hud) {
  hud.pauseEl.innerHTML = `
    <div class="panel">
      <h2>PAUSED</h2>
      <p>Cash $${hud.state.cash} · Respect ${rankFor(hud.state.respect)} · Missions ${hud.state.missionDone.length}/12</p>
      <div class="buttons">
        <button id="btn-resume">RESUME</button>
        <button id="btn-save">SAVE GAME</button>
        <button id="btn-quit">QUIT TO TITLE</button>
      </div>
      <p class="controls">Esc resume · Missions, radio, shop and saves all persist.</p>
    </div>`;
  hud.pauseEl.querySelector('#btn-resume').onclick = () => { hud.onResume && hud.onResume(); };
  hud.pauseEl.querySelector('#btn-save').onclick = () => { hud.onSave && hud.onSave(); };
  hud.pauseEl.querySelector('#btn-quit').onclick = () => { hud.onQuit && hud.onQuit(); };
}

export function renderShop(hud, lastResult) {
  const lines = shopLines(hud.state).map((l) => `<div class="shop-line">${l}</div>`).join('');
  hud.shopEl.innerHTML = `
    <div class="panel">
      <h2>SAFEHOUSE SHOP</h2>
      <p id="shop-cash">Cash $${hud.state.cash} · Respect ${rankFor(hud.state.respect)}</p>
      ${lines}
      <div class="buttons">
        <button data-buy="armor">Armor $300</button>
        <button data-buy="ammo">Ammo $150</button>
        <button data-buy="repair">Repair $200</button>
      </div>
      <div class="buttons">
        <button data-up="tires">Tires $400</button>
        <button data-up="armor">Plating $600</button>
        <button data-up="engine">Engine $800</button>
      </div>
      <p id="shop-result">${lastResult || 'F or Esc to close'}</p>
    </div>`;
  hud.shopEl.querySelectorAll('[data-buy]').forEach((b) => {
    b.onclick = () => { hud.onBuy && hud.onBuy(b.dataset.buy); };
  });
  hud.shopEl.querySelectorAll('[data-up]').forEach((b) => {
    b.onclick = () => { hud.onBuyUpgrade && hud.onBuyUpgrade(b.dataset.up); };
  });
}

export function updateShop(hud, resultText) {
  const cashEl = hud.shopEl.querySelector('#shop-cash');
  if (cashEl) cashEl.textContent = `Cash $${hud.state.cash} · Respect ${rankFor(hud.state.respect)}`;
  const resEl = hud.shopEl.querySelector('#shop-result');
  if (resEl) resEl.textContent = resultText;
}

export function renderWheel(hud) {
  const s = hud.state;
  const items = s.weapons.map((w, i) => `
    <div class="wheel-item ${i === s.weaponIndex ? 'selected' : ''}">
      <b>[${i + 1}] ${w.name}</b><br>Ammo ${w.ammoLeft} · DMG ${w.damage}
    </div>`).join('');
  hud.wheelEl.innerHTML = `<div class="panel"><h2>WEAPON WHEEL</h2><div class="wheel">${items}</div><p>Release Tab or press 1–4 to select · R reloads</p></div>`;
}

export function renderEnd(hud) {
  const s = hud.state;
  if (s.screen === 'busted') {
    hud.endEl.innerHTML = `<div class="panel"><h2>BUSTED</h2><p>${s.bustedReason || 'The police got you.'}</p><p>Cash kept: $${s.cash}</p><div class="buttons"><button id="btn-retry">RETRY</button></div></div>`;
    hud.endEl.querySelector('#btn-retry').onclick = () => { hud.onRetry && hud.onRetry(); };
  } else {
    hud.endEl.innerHTML = `<div class="panel"><h2>${s.missionIndex >= 12 ? 'QUEEN OF SOLARA' : 'KING OF SOLARA'}</h2><p>${s.endingText}</p><p>Cash $${s.cash} · Respect ${rankFor(s.respect)} · Kills ${s.kills} · Cars stolen ${s.carsStolen}</p><div class="buttons"><button id="btn-free">FREE ROAM</button></div></div>`;
    hud.endEl.querySelector('#btn-free').onclick = () => { hud.onFreeRoam && hud.onFreeRoam(); };
  }
}
