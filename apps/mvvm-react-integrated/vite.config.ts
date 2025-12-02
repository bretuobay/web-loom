import { defineConfig } from 'vite';
import { resolve } from 'path';

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@web-loom/design-core': resolve(__dirname, '../../packages/design-core/src'),
      '@web-loom/store-core': resolve(__dirname, '../../packages/store-core/src'),
      '@web-loom/mvvm-core': resolve(__dirname, '../../packages/mvvm-core/src'),
      '@web-loom/query-core': resolve(__dirname, '../../packages/query-core/src'),
      '@web-loom/event-bus-core': resolve(__dirname, '../../packages/event-bus-core/src'),
      '@web-loom/ui-core': resolve(__dirname, '../../packages/ui-core/src'),
      '@web-loom/ui-core/react': resolve(__dirname, '../../packages/ui-core/src/adapters/react'),
      '@web-loom/ui-patterns': resolve(__dirname, '../../packages/ui-patterns/src'),
      '@repo/shared': resolve(__dirname, '../../packages/shared/src'),
      '@repo/ui': resolve(__dirname, '../../packages/ui/src'),
      '@repo/view-models': resolve(__dirname, '../../packages/view-models/src'),
    },
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@web-loom/design-core',
      '@web-loom/store-core',
      '@web-loom/mvvm-core',
      '@web-loom/query-core',
      '@web-loom/event-bus-core',
      '@web-loom/ui-core',
      '@web-loom/ui-patterns',
    ],
  },
  build: {
    target: 'esnext',
    sourcemap: true,
  },
  define: {
    __DEV__: process.env.NODE_ENV === 'development',
  },
});
