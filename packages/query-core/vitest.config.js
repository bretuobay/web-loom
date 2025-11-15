import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{js,ts}'],
    testTimeout: 60000, // Increased to 60s for slower CI environments
    hookTimeout: 60000, // Increased to 60s for slower CI environments
    coverage: {
      enabled: false, // Disable coverage by default to avoid permission issues
    },
  },
  cacheDir: resolve(__dirname, 'node_modules/.vitest'),
});
