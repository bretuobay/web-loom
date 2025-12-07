import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node', // Node environment for CLI tool
    include: ['src/**/*.{test,spec}.{js,ts}', 'test/**/*.{test,spec}.{js,ts}'],
    testTimeout: 120000, // Increased timeout for property-based tests, needed for CI and running on slower machines
    hookTimeout: 120000,
    // Property-based testing configuration
    // fast-check will run 100+ iterations by default
    // Individual tests can override with fc.assert(property, { numRuns: N })
  },
});
