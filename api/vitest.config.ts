import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    environment: 'node',
    // Banco SQLite em memória — rápido, mas mantemos margem em máquina carregada.
    testTimeout: 20_000,
    hookTimeout: 30_000,
  },
});
