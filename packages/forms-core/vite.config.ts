import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    outDir: 'dist',
    lib: {
      entry: './src/index.ts',
      formats: ['es', 'umd'],
      name: 'FormsCore',
      fileName: (format) => `forms-core.${format}.js`,
    },
    rollupOptions: {
      external: ['zod', '@web-loom/storage-core', '@web-loom/event-emitter-core'],
      output: {
        globals: {
          zod: 'Zod',
          '@web-loom/storage-core': 'StorageCore',
          '@web-loom/event-emitter-core': 'EventEmitterCore',
        },
      },
    },
    minify: 'terser',
    sourcemap: true,
  },
  plugins: [
    dts({
      insertTypesEntry: true,
      outDir: 'dist',
      tsconfigPath: './tsconfig.json',
      rollupTypes: true,
      exclude: ['tests/**/*', '**/*.test.ts', '**/*.spec.ts'],
    }),
  ],
});
