import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import path from 'node:path';

export default defineConfig({
  plugins: [
    react(),
    dts({
      entryRoot: 'src',
    }),
  ],
  resolve: {
    alias: {
      '@web-loom/media-core': path.resolve(__dirname, '../media-core/src'),
    },
  },
  build: {
    sourcemap: true,
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'MediaReact',
      formats: ['es', 'cjs'],
      fileName: (format) => (format === 'cjs' ? 'index.cjs' : 'index.js'),
    },
    rollupOptions: {
      external: ['react', 'react-dom', '@web-loom/media-core'],
    },
  },
});
