import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { createAliases } from '../../scripts/vite-alias';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5180,
    strictPort: true,
  },
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: createAliases(__dirname),
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
});
