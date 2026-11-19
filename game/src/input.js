// Solara Bay — keyboard and mouse input.
// Tracks held keys, edge-triggered presses, and pointer drag for the camera orbit.

export const keys = {};
export const pressed = {};   // edge triggers, cleared once per frame by main.js
export let mouseDX = 0;
export let mouseDY = 0;
export let mouseDown = false;
export let mouseClicked = false;   // left click edge, cleared per frame

export function consumeMouse() {
  const d = { dx: mouseDX, dy: mouseDY, click: mouseClicked };
  mouseDX = 0; mouseDY = 0; mouseClicked = false;
  return d;
}

export function clearPressed() {
  for (const k of Object.keys(pressed)) delete pressed[k];
}

export function initInput(canvas) {
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Tab') e.preventDefault();
    if (!e.repeat) pressed[e.code] = true;
    keys[e.code] = true;
    if (e.code === 'KeyR' || e.code === 'KeyQ' || e.code === 'KeyF' || e.code === 'KeyE') e.preventDefault();
  });
  window.addEventListener('keyup', (e) => { keys[e.code] = false; });
  window.addEventListener('blur', () => {
    for (const k of Object.keys(keys)) keys[k] = false;
  });
  canvas.addEventListener('mousedown', (e) => {
    mouseDown = true;
    if (e.button === 0) mouseClicked = true;
  });
  window.addEventListener('mouseup', () => { mouseDown = false; });
  window.addEventListener('mousemove', (e) => {
    if (mouseDown) { mouseDX += e.movementX || 0; mouseDY += e.movementY || 0; }
  });
  // Keep the game usable without pointer lock: dragging orbits the camera.
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
}
