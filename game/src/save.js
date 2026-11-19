// Solara Bay — save to localStorage. Saves cash, mission progress,
// respect, upgrades and collected caches on mission completion and on
// the Save button. Continue resumes all of it.

import { G } from './state.js';

const KEY = 'solara-bay-save-v3';

export function saveGame() {
  try {
    const data = {
      cash: G.cash,
      missionIndex: G.missionIndex,
      respect: G.respect,
      upgrades: G.upgrades,
      cacheTaken: G.cacheTaken,
      cachesFound: G.cachesFound,
      station: G.station,
    };
    localStorage.setItem(KEY, JSON.stringify(data));
    return true;
  } catch (e) { return false; }
}

export function loadGame() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    G.cash = data.cash || 0;
    G.missionIndex = data.missionIndex || 0;
    G.respect = data.respect || 0;
    G.upgrades = data.upgrades || {};
    G.cacheTaken = data.cacheTaken || [];
    G.cachesFound = data.cachesFound || G.cacheTaken.length;
    G.station = data.station || 0;
    // hide already-collected caches
    if (G.cacheMeshes) {
      for (const i of G.cacheTaken) {
        if (G.cacheMeshes[i]) G.cacheMeshes[i].visible = false;
      }
    }
    return data;
  } catch (e) { return null; }
}

export function hasSave() {
  try { return !!localStorage.getItem(KEY); } catch (e) { return false; }
}

export function clearSave() {
  try { localStorage.removeItem(KEY); } catch (e) { /* best-effort */ }
}
