import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts', 'test/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      // Archivos solo de tipos o de reexportación: no generan código ejecutable.
      exclude: ['src/**/*.test.ts', 'src/**/index.ts', 'src/**/tipos.ts', 'src/**/puertos.ts'],
      reporter: ['text', 'html'],
      thresholds: { lines: 100, branches: 100, functions: 100, statements: 100 },
    },
  },
});
