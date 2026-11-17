export const ROADS = [-128, -64, 0, 64, 128];
export const SAVE_KEY = 'solara-bay-story-v4';
export const LANDMARKS = {
  garage: { x: -47, z: 28 },
  drop: { x: 128, z: -93 },
  harbor: { x: 119, z: 136 },
  lighthouse: { x: 192, z: -148 },
};
export const clamp = (v, low, high) => Math.max(low, Math.min(high, v));
export const distance = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
export function headingToward(a, b) {
  return Math.atan2(b.x - a.x, b.z - a.z);
}
export function turnToward(current, target, amount) {
  const difference = Math.atan2(Math.sin(target - current), Math.cos(target - current));
  return current + clamp(difference, -amount, amount);
}
