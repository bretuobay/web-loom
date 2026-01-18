import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    outDir: 'dist',
    lib: {
      entry: './src/index.ts',
      formats: ['es', 'umd'],
      name: 'EventEmitterCore',
      fileName: (format) => `event-emitter-core.${format}.js`,
    },
    rollupOptions: {
      output: {
        // No globals needed as no externals
      },
    },
  },
  plugins: [
    dts({
      insertTypesEntry: true,
      outDir: 'dist',
      tsconfigPath: './tsconfig.json',
      rollupTypes: true,
    }),
  ],
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      enabled: true,
      reporter: ['text', 'html'],
      reportsDirectory: './coverage',
    },
  },
});
