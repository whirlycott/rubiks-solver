import { defineConfig } from 'vite';

export default defineConfig({
  base: '/rubiks-solver/',
  test: {
    include: ['tests/**/*.test.ts'],
  },
});
