import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    outDir: 'dist',
    lib: {
      entry: './src/index.ts',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format}.js`,
    },
    rollupOptions: {
      external: ['node:http', 'node:fs/promises', 'node:path', 'vite'],
    },
  },
  plugins: [dts({ insertTypesEntry: true })],
});
