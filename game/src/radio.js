export const STATIONS = [
  { name: 'BAY FM 88', song: 'PALM STATIC — Golden Hour', bpm: 86, notes: [57, 64, 69, 64, 60, 67, 72, 67], type: 'sine' },
  { name: 'SOLARA ROCK 101', song: 'THE BREAKERS — Run the Causeway', bpm: 142, notes: [40, 40, 52, 43, 40, 47, 45, 43], type: 'sawtooth' },
  { name: 'HARBOR NIGHT 76', song: 'LOW TIDE — After the Last Ferry', bpm: 108, notes: [33, 33, 40, 36, 33, 43, 40, 31], type: 'triangle' },
  { name: 'RADIO OFF', song: 'Just the island. Q to tune in.', bpm: 90, notes: [], type: 'sine' }
];
export function createRadio(audio) {
  let station = 0;
  let beat = 0;
  let clock = 0;
  return {
    get current() { return STATIONS[station]; },
    get index() { return station; },
    cycle() { station = (station + 1) % STATIONS.length; clock = 0; },
    update(dt) {
      if (!audio.ready) return;
      clock -= dt;
      const s = STATIONS[station];
      if (clock > 0 || !s.notes.length) return;
      clock = 60 / s.bpm / 2;
      const note = s.notes[beat % s.notes.length];
      const hz = 440 * 2 ** ((note - 69) / 12);
      audio.tone(hz, clock * 1.6, .14, s.type);
      if (station === 0 && beat % 4 === 0) {
        audio.tone(hz * 2, 1, .08, 'triangle');
        audio.tone(hz * 2.5, 1, .05, 'sine');
      }
      if (station === 1) { audio.tone(hz * 1.5, .12, .09, 'square'); audio.tone(beat % 4 === 0 ? 70 : 1700, .04, .1, 'triangle'); }
      if (station === 2 && beat % 2 === 0) audio.tone(hz * 4, .15, .05, 'sine');
      beat++;
    }
  };
}
