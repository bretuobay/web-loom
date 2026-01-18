import { defineConfig } from 'vite';
import { createAliases } from '../../scripts/vite-alias';

// Packages this app imports - used for optimizeDeps pre-bundling
const appDependencies = [
  'react',
  'react-dom',
  '@repo/models',
  '@repo/view-models',
  '@repo/shared',
  '@web-loom/mvvm-core',
  '@web-loom/ui-core',
  '@web-loom/ui-patterns',
];

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
    include: appDependencies,
  },
  build: {
    target: 'esnext',
    sourcemap: true,
  },
  define: {
    __DEV__: process.env.NODE_ENV === 'development',
  },
});
