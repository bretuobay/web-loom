import { defineConfig } from 'vite';
import { resolve } from 'path';

// https://vite.dev/config/
export default defineConfig({
  cacheDir: 'node_modules/.vite',
  server: {
    port: 5173,
    strictPort: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@repo/models': resolve(__dirname, '../../packages/models/src'),
      '@repo/view-models': resolve(__dirname, '../../packages/view-models/src'),
      '@repo/shared': resolve(__dirname, '../../packages/shared/src'),
      '@web-loom/mvvm-core': resolve(__dirname, '../../packages/mvvm-core/src'),
      '@web-loom/ui-core': resolve(__dirname, '../../packages/ui-core/src'),
      '@web-loom/ui-patterns': resolve(__dirname, '../../packages/ui-patterns/src'),
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', '@web-loom/mvvm-core', '@web-loom/ui-core', '@web-loom/ui-patterns'],
  },
  build: {
    target: 'esnext',
    sourcemap: true,
  },
  define: {
    __DEV__: process.env.NODE_ENV === 'development',
  },
});
