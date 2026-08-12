import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    outDir: 'dist',
    lib: {
      entry: './src/index.ts',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format}.js`,
    },
    rollupOptions: {
      external: [
        'vite',
        'typescript',
        'magic-string',
        '@web-loom/template-core',
        '@web-loom/template-core/compiler-node',
        '@web-loom/template-core-tooling',
        'node:crypto',
        'node:fs',
        'node:path',
      ],
    },
  },
  plugins: [
    dts({
      insertTypesEntry: true,
      exclude: ['src/**/*.test.ts', 'src/__fixtures__/**'],
    }),
  ],
});
