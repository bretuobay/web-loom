import { defineConfig } from 'vitest/config';
import solid from 'vite-plugin-solid';
import { createAliases } from '../../scripts/vite-alias';

export default defineConfig({
  plugins: [solid()],
  resolve: {
    alias: createAliases(__dirname),
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,ts,jsx,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/coverage/**', '**/*.d.ts'],
    testTimeout: 10000,
    hookTimeout: 10000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        '**/*.d.ts',
        '**/*.config.*',
        '**/node_modules/**',
        '**/dist/**',
        'src/**/*.test.*',
        'src/**/*.spec.*',
        'coverage/**',
      ],
    },
  },
});
