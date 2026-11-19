// Safehouse shop: open with F at the garage. Buys Armor, Ammo and Car Repair,
// plus the three garage upgrades — each bought once, persistent in the save,
// and locked behind its respect rank.

import { SHOP_ITEMS, UPGRADES, WEAPONS } from './config.js';
import { rankFor } from './respect.js';
import { saveGame } from './save.js';

export function buildShop(G) {
  const panel = document.getElementById('shop-items');
  if (!panel) return;
  panel.innerHTML = '';
  for (const item of SHOP_ITEMS) {
    const row = document.createElement('div');
    row.className = 'shop-row';
    row.innerHTML = `<span>${item.name} — $${item.price}<br><small>${item.desc}</small></span>`;
    const btn = document.createElement('button');
    btn.textContent = 'BUY';
    btn.addEventListener('click', () => buyShopItem(G, item));
    row.appendChild(btn);
    panel.appendChild(row);
  }
  for (const up of UPGRADES) {
    const row = document.createElement('div');
    row.className = 'shop-row upgrade';
    const owned = G.upgrades[up.id];
    const rankOk = rankFor(G.respect).name === up.rank
      || rankIndexOf(up.rank) <= rankIndexOf(rankFor(G.respect).name);
    row.innerHTML = `<span>${up.name} — $${up.price}<br><small>${up.desc} ` +
      `${owned ? '(OWNED)' : rankOk ? '' : `(requires ${up.rank} rank)`}</small></span>`;
    const btn = document.createElement('button');
    btn.textContent = owned ? 'OWNED' : 'BUY';
    btn.disabled = owned || !rankOk;
    btn.addEventListener('click', () => buyUpgrade(G, up));
    row.appendChild(btn);
    panel.appendChild(row);
  }
  const cash = document.getElementById('shop-cash');
  if (cash) cash.textContent = `Cash: $${Math.floor(G.cash)} · Rank: ${rankFor(G.respect).name}`;
}

function rankIndexOf(name) {
  const order = ['Drifter', 'Street', 'Respected', 'Queen of Solara'];
  return order.indexOf(name);
}

function buyShopItem(G, item) {
  if (G.cash < item.price) {
    shopMessage(G, 'Not enough cash!');
    return;
  }
  G.cash -= item.price;
  if (item.id === 'armorKit') G.health = Math.min(100, G.health + 50);
  if (item.id === 'ammo') {
    G.weapons.forEach((slot, i) => {
      slot.reserve += WEAPONS[i].mag * 3;
    });
  }
  if (item.id === 'repair' && G.car) G.car.health = 100;
  if (item.id === 'repair' && !G.car) {
    G.cash += item.price;
    shopMessage(G, 'No car to repair — steal one first!');
    return;
  }
  if (G.audio) G.audio.chime();
  shopMessage(G, `${item.name} bought!`);
  buildShop(G);
  saveGame(G);
}

export function buyUpgrade(G, up) {
  if (G.upgrades[up.id]) return false;
  if (G.cash < up.price) {
    shopMessage(G, 'Not enough cash!');
    return false;
  }
  const rankOk = rankIndexOf(rankFor(G.respect).name) >= rankIndexOf(up.rank);
  if (!rankOk) {
    shopMessage(G, `Locked — requires ${up.rank} rank. Earn more respect!`);
    return false;
  }
  G.cash -= up.price;
  G.upgrades[up.id] = true;
  if (G.audio) G.audio.chime();
  shopMessage(G, `${up.name} installed!`);
  buildShop(G);
  saveGame(G);
  return true;
}

function shopMessage(G, text) {
  const el = document.getElementById('shop-message');
  if (el) el.textContent = text;
  G.toast = text;
  G.toastUntil = G.time + 2;
}

export function openShop(G) {
  buildShop(G);
  document.getElementById('shop-screen').classList.remove('hidden');
  G.shopOpen = true;
}

export function closeShop(G) {
  document.getElementById('shop-screen').classList.add('hidden');
  G.shopOpen = false;
}

export function nearGarage(G) {
  return Math.hypot(G.player.x + 140, G.player.z + 140) < 16;
}
