import { defineConfig } from 'vite';
import { resolve } from 'path';
import { createAliases } from '../../scripts/vite-alias';

// External packages to pre-bundle (not workspace packages which are linked)
const optimizeDepsInclude = ['react', 'react-dom'];

// https://vite.dev/config/
export default defineConfig({
  cacheDir: 'node_modules/.vite',
  server: {
    port: 5177,
    strictPort: true,
  },
  resolve: {
    alias: {
      // Use centralized aliases as base
      ...createAliases(__dirname),
      // App-specific sub-path alias
      '@web-loom/ui-core/react': resolve(__dirname, '../../packages/ui-core/src/adapters/react'),
    },
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
