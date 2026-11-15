import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    environment: 'node',
    // O PGlite (PostgreSQL em WASM) leva alguns segundos para iniciar em máquina carregada.
    testTimeout: 20_000,
    hookTimeout: 30_000,
  },
});
