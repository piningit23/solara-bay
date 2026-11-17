import { createPerson } from './render.js';
import { clamp, turnToward } from './config.js';

export function createPlayer(scene) {
  const mesh = createPerson('#ee885d');
  mesh.position.set(-4, 0, 19);
  scene.add(mesh);
  return { mesh, x: -4, z: 19, heading: 0, health: 100, ammo: 12, reserve: 96, reload: 0 };
}

export function updateOnFoot(game, dt) {
  const { player, input, world } = game;
  if (game.car) {
    player.x = game.car.x;
    player.z = game.car.z;
    player.mesh.visible = false;
    return;
  }
  player.mesh.visible = true;
  let x = Number(input.down('KeyD')) - Number(input.down('KeyA'));
  let z = Number(input.down('KeyW')) - Number(input.down('KeyS'));
  const length = Math.hypot(x, z);
  if (length) {
    x /= length;
    z /= length;
    const dx = x * Math.cos(game.cameraYaw) + z * Math.sin(game.cameraYaw);
    const dz = z * Math.cos(game.cameraYaw) - x * Math.sin(game.cameraYaw);
    const speed = input.down('ShiftLeft') ? 12 : 6;
    if (!world.blocked(player.x + dx * speed * dt, player.z)) player.x += dx * speed * dt;
    if (!world.blocked(player.x, player.z + dz * speed * dt)) player.z += dz * speed * dt;
    player.heading = turnToward(player.heading, Math.atan2(dx, dz), dt * 12);
    player.mesh.userData.legs.forEach((leg, i) => leg.rotation.x = Math.sin(game.time * speed * 1.8 + i * Math.PI) * .5);
  }
  player.x = clamp(player.x, -167, 200);
  player.z = clamp(player.z, -167, 167);
  player.mesh.position.set(player.x, 0, player.z);
  player.mesh.rotation.y = player.heading;
}
