import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    outDir: 'dist',
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        // Individual pattern entries for tree-shaking
        'patterns/command-palette': resolve(__dirname, 'src/patterns/command-palette.ts'),
        'patterns/master-detail': resolve(__dirname, 'src/patterns/master-detail.ts'),
        'patterns/modal': resolve(__dirname, 'src/patterns/modal.ts'),
        'patterns/sidebar-shell': resolve(__dirname, 'src/patterns/sidebar-shell.ts'),
        'patterns/tabbed-interface': resolve(__dirname, 'src/patterns/tabbed-interface.ts'),
        'patterns/toast-queue': resolve(__dirname, 'src/patterns/toast-queue.ts'),
        'patterns/wizard': resolve(__dirname, 'src/patterns/wizard.ts'),
      },
      formats: ['es'],
      name: 'UIPatterns',
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
        // Preserve module structure for tree-shaking
        preserveModules: true,
        preserveModulesRoot: 'src',
        entryFileNames: '[name].js',
        // Ensure proper chunking
        manualChunks: undefined,
        globals: {
          '@web-loom/ui-core': 'UICore',
          '@web-loom/store-core': 'StoreCore',
          '@web-loom/event-bus-core': 'EventBusCore',
          '@web-loom/mvvm-core': 'MVVMCore',
          '@web-loom/query-core': 'QueryCore',
        },
      },
    },
    // Enable minification for production
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false,
        pure_funcs: ['console.log'],
      },
    },
    // Source maps for debugging
    sourcemap: true,
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
});
