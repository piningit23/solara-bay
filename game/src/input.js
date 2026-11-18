export function createInput() {
  const held = new Set();
  const pressed = new Set();
  const input = { held, pressed, fire: false, mouseOrbit: false, down: key => held.has(key), tap: key => pressed.has(key), end: () => pressed.clear() };
  addEventListener('keydown', event => {
    if (['Space', 'ArrowUp', 'ArrowDown', 'Tab'].includes(event.code)) event.preventDefault();
    if (!held.has(event.code)) pressed.add(event.code);
    held.add(event.code);
  });
  addEventListener('keyup', event => held.delete(event.code));
  addEventListener('mousedown', event => { if (event.button === 0) input.fire = true; if (event.button === 2) input.mouseOrbit = true; });
  addEventListener('mouseup', event => { if (event.button === 0) input.fire = false; if (event.button === 2) input.mouseOrbit = false; });
  addEventListener('blur', () => { held.clear(); pressed.clear(); input.fire = false; });
  return input;
}
