import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    outDir: 'dist',
    lib: {
      entry: './src/index.ts',
      formats: ['es', 'umd'],
      name: 'UICore',
      fileName: (format) => `ui-core.${format}.js`,
    },
    rollupOptions: {
      external: ['@web-loom/store-core', '@web-loom/event-bus-core'],
      output: {
        globals: {
          '@web-loom/store-core': 'StoreCore',
          '@web-loom/event-bus-core': 'EventBusCore',
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
