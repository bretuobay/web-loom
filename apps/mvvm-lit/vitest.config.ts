import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@repo/models': resolve(__dirname, '../../packages/models/src'),
      '@repo/view-models': resolve(__dirname, '../../packages/view-models/src'),
      '@repo/shared': resolve(__dirname, '../../packages/shared/src'),
      '@web-loom/mvvm-core': resolve(__dirname, '../../packages/mvvm-core/src'),
      '@web-loom/ui-core': resolve(__dirname, '../../packages/ui-core/src'),
      '@web-loom/ui-patterns': resolve(__dirname, '../../packages/ui-patterns/src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/coverage/**', '**/*.d.ts'],
    testTimeout: 10000,
    hookTimeout: 10000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['**/*.d.ts', '**/*.config.*', '**/node_modules/**', '**/dist/**', 'src/**/*.test.*', 'coverage/**'],
    },
  },
});
