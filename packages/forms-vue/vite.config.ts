import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    vue(),
    dts({
      insertTypesEntry: true,
      include: ['src/**/*'],
      exclude: ['src/**/*.test.*', 'src/**/*.spec.*', 'src/test-utils.ts', 'tests/**/*'],
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
      name: 'WebLoomFormsVue',
      fileName: 'index',
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: ['vue', '@web-loom/forms-core', 'zod'],
      output: {
        globals: {
          vue: 'Vue',
          '@web-loom/forms-core': 'WebLoomFormsCore',
          zod: 'Zod',
        },
      },
    },
    sourcemap: true,
    minify: 'terser',
    emptyOutDir: true,
  },
});
