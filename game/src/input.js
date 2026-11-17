export class Input {
  constructor(canvas) {
    this.keys = new Set();
    this.pressed = new Set();
    this.yaw = 0;
    this.dragging = false;
    this.fire = false;
    window.addEventListener('keydown', event => {
      if (!this.keys.has(event.code)) this.pressed.add(event.code);
      this.keys.add(event.code);
      if (['Space', 'Tab'].includes(event.code)) event.preventDefault();
    });
    window.addEventListener('keyup', event => this.keys.delete(event.code));
    window.addEventListener('blur', () => this.keys.clear());
    canvas.addEventListener('mousedown', event => {
      if (event.button === 0) this.fire = true;
      if (event.button === 2) this.dragging = true;
    });
    window.addEventListener('mouseup', () => {
      this.fire = false;
      this.dragging = false;
    });
    canvas.addEventListener('contextmenu', event => event.preventDefault());
    window.addEventListener('mousemove', event => {
      if (this.dragging || document.pointerLockElement) this.yaw -= event.movementX * .004;
    });
  }
  down(key) { return this.keys.has(key); }
  tap(key) { return this.pressed.has(key); }
  end() { this.pressed.clear(); }
}
