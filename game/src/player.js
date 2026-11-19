// Solara Bay — on-foot player: WASD movement, camera orbit, collision,
// entering and exiting cars.

import * as THREE from 'three';
import { PLAYER } from './config.js';

export function createPlayer(scene) {
  const group = new THREE.Group();
  // Mara Vale: teal jacket, dark hair
  const jacket = new THREE.MeshLambertMaterial({ color: 0x0e7a6b });
  const skin = new THREE.MeshLambertMaterial({ color: 0xd9a066 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.8, 0.34), jacket);
  body.position.y = 1.05;
  group.add(body);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.36, 0.36), skin);
  head.position.y = 1.65;
  group.add(head);
  const hair = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.18, 0.4),
    new THREE.MeshLambertMaterial({ color: 0x1a1a1a }));
  hair.position.y = 1.86;
  group.add(hair);
  const legMat = new THREE.MeshLambertMaterial({ color: 0x223344 });
  [-0.15, 0.15].forEach((x) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.7, 0.22), legMat);
    leg.position.set(x, 0.35, 0);
    leg.name = x < 0 ? 'legL' : 'legR';
    group.add(leg);
  });
  group.position.set(-40, 0, -40);
  scene.add(group);
  return { mesh: group, walkPhase: 0 };
}

export function collideCircle(pos, colliders, radius) {
  for (const c of colliders) {
    const dx = pos.x - c.x;
    const dz = pos.z - c.z;
    const d = Math.hypot(dx, dz);
    const min = c.r + radius;
    if (d < min && d > 0.001) {
      pos.x = c.x + (dx / d) * min;
      pos.z = c.z + (dz / d) * min;
    }
  }
}

export function updatePlayerOnFoot(player, dt, state, input, colliders) {
  const run = input.isDown('ShiftLeft') || input.isDown('ShiftRight');
  const speed = run ? PLAYER.runSpeed : PLAYER.walkSpeed;
  let mx = 0;
  let mz = 0;
  if (input.isDown('KeyW') || input.isDown('ArrowUp')) mz += 1;
  if (input.isDown('KeyS') || input.isDown('ArrowDown')) mz -= 1;
  if (input.isDown('KeyA') || input.isDown('ArrowLeft')) mx -= 1;
  if (input.isDown('KeyD') || input.isDown('ArrowRight')) mx += 1;
  const len = Math.hypot(mx, mz);
  if (len > 0) {
    mx /= len; mz /= len;
    const cam = state.cameraAngle;
    const fx = Math.sin(cam);
    const fz = Math.cos(cam);
    const rx = Math.cos(cam);
    const rz = -Math.sin(cam);
    const vx = (fx * mz + rx * mx) * speed * dt;
    const vz = (fz * mz + rz * mx) * speed * dt;
    state.playerPos.x += vx;
    state.playerPos.z += vz;
    state.playerAngle = Math.atan2(vx, vz);
    player.walkPhase += dt * speed * 1.6;
    const legL = player.mesh.getObjectByName('legL');
    const legR = player.mesh.getObjectByName('legR');
    if (legL && legR) {
      legL.rotation.x = Math.sin(player.walkPhase) * 0.6;
      legR.rotation.x = -Math.sin(player.walkPhase) * 0.6;
    }
  }
  // keep inside the island
  state.playerPos.x = Math.max(-152, Math.min(152, state.playerPos.x));
  state.playerPos.z = Math.max(-152, Math.min(152, state.playerPos.z));
  collideCircle(state.playerPos, colliders, PLAYER.radius);
  player.mesh.position.set(state.playerPos.x, 0, state.playerPos.z);
  player.mesh.rotation.y = state.playerAngle;
  // camera orbit from mouse
  state.cameraAngle += input.mouseDX * 0.004;
  state.cameraPitch = Math.max(0.12, Math.min(0.9, state.cameraPitch + input.mouseDY * 0.002));
}
