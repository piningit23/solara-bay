// Solara Bay — respect ranks: points from missions, gigs, fares, takedowns.
// Ranks gate the garage upgrades.

import { RESPECT_RANKS } from './config.js';
import { rankFor, rankIndexFor } from './state.js';

export function createRespect(state) {
  return { state };
}

export function addRespect(state, points, reason) {
  const before = rankFor(state.respect);
  state.respect += points;
  const after = rankFor(state.respect);
  if (after !== before) {
    state.message = `RESPECT UP — you are now ${after.toUpperCase()}`;
    state.messageTimer = 4;
  }
  return state.respect;
}

export function respectProgress(state) {
  const idx = rankIndexFor(state.respect);
  const cur = RESPECT_RANKS[idx];
  const next = RESPECT_RANKS[idx + 1];
  if (!next) return { rank: cur.name, pct: 1, idx };
  const pct = (state.respect - cur.min) / (next.min - cur.min);
  return { rank: cur.name, pct: Math.max(0, Math.min(1, pct)), idx, next: next.name };
}

export function rankUnlocked(state, rankName) {
  const idx = RESPECT_RANKS.findIndex((r) => r.name === rankName);
  return rankIndexFor(state.respect) >= idx;
}
