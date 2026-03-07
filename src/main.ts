import {
  Engine,
  Scene,
  ArcRotateCamera,
  HemisphericLight,
  Vector3,
  Color4,
} from '@babylonjs/core';
import { CubeState } from './cube/CubeState.js';
import { CubeRenderer } from './cube/CubeRenderer.js';
import { CubeAnimator } from './cube/CubeAnimator.js';
import { FACE_NAMES, MOVE_SUFFIXES, invertMove, type MoveId } from './cube/moves.js';
import { initSolver, isSolverReady } from './solver/SolverService.js';
import { solve } from './solver/CFOPSolver.js';
import type { SolveMethod, SolveResult, SolveStep } from './solver/types.js';
import { Controls } from './ui/Controls.js';
import { MoveDisplay } from './ui/MoveDisplay.js';
import { CubeNetDisplay } from './ui/CubeNetDisplay.js';

// --- State ---
let cubeState = new CubeState();
let scrambleMoves: MoveId[] = [];
let solveResult: SolveResult | null = null;
let currentMoveIndex = 0;
let isPlaying = false;
let playAbortController: AbortController | null = null;
let animationSpeed = 5; // 1-10 scale
let isBusy = false;

// --- Babylon.js Setup ---
const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement;
const engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
const scene = new Scene(engine);
scene.clearColor = new Color4(0.1, 0.1, 0.18, 1);

const camera = new ArcRotateCamera('camera', -Math.PI / 4, Math.PI / 3, 8, Vector3.Zero(), scene);
camera.attachControl(canvas, true);
camera.lowerRadiusLimit = 5;
camera.upperRadiusLimit = 15;
camera.wheelPrecision = 30;

const light = new HemisphericLight('light', new Vector3(1, 2, 1), scene);
light.intensity = 1.0;
const light2 = new HemisphericLight('light2', new Vector3(-1, -1, -1), scene);
light2.intensity = 0.4;

const renderer = new CubeRenderer(scene);
const animator = new CubeAnimator(scene, renderer);

const cubeNet = new CubeNetDisplay();

renderer.syncFromState(cubeState);
cubeNet.syncFromState(cubeState);

engine.runRenderLoop(() => scene.render());
window.addEventListener('resize', () => engine.resize());

// --- Speed ---
function getMoveDuration(): number {
  // Speed 1 = 600ms, Speed 10 = 80ms
  return Math.max(80, 600 - (animationSpeed - 1) * 58);
}

// --- Scramble ---
function generateScramble(length: number = 22): MoveId[] {
  const moves: MoveId[] = [];
  let lastFace = -1;
  for (let i = 0; i < length; i++) {
    let faceIdx: number;
    do {
      faceIdx = Math.floor(Math.random() * 6);
    } while (faceIdx === lastFace);
    lastFace = faceIdx;
    const suffix = MOVE_SUFFIXES[Math.floor(Math.random() * 3)];
    moves.push((FACE_NAMES[faceIdx] + suffix) as MoveId);
  }
  return moves;
}

async function doScramble(): Promise<void> {
  if (isBusy) return;
  isBusy = true;
  controls.setEnabled(false);
  moveDisplay.clear();
  solveResult = null;
  currentMoveIndex = 0;

  // Reset to solved
  cubeState = new CubeState();
  renderer.syncFromState(cubeState);
  cubeNet.syncFromState(cubeState);

  // Generate and animate scramble
  scrambleMoves = generateScramble();
  await animator.animateMoveSequence(scrambleMoves, cubeState, 80, (idx, move) => {
    moveDisplay.setStage('Scrambling');
    moveDisplay.setMove(move);
    moveDisplay.setCounter(idx + 1, scrambleMoves.length);
  });

  cubeNet.syncFromState(cubeState);
  moveDisplay.setStage('Scrambled');
  moveDisplay.setMove('');
  moveDisplay.setCounter(0, 0);
  isBusy = false;
  controls.setEnabled(true);
}

// --- Solve ---
async function doSolve(method: SolveMethod): Promise<void> {
  if (isBusy || !isSolverReady()) return;
  isBusy = true;
  controls.setEnabled(false);
  moveDisplay.clear();

  try {
    console.log(`Scramble: ${scrambleMoves.join(' ')}`);
    console.log(`State before solve: ${cubeState.toFaceletString()}`);
    solveResult = await solve(cubeState.clone(), scrambleMoves, method);
    console.log(`Method: ${method}, Solution: ${solveResult.allMoves.join(' ')} (${solveResult.allMoves.length} moves)`);
    currentMoveIndex = 0;

    if (solveResult.allMoves.length === 0) {
      moveDisplay.setStage('Already solved');
      isBusy = false;
      controls.setEnabled(true);
      return;
    }

    // Auto-play the solution
    isPlaying = true;
    controls.setPlayPauseIcon(true);
    controls.setPlayPauseEnabled(true);
    await playSolution();
  } catch (err) {
    console.error('Solve error:', err);
    moveDisplay.setStage('Error');
    moveDisplay.setMove(String(err));
  }

  isBusy = false;
  controls.setEnabled(true);
}

