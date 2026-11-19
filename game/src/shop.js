// Solara Bay — safehouse shop: press F near the garage to buy armor, ammo,
// repairs, and the three garage upgrades (gated by respect rank).

import { SHOP_ITEMS, UPGRADES, GARAGE } from './config.js';
import { rankUnlocked } from './respect.js';

export function nearGarage(state) {
  return Math.hypot(state.playerPos.x - GARAGE.x, state.playerPos.z - GARAGE.z) < GARAGE.radius;
}

export function buyItem(state, id, audio) {
  const item = SHOP_ITEMS.find((i) => i.id === id);
  if (!item) return 'Unknown item';
  if (state.cash < item.price) return 'Not enough cash';
  state.cash -= item.price;
  if (id === 'armor') state.armor = Math.min(100, state.armor + 50);
  if (id === 'ammo') state.weapons.forEach((w) => { w.ammoLeft = w.ammo; });
  if (id === 'repair' && state.car) state.car.damage = 0;
  if (audio) audio.chime();
  return `Bought ${item.name} — $${item.price}`;
}

export function buyUpgrade(state, id, audio) {
  const up = UPGRADES.find((u) => u.id === id);
  if (!up) return 'Unknown upgrade';
  if (state.upgrades[id]) return 'Already owned';
  if (!rankUnlocked(state, up.rank)) return `Locked — needs ${up.rank} rank`;
  if (state.cash < up.price) return 'Not enough cash';
  state.cash -= up.price;
  state.upgrades[id] = true;
  if (audio) audio.chime();
  return `Installed ${up.name} — $${up.price}`;
}

export function shopLines(state) {
  const lines = [];
  lines.push('— SAFEHOUSE SHOP —');
  for (const item of SHOP_ITEMS) {
    lines.push(`${item.name} — $${item.price} · ${item.desc}`);
  }
  lines.push('— GARAGE UPGRADES —');
  for (const up of UPGRADES) {
    const owned = state.upgrades[up.id];
    const locked = !rankUnlocked(state, up.rank);
    const status = owned ? 'OWNED' : locked ? `LOCKED (${up.rank})` : `$${up.price}`;
    lines.push(`${up.name} — ${status} · ${up.desc}`);
  }
  return lines;
}
