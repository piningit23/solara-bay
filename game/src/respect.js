// Solara Bay — respect ranks. Respect is earned from missions, gigs, taxi
// fares and vigilante takedowns. Ranks unlock garage upgrades.
// Drifter (0) → Street (150) → Respected (400) → Queen of Solara (800).

import { G } from './state.js';
import { RANKS } from './config.js';

export function rankFor(respect) {
  let rank = RANKS[0];
  for (const r of RANKS) if (respect >= r.min) rank = r;
  return rank;
}

export function currentRank() { return rankFor(G.respect); }

export function nextRank() {
  for (const r of RANKS) if (G.respect < r.min) return r;
  return null;
}

export function respectProgress() {
  const cur = currentRank();
  const nxt = nextRank();
  if (!nxt) return 1;
  return (G.respect - cur.min) / (nxt.min - cur.min);
}

export function addRespect(n, reason) {
  const before = currentRank().name;
  G.respect += n;
  const after = currentRank().name;
  if (after !== before) {
    G.messages.push('RANK UP — you are now ' + after.toUpperCase() + '!');
  } else if (reason) {
    G.messages.push('+' + n + ' respect — ' + reason);
  }
}

export function rankUnlocks(rankName) {
  return RANKS.some((r) => r.name === rankName && G.respect >= r.min);
}
