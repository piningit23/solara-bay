// Synthesized WebAudio sound: engine hum, sirens, gunshots, pickup chimes,
// helicopter rotor and an ambient pad. No audio files anywhere.

export function createAudio() {
  const audio = {
    ctx: null,
    master: null,
    engineOsc: null,
    engineGain: null,
    sirenOsc: null,
    sirenGain: null,
    rotorOsc: null,
    rotorGain: null,
    musicGain: null,
    started: false,
  };

  audio.init = function init() {
    if (audio.started) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      audio.ctx = new AC();
      audio.master = audio.ctx.createGain();
      audio.master.gain.value = 0.5;
      audio.master.connect(audio.ctx.destination);
      audio.musicGain = audio.ctx.createGain();
      audio.musicGain.gain.value = 0.16;
      audio.musicGain.connect(audio.master);
      // Engine hum: a low sawtooth whose pitch follows speed.
      audio.engineOsc = audio.ctx.createOscillator();
      audio.engineOsc.type = 'sawtooth';
      audio.engineOsc.frequency.value = 55;
      audio.engineGain = audio.ctx.createGain();
      audio.engineGain.gain.value = 0.0;
      audio.engineOsc.connect(audio.engineGain);
      audio.engineGain.connect(audio.master);
      audio.engineOsc.start();
      // Police siren: two-tone triangle, toggled by setSiren.
      audio.sirenOsc = audio.ctx.createOscillator();
      audio.sirenOsc.type = 'triangle';
      audio.sirenOsc.frequency.value = 720;
      audio.sirenGain = audio.ctx.createGain();
      audio.sirenGain.gain.value = 0.0;
      audio.sirenOsc.connect(audio.sirenGain);
      audio.sirenGain.connect(audio.master);
      audio.sirenOsc.start();
      // Helicopter rotor: a low square wave chopped by an LFO.
      audio.rotorOsc = audio.ctx.createOscillator();
      audio.rotorOsc.type = 'square';
      audio.rotorOsc.frequency.value = 38;
      audio.rotorGain = audio.ctx.createGain();
      audio.rotorGain.gain.value = 0.0;
      const lfo = audio.ctx.createOscillator();
      lfo.frequency.value = 13;
      const lfoGain = audio.ctx.createGain();
      lfoGain.gain.value = 0.05;
      lfo.connect(lfoGain);
      lfoGain.connect(audio.rotorGain.gain);
      audio.rotorOsc.connect(audio.rotorGain);
      audio.rotorGain.connect(audio.master);
      audio.rotorOsc.start();
      lfo.start();
      audio.started = true;
    } catch (err) {
      audio.started = false;
    }
  };

  audio.resume = function resume() {
    audio.init();
    if (audio.ctx && audio.ctx.state === 'suspended') audio.ctx.resume();
  };

  audio.setEngine = function setEngine(speed, driving) {
    if (!audio.started) return;
    const target = driving ? 0.05 + Math.min(0.1, Math.abs(speed) * 0.003) : 0.0;
    audio.engineGain.gain.setTargetAtTime(target, audio.ctx.currentTime, 0.1);
    audio.engineOsc.frequency.setTargetAtTime(
      55 + Math.abs(speed) * 4, audio.ctx.currentTime, 0.1);
  };

  audio.setSiren = function setSiren(on) {
    if (!audio.started) return;
    audio.sirenGain.gain.setTargetAtTime(on ? 0.05 : 0.0, audio.ctx.currentTime, 0.2);
    if (on) {
      const now = audio.ctx.currentTime;
      audio.sirenOsc.frequency.setValueAtTime(720, now);
      audio.sirenOsc.frequency.linearRampToValueAtTime(980, now + 0.45);
      audio.sirenOsc.frequency.linearRampToValueAtTime(720, now + 0.9);
    }
  };

  audio.setRotor = function setRotor(on) {
    if (!audio.started) return;
    audio.rotorGain.gain.setTargetAtTime(on ? 0.06 : 0.0, audio.ctx.currentTime, 0.3);
  };

  // One short synthesized note, used by the radio and by chimes.
  audio.note = function note(freq, dur, type, vol, when) {
    if (!audio.started) return;
    const t = when || audio.ctx.currentTime;
    const osc = audio.ctx.createOscillator();
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    const gain = audio.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(vol || 0.2, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain);
    gain.connect(audio.musicGain);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  };

  audio.shot = function shot(kind) {
    if (!audio.started) return;
    const t = audio.ctx.currentTime;
    const osc = audio.ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(kind === 'rifle' ? 220 : 160, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.12);
    const gain = audio.ctx.createGain();
    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
    osc.connect(gain);
    gain.connect(audio.master);
    osc.start(t);
    osc.stop(t + 0.16);
  };

  audio.chime = function chime() {
    if (!audio.started) return;
    audio.note(660, 0.25, 'sine', 0.25);
    audio.note(990, 0.35, 'sine', 0.22, audio.ctx.currentTime + 0.09);
  };

  audio.thud = function thud() {
    if (!audio.started) return;
    const t = audio.ctx.currentTime;
    const osc = audio.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(90, t);
    osc.frequency.exponentialRampToValueAtTime(35, t + 0.18);
    const gain = audio.ctx.createGain();
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    osc.connect(gain);
    gain.connect(audio.master);
    osc.start(t);
    osc.stop(t + 0.22);
  };

  return audio;
}
