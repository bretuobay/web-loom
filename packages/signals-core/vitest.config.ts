import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      enabled: true,
      reporter: ['text', 'html'],
      reportsDirectory: './coverage',
    },
  },
});
