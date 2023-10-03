export function easeInOut(t: number, power: number): number {
  if (t < 0.5) {
    return Math.pow(2 * t, power) / 2
  }
  return 1 - Math.pow(2 * (1 - t), power) / 2
}
