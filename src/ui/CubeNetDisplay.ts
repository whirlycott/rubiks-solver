import { Color, COLOR_VALUES } from '../cube/constants.js';
import type { CubeState } from '../cube/CubeState.js';

const CELL = 16;
const GAP = 1;
const FACE_SIZE = CELL * 3 + GAP * 2; // 50px
const FACE_GAP = 4;

// CSS hex colors derived from COLOR_VALUES (Color3 components are 0-1 floats)
const COLOR_HEX: Record<Color, string> = {
  [Color.W]: toHex(COLOR_VALUES[Color.W].r, COLOR_VALUES[Color.W].g, COLOR_VALUES[Color.W].b),
  [Color.R]: toHex(COLOR_VALUES[Color.R].r, COLOR_VALUES[Color.R].g, COLOR_VALUES[Color.R].b),
  [Color.B]: toHex(COLOR_VALUES[Color.B].r, COLOR_VALUES[Color.B].g, COLOR_VALUES[Color.B].b),
  [Color.Y]: toHex(COLOR_VALUES[Color.Y].r, COLOR_VALUES[Color.Y].g, COLOR_VALUES[Color.Y].b),
  [Color.O]: toHex(COLOR_VALUES[Color.O].r, COLOR_VALUES[Color.O].g, COLOR_VALUES[Color.O].b),
  [Color.G]: toHex(COLOR_VALUES[Color.G].r, COLOR_VALUES[Color.G].g, COLOR_VALUES[Color.G].b),
};

function toHex(r: number, g: number, b: number): string {
  const to255 = (v: number) => Math.round(v * 255).toString(16).padStart(2, '0');
  return `#${to255(r)}${to255(g)}${to255(b)}`;
}

// Face positions on the grid (col, row in face-units)
const FACE_LAYOUT: { face: number; col: number; row: number; label: string }[] = [
  { face: 0, col: 1, row: 0, label: 'U' }, // U
  { face: 4, col: 0, row: 1, label: 'L' }, // L
  { face: 2, col: 1, row: 1, label: 'F' }, // F
  { face: 1, col: 2, row: 1, label: 'R' }, // R
  { face: 5, col: 3, row: 1, label: 'B' }, // B
  { face: 3, col: 1, row: 2, label: 'D' }, // D
];

const SVG_NS = 'http://www.w3.org/2000/svg';

export class CubeNetDisplay {
  private cells: SVGRectElement[] = [];
  private stateLabel: HTMLDivElement | null = null;

  constructor() {
    const container = document.getElementById('cube-net');
    if (!container) return;

    const svgW = 4 * FACE_SIZE + 3 * FACE_GAP; // 212
    const svgH = 3 * FACE_SIZE + 2 * FACE_GAP; // 158

    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('width', String(svgW));
    svg.setAttribute('height', String(svgH));
    svg.setAttribute('viewBox', `0 0 ${svgW} ${svgH}`);

    // Pre-allocate 54 slots
    this.cells = new Array(54);

    for (const { face, col, row, label } of FACE_LAYOUT) {
      const faceX = col * (FACE_SIZE + FACE_GAP);
      const faceY = row * (FACE_SIZE + FACE_GAP);

      // Draw 9 cells for this face
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          const idx = face * 9 + r * 3 + c;
          const rect = document.createElementNS(SVG_NS, 'rect');
          rect.setAttribute('x', String(faceX + c * (CELL + GAP)));
          rect.setAttribute('y', String(faceY + r * (CELL + GAP)));
          rect.setAttribute('width', String(CELL));
          rect.setAttribute('height', String(CELL));
          rect.setAttribute('rx', '2');
          rect.setAttribute('stroke', '#333');
          rect.setAttribute('stroke-width', '1');
          svg.appendChild(rect);
          this.cells[idx] = rect;
        }
      }

      // Face label at center
      const text = document.createElementNS(SVG_NS, 'text');
      text.setAttribute('x', String(faceX + FACE_SIZE / 2));
      text.setAttribute('y', String(faceY + FACE_SIZE / 2 + 1));
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('dominant-baseline', 'middle');
      text.setAttribute('fill', 'rgba(255,255,255,0.3)');
      text.setAttribute('font-size', '10');
      text.setAttribute('font-family', 'system-ui, sans-serif');
      text.setAttribute('pointer-events', 'none');
      text.textContent = label;
      svg.appendChild(text);
    }

    container.appendChild(svg);

    this.stateLabel = document.createElement('div');
    this.stateLabel.style.cssText = 'font-family: "SF Mono", "Consolas", monospace; font-size: 10px; color: rgba(255,255,255,0.5); margin-top: 6px; word-break: break-all; line-height: 1.3; max-width: ' + svgW + 'px;';
    container.appendChild(this.stateLabel);
  }

  syncFromState(state: CubeState): void {
    const facelets = state.facelets;
    for (let i = 0; i < 54; i++) {
      this.cells[i]?.setAttribute('fill', COLOR_HEX[facelets[i]]);
    }
    if (this.stateLabel) {
      this.stateLabel.textContent = state.toFaceletString();
    }
  }
}
