# Rubik's Cube Solver 3D Demo

## Build & Run

```bash
npm install          # Install dependencies
npm run dev          # Start dev server (Vite)
npm run build        # Type-check + production build
npm run preview      # Preview production build
```

## Test

```bash
npm test             # Run tests once (vitest run)
npm run test:watch   # Run tests in watch mode (vitest)
```

## Stack

- **Vite** + **TypeScript** (strict mode)
- **Babylon.js** for 3D rendering
- **cubejs** for Kociemba two-phase solver
- **cube-solver** for cross solver (CFOP decomposition)
- **Vitest** for unit tests

## Project Structure

- `src/cube/` — Cube state model, 3D renderer, animator, constants, move definitions
- `src/solver/` — Solver service (cubejs wrapper), CFOP stage decomposition
- `src/ui/` — UI controls, move display
- `src/utils/` — Math utilities (snap positions/rotations)
- `tests/` — Unit tests
