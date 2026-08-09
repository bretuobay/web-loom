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
      external: ['eslint', '@web-loom/template-core/compiler-node', '@web-loom/template-core-tooling'],
    },
  },
  plugins: [dts({ insertTypesEntry: true })],
});
