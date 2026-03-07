/**
 * Snap a value to the nearest integer.
 */
export function snapToGrid(value: number): number {
  return Math.round(value);
}

/**
 * Snap an angle (in radians) to the nearest multiple of PI/2.
 */
export function snapAngle(radians: number): number {
  const halfPi = Math.PI / 2;
  return Math.round(radians / halfPi) * halfPi;
}
