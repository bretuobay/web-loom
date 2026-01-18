import { defineConfig } from 'vite';
import { createAliases } from '../../scripts/vite-alias';

// External packages to pre-bundle (not workspace packages which are linked)
const optimizeDepsInclude = ['react', 'react-dom'];

// https://vite.dev/config/
export default defineConfig({
  cacheDir: 'node_modules/.vite',
  server: {
    port: 5173,
    strictPort: true,
  },
  resolve: {
    alias: createAliases(__dirname),
  },
  optimizeDeps: {
    include: optimizeDepsInclude,
  },
  build: {
    target: 'esnext',
    sourcemap: true,
  },
  define: {
    __DEV__: process.env.NODE_ENV === 'development',
  },
});
