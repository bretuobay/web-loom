import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { resolve } from 'path';
import { createAliases } from '../../scripts/vite-alias';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5180,
    strictPort: true,
  },
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      ...createAliases(__dirname),
      '@web-loom/ui-core': resolve(__dirname, '../../packages/ui-core/dist/index.js'),
      '@web-loom/signals-core': resolve(__dirname, '../../packages/signals-core/src'),
      '@web-loom/mvvm-patterns': resolve(__dirname, '../../packages/mvvm-patterns/src'),
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
});
