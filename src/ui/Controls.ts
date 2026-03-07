import type { SolveMethod } from '../solver/types.js';

export interface ControlCallbacks {
  onScramble: () => void;
  onSolve: (method: SolveMethod) => void;
  onReset: () => void;
  onStepBack: () => void;
  onPlayPause: () => void;
  onStepForward: () => void;
  onSpeedChange: (speed: number) => void;
}

export class Controls {
  private btnScramble: HTMLButtonElement;
  private btnSolve: HTMLButtonElement;
  private btnReset: HTMLButtonElement;
  private btnStepBack: HTMLButtonElement;
  private btnPlayPause: HTMLButtonElement;
  private btnStepForward: HTMLButtonElement;
  private selectMethod: HTMLSelectElement;
  private speedSlider: HTMLInputElement;
  private loadingIndicator: HTMLElement;

  constructor(callbacks: ControlCallbacks) {
    this.btnScramble = document.getElementById('btn-scramble') as HTMLButtonElement;
    this.btnSolve = document.getElementById('btn-solve') as HTMLButtonElement;
    this.btnReset = document.getElementById('btn-reset') as HTMLButtonElement;
    this.btnStepBack = document.getElementById('btn-step-back') as HTMLButtonElement;
    this.btnPlayPause = document.getElementById('btn-play-pause') as HTMLButtonElement;
    this.btnStepForward = document.getElementById('btn-step-forward') as HTMLButtonElement;
    this.selectMethod = document.getElementById('select-method') as HTMLSelectElement;
    this.speedSlider = document.getElementById('speed-slider') as HTMLInputElement;
    this.loadingIndicator = document.getElementById('loading-indicator')!;

    this.btnScramble.addEventListener('click', () => callbacks.onScramble());
    this.btnSolve.addEventListener('click', () => {
      callbacks.onSolve(this.selectMethod.value as SolveMethod);
    });
    this.btnReset.addEventListener('click', () => callbacks.onReset());
    this.btnStepBack.addEventListener('click', () => callbacks.onStepBack());
    this.btnPlayPause.addEventListener('click', () => callbacks.onPlayPause());
    this.btnStepForward.addEventListener('click', () => callbacks.onStepForward());
    this.speedSlider.addEventListener('input', () => {
      callbacks.onSpeedChange(parseInt(this.speedSlider.value, 10));
    });
  }

  setEnabled(enabled: boolean): void {
    this.btnScramble.disabled = !enabled;
    this.btnSolve.disabled = !enabled;
    this.btnReset.disabled = !enabled;
    this.btnStepBack.disabled = !enabled;
    this.btnPlayPause.disabled = !enabled;
    this.btnStepForward.disabled = !enabled;
  }

  setPlayPauseEnabled(enabled: boolean): void {
    this.btnPlayPause.disabled = !enabled;
  }

  setSolveEnabled(enabled: boolean): void {
    this.btnSolve.disabled = !enabled;
  }

  setPlayPauseIcon(playing: boolean): void {
    // Use Unicode characters for play/pause icons
    this.btnPlayPause.textContent = playing ? '\u23F8' : '\u25B6';
  }

  showLoading(show: boolean, message?: string): void {
    this.loadingIndicator.style.display = show ? 'block' : 'none';
    if (message) this.loadingIndicator.textContent = message;
  }

  getSpeed(): number {
    return parseInt(this.speedSlider.value, 10);
  }
}
