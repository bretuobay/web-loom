import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'node18',
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: () => 'index.js',
    },
    rollupOptions: {
      // Keep Node built-ins external; no npm runtime deps to bundle
      external: [/^node:/],
      output: {
        banner: '#!/usr/bin/env node',
      },
    },
  },
});
