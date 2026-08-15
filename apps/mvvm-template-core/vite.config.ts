import { defineConfig } from 'vite';
import { templateCoreLoom } from '@web-loom/template-core-vite';
import { createAliases } from '../../scripts/vite-alias';

export default defineConfig({
  cacheDir: 'node_modules/.vite',
  server: {
    port: 5183,
    strictPort: true,
  },
  plugins: [templateCoreLoom()],
  resolve: {
    alias: createAliases(__dirname),
  },
  build: {
    target: 'esnext',
    sourcemap: true,
  },
  define: {
    __DEV__: process.env.NODE_ENV === 'development',
  },
});
