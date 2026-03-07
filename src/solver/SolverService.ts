import type { MoveId } from '../cube/moves.js';
import { parseMoveString } from '../cube/moves.js';
import type { CubeState } from '../cube/CubeState.js';

// cubejs is a CJS module, we need to handle the import carefully
let CubeJS: any = null;

/**
 * Initialize the cubejs solver. This takes a few seconds.
 */
export async function initSolver(onProgress?: (msg: string) => void): Promise<void> {
  onProgress?.('Loading solver module...');
  const mod = await import('cubejs');
  CubeJS = mod.default || mod;
  onProgress?.('Initializing solver tables...');
  CubeJS.initSolver();
  onProgress?.('Solver ready');
}

/**
 * Check if solver is initialized.
 */
export function isSolverReady(): boolean {
  return CubeJS !== null;
}

/**
 * Solve a cube state and return the solution as moves.
 */
export function solveCube(state: CubeState): MoveId[] {
  if (!CubeJS) throw new Error('Solver not initialized');
  const faceletStr = state.toFaceletString();
  const cube = CubeJS.fromString(faceletStr);
  const solution = cube.solve();
  if (!solution || solution.trim() === '') return [];
  return parseMoveString(solution);
}

/**
 * Solve a cube state given as a facelet string.
 */
export function solveFaceletString(faceletStr: string): MoveId[] {
  if (!CubeJS) throw new Error('Solver not initialized');
  const cube = CubeJS.fromString(faceletStr);
  const solution = cube.solve();
  if (!solution || solution.trim() === '') return [];
  return parseMoveString(solution);
}

/**
 * Solve the cross using cube-solver.
 */
export async function solveCross(scrambleMoves: string): Promise<MoveId[]> {
  const { solve } = await import('cube-solver');
  const solution = solve(scrambleMoves, 'cross');
  if (!solution || solution.trim() === '') return [];
  return parseMoveString(solution);
}
