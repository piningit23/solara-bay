// Solara Bay — car radio: 3 synthesized stations, Q cycles them.
// Each station has its own tempo, waveform feel and ticker lines.

export const STATIONS = [
  {
    id: 0, name: 'BAY FM 88', genre: 'chill synthwave',
    songs: ['Sunset Over Solara — The Palms', 'Harbor Lights — Marina Blue', 'Slow Tide — Coral Static'],
  },
  {
    id: 1, name: 'SOLARA ROCK 101', genre: 'driving rock riff',
    songs: ['Asphalt Heart — The Breakers', 'Full Throttle — Neon Coast', 'Redline — V8 Sunday'],
  },
  {
    id: 2, name: 'HARBOR NIGHT 76', genre: 'moody night bass',
    songs: ['Low Tide — Dockside Ghost', 'Neon Rain — Velvet Pier', 'Last Ferry — Midnight Union'],
  },
];

export function createRadio(audio) {
  const radio = {
    station: 0,
    songIndex: 0,
    on: true,
    songTimer: 0,
  };

  radio.current = () => STATIONS[radio.station];
  radio.song = () => radio.current().songs[radio.songIndex];

  radio.cycle = () => {
    radio.station = (radio.station + 1) % STATIONS.length;
    radio.songIndex = (radio.songIndex + 1) % 3;
    audio.startMusic(radio.station);
    return radio.current().name;
  };

  radio.start = () => { audio.startMusic(radio.station); };

  radio.update = (dt) => {
    radio.songTimer += dt;
    if (radio.songTimer > 24) {
      radio.songTimer = 0;
      radio.songIndex = (radio.songIndex + 1) % 3;
    }
  };

  return radio;
}
