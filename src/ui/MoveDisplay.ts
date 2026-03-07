export class MoveDisplay {
  private stageLabelEl: HTMLElement;
  private moveTextEl: HTMLElement;
  private moveCounterEl: HTMLElement;

  constructor() {
    this.stageLabelEl = document.getElementById('stage-label')!;
    this.moveTextEl = document.getElementById('move-text')!;
    this.moveCounterEl = document.getElementById('move-counter')!;
  }

  setStage(label: string): void {
    this.stageLabelEl.textContent = label;
  }

  setMove(notation: string): void {
    this.moveTextEl.textContent = notation;
  }

  setCounter(current: number, total: number): void {
    this.moveCounterEl.textContent = total > 0 ? `${current}/${total}` : '';
  }

  clear(): void {
    this.stageLabelEl.textContent = '';
    this.moveTextEl.textContent = '';
    this.moveCounterEl.textContent = '';
  }
}
