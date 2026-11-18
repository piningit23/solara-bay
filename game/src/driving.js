import * as THREE from 'three';
import { clamp, distance, LIMIT } from './config.js';
import { createCar } from './models.js';

const carPaint = ['#e46f4c', '#427d8c', '#efc35d', '#8e7393', '#d5d4be', '#39786e', '#d58d55'];
export function createDriving(scene, state) {
  const parked = [];
  const traffic = [];
  function makeCar(x, z, angle, index, isTraffic = false) {
    const mesh = createCar(carPaint[index % carPaint.length], false, index % 2);
    mesh.position.set(x, 0, z);
    mesh.rotation.y = angle;
    scene.add(mesh);
    const car = { x, z, angle, speed: 0, mesh, color: carPaint[index % carPaint.length], parked: !isTraffic, target: null, lane: index % 4, boost: false, nos: 100, health: 100, isTraffic, hitTimer: 0 };
    (isTraffic ? traffic : parked).push(car);
    return car;
  }
  const roads = [-144, -72, 0, 72, 144];
  for (let i = 0; i < 24; i++) {
    const road = roads[i % roads.length];
    const lane = i % 2 ? 3.7 : -3.7;
    const along = -154 + (i * 67 % 300);
    if (i % 3) makeCar(road + lane, along, 0, i);
    else makeCar(along, road + lane, Math.PI / 2, i);
  }
  // Mara starts beside a car on the garage-side avenue, ready for the first-wheel job.
  parked[0].x = -115;
  parked[0].z = 81;
  parked[0].mesh.position.set(parked[0].x, 0, parked[0].z);
  for (let i = 0; i < 12; i++) {
    const road = roads[i % roads.length];
    const along = -150 + (i * 53 % 290);
    const vertical = i % 2 === 0;
    makeCar(vertical ? road + (i % 4 ? 3.4 : -3.4) : along, vertical ? along : road + (i % 4 ? -3.4 : 3.4), vertical ? (i % 4 ? 0 : Math.PI) : (i % 4 ? -Math.PI / 2 : Math.PI / 2), i + 2, true);
  }
  function nearParked() { return parked.filter(car => !car.occupied).sort((a, b) => distance(state.player, a) - distance(state.player, b))[0]; }
  function enter(car) {
    state.player.car = car;
    car.occupied = true;
    car.parked = false;
    car.speed = 0;
    state.player.x = car.x;
    state.player.z = car.z;
    state.player.mesh.visible = false;
  }
  function exit() {
    const car = state.player.car;
    if (!car) return;
    state.player.x = car.x + Math.sin(car.angle + Math.PI / 2) * 3.5;
    state.player.z = car.z + Math.cos(car.angle + Math.PI / 2) * 3.5;
    state.player.angle = car.angle + Math.PI;
    car.occupied = false;
    car.speed = 0;
    state.player.car = null;
    state.player.mesh.visible = true;
    state.player.mesh.position.set(state.player.x, 0, state.player.z);
  }
  function updateTraffic(dt) {
    for (const car of traffic) {
      if (car.speed === 0) car.speed = 5.4 + car.lane * .35;
      const next = { x: car.x + Math.sin(car.angle) * car.speed * dt, z: car.z + Math.cos(car.angle) * car.speed * dt };
      const player = state.player.car || state.player;
      const closeToPlayer = distance(next, player) < 12;
      const aheadJunction = Math.abs((car.angle === 0 || Math.abs(car.angle) === Math.PI ? next.z : next.x) % 72) < 9;
      const nearTraffic = traffic.some(other => other !== car && distance(next, other) < 7 && Math.abs(Math.atan2(Math.sin(car.angle - other.angle), Math.cos(car.angle - other.angle))) < .6);
      if (closeToPlayer || nearTraffic || (aheadJunction && Math.sin(state.time * 2 + car.lane) > -.2)) {
        car.speed = Math.max(0, car.speed - 17 * dt);
      } else car.speed = Math.min(9, car.speed + 4 * dt);
      car.x += Math.sin(car.angle) * car.speed * dt;
      car.z += Math.cos(car.angle) * car.speed * dt;
      if (Math.abs(car.x) > 163 || Math.abs(car.z) > 163) {
        if (Math.abs(Math.sin(car.angle)) > .5) car.x = Math.sign(car.x) * -158;
        else car.z = Math.sign(car.z) * -158;
      }
      car.mesh.position.set(car.x, 0, car.z);
    }
  }
  function updatePlayerCar(dt, input, world) {
    const car = state.player.car;
    if (!car) return;
    const gas = input.down('KeyW') ? 1 : input.down('KeyS') ? -.7 : 0;
    const boosting = (input.down('ShiftLeft') || input.down('ShiftRight')) && gas > 0 && car.nos > 0;
    car.boosting = boosting;
    car.nos = clamp(car.nos + (boosting ? -30 : 12) * dt, 0, 100);
    const max = boosting ? 33 : 22;
    car.speed = clamp(car.speed + gas * (boosting ? 23 : 13) * dt, -8, max);
    if (input.down('Space')) car.speed *= Math.pow(.04, dt);
    if (!gas && !input.down('Space')) car.speed *= Math.pow(.46, dt);
    const turn = (input.down('KeyD') ? 1 : 0) - (input.down('KeyA') ? 1 : 0);
    car.angle += turn * dt * Math.sign(car.speed) * Math.min(1.2, Math.abs(car.speed) / 6) * 1.65;
    const nx = clamp(car.x + Math.sin(car.angle) * car.speed * dt, -177, 177);
    const nz = clamp(car.z + Math.cos(car.angle) * car.speed * dt, -177, 177);
    const collision = world.collides(nx, nz, 1.7);
    if (!collision) { car.x = nx; car.z = nz; }
    else {
      state.shake = .23;
      state.effects.burst(car.x, .8, car.z, '#ffc47c', 12, 5);
      car.speed *= -.27;
      car.health -= 4;
      state.audio.effect('hit');
      state.player.health -= Math.max(0, Math.abs(car.speed) * .18);
    }
    const target = new THREE.Vector3(car.x, 0, car.z);
    car.mesh.position.lerp(target, Math.min(1, dt * 12));
    car.mesh.rotation.y = car.angle;
    state.player.x = car.x;
    state.player.z = car.z;
    state.player.speed = Math.abs(car.speed) * 4.4;
    if (Math.abs(car.speed) > 16 && Math.random() < dt * 16) {
      state.effects.burst(car.x - Math.sin(car.angle) * 2.7, .55, car.z - Math.cos(car.angle) * 2.7, boosting ? '#44dcff' : '#bbb2a3', 2, boosting ? 3.5 : 1);
    }
    if (Math.abs(car.speed) > 12) {
      for (const person of state.pedestrians.list) if (!person.down && distance(car, person) < 3) state.pedestrians.hit(person, 'vehicle');
    }
    car.hitTimer = Math.max(0, car.hitTimer - dt);
  }
  return { parked, traffic, nearParked, enter, exit, updateTraffic, updatePlayerCar };
}
