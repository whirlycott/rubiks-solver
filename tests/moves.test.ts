import { describe, it, expect } from 'vitest';
import { MOVES, applyPermutation, type MoveId } from '../src/cube/moves.js';
import { SOLVED_STATE } from '../src/cube/constants.js';

function applyMoveToState(state: number[], move: MoveId): number[] {
  return applyPermutation(state, MOVES[move]);
}

function applyMovesN(state: number[], move: MoveId, n: number): number[] {
  let result = state;
  for (let i = 0; i < n; i++) {
    result = applyMoveToState(result, move);
  }
  return result;
}

describe('moves', () => {
  const baseMoves: MoveId[] = ['U', 'R', 'F', 'D', 'L', 'B'];

  it('move x 4 = identity for all base moves', () => {
    for (const move of baseMoves) {
      const result = applyMovesN([...SOLVED_STATE], move, 4);
      expect(result).toEqual(SOLVED_STATE);
    }
  });

  it('move + inverse = identity for all moves', () => {
    for (const move of baseMoves) {
      const prime = (move + '\'') as MoveId;
      let state = applyMoveToState([...SOLVED_STATE], move);
      state = applyMoveToState(state, prime);
      expect(state).toEqual(SOLVED_STATE);
    }
  });

  it('move2 = move + move for all moves', () => {
    for (const move of baseMoves) {
      const double = (move + '2') as MoveId;
      const fromDouble = applyMoveToState([...SOLVED_STATE], double);
      const fromTwice = applyMovesN([...SOLVED_STATE], move, 2);
      expect(fromDouble).toEqual(fromTwice);
    }
  });

  it('inverse x 4 = identity for all primes', () => {
    for (const move of baseMoves) {
      const prime = (move + '\'') as MoveId;
      const result = applyMovesN([...SOLVED_STATE], prime, 4);
      expect(result).toEqual(SOLVED_STATE);
    }
  });

  it('double x 2 = identity for all double moves', () => {
    for (const move of baseMoves) {
      const double = (move + '2') as MoveId;
      const result = applyMovesN([...SOLVED_STATE], double, 2);
      expect(result).toEqual(SOLVED_STATE);
    }
  });

  it('all 18 moves are defined', () => {
    const allMoves: MoveId[] = [
      'U', 'U\'', 'U2', 'R', 'R\'', 'R2',
      'F', 'F\'', 'F2', 'D', 'D\'', 'D2',
      'L', 'L\'', 'L2', 'B', 'B\'', 'B2',
    ];
    for (const move of allMoves) {
      expect(MOVES[move]).toBeDefined();
      expect(MOVES[move]).toHaveLength(54);
    }
  });

  it('each permutation is a valid permutation (bijection)', () => {
    for (const [name, perm] of Object.entries(MOVES)) {
      const sorted = [...perm].sort((a, b) => a - b);
      expect(sorted, `${name} should be a valid permutation`).toEqual(
        Array.from({ length: 54 }, (_, i) => i)
      );
    }
  });
});
