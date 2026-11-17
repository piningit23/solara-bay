export function stage(query, player, driving, wanted, mission, cars, police) {
  const shot = new URLSearchParams(query).get('shot');
  if (!shot) return 'play';
  if (shot === 'start') return 'start';
  if (shot === 'cover') {
    player.position.set(-48, 0, 66);
    driving.toggle(player, wanted, { blip() {} });
    wanted.value = 3;
    mission.index = 1;
  }
  if (shot === 'on-foot') { player.position.set(0, 0, 0); mission.index = 1; }
  if (shot === 'police') { player.position.set(52, 0, -52); mission.index = 2; wanted.value = 2; mission.crates = 1; }
  return 'play';
}
