import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@web-loom/event-emitter-core': resolve(__dirname, '../event-emitter-core/src/index.ts'),
    },
  },
  test: {
    globals: true, // Optional: to use Vitest's globals like describe, it, expect without importing them
    environment: 'jsdom', // Use jsdom to simulate browser environment
    include: ['src/**/*.{test,spec}.{js,ts}'], // Pattern to find test files
    testTimeout: 20000, // Increased test timeout
    hookTimeout: 20000, // Increased hook timeout
  },
});
