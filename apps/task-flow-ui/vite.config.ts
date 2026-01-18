import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
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
  '@web-loom/event-emitter-core',
  '@web-loom/ui-core',
  '@web-loom/ui-patterns',
  '@repo/shared',
  '@repo/plugin-core',
  '@repo/models',
];

export default defineConfig({
  server: {
    port: 5178,
    strictPort: true,
  },
  plugins: [react()],
  resolve: {
    alias: createAliases(__dirname),
  },
  optimizeDeps: {
    include: appDependencies,
  },
  define: {
    __DEV__: process.env.NODE_ENV === 'development',
  },
});
