import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['**/*.test.js'],
    tags: [
      {
        description: 'Integration tests',
        name: 'integration',
        timeout: 15_000,
      },
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text'],
      thresholds: {
        statements: 90,
        branches: 80,
        functions: 90,
        lines: 90,
      },
    },
  },
});
