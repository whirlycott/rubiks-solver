import type { MoveId } from '../cube/moves.js';

export type SolveMethod = 'full' | 'cross' | 'f2l' | 'oll' | 'pll';

export type CFOPStage = 'cross' | 'f2l' | 'oll' | 'pll';

export interface SolveStep {
  stage: CFOPStage;
  moves: MoveId[];
  label: string;
}

export interface SolveResult {
  steps: SolveStep[];
  allMoves: MoveId[];
}
