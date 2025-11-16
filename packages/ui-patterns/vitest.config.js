import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@web-loom/event-bus-core': path.resolve(__dirname, '../event-bus-core/src/index.ts'),
      '@web-loom/store-core': path.resolve(__dirname, '../store-core/src/index.ts'),
      '@web-loom/ui-core': path.resolve(__dirname, '../ui-core/src/index.ts'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{js,ts}'],
    testTimeout: 20000,
    hookTimeout: 20000,
  },
});
