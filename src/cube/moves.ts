/**
 * Move definitions as permutation arrays on the 54-facelet array.
 *
 * Each permutation P means: result[i] = state[P[i]] (P[i] is the source position for target i).
 *
 * Permutations are computed from physical 3D coordinates and rotation matrices.
 */

export type MoveId =
  | 'U' | 'U\'' | 'U2'
  | 'R' | 'R\'' | 'R2'
  | 'F' | 'F\'' | 'F2'
  | 'D' | 'D\'' | 'D2'
  | 'L' | 'L\'' | 'L2'
  | 'B' | 'B\'' | 'B2';

// --- Coordinate system ---
// x: -1=left, +1=right
// y: -1=down, +1=up
// z: -1=back, +1=front
//
// Faces and their normal directions:
// U: y=+1, R: x=+1, F: z=+1, D: y=-1, L: x=-1, B: z=-1
//
// Facelet indexing per face (9 facelets each, 0-8):
//   0 1 2
//   3 4 5
//   6 7 8

// --- Face coordinate mappings ---
// Given a grid position (x, y, z) on a face, return the facelet index (0-8) within that face.
// "Looking at" the face from outside the cube.

interface FaceInfo {
  offset: number;       // Starting facelet index (face * 9)
  axis: 'x' | 'y' | 'z';  // Which axis is fixed
  value: number;        // The fixed value for that axis (-1 or +1)
  // Row and column mapping from the two free axes
  // Given the two free coordinates, compute row (0-2) and col (0-2)
  rowFn: (x: number, y: number, z: number) => number;
  colFn: (x: number, y: number, z: number) => number;
}

const FACES: FaceInfo[] = [
  { // U face (y=1): back (z=-1)=row0, front (z=1)=row2
    offset: 0, axis: 'y', value: 1,
    rowFn: (_x: number, _y: number, z: number) => z + 1,
    colFn: (x: number) => x + 1,
  },
  { // R face (x=1): row=1-y, col=1-z
    offset: 9, axis: 'x', value: 1,
    rowFn: (_x: number, y: number) => 1 - y,
    colFn: (_x: number, _y: number, z: number) => 1 - z,
  },
  { // F face (z=1): row=1-y, col=x+1
    offset: 18, axis: 'z', value: 1,
    rowFn: (_x: number, y: number) => 1 - y,
    colFn: (x: number) => x + 1,
  },
  { // D face (y=-1): front (z=1)=row0, back (z=-1)=row2
    offset: 27, axis: 'y', value: -1,
    rowFn: (_x: number, _y: number, z: number) => 1 - z,
    colFn: (x: number) => x + 1,
  },
  { // L face (x=-1): row=1-y, col=z+1
    offset: 36, axis: 'x', value: -1,
    rowFn: (_x: number, y: number) => 1 - y,
    colFn: (_x: number, _y: number, z: number) => z + 1,
  },
  { // B face (z=-1): row=1-y, col=1-x (mirrored)
    offset: 45, axis: 'z', value: -1,
    rowFn: (_x: number, y: number) => 1 - y,
    colFn: (x: number) => 1 - x,
  },
];

/**
 * Get the facelet index for a sticker at position (x,y,z) facing the given face.
 */
function getFaceletAt(x: number, y: number, z: number, faceIdx: number): number {
  const face = FACES[faceIdx];
  const row = face.rowFn(x, y, z);
  const col = face.colFn(x, y, z);
  return face.offset + row * 3 + col;
}

/**
 * For each face, determine which face a sticker at (x,y,z) belongs to.
 */
function getStickerFace(x: number, y: number, z: number, normal: [number, number, number]): number | null {
  const [nx, ny, nz] = normal;
  if (ny === 1 && y === 1) return 0;   // U
  if (nx === 1 && x === 1) return 1;   // R
  if (nz === 1 && z === 1) return 2;   // F
  if (ny === -1 && y === -1) return 3;  // D
  if (nx === -1 && x === -1) return 4;  // L
  if (nz === -1 && z === -1) return 5;  // B
  return null;
}

type RotationFn = (x: number, y: number, z: number) => [number, number, number];

/**
 * CW rotation when looking from the positive axis direction.
 */
const ROTATIONS: Record<string, RotationFn> = {
  // CW around +y axis (looking down): -90° around y → (x,y,z) → (-z, y, x)
  'y+': (x, y, z) => [-z, y, x],
  // CW around -y axis (looking up): +90° around y → (x,y,z) → (z, y, -x)
  'y-': (x, y, z) => [z, y, -x],
  // CW around +x axis (looking from right): -90° around x → (x,y,z) → (x, z, -y)
  'x+': (x, y, z) => [x, z, -y],
  // CW around -x axis (looking from left): +90° around x → (x,y,z) → (x, -z, y)
  'x-': (x, y, z) => [x, -z, y],
  // CW around +z axis (looking from front): -90° around z → (x,y,z) → (y, -x, z)
  'z+': (x, y, z) => [y, -x, z],
  // CW around -z axis (looking from back): +90° around z → (x,y,z) → (-y, x, z)
  'z-': (x, y, z) => [-y, x, z],
};

// Move definitions: which axis and direction for CW rotation of each face
const MOVE_DEFS: Record<string, { axis: 'x' | 'y' | 'z'; value: number; rotKey: string }> = {
  'U': { axis: 'y', value: 1, rotKey: 'y+' },
  'D': { axis: 'y', value: -1, rotKey: 'y-' },
  'R': { axis: 'x', value: 1, rotKey: 'x+' },
  'L': { axis: 'x', value: -1, rotKey: 'x-' },
  'F': { axis: 'z', value: 1, rotKey: 'z+' },
  'B': { axis: 'z', value: -1, rotKey: 'z-' },
};

