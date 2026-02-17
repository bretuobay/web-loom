import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { createAliases } from '../../scripts/vite-alias';

// https://vite.dev/config/
export default defineConfig({
  server: {
    port: 5179,
    strictPort: true,
  },
  plugins: [react()] as any, // Type assertion to handle Vite version mismatch
  resolve: {
    alias: createAliases(__dirname),
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
  },
  build: {
    target: 'esnext',
    sourcemap: true,
  },
  define: {
    __DEV__: process.env.NODE_ENV === 'development',
  },
});
