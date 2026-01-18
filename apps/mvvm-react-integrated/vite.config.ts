import { defineConfig } from 'vite';
import { resolve } from 'path';
import { createAliases } from '../../scripts/vite-alias';

// Packages this app imports - used for optimizeDeps pre-bundling
const appDependencies = [
  'react',
  'react-dom',
  '@web-loom/design-core',
  '@web-loom/store-core',
  '@web-loom/mvvm-core',
  '@web-loom/query-core',
  '@web-loom/event-bus-core',
  '@web-loom/ui-core',
  '@web-loom/ui-patterns',
  '@repo/shared',
  '@repo/ui-react',
  '@repo/view-models',
];

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
