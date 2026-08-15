import { defineConfig } from 'vitest/config';
import { templateCoreLoom } from '@web-loom/template-core-vite';
import { createAliases } from '../../scripts/vite-alias';

export default defineConfig({
  plugins: [templateCoreLoom()],
  resolve: {
    alias: createAliases(__dirname),
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    globals: true,
  },
});
