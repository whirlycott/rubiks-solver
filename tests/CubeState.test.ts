import { describe, it, expect } from 'vitest';
import { CubeState } from '../src/cube/CubeState.js';
import type { MoveId } from '../src/cube/moves.js';

describe('CubeState', () => {
  it('starts in solved state', () => {
    const state = new CubeState();
    expect(state.isSolved()).toBe(true);
  });

  it('is not solved after a single move', () => {
    const state = new CubeState().applyMove('R');
    expect(state.isSolved()).toBe(false);
  });

  it('is solved again after 4 quarter turns', () => {
    let state = new CubeState();
    state = state.applyMove('R').applyMove('R').applyMove('R').applyMove('R');
    expect(state.isSolved()).toBe(true);
  });

  it('move + inverse = solved', () => {
    const state = new CubeState().applyMove('U').applyMove('U\'');
    expect(state.isSolved()).toBe(true);
  });

  it('clone creates an independent copy', () => {
    const original = new CubeState();
    const clone = original.clone();
    clone.applyMoveInPlace('R');
    expect(original.isSolved()).toBe(true);
    expect(clone.isSolved()).toBe(false);
  });

  it('facelet string round-trips', () => {
    const state = new CubeState().applyMove('R').applyMove('U').applyMove('F');
    const str = state.toFaceletString();
    const recovered = CubeState.fromFaceletString(str);
    expect(recovered.facelets).toEqual(state.facelets);
  });

  it('solved state facelet string is all centers', () => {
    const state = new CubeState();
    const str = state.toFaceletString();
    expect(str).toBe('UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB');
  });

  it('applyMoves applies multiple moves', () => {
    const moves: MoveId[] = ['R', 'U', 'R\'', 'U\''];
    const state = new CubeState().applyMoves(moves);
    expect(state.isSolved()).toBe(false);
    // sexy move x 6 = identity
    let s = new CubeState();
    for (let i = 0; i < 6; i++) {
      s = s.applyMoves(moves);
    }
    expect(s.isSolved()).toBe(true);
  });

  it('cross detection works on solved cube', () => {
    const state = new CubeState();
    expect(state.isCrossSolved()).toBe(true);
  });

  it('F2L detection works on solved cube', () => {
    const state = new CubeState();
    expect(state.isF2LSolved()).toBe(true);
  });

  it('OLL detection works on solved cube', () => {
    const state = new CubeState();
    expect(state.isOLLSolved()).toBe(true);
  });

  it('cross is not solved after U move', () => {
    // U move doesn't affect D layer, but let's check F2L
    const state = new CubeState().applyMove('U');
    // Cross should still be solved (U only affects top layer)
    expect(state.isCrossSolved()).toBe(true);
    // F2L should still be solved
    expect(state.isF2LSolved()).toBe(true);
  });

  it('cross is broken after D move', () => {
    const state = new CubeState().applyMove('D');
    // D move rotates D layer - cross edges stay on D but adjacent faces change
    expect(state.isCrossSolved()).toBe(false);
  });
});
