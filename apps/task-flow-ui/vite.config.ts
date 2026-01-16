import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  server: {
    port: 5178,
    strictPort: true,
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@web-loom/design-core': path.resolve(__dirname, '../../packages/design-core/src'),
      '@web-loom/store-core': path.resolve(__dirname, '../../packages/store-core/src'),
      '@web-loom/mvvm-core': path.resolve(__dirname, '../../packages/mvvm-core/src'),
      '@web-loom/query-core': path.resolve(__dirname, '../../packages/query-core/src'),
      '@web-loom/event-bus-core': path.resolve(__dirname, '../../packages/event-bus-core/src'),
      '@web-loom/event-emitter-core': path.resolve(__dirname, '../../packages/event-emitter-core/src'),
      '@web-loom/ui-core': path.resolve(__dirname, '../../packages/ui-core/src'),
      '@web-loom/ui-patterns': path.resolve(__dirname, '../../packages/ui-patterns/src'),
      '@repo/shared': path.resolve(__dirname, '../../packages/shared/src'),
      '@repo/plugin-core': path.resolve(__dirname, '../../packages/plugin-core/src'),
      '@repo/models': path.resolve(__dirname, '../../packages/models/src'),
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
      '@repo/models',
    ],
  },
  define: {
    __DEV__: process.env.NODE_ENV === 'development',
  },
});
