import { addVehicle } from './driving.js';
import { ROADS, distance, turnToward, headingToward } from './config.js';

export function createTraffic(game) {
  for (let i = 0; i < 24; i++) {
    const lane = i % 5;
    const index = Math.floor(i / 5) % 5;
    const x = ROADS[lane] + 4;
    const z = ROADS[index] + 20 + (i % 3) * 7;
    addVehicle(game, x, z, 0, { traffic: true, parked: false, lane, node: index, wait: i * .11, model: i % 3 });
  }
}

export function updateTraffic(game, dt) {
  for (const car of game.cars) {
    if (!car.traffic || car === game.car) continue;
    car.wait -= dt;
    const target = car.routeTarget || { x: ROADS[car.lane] + 4, z: 156 };
    if (distance(car, target) < 5) {
      car.routeStep = ((car.routeStep || 0) + 1) % 4;
      const a = ROADS[car.lane] + 4;
      const b = ROADS[(car.lane + 2) % 5] - 4;
      const points = [{ x: a, z: 156 }, { x: b, z: 156 }, { x: b, z: -156 }, { x: a, z: -156 }];
      car.routeTarget = points[car.routeStep];
      car.wait = .8;
    }
    car.heading = turnToward(car.heading, headingToward(car, target), dt * 2);
    const nearby = distance(car, game.player) < 9;
    const junction = ROADS.some(r => Math.abs(car.z - r) < 3) && Math.floor(game.time / 4 + car.lane) % 2 === 0;
    car.speed = car.wait > 0 || nearby || junction ? 0 : 10 + car.lane;
    car.x += Math.sin(car.heading) * car.speed * dt;
    car.z += Math.cos(car.heading) * car.speed * dt;
    car.mesh.position.set(car.x, 0, car.z);
    car.mesh.rotation.y = car.heading;
  }
}
