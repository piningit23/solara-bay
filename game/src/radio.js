// Car radio: three synthesized stations with clearly different music patterns.
// All music is generated with WebAudio oscillators — no audio files.

import { STATIONS } from './config.js';

// Pentatonic-ish step tables, in semitones from each station's root.
const PATTERNS = {
  chill: [0, 3, 5, 7, 10, 12, 10, 7, 5, 3, 0, -2],
  rock: [0, 0, 12, 0, 10, 0, 7, 5, 3, 0, 12, 10],
  night: [0, 0, 0, 7, 0, 10, 12, 10, 7, 3, 0, -5],
};

const WAVE = { chill: 'sine', rock: 'square', night: 'triangle' };

export function createRadio(audio) {
  const radio = {
    index: 0,
    step: 0,
    nextNoteAt: 0,
    ticker: '',
    songs: [
      'Midnight Palms — The Breakers',
      'Salt Air — Marina Lights',
      'Island Loop — DJ Coral',
      'Harbor Glow — Night Ferry',
    ],
    songIndex: 0,
  };

  radio.station = function station() {
    return STATIONS[radio.index];
  };

  radio.cycle = function cycle() {
    radio.index = (radio.index + 1) % STATIONS.length;
    radio.step = 0;
    radio.songIndex = (radio.songIndex + 1) % radio.songs.length;
    radio.ticker = `${radio.station().name} — now playing: ${radio.songs[radio.songIndex]}`;
    return radio.station();
  };

  // Schedule notes ahead of time; call every frame while playing.
  radio.tick = function tick(now) {
    if (!audio.started) return;
    const st = radio.station();
    const beat = 60 / st.bpm;
    if (radio.nextNoteAt < audio.ctx.currentTime) {
      radio.nextNoteAt = audio.ctx.currentTime + 0.05;
    }
    while (radio.nextNoteAt < audio.ctx.currentTime + 0.25) {
      const steps = PATTERNS[st.mood];
      const semitone = steps[radio.step % steps.length];
      const freq = st.root * Math.pow(2, semitone / 12);
      const dur = beat * 0.9;
      audio.note(freq, dur, WAVE[st.mood], st.mood === 'rock' ? 0.12 : 0.18, radio.nextNoteAt);
      // A low root note under every fourth step keeps the groove grounded.
      if (radio.step % 4 === 0) {
        audio.note(st.root / 2, beat * 1.8, 'sine', 0.2, radio.nextNoteAt);
      }
      radio.step += 1;
      radio.nextNoteAt += beat;
    }
  };

  radio.ticker = `${radio.station().name} — now playing: ${radio.songs[0]}`;
  return radio;
}
