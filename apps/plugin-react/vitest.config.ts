/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
    dedupe: ['react', 'react-dom'],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['tests/**/*.{test,spec}.{js,ts,jsx,tsx}', 'src/**/*.{test,spec}.{js,ts,jsx,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/coverage/**', '**/*.d.ts'],
    testTimeout: 10000,
    hookTimeout: 10000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'tests/**',
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
