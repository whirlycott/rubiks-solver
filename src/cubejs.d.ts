declare module 'cubejs' {
  class Cube {
    constructor(other?: any);
    identity(): void;
    toJSON(): any;
    asString(): string;
    static fromString(str: string): Cube;
    clone(): Cube;
    static random(): Cube;
    randomize(): Cube;
    isSolved(): boolean;
    move(arg: string): Cube;
    solve(maxDepth?: number): string;
    static initSolver(): void;
    static scramble(): string;
    static inverse(arg: string): string;
  }
  export default Cube;
}
