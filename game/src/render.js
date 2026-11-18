import * as THREE from 'three';
import { clamp } from './config.js';

export function createRenderer() {
  const renderer = new THREE.WebGLRenderer({ canvas: document.querySelector('#view'), antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#b5d8d6');
  scene.fog = new THREE.Fog('#b5d8d6', 100, 470);
  const camera = new THREE.PerspectiveCamera(57, innerWidth / innerHeight, .1, 1400);
  const ambient = new THREE.HemisphereLight('#ddf6ed', '#9a806a', 2.1);
  scene.add(ambient);
  const sun = new THREE.DirectionalLight('#ffe2ac', 3.4);
  sun.position.set(-90, 130, 50);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -190, right: 190, top: 190, bottom: -190, near: 1, far: 400 });
  sun.shadow.bias = -.0005;
  scene.add(sun);
  let orbit = 0;
  let pitch = .37;
  addEventListener('mousemove', event => {
    if (event.buttons === 2 || document.pointerLockElement) {
      orbit -= event.movementX * .004;
      pitch = clamp(pitch + event.movementY * .003, .1, .9);
    }
  });
  addEventListener('contextmenu', event => event.preventDefault());
  addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });
  const desired = new THREE.Vector3();
  const look = new THREE.Vector3();
  function follow(state, dt) {
    const p = state.player;
    const car = p.car;
    const heading = car ? car.angle : p.angle;
    if (car && !state.input.mouseOrbit) orbit *= Math.exp(-dt * .6);
    const a = heading + orbit;
    const distance = car ? 17 : 11;
    desired.set(p.x - Math.sin(a) * distance, (car ? 8.5 : 6.5) + pitch * 4, p.z - Math.cos(a) * distance);
    // Lift the follow camera if a block would conceal the subject.
    if (state.world.collides(desired.x, desired.z, .4)) desired.y = 37;
    camera.position.lerp(desired, 1 - Math.exp(-dt * 7));
    if (state.shake > 0) { camera.position.x += Math.sin(state.time * 83) * state.shake; camera.position.y += Math.cos(state.time * 79) * state.shake; }
    look.set(p.x, 2.1, p.z);
    camera.lookAt(look);
    const fov = car?.boosting ? 66 : 57;
    camera.fov += (fov - camera.fov) * Math.min(1, dt * 5);
    camera.updateProjectionMatrix();
  }
  function setNight(night) {
    scene.background.set(night ? '#263c58' : '#b5d8d6');
    scene.fog.color.copy(scene.background);
    ambient.intensity = night ? .85 : 2.1;
    sun.intensity = night ? .8 : 3.4;
  }
  return { scene, camera, renderer, follow, setNight, draw: () => renderer.render(scene, camera) };
}
