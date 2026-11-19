// Solara Bay — deterministic screenshot staging from ?shot=.
// cover: chase with helicopter, 5 stars, roadblock ahead, Dante beside the player.
// street: on-foot on a busy street with traffic, pedestrians and a taxi marker.
// mission: harbor crates with police closing in and the helicopter in the sky.
// start: the title screen.

import { addWanted, spawnPoliceCar } from './police.js';
import { setCrewActive } from './crew.js';
import { spawnEnemy } from './combat.js';
import { makeCrateMesh } from './models.js';

function quietActivities(activities) {
  // keep side-activity popups out of the staged frame
  activities.taxiTimer = 999;
  activities.vigilanteTimer = 999;
}

export function applyShotStaging(shot, world) {
  const { state, police, heli, crew, combat, missions, activities, parked, traffic, peds } = world;
  if (!shot) return;
  state.screen = 'playing';
  if (shot === 'start') {
    state.screen = 'title';
    return;
  }
  if (shot === 'street') {
    // Mara on foot at the central junction, facing north down the avenue.
    state.playerPos = { x: 0, z: 0 };
    state.playerAngle = Math.PI;
    state.cameraAngle = Math.PI;
    state.onFoot = true;
    state.shotWide = true;
    spawnTaxiMarker(activities, state);
    quietActivities(activities);
    // pull traffic onto this avenue and pedestrians onto its sidewalks
    traffic.cars.slice(0, 6).forEach((car, i) => {
      car.horizontal = false;
      car.road = 0;
      car.along = -14 - i * 14;
      car.lane = i % 2 === 0 ? 2.5 : -2.5;
      car.dir = i % 2 === 0 ? -1 : 1;
      car.mesh.position.set(car.road + car.lane, 0, car.along);
      car.mesh.rotation.y = car.dir > 0 ? 0 : Math.PI;
    });
    peds.people.slice(0, 8).forEach((p, i) => {
      p.horizontal = false;
      p.road = 0;
      p.side = i % 2 === 0 ? 6.2 : -6.2;
      p.along = -8 - i * 5;
      p.mesh.position.set(p.road + p.side, 0, p.along);
    });
    state.message = 'TAXI FARE — pick up the rider at the blue TAXI marker';
    state.messageTimer = 999;
    return;
  }
  if (shot === 'mission') {
    // Mara driving east on the harbor road toward the docks crates.
    state.missionIndex = 2;
    state.missionActive = true;
    state.missionStage = 0;
    state.cratesLeft = 3;
    state.onFoot = false;
    const car = parked.cars[0];
    if (car) {
      car.taken = true;
      state.car = car;
      car.mesh.position.set(120, 0, 90);
      car.mesh.rotation.y = Math.PI / 2;
      state.playerPos = { x: 120, z: 90 };
      state.playerAngle = Math.PI / 2;
      state.cameraAngle = Math.PI / 2;
      state.carSpeed = 0;
    }
    state.shotWide = true;
    addWanted(state, 3);
    missions.crateMeshes = [[152, 100], [154, 112], [152, 124]].map(([x, z]) => {
      const c = makeCrateMesh();
      c.position.set(x, 0, z);
      missions.markerGroup.add(c);
      return c;
    });
    spawnEnemy(combat, 150, 106, 60);
    spawnEnemy(combat, 154, 118, 60);
    spawnPoliceCar(police, 100, 84);
    spawnPoliceCar(police, 104, 97);
    heli.stagingAngle = 0.2;
    heli.height = 16;
    quietActivities(activities);
    state.banner = 'MISSION 3/12 — HARBOR HEIST';
    state.bannerTimer = 999;
    state.message = 'Collect all 3 crates at the docks. The dock crew is armed.';
    state.messageTimer = 999;
    return;
  }
  if (shot === 'cover') {
    // Player driving east on the southern ring road: beach and water on the
    // right, city on the left, roadblock ahead, helicopter overhead.
    state.onFoot = false;
    const car = parked.cars[0];
    if (car) {
      car.taken = true;
      state.car = car;
      car.mesh.position.set(0, 0, 150);
      car.mesh.rotation.y = Math.PI / 2;
      state.playerPos = { x: 0, z: 150 };
      state.playerAngle = Math.PI / 2;
      state.cameraAngle = Math.PI / 2;
      state.carSpeed = 0;
    }
    addWanted(state, 5);
    setCrewActive(crew, state, true, state.playerPos);
    crew.carMesh.position.set(5, 0, 154);
    crew.carMesh.rotation.y = Math.PI / 2;
    // two police cars in pursuit right behind the player
    spawnPoliceCar(police, -16, 147);
    spawnPoliceCar(police, -22, 154);
    // the roadblock itself is built by updatePolice on the first frame
    quietActivities(activities);
    state.banner = 'MISSION 12/12 — QUEEN OF SOLARA';
    state.bannerTimer = 999;
    state.message = 'Reach the lighthouse with 5-star heat. Dante is backing you up.';
    state.messageTimer = 999;
    state.cash = 12450;
    state.respect = 820;
    state.missionIndex = 11;
    state.missionActive = true;
    state.shotCover = true;
    return;
  }
}

function spawnTaxiMarker(activities, state) {
  state.taxi = {
    pickup: { x: 8, z: -6 },
    drop: { x: 120, z: 120 },
    passenger: false,
    fare: 180,
  };
}
