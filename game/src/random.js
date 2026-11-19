// Solara Bay — small seeded random helper so the city is the same every run.

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pick(rand, list) {
  return list[Math.floor(rand() * list.length)];
}

export function range(rand, min, max) {
  return min + rand() * (max - min);
}

export function intRange(rand, min, max) {
  return Math.floor(range(rand, min, max + 1));
}
