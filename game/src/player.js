// On-foot player movement: WASD relative to the camera, Shift to run,
// mouse orbits the camera. E near a parked car steals it.

import { keyDown, takeMouse } from './input.js';
import { clampToIsland } from './world.js';

export function updateOnFoot(G, dt) {
  const input = G.input;
  const mouse = takeMouse(input);
  G.camYaw -= mouse.dx * 0.0035;
  G.camPitch = Math.max(0.08, Math.min(1.1, G.camPitch + mouse.dy * 0.002));

  let fx = 0;
  let fz = 0;
  if (keyDown(input, 'KeyW')) fz += 1;
  if (keyDown(input, 'KeyS')) fz -= 1;
  if (keyDown(input, 'KeyA')) fx -= 1;
  if (keyDown(input, 'KeyD')) fx += 1;
  const moving = fx !== 0 || fz !== 0;
  if (moving) {
    const len = Math.hypot(fx, fz);
    fx /= len;
    fz /= len;
    const run = keyDown(input, 'ShiftLeft') || keyDown(input, 'ShiftRight');
    const speed = run ? 10 : 6;
    const yaw = G.camYaw;
    const wx = (Math.sin(yaw) * -fz + Math.cos(yaw) * -fx) * -1;
    const wz = (Math.cos(yaw) * -fz + Math.sin(yaw) * fx) * -1;
    // Move relative to camera yaw: forward is away from the camera.
    const mx = Math.sin(yaw) * fz + Math.cos(yaw) * fx;
    const mz = Math.cos(yaw) * fz - Math.sin(yaw) * fx;
    G.player.x += mx * speed * dt;
    G.player.z += mz * speed * dt;
    G.player.heading = Math.atan2(mx, mz);
    G.player.speed = speed;
    void wx; void wz;
  } else {
    G.player.speed = 0;
  }
  const clamped = clampToIsland(G.player.x, G.player.z);
  G.player.x = clamped.x;
  G.player.z = clamped.z;
  if (G.player.mesh) {
    G.player.mesh.position.set(G.player.x, 0, G.player.z);
    G.player.mesh.rotation.y = G.player.heading;
    // Walk bob while moving.
    G.player.mesh.position.y = moving ? Math.abs(Math.sin(G.time * 9)) * 0.07 : 0;
  }
}
