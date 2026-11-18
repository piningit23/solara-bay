import * as THREE from 'three';
import { clamp } from './config.js';
import { createPerson, animatePerson } from './models.js';

export function createPlayer(scene) {
  const mesh = createPerson('#66c6ae');
  mesh.scale.set(1.08, 1.08, 1.08);
  scene.add(mesh);
  return { x: -112, z: 78, angle: 0, health: 100, armor: 0, cash: 2200, mesh, car: null, ammo: [48, 22, 160], weapon: 0, jacking: 0, busting: 0, speed: 0, nos: 100, boosting: false, kills: 0 };
}
export function updateOnFoot(player, input, world, dt, time) {
  if (player.car || player.jacking > 0 || player.busting > 0) return;
  let x = 0;
  let z = 0;
  if (input.down('KeyW')) z -= 1;
  if (input.down('KeyS')) z += 1;
  if (input.down('KeyA')) x -= 1;
  if (input.down('KeyD')) x += 1;
  const length = Math.hypot(x, z);
  if (length) {
    x /= length;
    z /= length;
    const speed = input.down('ShiftLeft') || input.down('ShiftRight') ? 12 : 7;
    const nx = clamp(player.x + x * speed * dt, -178, 178);
    const nz = clamp(player.z + z * speed * dt, -178, 178);
    if (!world.collides(nx, player.z, .7)) player.x = nx;
    if (!world.collides(player.x, nz, .7)) player.z = nz;
    player.angle = Math.atan2(x, z);
  }
  player.mesh.position.set(player.x, 0, player.z);
  player.mesh.rotation.y = player.angle;
  animatePerson(player.mesh, time, !!length);
}
export function syncPlayerMesh(player) {
  player.mesh.visible = !player.car;
  if (!player.car) player.mesh.position.set(player.x, 0, player.z);
}
export function steerToward(from, to) {
  const dx = to.x - from.x;
  const dz = to.z - from.z;
  return Math.atan2(dx, dz);
}