async function playSolution(): Promise<void> {
  if (!solveResult) return;

  playAbortController = new AbortController();
  const signal = playAbortController.signal;

  // Find which step and move we're at
  let globalIdx = 0;
  for (const step of solveResult.steps) {
    for (let i = 0; i < step.moves.length; i++) {
      if (globalIdx >= currentMoveIndex) {
        if (signal.aborted) { isPlaying = false; controls.setPlayPauseIcon(false); return; }
        moveDisplay.setStage(step.label);
        moveDisplay.setMove(step.moves[i]);
        moveDisplay.setCounter(globalIdx + 1, solveResult.allMoves.length);
        await animator.animateMove(step.moves[i], cubeState, getMoveDuration());
        cubeNet.syncFromState(cubeState);
        console.log(`[${step.label}] ${globalIdx + 1}/${solveResult.allMoves.length} ${step.moves[i]} → ${cubeState.toFaceletString()}`);
        currentMoveIndex = globalIdx + 1;
        if (signal.aborted) { isPlaying = false; controls.setPlayPauseIcon(false); return; }
      }
      globalIdx++;
    }
  }

  isPlaying = false;
  controls.setPlayPauseIcon(false);
  const lastStep = solveResult.steps[solveResult.steps.length - 1];
  moveDisplay.setStage(`${lastStep?.label ?? ''} complete`);
  moveDisplay.setMove('');
}

function stopPlayback(): void {
  if (playAbortController) {
    playAbortController.abort();
    playAbortController = null;
  }
  isPlaying = false;
  isBusy = false;
  controls.setPlayPauseIcon(false);
  controls.setEnabled(true);
}

// --- Step controls ---
async function stepForward(): Promise<void> {
  if (isBusy || !solveResult || currentMoveIndex >= solveResult.allMoves.length) return;
  isBusy = true;
  controls.setEnabled(false);

  const move = solveResult.allMoves[currentMoveIndex];
  const step = findStepForIndex(currentMoveIndex);
  moveDisplay.setStage(step?.label ?? '');
  moveDisplay.setMove(move);
  moveDisplay.setCounter(currentMoveIndex + 1, solveResult.allMoves.length);
  await animator.animateMove(move, cubeState, getMoveDuration());
  cubeNet.syncFromState(cubeState);
  currentMoveIndex++;

  if (currentMoveIndex >= solveResult.allMoves.length) {
    const lastStep = solveResult.steps[solveResult.steps.length - 1];
    moveDisplay.setStage(`${lastStep?.label ?? ''} complete`);
    moveDisplay.setMove('');
  }

  isBusy = false;
  controls.setEnabled(true);
}

function findStepForIndex(globalIdx: number): SolveStep | null {
  if (!solveResult) return null;
  let idx = 0;
  for (const step of solveResult.steps) {
    if (globalIdx < idx + step.moves.length) return step;
    idx += step.moves.length;
  }
  return null;
}

async function stepBack(): Promise<void> {
  if (isBusy || !solveResult || currentMoveIndex <= 0) return;
  isBusy = true;
  controls.setEnabled(false);

  // Animate the inverse of the last applied move
  const lastMove = solveResult.allMoves[currentMoveIndex - 1];
  const inverse = invertMove(lastMove);
  await animator.animateMove(inverse, cubeState, getMoveDuration());
  cubeNet.syncFromState(cubeState);
  currentMoveIndex--;

  const step = findStepForIndex(currentMoveIndex);
  moveDisplay.setStage(step?.label ?? '');
  moveDisplay.setMove(currentMoveIndex < solveResult.allMoves.length ? solveResult.allMoves[currentMoveIndex] : '');
  moveDisplay.setCounter(currentMoveIndex, solveResult.allMoves.length);

  isBusy = false;
  controls.setEnabled(true);
}

async function togglePlayPause(): Promise<void> {
  if (!solveResult) return;
  if (isPlaying) {
    stopPlayback();
  } else if (currentMoveIndex < solveResult.allMoves.length) {
    isPlaying = true;
    controls.setPlayPauseIcon(true);
    isBusy = true;
    controls.setEnabled(false);
    controls.setPlayPauseEnabled(true);
    await playSolution();
    isBusy = false;
    controls.setEnabled(true);
  }
}

function doReset(): void {
  if (isBusy) return;
  stopPlayback();
  cubeState = new CubeState();
  scrambleMoves = [];
  solveResult = null;
  currentMoveIndex = 0;
  renderer.syncFromState(cubeState);
  cubeNet.syncFromState(cubeState);
  moveDisplay.clear();
}

// --- UI Setup ---
const controls = new Controls({
  onScramble: doScramble,
  onSolve: doSolve,
  onReset: doReset,
  onStepBack: stepBack,
  onPlayPause: togglePlayPause,
  onStepForward: stepForward,
  onSpeedChange: (speed) => { animationSpeed = speed; },
});

const moveDisplay = new MoveDisplay();

// Initialize solver in background
controls.showLoading(true, 'Initializing solver...');
controls.setSolveEnabled(false);
initSolver((msg) => {
  controls.showLoading(true, msg);
}).then(() => {
  controls.showLoading(false);
  controls.setSolveEnabled(true);
}).catch((err) => {
  console.error('Failed to initialize solver:', err);
  controls.showLoading(true, 'Solver failed to load');
});
