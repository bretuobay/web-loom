import { defineConfig } from 'vite';
import { createAliases } from '../../scripts/vite-alias';

// https://vite.dev/config/
export default defineConfig({
  cacheDir: 'node_modules/.vite',
  server: {
    port: 5176,
    strictPort: true,
  },
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
