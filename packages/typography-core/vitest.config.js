import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true, // Optional: to use Vitest's globals like describe, it, expect without importing them
    environment: 'jsdom', // Use jsdom to simulate browser environment
    include: ['src/**/*.{test,spec}.{js,ts}'], // Pattern to find test files
    testTimeout: 20000, // Increased test timeout
    hookTimeout: 20000, // Increased hook timeout
  },
});
