// Solara Bay — all sound is synthesized with WebAudio. No audio files.

export function createAudio() {
  const audio = {
    ctx: null, master: null, musicGain: null, engineOsc: null,
    engineGain: null, sirenOsc: null, sirenGain: null, rotorOsc: null,
    rotorGain: null, musicTimer: null, enabled: true,
  };

  audio.init = () => {
    if (audio.ctx) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      audio.ctx = new AC();
      audio.master = audio.ctx.createGain();
      audio.master.gain.value = 0.5;
      audio.master.connect(audio.ctx.destination);
      audio.musicGain = audio.ctx.createGain();
      audio.musicGain.gain.value = 0.16;
      audio.musicGain.connect(audio.master);
      // engine hum
      audio.engineOsc = audio.ctx.createOscillator();
      audio.engineOsc.type = 'sawtooth';
      audio.engineOsc.frequency.value = 55;
      audio.engineGain = audio.ctx.createGain();
      audio.engineGain.gain.value = 0;
      audio.engineOsc.connect(audio.engineGain);
      audio.engineGain.connect(audio.master);
      audio.engineOsc.start();
      // siren (two-tone)
      audio.sirenOsc = audio.ctx.createOscillator();
      audio.sirenOsc.type = 'sine';
      audio.sirenOsc.frequency.value = 700;
      audio.sirenGain = audio.ctx.createGain();
      audio.sirenGain.gain.value = 0;
      audio.sirenOsc.connect(audio.sirenGain);
      audio.sirenGain.connect(audio.master);
      audio.sirenOsc.start();
      // helicopter rotor
      audio.rotorOsc = audio.ctx.createOscillator();
      audio.rotorOsc.type = 'square';
      audio.rotorOsc.frequency.value = 13;
      audio.rotorGain = audio.ctx.createGain();
      audio.rotorGain.gain.value = 0;
      audio.rotorOsc.connect(audio.rotorGain);
      audio.rotorGain.connect(audio.master);
      audio.rotorOsc.start();
    } catch (e) { audio.ctx = null; }
  };

  audio.resume = () => { if (audio.ctx && audio.ctx.state === 'suspended') audio.ctx.resume(); };

  audio.blip = (freq, dur, type, vol) => {
    if (!audio.ctx) return;
    const t = audio.ctx.currentTime;
    const o = audio.ctx.createOscillator();
    const g = audio.ctx.createGain();
    o.type = type || 'square';
    o.frequency.value = freq;
    g.gain.setValueAtTime(vol || 0.2, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(audio.master);
    o.start(t); o.stop(t + dur + 0.02);
  };

  audio.shot = () => {
    if (!audio.ctx) return;
    const t = audio.ctx.currentTime;
    const buf = audio.ctx.createBuffer(1, 2205, 44100);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const src = audio.ctx.createBufferSource();
    src.buffer = buf;
    const g = audio.ctx.createGain();
    g.gain.value = 0.35;
    src.connect(g); g.connect(audio.master);
    src.start(t);
    audio.blip(160, 0.08, 'square', 0.25);
  };

  audio.chime = () => { audio.blip(880, 0.12, 'sine', 0.25); audio.blip(1320, 0.18, 'sine', 0.2); };
  audio.pickup = () => { audio.blip(660, 0.1, 'triangle', 0.25); audio.blip(990, 0.15, 'triangle', 0.25); };
  audio.crash = () => { audio.blip(90, 0.3, 'sawtooth', 0.4); };
  audio.busted = () => { audio.blip(220, 0.5, 'sawtooth', 0.3); audio.blip(165, 0.7, 'sawtooth', 0.3); };

  audio.setEngine = (speedNorm, driving) => {
    if (!audio.ctx) return;
    audio.engineGain.gain.value = driving ? 0.05 + speedNorm * 0.08 : 0;
    audio.engineOsc.frequency.value = 50 + speedNorm * 130;
  };

  audio.setSiren = (on) => {
    if (!audio.ctx) return;
    audio.sirenGain.gain.value = on ? 0.05 : 0;
    if (on) {
      const t = audio.ctx.currentTime;
      audio.sirenOsc.frequency.setValueAtTime(650, t);
      audio.sirenOsc.frequency.linearRampToValueAtTime(950, t + 0.4);
      audio.sirenOsc.frequency.linearRampToValueAtTime(650, t + 0.8);
    }
  };

  audio.setRotor = (on) => {
    if (!audio.ctx) return;
    audio.rotorGain.gain.value = on ? 0.06 : 0;
  };

  // Ambient music: a slow chord pad loop driven by a timer.
  audio.startMusic = (station) => {
    if (!audio.ctx) return;
    audio.stopMusic();
    const chords = station === 1
      ? [[110, 165, 220], [98, 147, 196], [123, 185, 247], [87, 131, 175]]
      : station === 2
        ? [[82, 123, 164], [73, 110, 146], [98, 147, 196], [65, 98, 130]]
        : [[130, 196, 261], [116, 174, 233], [146, 220, 293], [103, 155, 207]];
    let i = 0;
    const step = () => {
      if (!audio.ctx) return;
      const chord = chords[i % chords.length];
      i++;
      chord.forEach((f) => audio.blip(f, 1.8, 'sine', 0.05));
      audio.musicTimer = setTimeout(step, 1800);
    };
    step();
  };

  audio.stopMusic = () => {
    if (audio.musicTimer) { clearTimeout(audio.musicTimer); audio.musicTimer = null; }
  };

  return audio;
}
