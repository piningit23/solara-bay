import { createCar } from './render.js';
import { clamp, distance } from './config.js';
import { pick } from './random.js';

export function addVehicle(game, x, z, heading = 0, options = {}) {
  const color = options.color || pick(['#ed9553', '#5bb4a9', '#de6b75', '#ede4bb', '#769ccc', '#eacb58']);
  const mesh = createCar(color, options.model || 0, options.police);
  mesh.position.set(x, 0, z);
  mesh.rotation.y = heading;
  game.scene.add(mesh);
  const car = { x, z, heading, mesh, speed: 0, stolen: false, parked: true, model: options.model || 0, ...options };
  game.cars.push(car);
  return car;
}

export function populateParkedCars(game) {
  addVehicle(game, -7, 24, 0, { color: '#ed9952', model: 2 });
  for (let i = 0; i < 25; i++) {
    const road = [-128, -64, 0, 64, 128][i % 5];
    const along = -145 + Math.floor(i / 5) * 63;
    addVehicle(game, road - 7, along, 0, { model: i % 3 });
  }
}

export function updateDriving(game, dt) {
  const { input, player } = game;
  if (input.tap('KeyE') && !game.jacking) {
    if (game.car) {
      const car = game.car;
      player.x = car.x + Math.cos(car.heading) * 3.1;
      player.z = car.z - Math.sin(car.heading) * 3.1;
      car.speed = 0;
      game.car = null;
      game.notify('Back on foot');
    } else {
      const nearest = game.cars.filter(c => !c.police).sort((a, b) => distance(a, player) - distance(b, player))[0];
      if (nearest && distance(nearest, player) < 7) {
        game.jacking = { car: nearest, remaining: .8 };
        game.notify('JACKING…');
      } else game.notify('Get closer to a parked car · E to steal');
    }
  }
  if (game.jacking) {
    game.jacking.remaining -= dt;
    if (game.jacking.remaining <= 0) {
      game.car = game.jacking.car;
      game.car.parked = false;
      game.car.traffic = false;
      game.car.stolen = true;
      game.jacking = null;
      game.crime(1, 'VEHICLE STOLEN • POLICE ALERTED');
      game.audio.tone(220, .25, .08, 'square');
    }
  }
  if (!game.car) return;
  const car = game.car;
  const throttle = Number(input.down('KeyW')) - Number(input.down('KeyS'));
  car.speed += throttle * dt * 18;
  car.speed *= Math.pow(input.down('Space') ? .035 : .72, dt);
  car.speed = clamp(car.speed, -15, input.down('ShiftLeft') ? 53 : 44);
  const steering = Number(input.down('KeyA')) - Number(input.down('KeyD'));
  car.heading += steering * dt * 1.65 * clamp(car.speed / 10, -1, 1);
  const x = car.x + Math.sin(car.heading) * car.speed * dt;
  const z = car.z + Math.cos(car.heading) * car.speed * dt;
  if (game.world.blocked(x, z, 1.35)) {
    if (Math.abs(car.speed) > 9) {
      game.hurt(Math.abs(car.speed) * .25);
      game.effects.burst(car.x, 1, car.z, '#ffd27d', 12);
      game.shake = .5;
    }
    car.speed *= -.25;
  } else {
    car.x = x;
    car.z = z;
  }
  if (Math.abs(car.speed) > 18 && game.time % .08 < dt) game.effects.burst(car.x, .2, car.z, '#c9b794', 1);
  car.mesh.position.set(car.x, 0, car.z);
  car.mesh.rotation.y = car.heading;
}
