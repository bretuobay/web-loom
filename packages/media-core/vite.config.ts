import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    outDir: 'dist',
    lib: {
      entry: './src/index.ts',
      formats: ['es', 'umd'],
      name: 'MediaCore',
      fileName: (format) => `media-core.${format}.js`,
    },
    rollupOptions: {
      output: {},
    },
  },
  css: {
    modules: false,
  },
  plugins: [
    dts({
      insertTypesEntry: true,
      outDir: 'dist',
      tsconfigPath: './tsconfig.json',
      rollupTypes: true,
    }),
  ],
  server: {
    fs: {
      allow: ['.', 'tests'],
    },
  },
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 10000,
  },
});
