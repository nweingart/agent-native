import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    globals: true,
    coverage: {
      thresholds: {
        statements: 80,
        functions: 80,
        lines: 80,
      },
    },
  },
});
