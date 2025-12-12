import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  resolve: {
    alias: {
      '@web-loom/query-core': resolve(__dirname, '../query-core/src/index.ts'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true, // Clear dist directory before building
    lib: {
      entry: './src/index.ts',
      formats: ['es', 'umd'],
      name: 'MVVMCore',
      fileName: 'index',
    },
    rollupOptions: {
      external: ['rxjs', 'zod', '@web-loom/query-core'],
      output: {
        globals: {
          rxjs: 'rxjs',
          zod: 'Zod',
          '@web-loom/query-core': 'QueryCore',
        },
      },
    },
  },
  plugins: [
    dts({
      insertTypesEntry: true,
      outDir: 'dist',
      tsconfigPath: './tsconfig.json',
      rollupTypes: true,
      exclude: ['**/*.test.ts', '**/*.spec.ts', '**/examples/**'],
    }),
  ],
});
