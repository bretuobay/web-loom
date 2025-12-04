import { defineConfig } from 'vite';
import { resolve } from 'path';
import react from '@vitejs/plugin-react-swc';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@repo/models': resolve(__dirname, '../../packages/models/src'),
      '@repo/view-models': resolve(__dirname, '../../packages/view-models/src'),
      '@repo/shared': resolve(__dirname, '../../packages/shared/src'),
      '@web-loom/mvvm-core': resolve(__dirname, '../../packages/mvvm-core/src'),
      '@web-loom/ui-core': resolve(__dirname, '../../packages/ui-core/src'),
      '@web-loom/ui-patterns': resolve(__dirname, '../../packages/ui-patterns/src'),
      '@web-loom/store-core': resolve(__dirname, '../../packages/store-core/src'),
      '@web-loom/event-bus-core': resolve(__dirname, '../../packages/event-bus-core/src'),
      '@web-loom/media-core': resolve(__dirname, '../../packages/media-core/src'),
      '@web-loom/media-react': resolve(__dirname, '../../packages/media-react/src'),
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
    exclude: ['@web-loom/mvvm-core', '@web-loom/ui-core', '@web-loom/ui-patterns', '@web-loom/store-core', '@web-loom/event-bus-core', '@web-loom/media-core', '@web-loom/media-react'],
  },
  build: {
    target: 'esnext',
    sourcemap: true,
  },
  define: {
    __DEV__: process.env.NODE_ENV === 'development',
  },
});
