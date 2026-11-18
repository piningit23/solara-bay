export const TITLE = 'SOLARA BAY: island-city crime game — 8 story missions, 5-star police and helicopter chases, car radio, safehouse saves';
export const ROADS = [-144, -72, 0, 72, 144];
export const LIMIT = 184;
export const GARAGE = { x: -144, z: 74 };
export const LIGHTHOUSE = { x: 0, z: -179 };
export const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
export const distance = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
export function randomSource(seed = 8721) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}
