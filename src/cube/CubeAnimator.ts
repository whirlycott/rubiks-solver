import {
  TransformNode,
  Vector3,
  Scene,
  Animation,
  QuadraticEase,
  EasingFunction,
  type Animatable,
} from '@babylonjs/core';
import type { CubeRenderer } from './CubeRenderer.js';
import type { CubeState } from './CubeState.js';
import type { MoveId } from './moves.js';

interface MoveAnimation {
  axis: 'x' | 'y' | 'z';
  layer: number;
  angle: number;
}

const MOVE_ANIMATIONS: Record<string, MoveAnimation> = {
  'U':  { axis: 'y', layer: 1,  angle: -Math.PI / 2 },
  'U\'': { axis: 'y', layer: 1,  angle: Math.PI / 2 },
  'U2': { axis: 'y', layer: 1,  angle: -Math.PI },
  'D':  { axis: 'y', layer: -1, angle: Math.PI / 2 },
  'D\'': { axis: 'y', layer: -1, angle: -Math.PI / 2 },
  'D2': { axis: 'y', layer: -1, angle: Math.PI },
  'R':  { axis: 'x', layer: 1,  angle: -Math.PI / 2 },
  'R\'': { axis: 'x', layer: 1,  angle: Math.PI / 2 },
  'R2': { axis: 'x', layer: 1,  angle: -Math.PI },
  'L':  { axis: 'x', layer: -1, angle: Math.PI / 2 },
  'L\'': { axis: 'x', layer: -1, angle: -Math.PI / 2 },
  'L2': { axis: 'x', layer: -1, angle: Math.PI },
  'F':  { axis: 'z', layer: 1,  angle: -Math.PI / 2 },
  'F\'': { axis: 'z', layer: 1,  angle: Math.PI / 2 },
  'F2': { axis: 'z', layer: 1,  angle: -Math.PI },
  'B':  { axis: 'z', layer: -1, angle: Math.PI / 2 },
  'B\'': { axis: 'z', layer: -1, angle: -Math.PI / 2 },
  'B2': { axis: 'z', layer: -1, angle: Math.PI },
};

export class CubeAnimator {
  private scene: Scene;
  private renderer: CubeRenderer;
  private currentAnimation: Animatable | null = null;
  private _isAnimating = false;

  get isAnimating(): boolean {
    return this._isAnimating;
  }

  constructor(scene: Scene, renderer: CubeRenderer) {
    this.scene = scene;
    this.renderer = renderer;
  }

  /**
   * Animate a single move on the 3D cube.
   * Updates the logical state after animation completes.
   */
  animateMove(move: MoveId, state: CubeState, durationMs: number = 300): Promise<void> {
    return new Promise((resolve) => {
      const moveAnim = MOVE_ANIMATIONS[move];
      if (!moveAnim) {
        state.applyMoveInPlace(move);
        this.renderer.syncFromState(state);
        resolve();
        return;
      }

      this._isAnimating = true;

      const cubies = this.renderer.getCubiesOnFace(moveAnim.axis, moveAnim.layer);

      // Create pivot
      const pivot = new TransformNode('pivot', this.scene);
      pivot.parent = this.renderer.root;
      pivot.position = Vector3.Zero();

      // Save original positions and parents before reparenting
      const originalParents: TransformNode[] = [];
      const originalPositions: Vector3[] = [];
      for (const cubie of cubies) {
        originalParents.push(cubie.parent as TransformNode);
        originalPositions.push(cubie.position.clone());
        cubie.parent = pivot;
      }

      // Create rotation animation
      const rotationProp = moveAnim.axis === 'x' ? 'rotation.x'
        : moveAnim.axis === 'y' ? 'rotation.y'
        : 'rotation.z';

      const fps = 60;
      const totalFrames = Math.round((durationMs / 1000) * fps);

      const anim = new Animation(
        'faceRotation',
        rotationProp,
        fps,
        Animation.ANIMATIONTYPE_FLOAT,
        Animation.ANIMATIONLOOPMODE_CONSTANT,
      );

      anim.setKeys([
        { frame: 0, value: 0 },
        { frame: totalFrames, value: moveAnim.angle },
      ]);

      const easingFunction = new QuadraticEase();
      easingFunction.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);
      anim.setEasingFunction(easingFunction);

      pivot.animations = [anim];

      this.currentAnimation = this.scene.beginAnimation(
        pivot,
        0,
        totalFrames,
        false,
        1,
        () => {
          // Reparent back and restore original positions.
          // Cubies stay at their grid positions; only colors change.
          for (let i = 0; i < cubies.length; i++) {
            cubies[i].parent = originalParents[i];
            cubies[i].position = originalPositions[i];
            cubies[i].rotation = Vector3.Zero();
          }

          // Update logical state
          state.applyMoveInPlace(move);

          // Resync colors
          this.renderer.syncFromState(state);

          // Clean up pivot
          pivot.dispose();

          this._isAnimating = false;
          this.currentAnimation = null;
          resolve();
        },
      );
    });
  }

  /**
   * Animate a sequence of moves.
   */
  async animateMoveSequence(
    moves: MoveId[],
    state: CubeState,
    durationMs: number = 300,
    onMove?: (moveIndex: number, move: MoveId) => void,
  ): Promise<void> {
    for (let i = 0; i < moves.length; i++) {
      onMove?.(i, moves[i]);
      await this.animateMove(moves[i], state, durationMs);
    }
  }

  /**
   * Stop the current animation immediately.
   */
  stop(): void {
    if (this.currentAnimation) {
      this.currentAnimation.stop();
      this.currentAnimation = null;
      this._isAnimating = false;
    }
  }
}
