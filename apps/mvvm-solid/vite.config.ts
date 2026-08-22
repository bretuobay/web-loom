import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';
import { createAliases } from '../../scripts/vite-alias';

export default defineConfig({
  cacheDir: 'node_modules/.vite',
  plugins: [solid()],
  server: {
    port: 5179,
    strictPort: true,
  },
  resolve: {
    alias: createAliases(__dirname),
  },
  optimizeDeps: {
    include: ['solid-js', 'solid-js/web', '@solidjs/router', 'chart.js'],
  },
  build: {
    target: 'esnext',
    sourcemap: true,
  },
  define: {
    __DEV__: process.env.NODE_ENV === 'development',
  },
});
