import * as THREE from 'three';

export function createRenderer() {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.3;
  document.querySelector('#game').append(renderer.domElement);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#85cad0');
  scene.fog = new THREE.Fog('#b8d7d2', 100, 390);
  scene.add(new THREE.HemisphereLight('#e2f9ff', '#a67b59', 2.4));
  const sun = new THREE.DirectionalLight('#ffe0aa', 3.4);
  sun.position.set(-90, 160, -60);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -160, right: 160, top: 160, bottom: -160, far: 450 });
  sun.shadow.bias = -.001;
  scene.add(sun);
  const camera = new THREE.PerspectiveCamera(57, innerWidth / innerHeight, .2, 700);
  window.addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });
  return { renderer, scene, camera };
}

const materials = new Map();
export function material(color) {
  if (!materials.has(color)) materials.set(color, new THREE.MeshStandardMaterial({ color, roughness: .78 }));
  return materials.get(color);
}
export function box(parent, x, y, z, width, height, depth, color) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material(color));
  mesh.position.set(x, y, z);
  mesh.castShadow = height > 1;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}
export function cylinder(parent, x, y, z, radius, height, color, top = radius) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(top, radius, height, 9), material(color));
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  parent.add(mesh);
  return mesh;
}
export function label(parent, text, x, y, z, width = 12, color = '#ffe2a1', background = '#164957') {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const context = canvas.getContext('2d');
  context.fillStyle = background;
  context.fillRect(0, 0, 512, 128);
  context.strokeStyle = color;
  context.lineWidth = 7;
  context.strokeRect(8, 8, 496, 112);
  context.font = 'bold 49px Arial';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillStyle = color;
  context.fillText(text, 256, 66, 470);
  const texture = new THREE.CanvasTexture(canvas);
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, width / 4), new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide }));
  mesh.position.set(x, y, z);
  parent.add(mesh);
  return mesh;
}

export function createPerson(color = '#f47752', officer = false) {
  const group = new THREE.Group();
  box(group, 0, 1.45, 0, .85, 1.05, .48, color);
  cylinder(group, 0, 2.24, 0, .29, .5, '#b87950');
  box(group, 0, 2.49, -.02, .6, .18, .54, officer ? '#132e49' : '#352a2a');
  const legs = [-.23, .23].map(x => box(group, x, .5, 0, .3, 1, .35, '#233e54'));
  box(group, -.58, 1.4, 0, .25, .9, .28, '#b87950');
  box(group, .58, 1.55, .25, .25, .7, .28, '#b87950');
  if (officer) box(group, .18, 1.7, .26, .15, .18, .03, '#ffd675');
  group.userData.legs = legs;
  return group;
}

export function createCar(color, model = 0, police = false) {
  const group = new THREE.Group();
  const length = model === 1 ? 6 : 5.2;
  box(group, 0, .95, 0, 2.55, .95, length, police ? '#f0f3df' : color);
  box(group, 0, 1.4, .1, 2.4, .2, length - .3, police ? '#173044' : color);
  box(group, 0, 1.95, -.25, 2.05, 1.05, model === 1 ? 3.3 : 2.55, '#244655');
  box(group, 0, 2.48, -.25, 2.12, .14, model === 1 ? 3.4 : 2.65, police ? '#f3f2dd' : color);
  for (const x of [-1.32, 1.32]) {
    for (const z of [-1.65, 1.65]) {
      const wheel = cylinder(group, x, .65, z, .6, .35, '#182b32');
      wheel.rotation.z = Math.PI / 2;
      const hub = cylinder(group, x * 1.02, .65, z, .3, .38, '#a5b9b7');
      hub.rotation.z = Math.PI / 2;
    }
    box(group, x * .7, 1.06, length / 2 + .03, .55, .3, .09, '#fff2b1');
    box(group, x * .7, 1.06, -length / 2 - .03, .55, .3, .09, '#ec634e');
  }
  box(group, 0, .65, length / 2 + .08, 2.3, .19, .16, '#bac9c1');
  if (police) {
    box(group, 0, 2.65, -.2, 1.6, .14, .48, '#172f43');
    group.userData.red = box(group, -.5, 2.85, -.2, .6, .27, .4, '#ff464d');
    group.userData.blue = box(group, .5, 2.85, -.2, .6, .27, .4, '#38adff');
    label(group, 'POLICE', 0, 1.4, -length / 2 - .06, 1.8, '#163f52', '#e4eee2');
  } else if (model === 2) {
    box(group, 0, 1.6, -2.1, 2.7, .15, .5, color);
  }
  return group;
}
