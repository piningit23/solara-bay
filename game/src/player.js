// Solara Bay — the player on foot: WASD movement, camera-relative,
// Shift to run, collision against buildings, clamped to the island.

import * as THREE from 'three';
import { G } from './state.js';
import { keys } from './input.js';
import { makePlayerMesh } from './models.js';
import { collidesWithBuilding, clampToIsland } from './world.js';

export let camYaw = 0.6;
export let camPitch = 0.35;

export function setCam(yaw, pitch) { camYaw = yaw; camPitch = pitch; }

export function createPlayer(scene) {
  const mesh = makePlayerMesh();
  mesh.position.set(20, 0.3, 80);
  scene.add(mesh);
  G.player = {
    mesh, pos: mesh.position, yaw: 0, health: 100, speed: 0,
    vel: new THREE.Vector3(),
  };
  return G.player;
}

export function updatePlayer(dt, mouse) {
  const p = G.player;
  if (!p) return;
  camYaw -= mouse.dx * 0.004;
  camPitch = Math.max(0.08, Math.min(1.1, camPitch + mouse.dy * 0.003));

  const run = keys['ShiftLeft'] || keys['ShiftRight'];
  const speed = run ? 11 : 6;
  let fx = 0, fz = 0;
  if (keys['KeyW']) fz -= 1;
  if (keys['KeyS']) fz += 1;
  if (keys['KeyA']) fx -= 1;
  if (keys['KeyD']) fx += 1;
  const len = Math.hypot(fx, fz);
  p.speed = 0;
  if (len > 0) {
    fx /= len; fz /= len;
    const sin = Math.sin(camYaw), cos = Math.cos(camYaw);
    const wx = fx * cos - fz * sin;
    const wz = fx * sin + fz * cos;
    const nx = p.pos.x + wx * speed * dt;
    const nz = p.pos.z + wz * speed * dt;
    if (!collidesWithBuilding(nx, p.pos.z, 1)) p.pos.x = nx;
    if (!collidesWithBuilding(p.pos.x, nz, 1)) p.pos.z = nz;
    const cl = clampToIsland(p.pos.x, p.pos.z, 1);
    p.pos.x = cl.x; p.pos.z = cl.z;
    p.yaw = Math.atan2(wx, wz);
    p.speed = speed;
    // walk bob
    p.mesh.position.y = 0.3 + Math.abs(Math.sin(G.time * 10)) * 0.08;
  }
  p.mesh.rotation.y = p.yaw;
  // simple limb swing is skipped: the capsule bobs and leans instead
  p.mesh.rotation.z = p.speed > 0 ? Math.sin(G.time * 10) * 0.03 : 0;
}

export function playerPos() { return G.player ? G.player.pos : new THREE.Vector3(); }
