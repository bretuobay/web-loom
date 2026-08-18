import { defineConfig } from 'vite';
import { templateCoreLoom } from '../../index.js';

export default defineConfig({
  build: {
    outDir: 'dist',
    minify: false,
    lib: {
      entry: './importer.ts',
      formats: ['es'],
      fileName: () => 'importer.js',
    },
    rollupOptions: {
      external: ['@web-loom/template-core', '@web-loom/template-core/compiler-node'],
    },
  },
  plugins: [templateCoreLoom()],
});
