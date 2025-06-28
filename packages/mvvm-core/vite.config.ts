import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    clearScreen: false,
    outDir: 'dist', // Explicitly set outDir
    lib: {
      entry: './src/index.ts',
      formats: ['es', 'umd'],
      name: 'index',
      fileName: 'index',
    },
  },
  plugins: [dts({ insertTypesEntry: true, outDir: 'dist', tsconfigPath: './tsconfig.json', rollupTypes: true })], // also specify for dts plugin
  test: {
    globals: true, // Optional: to use vitest globals like describe, it without importing
    environment: 'node', // Or 'jsdom'
    testTimeout: 10000, // Global timeout of 10 seconds
  },
});
