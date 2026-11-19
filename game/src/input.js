// Solara Bay — keyboard + mouse input, one object the loop polls.

export function createInput(canvas) {
  const input = {
    keys: {},
    mouseDX: 0,
    mouseDY: 0,
    mouseDown: false,
    pointerLocked: false,
    pressed: {},   // edge-triggered: true for one frame after keydown
  };

  const blocked = ['Tab', 'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];

  window.addEventListener('keydown', (e) => {
    if (blocked.includes(e.code) || e.code === 'Tab') e.preventDefault();
    if (!e.repeat) input.pressed[e.code] = true;
    input.keys[e.code] = true;
  });
  window.addEventListener('keyup', (e) => { input.keys[e.code] = false; });
  window.addEventListener('blur', () => { input.keys = {}; input.mouseDown = false; });

  canvas.addEventListener('mousedown', (e) => {
    input.mouseDown = true;
    if (e.button === 0 && document.pointerLockElement !== canvas) {
      canvas.requestPointerLock?.();
    }
  });
  window.addEventListener('mouseup', () => { input.mouseDown = false; });
  document.addEventListener('pointerlockchange', () => {
    input.pointerLocked = document.pointerLockElement === canvas;
  });
  document.addEventListener('mousemove', (e) => {
    if (input.pointerLocked) {
      input.mouseDX += e.movementX || 0;
      input.mouseDY += e.movementY || 0;
    }
  });

  input.isDown = (code) => !!input.keys[code];
  input.wasPressed = (code) => !!input.pressed[code];
  input.endFrame = () => {
    input.pressed = {};
    input.mouseDX = 0;
    input.mouseDY = 0;
  };
  return input;
}
