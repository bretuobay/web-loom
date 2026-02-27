import { cpSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, type PluginOption } from 'vite';

const templateSourceDir = resolve(__dirname, 'src/templates');

function copyTemplatesPlugin(): PluginOption {
  return {
    name: 'copy-create-web-loom-templates',
    closeBundle() {
      const templateOutDir = resolve(__dirname, 'dist/templates');
      rmSync(templateOutDir, { recursive: true, force: true });
      cpSync(templateSourceDir, templateOutDir, { recursive: true });
    },
  };
}

export default defineConfig({
  plugins: [copyTemplatesPlugin()],
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
