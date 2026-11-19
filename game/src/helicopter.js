// Solara Bay — police helicopter: spawns at 3+ stars, circles the player,
// shines a spotlight cone, plays rotor sound, shows as "H" on the minimap.

import * as THREE from 'three';
import { makeHelicopterMesh } from './models.js';

export function createHelicopter(scene) {
  const mesh = makeHelicopterMesh();
  mesh.visible = false;
  scene.add(mesh);
  return {
    scene,
    mesh,
    active: false,
    angle: 0,
    height: 20,
    stagingAngle: undefined,
  };
}

export function updateHelicopter(heli, dt, state, playerPos, audio) {
  const want = state.wanted >= 3;
  if (want && !heli.active) {
    heli.active = true;
    heli.mesh.visible = true;
    heli.angle = heli.stagingAngle !== undefined ? heli.stagingAngle : 0.5;
    heli.mesh.position.set(playerPos.x + 20, heli.height, playerPos.z + 20);
  }
  if (!want && heli.active) {
    heli.active = false;
    heli.mesh.visible = false;
    if (audio) audio.setRotor(false);
  }
  if (!heli.active) return;
  if (state.shotCover) {
    // staged cover shot: hold the helicopter ahead of the player, in frame
    heli.angle = 0.5;
    heli.height = 14;
  } else {
    heli.angle += dt * 0.45;
  }
  const r = 16;
  heli.mesh.position.x = playerPos.x + Math.cos(heli.angle) * r;
  heli.mesh.position.z = playerPos.z + Math.sin(heli.angle) * r;
  heli.mesh.position.y = heli.height + Math.sin(state.time * 0.8) * 1.2;
  heli.mesh.rotation.y = -heli.angle;
  const rotor = heli.mesh.getObjectByName('rotor');
  if (rotor) rotor.rotation.y += dt * 22;
  if (audio) audio.setRotor(true);
}

export function heliPosition(heli) {
  return heli.active
    ? { x: heli.mesh.position.x, z: heli.mesh.position.z }
    : null;
}
