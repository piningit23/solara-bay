let seed = 47291;
export function random() {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 4294967296;
}
export function between(a, b) {
  return a + (b - a) * random();
}
export function pick(values) {
  return values[Math.floor(random() * values.length)];
}
