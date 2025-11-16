import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    outDir: 'dist',
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es', 'umd'],
      name: 'UICore',
      fileName: (format) => `ui-core.${format}.js`,
    },
    rollupOptions: {
      external: ['@web-loom/store-core', '@web-loom/event-bus-core', 'react', 'vue'],
      output: {
        globals: {
          '@web-loom/store-core': 'StoreCore',
          '@web-loom/event-bus-core': 'EventBusCore',
          'react': 'React',
          'vue': 'Vue',
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
    }),
  ],
  server: {
    fs: {
      allow: ['.', 'tests'],
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    testTimeout: 10000,
  },
});
