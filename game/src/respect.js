// Respect ranks: points earned from missions, gigs, taxi fares and vigilante
// takedowns. Ranks gate the garage upgrades.

import { RANKS } from './config.js';

export function rankFor(respect) {
  let rank = RANKS[0];
  for (const r of RANKS) {
    if (respect >= r.min) rank = r;
  }
  return rank;
}

export function rankIndex(respect) {
  let idx = 0;
  for (let i = 0; i < RANKS.length; i++) {
    if (respect >= RANKS[i].min) idx = i;
  }
  return idx;
}

export function nextRank(respect) {
  for (const r of RANKS) {
    if (respect < r.min) return r;
  }
  return null;
}

export function addRespect(G, points, reason) {
  const before = rankFor(G.respect).name;
  G.respect += points;
  const after = rankFor(G.respect).name;
  if (reason) {
    G.toast = `+${points} respect — ${reason}`;
    G.toastUntil = G.time + 2.5;
  }
  if (after !== before) {
    G.toast = `RANK UP: you are now ${after.toUpperCase()}!`;
    G.toastUntil = G.time + 4;
    if (G.audio) G.audio.chime();
  }
  return G.respect;
}

// Progress toward the next rank, 0..1, for the HUD respect bar.
export function respectProgress(G) {
  const idx = rankIndex(G.respect);
  const cur = RANKS[idx];
  const next = RANKS[idx + 1];
  if (!next) return 1;
  return Math.max(0, Math.min(1, (G.respect - cur.min) / (next.min - cur.min)));
}
