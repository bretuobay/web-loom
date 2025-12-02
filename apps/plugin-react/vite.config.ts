// vite.config.ts
import { defineConfig } from 'vite';
import { resolve } from 'path';

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
    // de-dupe if the plugin is linked during local dev
    dedupe: ['react', 'react-dom'],
  },
  build: {
    rollupOptions: {
      // don't bundle these; use host's copies
      external: ['react', 'react-dom', 'react/jsx-runtime'],
    },
    target: 'esnext',
    sourcemap: true,
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
  },
  define: {
    __DEV__: process.env.NODE_ENV === 'development',
  },
});
