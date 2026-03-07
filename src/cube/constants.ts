import { Color3 } from '@babylonjs/core';

/**
 * Face indices into the 54-facelet array.
 * Each face has 9 facelets numbered left-to-right, top-to-bottom
 * when looking directly at that face.
 *
 * Standard color scheme:
 *   U = White (top)
 *   R = Red (right)
 *   F = Blue (front)
 *   D = Yellow (bottom)
 *   L = Orange (left)
 *   B = Green (back)
 */
export const Face = {
  U: 0,  // Up (White)
  R: 1,  // Right (Red)
  F: 2,  // Front (Blue)
  D: 3,  // Down (Yellow)
  L: 4,  // Left (Orange)
  B: 5,  // Back (Green)
} as const;
export type Face = (typeof Face)[keyof typeof Face];

export const Color = {
  W: 0,  // White
  R: 1,  // Red
  B: 2,  // Blue
  Y: 3,  // Yellow
  O: 4,  // Orange
  G: 5,  // Green
} as const;
export type Color = (typeof Color)[keyof typeof Color];

export const COLOR_NAMES: Record<Color, string> = {
  [Color.W]: 'W',
  [Color.R]: 'R',
  [Color.B]: 'B',
  [Color.Y]: 'Y',
  [Color.O]: 'O',
  [Color.G]: 'G',
};

export const COLOR_VALUES: Record<Color, Color3> = {
  [Color.W]: new Color3(1, 1, 1),
  [Color.R]: new Color3(0.8, 0.05, 0.05),
  [Color.B]: new Color3(0, 0.27, 0.68),
  [Color.Y]: new Color3(1, 0.84, 0),
  [Color.O]: new Color3(1, 0.35, 0),
  [Color.G]: new Color3(0, 0.6, 0.28),
};

export const CUBIE_DARK = new Color3(0.12, 0.12, 0.12);

/**
 * Facelet indices for each face.
 * Face U: indices 0-8
 * Face R: indices 9-17
 * Face F: indices 18-26
 * Face D: indices 27-35
 * Face L: indices 36-44
 * Face B: indices 45-53
 */
export function faceStart(face: Face): number {
  return face * 9;
}

/**
 * The solved state color for each facelet.
 */
export const SOLVED_STATE: Color[] = [
  // U face (0-8)
  Color.W, Color.W, Color.W,
  Color.W, Color.W, Color.W,
  Color.W, Color.W, Color.W,
  // R face (9-17)
  Color.R, Color.R, Color.R,
  Color.R, Color.R, Color.R,
  Color.R, Color.R, Color.R,
  // F face (18-26)
  Color.B, Color.B, Color.B,
  Color.B, Color.B, Color.B,
  Color.B, Color.B, Color.B,
  // D face (27-35)
  Color.Y, Color.Y, Color.Y,
  Color.Y, Color.Y, Color.Y,
  Color.Y, Color.Y, Color.Y,
  // L face (36-44)
  Color.O, Color.O, Color.O,
  Color.O, Color.O, Color.O,
  Color.O, Color.O, Color.O,
  // B face (45-53)
  Color.G, Color.G, Color.G,
  Color.G, Color.G, Color.G,
  Color.G, Color.G, Color.G,
];

/**
 * Facelet ordering for cubejs compatibility.
 * cubejs uses: U R F D L B with URFDLB color letters
 */
export const FACE_TO_CUBEJS: Record<Color, string> = {
  [Color.W]: 'U',
  [Color.R]: 'R',
  [Color.B]: 'F',
  [Color.Y]: 'D',
  [Color.O]: 'L',
  [Color.G]: 'B',
};

export const CUBEJS_TO_COLOR: Record<string, Color> = {
  'U': Color.W,
  'R': Color.R,
  'F': Color.B,
  'D': Color.Y,
  'L': Color.O,
  'B': Color.G,
};
