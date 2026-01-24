import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
  build: {
    outDir: 'dist', // Explicitly set outDir
    lib: {
      entry: {
        'design-core.es': './src/index.ts', // Main bundle for backwards compatibility
        index: './src/index.ts',
        'utils/index': './src/utils/index.ts',
        'types/index': './src/types/index.ts',
      },
      formats: ['es'],
      name: 'DesignCore', // For UMD global variable
    },
    rollupOptions: {
      // No external dependencies for QueryCore
      output: {
        // Preserve module structure for better tree-shaking
        preserveModules: false,
        entryFileNames: '[name].js',
        // No globals needed as no externals
      },
    },
  },
  plugins: [
    dts({
      insertTypesEntry: true,
      outDir: 'dist',
      tsconfigPath: './tsconfig.json',
      rollupTypes: false, // Don't roll up types, keep them separate
    }),
  ], // also specify for dts plugin
  server: {
    // Expose tests directory for the custom runner
    fs: {
      allow: ['.', 'tests'], // Allow serving files from root and tests directory
    },
  },
  test: {
    globals: true, // Optional: to use vitest globals like describe, it without importing
    environment: 'node', // Or 'jsdom'
    testTimeout: 10000, // Global timeout of 10 seconds
  },
});
