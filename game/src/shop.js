// Solara Bay — safehouse shop. Press F at the garage to open it.
// Buys Armor, Ammo and Car Repair, plus the three rank-gated garage
// upgrades (Racing Tires, Armor Plating, Engine). Cash only, persistent.

import { G } from './state.js';
import { SHOP_ITEMS, UPGRADES, WEAPONS } from './config.js';
import { currentRank } from './respect.js';
import { saveGame } from './save.js';
import { playCash, playHit } from './audio.js';

let open = false;

export function isShopOpen() { return open; }

export function openShop() {
  open = true;
  renderShop();
  const el = document.getElementById('shop-overlay');
  if (el) el.style.display = 'block';
}

export function closeShop() {
  open = false;
  const el = document.getElementById('shop-overlay');
  if (el) el.style.display = 'none';
}

function renderShop() {
  const list = document.getElementById('shop-list');
  if (!list) return;
  const rank = currentRank().name;
  let html = '<h2>GARAGE SHOP — ' + rank.toUpperCase() + ' RANK</h2>';
  html += '<p class="shop-cash">Cash: $' + Math.floor(G.cash) + '</p>';
  for (const item of SHOP_ITEMS) {
    html += '<div class="shop-row"><span><b>' + item.name + '</b> — ' + item.desc +
      '</span><button data-buy="' + item.id + '">$' + item.price + '</button></div>';
  }
  html += '<h3>GARAGE UPGRADES</h3>';
  for (const up of UPGRADES) {
    const owned = !!G.upgrades[up.id];
    const unlocked = G.respect >= rankMin(up.rank);
    const label = owned ? 'OWNED' : !unlocked ? 'LOCKED — needs ' + up.rank + ' rank' : '$' + up.price;
    html += '<div class="shop-row"><span><b>' + up.name + '</b> — ' + up.desc +
      '</span><button data-upgrade="' + up.id + '" ' + (owned || !unlocked ? 'disabled' : '') + '>' + label + '</button></div>';
  }
  html += '<p class="shop-note">Press F or Esc to close. Upgrades stay in your save.</p>';
  list.innerHTML = html;
  list.querySelectorAll('[data-buy]').forEach((b) => {
    b.addEventListener('click', () => buyItem(b.getAttribute('data-buy')));
  });
  list.querySelectorAll('[data-upgrade]').forEach((b) => {
    b.addEventListener('click', () => buyUpgrade(b.getAttribute('data-upgrade')));
  });
}

function rankMin(name) {
  return { Drifter: 0, Street: 150, Respected: 400, 'Queen of Solara': 800 }[name] || 0;
}

export function buyItem(id) {
  const item = SHOP_ITEMS.find((i) => i.id === id);
  if (!item) return false;
  if (G.cash < item.price) { G.messages.push('Not enough cash for ' + item.name + '.'); playHit(); return false; }
  G.cash -= item.price;
  if (id === 'armor') G.armor = Math.min(100, G.armor + 50);
  if (id === 'ammo') G.weapons.forEach((w, i) => { w.ammo = Math.max(w.ammo, 60); w.mag = WEAPONS[i].mag; });
  if (id === 'repair' && G.car) G.car.hp = 100;
  playCash();
  G.messages.push('Bought ' + item.name + ' for $' + item.price + '.');
  saveGame();
  renderShop();
  return true;
}

export function buyUpgrade(id) {
  const up = UPGRADES.find((u) => u.id === id);
  if (!up || G.upgrades[id]) return false;
  if (G.respect < rankMin(up.rank)) { G.messages.push(up.name + ' needs ' + up.rank + ' rank.'); return false; }
  if (G.cash < up.price) { G.messages.push('Not enough cash for ' + up.name + '.'); playHit(); return false; }
  G.cash -= up.price;
  G.upgrades[id] = true;
  playCash();
  G.messages.push('UPGRADE INSTALLED — ' + up.name + '!');
  saveGame();
  renderShop();
  return true;
}

// test hook: buy an upgrade programmatically (used by the play-test)
export function shopState() { return { open, cash: G.cash, upgrades: { ...G.upgrades } }; }
