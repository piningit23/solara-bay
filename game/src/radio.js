// Solara Bay — car radio. Three synthesized stations, Q cycles them.
// The radio keeps playing across switches and across on-foot / driving.

import { G } from './state.js';
import { RADIO_STATIONS } from './config.js';
import { startStation, stationName } from './audio.js';

export function initRadio() { G.station = 0; }

export function cycleStation() {
  G.station = (G.station + 1) % RADIO_STATIONS.length;
  startStation(G.station);
  return stationName(G.station);
}

export function startRadio() { startStation(G.station); }

export function stationLabel() {
  const s = RADIO_STATIONS[G.station % RADIO_STATIONS.length];
  return s.name + ' — ' + s.tag;
}
