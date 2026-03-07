import {
  Scene,
  TransformNode,
  MeshBuilder,
  StandardMaterial,
  Color3,
  type Mesh,
  Vector3,
} from '@babylonjs/core';
import { COLOR_VALUES, CUBIE_DARK, Face, faceStart } from './constants.js';
import type { CubeState } from './CubeState.js';

interface Cubie {
  root: TransformNode;
  stickers: Map<Face, Mesh>;
  position: [number, number, number]; // grid position
}

/**
 * Maps a cubie grid position and face direction to the facelet index in the 54-facelet array.
 * Grid positions range from -1 to 1 on each axis.
 * Coordinate system: x=right, y=up, z=front (towards camera)
 */
function getFaceletIndex(x: number, y: number, z: number, face: Face): number | null {
  const base = faceStart(face);
  // Facelet indices match cubejs ordering (URFDLB, 9 facelets per face).
  switch (face) {
    case Face.U: // y=1, looking down: back (z=-1) = row 0, front (z=1) = row 2
      if (y !== 1) return null;
      return base + (z + 1) * 3 + (x + 1);

    case Face.R: // x=1, looking from right: row=1-y, col=1-z
      if (x !== 1) return null;
      return base + (1 - y) * 3 + (1 - z);

    case Face.F: // z=1, looking from front: row=1-y, col=x+1
      if (z !== 1) return null;
      return base + (1 - y) * 3 + (x + 1);

    case Face.D: // y=-1, looking up: front (z=1) = row 0, back (z=-1) = row 2
      if (y !== -1) return null;
      return base + (1 - z) * 3 + (x + 1);

    case Face.L: // x=-1, looking from left: row=1-y, col=z+1
      if (x !== -1) return null;
      return base + (1 - y) * 3 + (z + 1);

    case Face.B: // z=-1, looking from back: row=1-y, col=1-x (mirrored)
      if (z !== -1) return null;
      return base + (1 - y) * 3 + (1 - x);
  }
}

export class CubeRenderer {
  private scene: Scene;
  root: TransformNode;
  private cubies: Cubie[] = [];
  private stickerMaterials: Map<string, StandardMaterial> = new Map();
  private darkMaterial: StandardMaterial;

  constructor(scene: Scene) {
    this.scene = scene;
    this.root = new TransformNode('cubeRoot', scene);

    // Create dark material for cubie bodies
    this.darkMaterial = new StandardMaterial('cubieDark', scene);
    this.darkMaterial.diffuseColor = CUBIE_DARK;
    this.darkMaterial.specularColor = new Color3(0.1, 0.1, 0.1);

    this.buildCubies();
  }

  private getOrCreateStickerMaterial(color: Color3, key: string): StandardMaterial {
    let mat = this.stickerMaterials.get(key);
    if (!mat) {
      mat = new StandardMaterial(`sticker_${key}`, this.scene);
      mat.diffuseColor = color;
      mat.specularColor = new Color3(0.3, 0.3, 0.3);
      this.stickerMaterials.set(key, mat);
    }
    return mat;
  }

  private buildCubies(): void {
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          // Skip center cubie
          if (x === 0 && y === 0 && z === 0) continue;

          const cubieRoot = new TransformNode(`cubie_${x}_${y}_${z}`, this.scene);
          cubieRoot.parent = this.root;
          cubieRoot.position.set(x, y, z);

          // Dark body
          const body = MeshBuilder.CreateBox(
            `body_${x}_${y}_${z}`,
            { size: 0.9 },
            this.scene,
          );
          body.material = this.darkMaterial;
          body.parent = cubieRoot;

          // Add stickers for external faces
          const stickers = new Map<Face, Mesh>();

          if (y === 1) stickers.set(Face.U, this.createSticker(cubieRoot, 'U', x, y, z));
          if (y === -1) stickers.set(Face.D, this.createSticker(cubieRoot, 'D', x, y, z));
          if (x === 1) stickers.set(Face.R, this.createSticker(cubieRoot, 'R', x, y, z));
          if (x === -1) stickers.set(Face.L, this.createSticker(cubieRoot, 'L', x, y, z));
          if (z === 1) stickers.set(Face.F, this.createSticker(cubieRoot, 'F', x, y, z));
          if (z === -1) stickers.set(Face.B, this.createSticker(cubieRoot, 'B', x, y, z));

          this.cubies.push({
            root: cubieRoot,
            stickers,
            position: [x, y, z],
          });
        }
      }
    }
  }

  private createSticker(
    parent: TransformNode,
    face: string,
    x: number,
    y: number,
    z: number,
  ): Mesh {
    const sticker = MeshBuilder.CreatePlane(
      `sticker_${face}_${x}_${y}_${z}`,
      { size: 0.85 },
      this.scene,
    );
    sticker.parent = parent;

    const offset = 0.46;
    switch (face) {
      case 'U':
        sticker.position.set(0, offset, 0);
        sticker.rotation.set(Math.PI / 2, 0, 0);
        break;
      case 'D':
        sticker.position.set(0, -offset, 0);
        sticker.rotation.set(-Math.PI / 2, 0, 0);
        break;
      case 'R':
        sticker.position.set(offset, 0, 0);
        sticker.rotation.set(0, -Math.PI / 2, 0);
        break;
      case 'L':
        sticker.position.set(-offset, 0, 0);
        sticker.rotation.set(0, Math.PI / 2, 0);
        break;
      case 'F':
        sticker.position.set(0, 0, offset);
        sticker.rotation.set(0, Math.PI, 0);
        break;
      case 'B':
        sticker.position.set(0, 0, -offset);
        // no rotation needed, plane faces +z by default, we want it facing -z
        break;
    }

    return sticker;
  }

  /**
   * Update sticker colors from the logical CubeState.
   */
  syncFromState(state: CubeState): void {
    for (const cubie of this.cubies) {
      const [x, y, z] = cubie.position;
      for (const [face, mesh] of cubie.stickers) {
        const idx = getFaceletIndex(x, y, z, face);
        if (idx !== null) {
          const color = state.facelets[idx];
          const colorValue = COLOR_VALUES[color];
          const key = `${color}`;
          mesh.material = this.getOrCreateStickerMaterial(colorValue, key);
        }
      }
    }
  }

  /**
   * Get all cubies at a certain face position for animation.
   * Returns cubies whose grid position matches the filter.
   */
  getCubiesOnFace(axis: 'x' | 'y' | 'z', value: number): TransformNode[] {
    return this.cubies
      .filter(c => {
        const pos = c.root.getAbsolutePosition();
        const coord = axis === 'x' ? pos.x : axis === 'y' ? pos.y : pos.z;
        return Math.abs(Math.round(coord) - value) < 0.1;
      })
      .map(c => c.root);
  }

  /**
   * Snap all cubie positions and rotations to grid after animation.
   */
  snapAll(): void {
    for (const cubie of this.cubies) {
      const absPos = cubie.root.getAbsolutePosition();
      cubie.root.position = new Vector3(
        Math.round(absPos.x),
        Math.round(absPos.y),
        Math.round(absPos.z),
      );
      // Reset rotation since we reparent after animation
      cubie.root.rotation = Vector3.Zero();
      cubie.position = [
        Math.round(cubie.root.position.x),
        Math.round(cubie.root.position.y),
        Math.round(cubie.root.position.z),
      ];
    }
  }
}
