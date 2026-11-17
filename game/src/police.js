import { addVehicle } from './driving.js';
import { createPerson } from './render.js';
import { clamp, distance, headingToward, turnToward } from './config.js';

export function updatePolice(game, dt) {
  if (game.wanted > 0 && game.time - game.lastCrime > 2 && game.police.length < Math.min(2 + game.wanted, 6)) {
    if (game.time - game.lastSpawn > 2.4) {
      game.lastSpawn = game.time;
      spawnCruiser(game);
    }
  }
  const visible = game.police.some(officer => distance(officer, game.player) < 70);
  const safehouse = Math.hypot(game.player.x + 47, game.player.z - 28) < 20;
  if (game.wanted > 0 && game.time - game.lastCrime > 8 && !visible) {
    game.heatTimer += dt * (safehouse ? 3 : 1);
    if (game.heatTimer > 15) {
      game.wanted = Math.max(0, game.wanted - 1);
      game.heatTimer = 0;
      game.notify('HEAT DOWN • LAY LOW');
    }
  } else game.heatTimer = 0;
  if (safehouse && game.wanted > 0 && game.time - game.lastCrime > 3) {
    game.heatTimer += dt * 2;
    if (game.heatTimer > 5) {
      game.wanted = 0;
      game.heatTimer = 0;
      game.notify('SAFEHOUSE • HEAT CLEARED');
    }
  }
  for (const officer of game.police) {
    const target = game.car || game.player;
    const gap = distance(officer, target);
    officer.heading = turnToward(officer.heading, headingToward(officer, target), dt * (officer.onFoot ? 2.8 : 1.7));
    if (officer.onFoot) {
      officer.x += Math.sin(officer.heading) * dt * 3.8;
      officer.z += Math.cos(officer.heading) * dt * 3.8;
      officer.mesh.position.set(officer.x, 0, officer.z);
      officer.mesh.rotation.y = officer.heading;
    } else {
      if (officer.mesh.userData.red) {
        officer.mesh.userData.red.material.color.setHex(Math.floor(game.time * 6) % 2 ? 0xff323c : 0xffa4a3);
        officer.mesh.userData.blue.material.color.setHex(Math.floor(game.time * 6) % 2 ? 0x7399ff : 0x268eff);
      }
      officer.speed = clamp(gap * .55, 10, 35);
      if (gap < 8 && game.car) {
        game.car.speed *= .92;
        if (Math.abs(game.car.speed) < 1 && gap < 4) game.bust('BUSTED');
      }
      const nx = officer.x + Math.sin(officer.heading) * officer.speed * dt;
      const nz = officer.z + Math.cos(officer.heading) * officer.speed * dt;
      if (!game.world.blocked(nx, nz, 1.4)) {
        officer.x = nx;
        officer.z = nz;
      } else officer.heading += dt * 1.5;
      officer.mesh.position.set(officer.x, 0, officer.z);
      officer.mesh.rotation.y = officer.heading;
    }
    if (gap < 12 && game.time - (officer.lastShot || 0) > 1.5) {
      officer.lastShot = game.time;
      game.hurt(game.car ? 3 : 8);
      game.effects.burst(game.player.x, 1, game.player.z, '#ff7664', 4);
      if (game.player.health <= 0) game.bust('BUSTED');
    }
  }
  for (const officer of game.police) {
    if (!officer.onFoot && distance(officer, game.player) > 240) {
      game.scene.remove(officer.mesh);
      game.cars.splice(game.cars.indexOf(officer), 1);
      game.police.splice(game.police.indexOf(officer), 1);
      break;
    }
  }
}

function spawnCruiser(game) {
  const angle = game.randomAngle++ * 2.4;
  const x = clamp(game.player.x + Math.sin(angle) * 85, -160, 165);
  const z = clamp(game.player.z + Math.cos(angle) * 85, -155, 155);
  const cruiser = addVehicle(game, x, z, headingToward({ x, z }, game.player), { police: true, parked: false });
  game.police.push(cruiser);
  if (game.police.length === 1 && !game.car && game.wanted >= 3) {
    const officer = createPerson('#1f4b76', true);
    officer.position.set(x + 4, 0, z);
    game.scene.add(officer);
    game.police.push({ x: x + 4, z, heading: 0, mesh: officer, onFoot: true });
  }
}
