import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node', // Node environment for CLI tool
    include: ['src/**/*.{test,spec}.{js,ts}', 'test/**/*.{test,spec}.{js,ts}'],
    testTimeout: 30000, // Increased timeout for property-based tests
    hookTimeout: 30000,
    // Property-based testing configuration
    // fast-check will run 100+ iterations by default
    // Individual tests can override with fc.assert(property, { numRuns: N })
  },
});