/**
 * All stickers on the cube. Each sticker has:
 * - position (x, y, z): cubie position
 * - normal: which direction the sticker faces
 * - faceIdx: which face it belongs to
 * - faceletIdx: the 0-53 facelet index
 */
interface Sticker {
  x: number;
  y: number;
  z: number;
  normal: [number, number, number];
  faceIdx: number;
  faceletIdx: number;
}

function buildAllStickers(): Sticker[] {
  const stickers: Sticker[] = [];
  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        if (x === 0 && y === 0 && z === 0) continue;
        const normals: [number, number, number][] = [];
        if (y === 1) normals.push([0, 1, 0]);
        if (y === -1) normals.push([0, -1, 0]);
        if (x === 1) normals.push([1, 0, 0]);
        if (x === -1) normals.push([-1, 0, 0]);
        if (z === 1) normals.push([0, 0, 1]);
        if (z === -1) normals.push([0, 0, -1]);

        for (const normal of normals) {
          const faceIdx = getStickerFace(x, y, z, normal);
          if (faceIdx !== null) {
            const faceletIdx = getFaceletAt(x, y, z, faceIdx);
            stickers.push({ x, y, z, normal, faceIdx, faceletIdx });
          }
        }
      }
    }
  }
  return stickers;
}

/**
 * Build the permutation for a face move.
 * Returns perm[] where result[i] = state[perm[i]].
 */
function buildMovePermutation(moveName: string): number[] {
  const def = MOVE_DEFS[moveName];
  const rot = ROTATIONS[def.rotKey];
  const allStickers = buildAllStickers();

  // Identity permutation
  const perm = Array.from({ length: 54 }, (_, i) => i);

  // For each sticker on the affected layer
  for (const sticker of allStickers) {
    const coord = def.axis === 'x' ? sticker.x : def.axis === 'y' ? sticker.y : sticker.z;
    if (coord !== def.value) continue;

    // Compute new position and normal after rotation
    const [nx, ny, nz] = rot(sticker.x, sticker.y, sticker.z);
    const [nnx, nny, nnz] = rot(...sticker.normal);

    // Find which face this sticker ends up on
    const newFaceIdx = getStickerFace(nx, ny, nz, [nnx, nny, nnz]);
    if (newFaceIdx === null) continue;

    const newFaceletIdx = getFaceletAt(nx, ny, nz, newFaceIdx);

    // After rotation: the sticker that was at faceletIdx is now at newFaceletIdx
    // So: result[newFaceletIdx] = state[faceletIdx]
    // Which means: perm[newFaceletIdx] = faceletIdx
    perm[newFaceletIdx] = sticker.faceletIdx;
  }

  return perm;
}

/**
 * Invert a permutation.
 */
function invertPermutation(perm: number[]): number[] {
  const result = new Array(perm.length);
  for (let i = 0; i < perm.length; i++) {
    result[perm[i]] = i;
  }
  return result;
}

/**
 * Compose two permutations: apply p1 first, then p2.
 * result[i] = state[p1[p2[i]]]... no.
 * If applyPermutation does result[i] = state[p[i]], then:
 *   after p1: r1[i] = state[p1[i]]
 *   after p2: r2[i] = r1[p2[i]] = state[p1[p2[i]]]
 * So combined[i] = p1[p2[i]]
 */
function composePermutations(p1: number[], p2: number[]): number[] {
  const result = new Array(p1.length);
  for (let i = 0; i < p1.length; i++) {
    result[i] = p1[p2[i]];
  }
  return result;
}

// Build all 18 move permutations
const U_PERM = buildMovePermutation('U');
const R_PERM = buildMovePermutation('R');
const F_PERM = buildMovePermutation('F');
const D_PERM = buildMovePermutation('D');
const L_PERM = buildMovePermutation('L');
const B_PERM = buildMovePermutation('B');

export const MOVES: Record<MoveId, number[]> = {
  'U': U_PERM,
  'U\'': invertPermutation(U_PERM),
  'U2': composePermutations(U_PERM, U_PERM),
  'R': R_PERM,
  'R\'': invertPermutation(R_PERM),
  'R2': composePermutations(R_PERM, R_PERM),
  'F': F_PERM,
  'F\'': invertPermutation(F_PERM),
  'F2': composePermutations(F_PERM, F_PERM),
  'D': D_PERM,
  'D\'': invertPermutation(D_PERM),
  'D2': composePermutations(D_PERM, D_PERM),
  'L': L_PERM,
  'L\'': invertPermutation(L_PERM),
  'L2': composePermutations(L_PERM, L_PERM),
  'B': B_PERM,
  'B\'': invertPermutation(B_PERM),
  'B2': composePermutations(B_PERM, B_PERM),
};

/**
 * Apply a permutation to a state array.
 * perm[i] tells us which position's value goes into position i.
 */
export function applyPermutation(state: readonly number[], perm: number[]): number[] {
  const result = new Array(state.length);
  for (let i = 0; i < state.length; i++) {
    result[i] = state[perm[i]];
  }
  return result;
}

/**
 * Parse a move string like "R U' F2" into an array of MoveIds.
 */
export function parseMoveString(moveString: string): MoveId[] {
  if (!moveString.trim()) return [];
  return moveString.trim().split(/\s+/) as MoveId[];
}

/**
 * All face move names (for scramble generation).
 */
export const FACE_NAMES = ['U', 'R', 'F', 'D', 'L', 'B'] as const;
export const MOVE_SUFFIXES = ['', '\'', '2'] as const;
