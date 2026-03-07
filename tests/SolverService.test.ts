import { describe, it, expect, beforeAll } from 'vitest';
import { initSolver, solveCube } from '../src/solver/SolverService.js';
import { CubeState } from '../src/cube/CubeState.js';
import type { MoveId } from '../src/cube/moves.js';

describe('SolverService', () => {
  beforeAll(async () => {
    await initSolver();
  }, 30000);

  it('solves a scrambled cube', () => {
    const scramble: MoveId[] = ['R', 'U', 'F', 'D\'', 'L2', 'B', 'R\'', 'U2'];
    const scrambled = new CubeState().applyMoves(scramble);
    expect(scrambled.isSolved()).toBe(false);

    const solution = solveCube(scrambled);
    expect(solution.length).toBeGreaterThan(0);

    const solved = scrambled.applyMoves(solution);
    expect(solved.isSolved()).toBe(true);
  });

  it('solving a solved cube still yields solved state', () => {
    const solved = new CubeState();
    const solution = solveCube(solved);
    // cubejs may return rotation moves for a solved cube
    const afterSolve = solved.applyMoves(solution);
    expect(afterSolve.isSolved()).toBe(true);
  });
});
