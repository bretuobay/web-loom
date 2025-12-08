import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    outDir: 'dist', // Explicitly set outDir
    lib: {
      entry: './src/index.ts',
      formats: ['es', 'umd'],
      name: 'NotificationsCore', // For UMD global variable
      fileName: (format) => `notifications-core.${format}.js`,
    },
    rollupOptions: {
      external: ['@web-loom/event-emitter-core'],
      output: {
        globals: {
          '@web-loom/event-emitter-core': 'EventEmitterCore',
        },
      },
    },
  },
  plugins: [dts({ insertTypesEntry: true, outDir: 'dist', tsconfigPath: './tsconfig.json', rollupTypes: true })], // also specify for dts plugin
  server: {
    // Expose tests directory for the custom runner
    fs: {
      allow: ['.', 'tests'], // Allow serving files from root and tests directory
    },
  },
  // test: {
  //   globals: true, // Optional: to use vitest globals like describe, it without importing
  //   environment: 'node', // Or 'jsdom'
  //   testTimeout: 10000, // Global timeout of 10 seconds
  // },
});
