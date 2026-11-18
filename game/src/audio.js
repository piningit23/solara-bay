export function createAudio() {
  let context;
  let master;
  let engine;
  let engineGain;
  let rotor;
  let rotorGain;
  function start() {
    if (!context) {
      context = new AudioContext();
      master = context.createGain();
      master.gain.value = .18;
      master.connect(context.destination);
      engine = context.createOscillator();
      engine.type = 'sawtooth';
      engineGain = context.createGain();
      engineGain.gain.value = 0;
      engine.connect(engineGain).connect(master);
      engine.start();
      rotor = context.createOscillator();
      rotor.type = 'triangle';
      rotorGain = context.createGain();
      rotorGain.gain.value = 0;
      rotor.connect(rotorGain).connect(master);
      rotor.start();
    }
    context.resume();
  }
  function tone(frequency, duration = .16, volume = .3, type = 'triangle', delay = 0) {
    if (!context) return;
    const at = context.currentTime + delay;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, at);
    gain.gain.setValueAtTime(volume, at);
    gain.gain.exponentialRampToValueAtTime(.001, at + duration);
    oscillator.connect(gain).connect(master);
    oscillator.start(at);
    oscillator.stop(at + duration);
  }
  function effect(name) {
    if (name === 'shot') { tone(120, .09, .5, 'sawtooth'); tone(52, .15, .4, 'square'); }
    if (name === 'pickup') [440, 554, 659, 880].forEach((f, i) => tone(f, .25, .3, 'sine', i * .07));
    if (name === 'hit') tone(55, .22, .5, 'sawtooth');
    if (name === 'reload') { tone(220, .06, .2, 'square'); tone(330, .05, .2, 'square', .2); }
  }
  let sirenBeat = 0;
  function update(state, dt) {
    if (!context) return;
    engineGain.gain.setTargetAtTime(state.player.car ? .15 : 0, context.currentTime, .1);
    engine.frequency.setTargetAtTime(38 + Math.abs(state.player.car?.speed || 0) * 2.6, context.currentTime, .1);
    rotorGain.gain.setTargetAtTime(state.helicopter.active ? .1 + Math.sin(state.time * 28) * .07 : 0, context.currentTime, .03);
    rotor.frequency.value = 51 + Math.sin(state.time * 21) * 16;
    sirenBeat -= dt;
    if (state.wanted > 0 && state.police.length && sirenBeat <= 0) {
      tone(Math.sin(state.time * 4) > 0 ? 680 : 920, .3, .12, 'sine');
      sirenBeat = .35;
    }
  }
  return { start, tone, effect, update, get ready() { return !!context; } };
}
