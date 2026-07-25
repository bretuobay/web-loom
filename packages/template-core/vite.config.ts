import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    outDir: 'dist',
    lib: {
      entry: {
        index: './src/index.ts',
        compiler: './src/compiler/index.ts',
        ssr: './src/ssr/index.ts',
      },
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => `${entryName}.${format}.js`,
    },
    rollupOptions: {
      external: ['@web-loom/signals-core', 'parse5'],
      output: {},
    },
  },
  plugins: [
    dts({
      insertTypesEntry: true,
      outDir: 'dist',
      tsconfigPath: './tsconfig.json',
      rollupTypes: true,
      exclude: ['src/**/*.test.ts'],
    }),
  ],
});
