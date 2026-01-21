import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    outDir: 'dist',
    lib: {
      entry: './src/index.ts',
      formats: ['es', 'umd'],
      name: 'ChartsCore',
      fileName: (format) => `charts-core.${format}.js`,
    },
    rollupOptions: {
      output: {
        // No external globals required; consumers provide peer deps.
      },
    },
  },
  plugins: [
    dts({
      insertTypesEntry: true,
      outDir: 'dist',
      tsconfigPath: './tsconfig.json',
      rollupTypes: false,
      skipDiagnostics: true,
    }),
  ],
  server: {
    fs: {
      allow: ['.', 'tests'],
    },
  },
});
