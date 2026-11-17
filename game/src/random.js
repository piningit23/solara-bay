export function seeded(seed = 7) { let value = seed; return () => { value = (value * 1664525 + 1013904223) >>> 0; return value / 4294967296; }; }
export function pick(random, list) { return list[Math.floor(random() * list.length) % list.length]; }
