import * as THREE from 'three';

const materials = new Map();
export function material(color, options = {}) {
  const key = `${color}:${JSON.stringify(options)}`;
  if (!materials.has(key)) materials.set(key, new THREE.MeshStandardMaterial({ color, roughness: .72, ...options }));
  return materials.get(key);
}
export function box(parent, x, y, z, w, h, d, color, options = {}) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material(color, options));
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}
export function cylinder(parent, x, y, z, top, bottom, h, color, sides = 10) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(top, bottom, h, sides), material(color));
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  parent.add(mesh);
  return mesh;
}
export function label(parent, text, x, y, z, width = 12, color = '#f6e7b4', background = '#16434a') {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const context = canvas.getContext('2d');
  context.fillStyle = background;
  context.fillRect(0, 0, 512, 128);
  context.strokeStyle = color;
  context.lineWidth = 5;
  context.strokeRect(8, 8, 496, 112);
  context.fillStyle = color;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.font = 'bold 40px Arial';
  context.fillText(text, 256, 65, 470);
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, width / 4), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(canvas), side: THREE.DoubleSide }));
  mesh.position.set(x, y, z);
  parent.add(mesh);
  return mesh;
}
export function createCar(color = '#ec9b48', police = false, model = 0) {
  const car = new THREE.Group();
  box(car, 0, .7, 0, 2.7, .8, 5.2 + model * .3, color, { metalness: .25 });
  box(car, 0, 1.35, -.2, 2.35, .75, 2.65, police ? '#f0efe0' : color);
  box(car, 0, 1.48, 1.14, 2.12, .55, .07, '#174451', { metalness: .5, roughness: .2 });
  box(car, 0, 1.48, -1.54, 2.12, .5, .07, '#174451');
  for (const x of [-1.2, 1.2]) {
    box(car, x, 1.48, -.2, .06, .5, 2.05, '#234e5b');
    for (const z of [-1.6, 1.6]) {
      const tire = cylinder(car, x, .52, z, .52, .52, .36, '#182a31', 12);
      tire.rotation.z = Math.PI / 2;
      const hub = cylinder(car, x * 1.12, .52, z, .25, .25, .38, '#b6c9c3', 10);
      hub.rotation.z = Math.PI / 2;
    }
    box(car, x * .7, .85, 2.66, .58, .24, .06, '#fff6b0', { emissive: '#fff4b4', emissiveIntensity: .4 });
    box(car, x * .7, .85, -2.66, .56, .2, .06, '#ed634e', { emissive: '#d94237', emissiveIntensity: .5 });
  }
  box(car, 0, .48, 2.73, 2.4, .18, .16, '#a8beb6');
  box(car, 0, .48, -2.73, 2.4, .18, .16, '#a8beb6');
  if (model === 1) box(car, 0, 1.08, -2.1, 2.8, .13, .45, '#253d43');
  if (police) {
    box(car, 0, 1.83, -.1, 1.9, .12, .5, '#122b36');
    car.userData.red = box(car, -.53, 1.97, -.1, .75, .22, .45, '#ff3434', { emissive: '#ff2222', emissiveIntensity: 2 });
    car.userData.blue = box(car, .53, 1.97, -.1, .75, .22, .45, '#3f8eff', { emissive: '#2266ff', emissiveIntensity: 2 });
    label(car, 'SBPD', 0, .94, -2.76, 1.8, '#152f3b', '#e8e9d9').rotation.y = Math.PI;
  }
  return car;
}
export function createPerson(shirt = '#d46b58', officer = false) {
  const person = new THREE.Group();
  box(person, 0, 1.2, 0, .62, .8, .38, shirt);
  cylinder(person, 0, 1.92, 0, .23, .26, .44, '#c58e69', 8);
  box(person, 0, 2.16, -.02, .5, .16, .46, officer ? '#183445' : '#352d32');
  const limbs = [];
  for (const x of [-.2, .2]) limbs.push(box(person, x, .42, 0, .24, .8, .3, '#25394a'));
  for (const x of [-.44, .44]) limbs.push(box(person, x, 1.17, 0, .2, .72, .24, shirt));
  if (officer) box(person, .35, 1.15, .4, .13, .16, .65, '#142a33');
  person.userData.limbs = limbs;
  return person;
}
export function animatePerson(person, time, moving) {
  person.userData.limbs.forEach((limb, i) => { limb.rotation.x = moving ? Math.sin(time * 10 + i * Math.PI) * .5 : 0; });
}
