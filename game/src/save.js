// Solara Bay — save to localStorage: cash, missions, wanted, respect,
// upgrades, caches. Continue resumes the run.

const KEY = 'solara-bay-save-v3';

export function saveGame(state) {
  try {
    const data = {
      cash: state.cash,
      missionIndex: state.missionIndex,
      missionDone: state.missionDone,
      respect: state.respect,
      upgrades: state.upgrades,
      caches: state.caches,
      cacheFound: state.cacheFound,
      carsStolen: state.carsStolen,
      kills: state.kills,
    };
    localStorage.setItem(KEY, JSON.stringify(data));
    return true;
  } catch (e) {
    return false;
  }
}

export function loadGame() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

export function applySave(state, data) {
  if (!data) return false;
  state.cash = data.cash ?? state.cash;
  state.missionIndex = data.missionIndex ?? 0;
  state.missionDone = data.missionDone || [];
  state.respect = data.respect ?? 0;
  state.upgrades = { ...state.upgrades, ...(data.upgrades || {}) };
  state.caches = data.caches ?? 0;
  state.cacheFound = data.cacheFound || [];
  state.carsStolen = data.carsStolen ?? 0;
  state.kills = data.kills ?? 0;
  return true;
}

export function hasSave() {
  return loadGame() !== null;
}
