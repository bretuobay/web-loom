import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      // More specific patterns must come first
      {
        find: '@web-loom/design-core/design-system',
        replacement: resolve(__dirname, '../design-core/src/design-system'),
      },
      { find: '@web-loom/ui-core/behaviors', replacement: resolve(__dirname, '../ui-core/src/behaviors/index.ts') },
      {
        find: /^@web-loom\/ui-core\/behaviors\/(.*)$/,
        replacement: resolve(__dirname, '../ui-core/src/behaviors/$1.ts'),
      },
      { find: '@web-loom/design-core', replacement: resolve(__dirname, '../design-core/src/index.ts') },
      { find: '@web-loom/ui-core', replacement: resolve(__dirname, '../ui-core/src/index.ts') },
      { find: '@web-loom/ui-patterns', replacement: resolve(__dirname, '../ui-patterns/src/index.ts') },
      { find: '@web-loom/store-core', replacement: resolve(__dirname, '../store-core/src/index.ts') },
      { find: '@web-loom/forms-core', replacement: resolve(__dirname, '../forms-core/src/index.ts') },
      { find: '@web-loom/forms-react', replacement: resolve(__dirname, '../forms-react/src/index.ts') },
      { find: '@web-loom/event-bus-core', replacement: resolve(__dirname, '../event-bus-core/src/index.ts') },
      { find: '@repo/ui-react', replacement: resolve(__dirname, './src') },
    ],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      provider: 'v8',
    },
  },
});
