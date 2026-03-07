import { Color, SOLVED_STATE, FACE_TO_CUBEJS, CUBEJS_TO_COLOR } from './constants.js';
import { MOVES, applyPermutation, type MoveId } from './moves.js';

export class CubeState {
  facelets: Color[];

  constructor(facelets?: Color[]) {
    this.facelets = facelets ? [...facelets] : [...SOLVED_STATE];
  }

  /**
   * Apply a single move and return a new CubeState.
   */
  applyMove(move: MoveId): CubeState {
    const perm = MOVES[move];
    if (!perm) throw new Error(`Unknown move: ${move}`);
    return new CubeState(applyPermutation(this.facelets, perm) as Color[]);
  }

  /**
   * Apply a sequence of moves and return a new CubeState.
   */
  applyMoves(moves: MoveId[]): CubeState {
    let state: CubeState = this;
    for (const move of moves) {
      state = state.applyMove(move);
    }
    return state;
  }

  /**
   * Apply a move in-place, mutating this state.
   */
  applyMoveInPlace(move: MoveId): void {
    const perm = MOVES[move];
    if (!perm) throw new Error(`Unknown move: ${move}`);
    this.facelets = applyPermutation(this.facelets, perm) as Color[];
  }

  /**
   * Check if the cube is in solved state.
   */
  isSolved(): boolean {
    for (let i = 0; i < 54; i++) {
      if (this.facelets[i] !== SOLVED_STATE[i]) return false;
    }
    return true;
  }

  /**
   * Check if the bottom cross is solved (4 bottom edges in place).
   * D face center is index 31. The 4 edge facelets on D that belong to the cross:
   * D[1]=28, D[3]=30, D[5]=32, D[7]=34
   * And their adjacent edge facelets must also match their center:
   * D1(28) adj F7(25), D3(30) adj L7(43), D5(32) adj R7(16), D7(34) adj B7(52)
   */
  isCrossSolved(): boolean {
    const f = this.facelets;
    const dColor = SOLVED_STATE[31]; // D center color
    // D edge facelets must be D color
    if (f[28] !== dColor || f[30] !== dColor || f[32] !== dColor || f[34] !== dColor) return false;
    // Adjacent edge facelets must match their face center
    if (f[25] !== SOLVED_STATE[22]) return false; // F7 matches F center
    if (f[43] !== SOLVED_STATE[40]) return false; // L7 matches L center
    if (f[16] !== SOLVED_STATE[13]) return false; // R7 matches R center
    if (f[52] !== SOLVED_STATE[49]) return false; // B7 matches B center
    return true;
  }

  /**
   * Check if the first two layers are solved.
   * All of D face is correct, plus bottom two rows of F, R, B, L faces.
   */
  isF2LSolved(): boolean {
    const f = this.facelets;
    // D face all correct
    for (let i = 27; i <= 35; i++) {
      if (f[i] !== SOLVED_STATE[i]) return false;
    }
    // F face bottom 2 rows (indices 21-26, i.e. rows 1 and 2)
    for (let i = 21; i <= 26; i++) {
      if (f[i] !== SOLVED_STATE[i]) return false;
    }
    // R face bottom 2 rows
    for (let i = 12; i <= 17; i++) {
      if (f[i] !== SOLVED_STATE[i]) return false;
    }
    // L face bottom 2 rows
    for (let i = 39; i <= 44; i++) {
      if (f[i] !== SOLVED_STATE[i]) return false;
    }
    // B face bottom 2 rows
    for (let i = 48; i <= 53; i++) {
      if (f[i] !== SOLVED_STATE[i]) return false;
    }
    return true;
  }

  /**
   * Check if OLL is solved (U face all same color, F2L remains solved).
   */
  isOLLSolved(): boolean {
    if (!this.isF2LSolved()) return false;
    const f = this.facelets;
    const uColor = SOLVED_STATE[4]; // U center
    for (let i = 0; i <= 8; i++) {
      if (f[i] !== uColor) return false;
    }
    return true;
  }

  /**
   * Convert to cubejs facelet string (URFDLB order).
   */
  toFaceletString(): string {
    return this.facelets.map(c => FACE_TO_CUBEJS[c]).join('');
  }

  /**
   * Create a CubeState from a cubejs facelet string.
   */
  static fromFaceletString(str: string): CubeState {
    const facelets = str.split('').map(ch => CUBEJS_TO_COLOR[ch]);
    return new CubeState(facelets);
  }

  /**
   * Create a clone of this state.
   */
  clone(): CubeState {
    return new CubeState([...this.facelets]);
  }
}
