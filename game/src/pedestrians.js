import { createPerson } from './render.js';
import { between, pick } from './random.js';
import { distance, ROADS } from './config.js';

export function createPedestrians(game) {
  game.pedestrians = [];
  for (let i = 0; i < 70; i++) {
    const x = ROADS[i % 5] + (i % 2 ? -12 : 12);
    const z = between(-155, 155);
    const mesh = createPerson(pick(['#f3c35f', '#d86b72', '#6cbab0', '#f4e4bf', '#7e9bd1']));
    mesh.position.set(x, 0, z);
    game.scene.add(mesh);
    game.pedestrians.push({ x, z, mesh, direction: i % 2 ? 1 : -1, panic: 0, down: false });
  }
}

export function updatePedestrians(game, dt) {
  for (const person of game.pedestrians) {
    if (person.down) continue;
    if ((game.car && Math.abs(game.car.speed) > 8 && distance(person, game.player) < 16) || game.gunNoise > 0) person.panic = 5;
    person.panic = Math.max(0, person.panic - dt);
    const speed = person.panic > 0 ? 7 : 1.5;
    person.z += person.direction * speed * dt;
    if (Math.abs(person.z) > 158) person.direction *= -1;
    if (person.panic > 0) person.x += Math.sign(person.x - game.player.x) * dt * 1.8;
    person.mesh.position.set(person.x, 0, person.z);
    person.mesh.rotation.y = person.direction > 0 ? 0 : Math.PI;
    person.mesh.userData.legs.forEach((leg, i) => leg.rotation.x = Math.sin(game.time * speed * 3 + i * Math.PI) * .5);
    if (game.car && Math.abs(game.car.speed) > 11 && distance(person, game.car) < 2.1) {
      person.down = true;
      person.mesh.rotation.z = Math.PI / 2;
      person.mesh.position.y = .3;
      game.crime(1, 'HIT AND RUN');
      game.car.speed *= .8;
    }
  }
}
