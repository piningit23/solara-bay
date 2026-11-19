// Save / load: progress persists in localStorage — cash, respect, caches,
// upgrades, mission progress and ammo. Continue resumes it all.

import { SAVE_KEY } from './config.js';

export function saveGame(G) {
  try {
    const save = {
      cash: G.cash,
      respect: G.respect,
      cachesFound: G.cachesFound,
      upgrades: G.upgrades,
      missionIndex: G.missionIndex,
      weapons: G.weapons,
      health: G.health,
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
    G.toast = 'Game saved.';
    G.toastUntil = G.time + 2;
    return true;
  } catch (err) {
    G.toast = 'Save failed — storage unavailable.';
    G.toastUntil = G.time + 2;
    return false;
  }
}

export function loadGame(G) {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const save = JSON.parse(raw);
    if (typeof save.cash === 'number') G.cash = save.cash;
    if (typeof save.respect === 'number') G.respect = save.respect;
    if (typeof save.cachesFound === 'number') G.cachesFound = save.cachesFound;
    if (save.upgrades) G.upgrades = { ...G.upgrades, ...save.upgrades };
    if (typeof save.missionIndex === 'number') {
      G.missionIndex = Math.max(0, Math.min(11, save.missionIndex));
    }
    if (Array.isArray(save.weapons)) {
      save.weapons.forEach((w, i) => {
        if (G.weapons[i]) G.weapons[i] = { ...G.weapons[i], ...w };
      });
    }
    if (typeof save.health === 'number') G.health = save.health;
    return true;
  } catch (err) {
    return false;
  }
}

export function hasSave() {
  try {
    return !!localStorage.getItem(SAVE_KEY);
  } catch (err) {
    return false;
  }
}
