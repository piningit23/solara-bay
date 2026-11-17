import { distance } from './config.js';

export class GameHUD {
  constructor() {
    this.stats = document.querySelector('#stats');
    this.mission = document.querySelector('#mission');
    this.chapter = document.querySelector('#chapter');
    this.story = document.querySelector('#story');
    this.target = document.querySelector('#target');
    this.speed = document.querySelector('#speed');
    this.vehicle = document.querySelector('#vehicle');
    this.weapon = document.querySelector('#weapon');
    this.health = document.querySelector('#health i');
    this.map = document.querySelector('#minimap');
    this.context = this.map.getContext('2d');
    this.toast = document.querySelector('#toast');
    this.toastTime = 0;
  }
  update(game, dt) {
    const stars = '★'.repeat(game.wanted) + `<span class="empty">${'★'.repeat(5 - game.wanted)}</span>`;
    this.stats.innerHTML = `<div class="stars">${stars}</div><div class="cash">$${game.cash.toLocaleString()}</div><div class="heat">${game.wanted ? 'BAY PATROL SEARCHING' : 'COAST IS QUIET'}</div>`;
    const mission = game.missions[game.missionIndex];
    this.mission.textContent = mission?.title || 'CITY FREE ROAM';
    this.chapter.textContent = mission ? `STORY ${String(game.missionIndex + 1).padStart(2, '0')} / 05 • ${mission.place}` : 'SOLARA BAY';
    this.story.textContent = mission?.story || 'The city is open. Make your own way.';
    this.target.innerHTML = mission ? `◆ ${mission.place} <span style="float:right">${Math.round(distance(game.player, mission.target))} M</span>` : '◆ FREE ROAM';
    this.health.style.width = `${game.player.health}%`;
    this.health.style.background = game.player.health < 35 ? '#ff5555' : '#96f0ba';
    this.weapon.textContent = `▣  PISTOL   ${game.player.ammo} / ${game.player.reserve}${game.player.reload > 0 ? '  •  RELOADING' : ''}`;
    this.vehicle.textContent = game.car ? `${game.car.model === 1 ? 'ORION ESTATE' : game.car.model === 2 ? 'CALYPSO GT' : 'MISTRAL COUPE'}  •  ${game.car.stolen ? 'HOT PLATES' : 'LOCAL VEHICLE'}` : 'ON FOOT  •  MARA VALE';
    this.speed.innerHTML = game.car ? `${Math.round(Math.abs(game.car.speed) * 3.6)}<small> KM/H</small>` : `<span style="font-size:15px;letter-spacing:2px">VITALS ${Math.round(game.player.health)}%</span>`;
    const p = game.player;
    document.querySelector('#district').textContent = p.x > 154 ? p.z > 120 ? 'PORT SOLARA' : 'PALM BEACH' : p.z < -130 ? 'SOLARA POINT' : p.x < -100 ? 'OLD TOWN' : 'PALM QUARTER';
    this.drawMap(game);
    this.toastTime = Math.max(0, this.toastTime - dt);
    if (!this.toastTime) this.toast.textContent = '';
  }
  notify(text) {
    this.toast.textContent = text;
    this.toastTime = 2.6;
  }
  drawMap(game) {
    const c = this.context;
    c.clearRect(0, 0, 230, 190);
    c.fillStyle = '#176270';
    c.fillRect(0, 0, 230, 190);
    const sx = 230 / 360;
    const sy = 190 / 350;
    const px = x => (x + 175) * sx;
    const py = z => (z + 175) * sy;
    c.fillStyle = '#e4cc91';
    c.fillRect(px(155), 0, 12, 190);
    c.fillStyle = '#4b5c5a';
    for (const road of [-128, -64, 0, 64, 128]) {
      c.fillRect(px(road) - 4, 0, 8, 190);
      c.fillRect(0, py(road) - 3, 230, 6);
    }
    c.fillStyle = '#73816d';
    for (const x of [-110, -45, 20, 85]) for (const z of [-110, -45, 20, 85]) c.fillRect(px(x) - 8, py(z) - 8, 16, 16);
    c.fillStyle = '#ffd46e';
    c.beginPath();
    c.arc(px(-47), py(28), 3, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#ffe8a4';
    c.beginPath();
    c.arc(px(game.player.x), py(game.player.z), 4, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = '#ffe8a4';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(px(game.player.x), py(game.player.z));
    c.lineTo(px(game.player.x + Math.sin(game.car?.heading || game.player.heading) * 7), py(game.player.z + Math.cos(game.car?.heading || game.player.heading) * 7));
    c.stroke();
    for (const car of game.cars) {
      if (!car.traffic && !car.police && car !== game.car) continue;
      c.fillStyle = car.police ? '#ff6362' : car === game.car ? '#ffe58b' : '#83c9c2';
      c.fillRect(px(car.x) - 2, py(car.z) - 3, 4, 6);
    }
    const mission = game.missions[game.missionIndex];
    if (mission) {
      c.fillStyle = '#ffbd5e';
      c.beginPath();
      c.arc(px(mission.target.x), py(mission.target.z), 5, 0, Math.PI * 2);
      c.fill();
    }
  }
}
