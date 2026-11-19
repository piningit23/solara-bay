// Keyboard + mouse input. One object, read by the player, driving and combat
// modules. Mouse movement orbits the camera; clicking fires the current weapon.

export function createInput() {
  const input = {
    keys: new Set(),
    mouseDX: 0,
    mouseDY: 0,
    mouseDown: false,
    clicked: false,
    locked: false,
  };

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Tab') e.preventDefault();
    input.keys.add(e.code);
  });
  window.addEventListener('keyup', (e) => input.keys.delete(e.code));
  window.addEventListener('blur', () => input.keys.clear());
  window.addEventListener('mousemove', (e) => {
    input.mouseDX += e.movementX || 0;
    input.mouseDY += e.movementY || 0;
  });
  window.addEventListener('mousedown', (e) => {
    if (e.button === 0) {
      input.mouseDown = true;
      input.clicked = true;
    }
  });
  window.addEventListener('mouseup', (e) => {
    if (e.button === 0) input.mouseDown = false;
  });
  window.addEventListener('contextmenu', (e) => e.preventDefault());
  return input;
}

export function keyDown(input, code) {
  return input.keys.has(code);
}

// Consume the accumulated mouse delta for this frame.
export function takeMouse(input) {
  const dx = input.mouseDX;
  const dy = input.mouseDY;
  input.mouseDX = 0;
  input.mouseDY = 0;
  return { dx, dy };
}

export function takeClick(input) {
  const c = input.clicked;
  input.clicked = false;
  return c;
}
