// Solara Bay — synthesized WebAudio sound. No audio files anywhere.
// Engine hum, sirens, gunshots, pickup chimes, helicopter rotor and music
// are all oscillators and noise buffers built at runtime.

let ctx = null;
let master = null;
let musicGain = null;
let engineOsc = null;
let engineGain = null;
let sirenOsc = null;
let sirenGain = null;
let rotorOsc = null;
let rotorGain = null;
let musicTimer = null;
let musicStep = 0;
let currentStation = -1;

export function initAudio() {
  if (ctx) return;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.5; master.connect(ctx.destination);
    musicGain = ctx.createGain(); musicGain.gain.value = 0.16; musicGain.connect(master);
    engineOsc = ctx.createOscillator(); engineOsc.type = 'sawtooth'; engineOsc.frequency.value = 50;
    engineGain = ctx.createGain(); engineGain.gain.value = 0.0;
    engineOsc.connect(engineGain); engineGain.connect(master); engineOsc.start();
    sirenOsc = ctx.createOscillator(); sirenOsc.type = 'sine'; sirenOsc.frequency.value = 700;
    sirenGain = ctx.createGain(); sirenGain.gain.value = 0.0;
    sirenOsc.connect(sirenGain); sirenGain.connect(master); sirenOsc.start();
    rotorOsc = ctx.createOscillator(); rotorOsc.type = 'square'; rotorOsc.frequency.value = 13;
    rotorGain = ctx.createGain(); rotorGain.gain.value = 0.0;
    rotorOsc.connect(rotorGain); rotorGain.connect(master); rotorOsc.start();
  } catch (e) { ctx = null; }
}

export function resumeAudio() { if (ctx && ctx.state === 'suspended') ctx.resume(); }

function blip(freq, dur, type, vol, slideTo) {
  if (!ctx) return;
  try {
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type = type || 'sine'; o.frequency.value = freq;
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + dur);
    g.gain.setValueAtTime(vol || 0.2, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    o.connect(g); g.connect(master); o.start(); o.stop(ctx.currentTime + dur);
  } catch (e) { /* audio is best-effort */ }
}

function noiseBurst(dur, vol, low) {
  if (!ctx) return;
  try {
    const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = low || 1200;
    const g = ctx.createGain(); g.gain.value = vol || 0.3;
    src.connect(f); f.connect(g); g.connect(master); src.start();
  } catch (e) { /* best-effort */ }
}

export function playShot(kind) {
  if (kind === 'rifle') noiseBurst(0.35, 0.5, 900);
  else if (kind === 'scatter') noiseBurst(0.3, 0.45, 700);
  else if (kind === 'smg') noiseBurst(0.12, 0.28, 1800);
  else noiseBurst(0.18, 0.32, 1400);
}
export function playChime() { blip(880, 0.12, 'sine', 0.2); setTimeout(() => blip(1320, 0.18, 'sine', 0.2), 90); }
export function playCash() { blip(660, 0.1, 'triangle', 0.25); setTimeout(() => blip(990, 0.14, 'triangle', 0.25), 80); }
export function playHit() { blip(180, 0.12, 'square', 0.2, 90); }
export function playBusted() { blip(220, 0.5, 'sawtooth', 0.25, 110); }
export function playCrash() { noiseBurst(0.25, 0.4, 500); }

export function setEngine(rpm, on) {
  if (!ctx) return;
  engineGain.gain.value = on ? 0.03 + rpm * 0.05 : 0.0;
  engineOsc.frequency.value = 45 + rpm * 90;
}
export function setSiren(on, t) {
  if (!ctx) return;
  sirenGain.gain.value = on ? 0.035 : 0.0;
  if (on) sirenOsc.frequency.value = 650 + Math.sin(t * 3.2) * 180;
}
export function setRotor(on) { if (ctx) rotorGain.gain.value = on ? 0.05 : 0.0; }

// --- Music: three stations, three different patterns, all synthesized. ---
// BAY FM 88: slow chill synthwave (minor pad arpeggio).
// SOLARA ROCK 101: driving guitar-like riff (square wave, faster).
// HARBOR NIGHT 76: moody night bass (slow low notes, sparse).
const PATTERNS = [
  { bpm: 92,  wave: 'triangle', notes: [220, 261.6, 329.6, 392, 329.6, 261.6], bass: [110, 87.3, 98, 110] },
  { bpm: 132, wave: 'square',   notes: [164.8, 196, 246.9, 196, 164.8, 220],  bass: [82.4, 82.4, 98, 110] },
  { bpm: 70,  wave: 'sine',     notes: [196, 174.6, 146.8, 174.6, 196, 233.1], bass: [65.4, 58.3, 73.4, 65.4] },
];

export function startStation(index) {
  if (!ctx) return;
  currentStation = index;
  musicStep = 0;
  if (musicTimer) clearInterval(musicTimer);
  const pat = PATTERNS[index % PATTERNS.length];
  const stepMs = 60000 / pat.bpm / 2;
  musicTimer = setInterval(() => {
    if (!ctx || musicStep < 0) return;
    const n = pat.notes[musicStep % pat.notes.length];
    const b = pat.bass[Math.floor(musicStep / 2) % pat.bass.length];
    note(n, stepMs * 0.9, pat.wave, 0.5);
    if (musicStep % 2 === 0) note(b, stepMs * 1.8, 'sine', 0.7);
    musicStep++;
  }, stepMs);
}

function note(freq, ms, type, vol) {
  if (!ctx) return;
  try {
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(0.12 * vol, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + ms / 1000);
    o.connect(g); g.connect(musicGain); o.start(); o.stop(ctx.currentTime + ms / 1000 + 0.05);
  } catch (e) { /* best-effort */ }
}

export function stopMusic() {
  if (musicTimer) { clearInterval(musicTimer); musicTimer = null; }
  currentStation = -1;
}
export function stationName(i) { return ['BAY FM 88', 'SOLARA ROCK 101', 'HARBOR NIGHT 76'][i % 3]; }
