export function shotMode() {
  return new URLSearchParams(location.search).get('shot') || '';
}

export function stageScreenshot(game, hud, mode) {
  const stages = {
    cover: { x: 34, z: 18, heading: Math.PI * .42, mission: 1, wanted: 3, cash: 4250 },
    'on-foot': { x: -12, z: -15, heading: .6, mission: 0, wanted: 0, cash: 1850 },
    police: { x: 120, z: 108, heading: 0, mission: 2, wanted: 2, cash: 6400 },
  };
  if (mode === 'start') {
    document.querySelector('#menu').classList.remove('hidden');
    document.querySelector('#continue').classList.add('hidden');
    game.mode = 'menu';
    return;
  }
  const stage = stages[mode];
  if (!stage) return;
  try { localStorage.removeItem('solara-bay-story-v4'); } catch {}
  game.mode = 'play';
  game.player.x = stage.x;
  game.player.z = stage.z;
  game.player.mesh.position.set(stage.x, 0, stage.z);
  game.player.heading = stage.heading;
  game.missionIndex = stage.mission;
  game.cash = stage.cash;
  game.wanted = stage.wanted;
  if (mode === 'cover') {
    game.car = game.cars.find(car => car.parked && !car.traffic);
    game.car.parked = false;
    game.car.stolen = true;
    game.car.x = stage.x;
    game.car.z = stage.z;
    game.car.heading = stage.heading;
    game.car.speed = 17;
    game.car.mesh.position.set(stage.x, 0, stage.z);
    game.car.mesh.rotation.y = stage.heading;
    for (const [i, offset] of [-1, 1].entries()) {
      const cruiser = game.addPoliceCar(stage.x - offset * 13, stage.z - 24 - i * 4, stage.heading);
      cruiser.speed = 27;
    }
  }
  if (mode === 'police') {
    for (const [i, offset] of [-1, 1].entries()) {
      const cruiser = game.addPoliceCar(stage.x + offset * 18, stage.z + 37 + i * 3, Math.PI);
      cruiser.speed = 18;
    }
  }
  hud.update(game, 0);
  document.querySelector('#menu').classList.add('hidden');
}
