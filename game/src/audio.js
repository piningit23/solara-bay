export class SynthAudio {
  constructor() {
    this.context = null;
    this.musicClock = 0;
    this.beat = 0;
  }
  start() {
    if (!this.context) {
      this.context = new AudioContext();
      this.engine = this.context.createOscillator();
      this.engineGain = this.context.createGain();
      this.engine.type = 'sawtooth';
      this.engineGain.gain.value = 0;
      this.engine.connect(this.engineGain).connect(this.context.destination);
      this.engine.start();
    }
    this.context.resume();
  }
  tone(frequency, duration = .15, volume = .04, type = 'sine') {
    if (!this.context) return;
    const now = this.context.currentTime;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(.0001, now + duration);
    oscillator.connect(gain).connect(this.context.destination);
    oscillator.start();
    oscillator.stop(now + duration);
  }
  shot() { this.tone(92, .12, .13, 'sawtooth'); }
  chime() {
    this.tone(523, .3, .08);
    setTimeout(() => this.tone(784, .5, .06), 140);
  }
  update(dt, game) {
    if (!this.context) return;
    this.engine.frequency.value = 35 + Math.abs(game.car?.speed || 0) * 5;
    this.engineGain.gain.value = game.car && game.mode === 'play' ? .018 : 0;
    this.musicClock -= dt;
    if (this.musicClock <= 0) {
      this.musicClock = .45;
      const notes = [130.81, 164.81, 196, 164.81, 110, 146.83, 174.61, 146.83];
      this.tone(notes[this.beat++ % notes.length], .4, .018, 'triangle');
      if (game.wanted > 0 && game.police.length) this.tone(this.beat % 2 ? 620 : 850, .4, .018);
    }
  }
}
