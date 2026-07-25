import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
import { createAliases } from '../../scripts/vite-alias';

export default defineConfig({
  resolve: {
    alias: {
      ...createAliases(__dirname),
      '@web-loom/ui-core': resolve(__dirname, '../../packages/ui-core/src'),
      '@web-loom/signals-core': resolve(__dirname, '../../packages/signals-core/src'),
      '@web-loom/mvvm-patterns': resolve(__dirname, '../../packages/mvvm-patterns/src'),
      '@web-loom/template-core': resolve(__dirname, '../../packages/template-core/src'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    globals: true,
  },
});
