export function createSave(state) {
  function data() { return { cash: state.player.cash, health: state.player.health, armor: state.player.armor, ammo: state.player.ammo, missionIndex: state.missionIndex, wanted: state.wanted, unlockedMissions: state.unlockedMissions }; }
  function save() { localStorage.setItem('solara-bay-v2', JSON.stringify(data())); }
  function load() { try { const value = JSON.parse(localStorage.getItem('solara-bay-v2')); if (!value) return false; Object.assign(state.player, { cash: value.cash || 0, health: value.health || 100, armor: value.armor || 0, ammo: value.ammo || [48, 22, 160] }); state.missionIndex = value.missionIndex || 0; state.unlockedMissions = value.unlockedMissions || state.missionIndex + 1; state.wanted = value.wanted || 0; return true; } catch { return false; } }
  return { save, load, get exists() { return !!localStorage.getItem('solara-bay-v2'); } };
}
