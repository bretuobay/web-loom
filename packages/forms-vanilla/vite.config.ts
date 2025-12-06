import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
      include: ['src/**/*'],
      exclude: ['src/**/*.test.*', 'src/**/*.spec.*', 'tests/**/*'],
      tsconfigPath: './tsconfig.json',
    }),
  ],
  resolve: {
    alias: {
      '@web-loom/forms-core': resolve(__dirname, '../forms-core/src'),
    },
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'WebLoomFormsVanilla',
      fileName: 'index',
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: ['@web-loom/forms-core', 'zod'],
      output: {
        globals: {
          '@web-loom/forms-core': 'WebLoomFormsCore',
          zod: 'Zod',
        },
      },
    },
    sourcemap: true,
    minify: 'terser',
  },
});
