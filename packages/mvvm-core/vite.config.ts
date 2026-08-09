import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig(({ command }) => ({
  resolve: {
    // Only alias to sibling source for dev/test (fast iteration without a
    // prebuilt dist). The production build must resolve these as real
    // external packages, or vite-plugin-dts bakes the aliased source path
    // into the shipped .d.ts instead of the package's own type exports.
    alias:
      command === 'build'
        ? {}
        : {
            '@web-loom/query-core': resolve(__dirname, '../query-core/src/index.ts'),
            '@web-loom/signals-core': resolve(__dirname, '../signals-core/src/index.ts'),
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
      external: ['rxjs', 'zod', '@web-loom/query-core', '@web-loom/signals-core'],
      output: {
        globals: {
          rxjs: 'rxjs',
          zod: 'Zod',
          '@web-loom/query-core': 'QueryCore',
          '@web-loom/signals-core': 'SignalsCore',
        },
      },
    },
  },
  plugins: [
    dts({
      insertTypesEntry: true,
      outDir: 'dist',
      tsconfigPath: './tsconfig.json',
      rollupTypes: false,
      exclude: ['**/*.test.ts', '**/*.spec.ts', '**/examples/**'],
    }),
  ],
}));
