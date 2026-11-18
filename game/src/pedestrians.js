import * as THREE from 'three';
import { ROADS, randomSource, distance } from './config.js';
import { createPerson, animatePerson } from './models.js';

export function createPedestrians(scene, state) {
  const random = randomSource(4512);
  const list = [];
  for (let i = 0; i < 50; i++) {
    const road = ROADS[i % ROADS.length];
    const side = i % 2 ? 1 : -1;
    const along = -164 + (i * 39 % 320);
    const vertical = i % 3 !== 0;
    const x = vertical ? road + side * 13 : along;
    const z = vertical ? along : road + side * 13;
    const mesh = createPerson(['#da765c', '#77ada7', '#d2b05e', '#d28da6', '#ddd8c6'][i % 5]);
    mesh.position.set(x, 0, z);
    mesh.rotation.y = random() * Math.PI * 2;
    scene.add(mesh);
    list.push({ x, z, angle: mesh.rotation.y, mesh, speed: 1 + random() * .65, flee: 0, down: false, target: { x: x + (random() - .5) * 45, z: z + (random() - .5) * 45 }, fireAt: 0, health: 45 });
  }
  function update(dt) {
    const player = state.player.car || state.player;
    for (const person of list) {
      if (person.down) continue;
      const d = distance(person, player);
      if (d < 13 && state.player.car && Math.abs(state.player.car.speed) > 4) person.flee = 3;
      person.flee = Math.max(0, person.flee - dt);
      if (person.flee > 0 && d < 32) person.angle = Math.atan2(person.x - player.x, person.z - player.z);
      else if (Math.hypot(person.x - person.target.x, person.z - person.target.z) < 3) {
        person.target.x = Math.max(-170, Math.min(170, person.x + (Math.random() - .5) * 50));
        person.target.z = Math.max(-170, Math.min(170, person.z + (Math.random() - .5) * 50));
        person.angle = Math.atan2(person.target.x - person.x, person.target.z - person.z);
      }
      const speed = person.flee ? 5.3 : person.speed;
      person.x += Math.sin(person.angle) * speed * dt;
      person.z += Math.cos(person.angle) * speed * dt;
      person.mesh.position.set(person.x, 0, person.z);
      person.mesh.rotation.y = person.angle;
      animatePerson(person.mesh, state.time, speed > 2);
    }
  }
  function fleeNear(x, z) { for (const person of list) if (Math.hypot(person.x - x, person.z - z) < 44) person.flee = 6; }
  function hit(person, cause = 'weapon') {
    if (person.down) return;
    person.down = true;
    person.mesh.rotation.z = Math.PI / 2;
    person.mesh.position.y = .35;
    person.health = 0;
    if (cause === 'vehicle') {
      state.player.cash = Math.max(0, state.player.cash - 30);
      state.raiseWanted(1, 'Pedestrian struck');
    }
    state.effects.burst(person.x, 1.2, person.z, '#e98662', 8, 3);
  }
  return { list, update, fleeNear, hit };
}
