import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    outDir: 'dist',
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es', 'umd'],
      name: 'UIPatterns',
      fileName: (format) => `ui-patterns.${format}.js`,
    },
    rollupOptions: {
      external: [
        '@web-loom/ui-core',
        '@web-loom/store-core',
        '@web-loom/event-bus-core',
        '@web-loom/mvvm-core',
        '@web-loom/query-core',
      ],
      output: {
        globals: {
          '@web-loom/ui-core': 'UICore',
          '@web-loom/store-core': 'StoreCore',
          '@web-loom/event-bus-core': 'EventBusCore',
          '@web-loom/mvvm-core': 'MVVMCore',
          '@web-loom/query-core': 'QueryCore',
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
