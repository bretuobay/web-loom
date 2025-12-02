import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'WebLoomFormsVue',
      fileName: 'index',
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: ['vue', '@web-loom/forms-core'],
      output: {
        globals: {
          vue: 'Vue',
          '@web-loom/forms-core': 'WebLoomFormsCore',
        },
      },
    },
    sourcemap: true,
    minify: 'terser',
    emptyOutDir: true,
  },
});
