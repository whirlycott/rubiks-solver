import { CubeState } from '../cube/CubeState.js';
import type { MoveId } from '../cube/moves.js';
import { solveCube, solveCross } from './SolverService.js';
import type { SolveResult, SolveStep, SolveMethod, CFOPStage } from './types.js';

/**
 * Convert moves array to string notation.
 */
function movesToString(moves: MoveId[]): string {
  return moves.join(' ');
}

/**
 * Decompose a full solution into CFOP stages by replaying moves
 * and detecting when milestones are reached.
 */
function decomposeIntoCFOP(state: CubeState, moves: MoveId[]): SolveStep[] {
  const steps: SolveStep[] = [];
  let currentStage: CFOPStage = 'cross';
  let currentMoves: MoveId[] = [];
  const simState = state.clone();

  for (const move of moves) {
    simState.applyMoveInPlace(move);
    currentMoves.push(move);

    if (currentStage === 'cross' && simState.isCrossSolved()) {
      steps.push({ stage: 'cross', moves: [...currentMoves], label: 'Cross' });
      currentMoves = [];
      currentStage = 'f2l';
    } else if (currentStage === 'f2l' && simState.isF2LSolved()) {
      steps.push({ stage: 'f2l', moves: [...currentMoves], label: 'F2L' });
      currentMoves = [];
      currentStage = 'oll';
    } else if (currentStage === 'oll' && simState.isOLLSolved()) {
      steps.push({ stage: 'oll', moves: [...currentMoves], label: 'OLL' });
      currentMoves = [];
      currentStage = 'pll';
    }
  }

  // Remaining moves go to current stage
  if (currentMoves.length > 0) {
    steps.push({ stage: currentStage, moves: currentMoves, label: stageLabel(currentStage) });
  }

  return steps;
}

function stageLabel(stage: CFOPStage): string {
  switch (stage) {
    case 'cross': return 'Cross';
    case 'f2l': return 'F2L';
    case 'oll': return 'OLL';
    case 'pll': return 'PLL';
  }
}

/**
 * Solve using full CFOP decomposition.
 */
async function solveFullCFOP(state: CubeState, scrambleMoves: MoveId[]): Promise<SolveResult> {
  // Try to get a cross-specific solution first
  let crossMoves: MoveId[] = [];
  try {
    crossMoves = await solveCross(movesToString(scrambleMoves));
  } catch {
    // Fallback: will try to decompose the full solution
  }

  if (crossMoves.length > 0) {
    // Apply cross moves, then solve the rest
    const afterCross = state.applyMoves(crossMoves);
    const remainingMoves = solveCube(afterCross);

    const allMoves = [...crossMoves, ...remainingMoves];
    const steps: SolveStep[] = [{ stage: 'cross', moves: crossMoves, label: 'Cross' }];

    // Decompose remaining into F2L/OLL/PLL
    if (remainingMoves.length > 0) {
      const remainingSteps = decomposeIntoStages(afterCross, remainingMoves, 'f2l');
      steps.push(...remainingSteps);
    }

    return { steps, allMoves };
  }

  // Fallback: solve everything and try to decompose
  const allMoves = solveCube(state);
  const steps = decomposeIntoCFOP(state, allMoves);
  return { steps, allMoves };
}

/**
 * Decompose moves starting from a given stage.
 */
function decomposeIntoStages(state: CubeState, moves: MoveId[], startStage: CFOPStage): SolveStep[] {
  const steps: SolveStep[] = [];
  let currentStage = startStage;
  let currentMoves: MoveId[] = [];
  const simState = state.clone();

  for (const move of moves) {
    simState.applyMoveInPlace(move);
    currentMoves.push(move);

    if (currentStage === 'f2l' && simState.isF2LSolved()) {
      steps.push({ stage: 'f2l', moves: [...currentMoves], label: 'F2L' });
      currentMoves = [];
      currentStage = 'oll';
    } else if (currentStage === 'oll' && simState.isOLLSolved()) {
      steps.push({ stage: 'oll', moves: [...currentMoves], label: 'OLL' });
      currentMoves = [];
      currentStage = 'pll';
    }
  }

  if (currentMoves.length > 0) {
    steps.push({ stage: currentStage, moves: currentMoves, label: stageLabel(currentStage) });
  }

  return steps;
}

/**
 * Solve for a specific CFOP stage only.
 * Generates a scramble where prior stages are already solved.
 */
async function solveSingleStage(state: CubeState, scrambleMoves: MoveId[], method: SolveMethod): Promise<SolveResult> {
  // For single stage, we solve the full cube and extract just that stage's moves
  const fullResult = await solveFullCFOP(state, scrambleMoves);

  const targetStage = method as CFOPStage;
  const stageStep = fullResult.steps.find(s => s.stage === targetStage);

  if (stageStep) {
    return {
      steps: [stageStep],
      allMoves: stageStep.moves,
    };
  }

  // If the target stage wasn't found (already solved?), return empty
  return {
    steps: [{ stage: targetStage, moves: [], label: stageLabel(targetStage) }],
    allMoves: [],
  };
}

/**
 * Main solve function. Dispatches to the appropriate solver based on method.
 */
export async function solve(
  state: CubeState,
  scrambleMoves: MoveId[],
  method: SolveMethod,
): Promise<SolveResult> {
  if (method === 'full') {
    return solveFullCFOP(state, scrambleMoves);
  }
  return solveSingleStage(state, scrambleMoves, method);
}
