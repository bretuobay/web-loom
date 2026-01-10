import { defineConfig } from 'vite';
import { resolve } from 'path';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@repo/models': resolve(__dirname, '../../packages/models/src'),
      '@repo/view-models': resolve(
        __dirname,
        '../../packages/view-models/src',
      ),
      '@repo/shared': resolve(__dirname, '../../packages/shared/src'),
      '@repo/plugin-core': resolve(__dirname, '../../packages/plugin-core/src'),
    },
  },
});
