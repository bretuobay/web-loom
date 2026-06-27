import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    outDir: 'dist',
    lib: {
      entry: {
        index: './src/index.ts',
        persist: './src/persist.ts',
      },
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => `${entryName}.${format}.js`,
    },
    rollupOptions: {
      output: {},
    },
  },
  plugins: [dts({ outDir: 'dist', tsconfigPath: './tsconfig.json', rollupTypes: true })],
  server: {
    fs: {
      allow: ['.', 'tests'],
    },
  },
});
