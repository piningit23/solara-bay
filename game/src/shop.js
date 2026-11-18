import { GARAGE } from './config.js';

export function openShop(state) {
  const menu = document.querySelector('#menu');
  menu.innerHTML = `<div class="menu-content"><div class="title-kicker">VALE AUTO / SAFEHOUSE</div><h2>SUPPLY SHOP</h2><p class="story">The garage is quiet. The island is not. Stock up before the next run.</p><div class="shop-item"><div><b>ARMOR</b><p>Plate up. Restore 100 armor.</p></div><button data-buy="armor">$300</button></div><div class="shop-item"><div><b>AMMO</b><p>Refill every weapon.</p></div><button data-buy="ammo">$150</button></div><div class="shop-item"><div><b>REPAIR CAR</b><p>Restore the current vehicle.</p></div><button data-buy="repair">$200</button></div><p id="shop-note" class="story"></p><div class="buttons"><button class="primary" id="close-shop">CLOSE (F)</button></div></div>`;
  menu.querySelector('#close-shop').onclick = () => { state.paused = false; menu.innerHTML = ''; };
  menu.querySelectorAll('[data-buy]').forEach(button => button.onclick = () => {
    const type = button.dataset.buy;
    const prices = { armor: 300, ammo: 150, repair: 200 };
    if (state.player.cash < prices[type]) { menu.querySelector('#shop-note').textContent = 'NOT ENOUGH CASH.'; return; }
    state.player.cash -= prices[type];
    if (type === 'armor') state.player.armor = 100;
    if (type === 'ammo') state.player.ammo = [12, 6, 32];
    if (type === 'repair' && state.player.car) state.player.car.health = 100;
    state.save();
    menu.querySelector('#shop-note').textContent = `${type.toUpperCase()} PURCHASED. CASH $${state.player.cash.toLocaleString()}`;
  });
}
