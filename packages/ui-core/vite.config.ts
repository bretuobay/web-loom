import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  resolve: {
    alias: {
      '@web-loom/store-core': resolve(__dirname, '../store-core/src/index.ts'),
      '@web-loom/event-bus-core': resolve(__dirname, '../event-bus-core/src/index.ts'),
    },
  },
  build: {
    outDir: 'dist',
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        // Individual behavior entries for tree-shaking
        'behaviors/dialog': resolve(__dirname, 'src/behaviors/dialog.ts'),
        'behaviors/disclosure': resolve(__dirname, 'src/behaviors/disclosure.ts'),
        'behaviors/form': resolve(__dirname, 'src/behaviors/form.ts'),
        'behaviors/list-selection': resolve(__dirname, 'src/behaviors/list-selection.ts'),
        'behaviors/roving-focus': resolve(__dirname, 'src/behaviors/roving-focus.ts'),
        modal: resolve(__dirname, 'src/modal/index.ts'),
        // Framework adapters
        'adapters/react': resolve(__dirname, 'src/adapters/react/index.ts'),
        'adapters/vue': resolve(__dirname, 'src/adapters/vue/index.ts'),
        'adapters/angular': resolve(__dirname, 'src/adapters/angular/index.ts'),
      },
      formats: ['es'],
      name: 'UICore',
    },
    rollupOptions: {
      external: ['@web-loom/store-core', '@web-loom/event-bus-core', 'react', 'vue', 'rxjs'],
      output: {
        // Preserve module structure for tree-shaking
        preserveModules: true,
        preserveModulesRoot: 'src',
        entryFileNames: '[name].js',
        // Ensure proper chunking
        manualChunks: undefined,
        globals: {
          '@web-loom/store-core': 'StoreCore',
          '@web-loom/event-bus-core': 'EventBusCore',
          react: 'React',
          vue: 'Vue',
          rxjs: 'rxjs',
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
      outDir: 'dist',
      tsconfigPath: './tsconfig.json',
      entryRoot: 'src',
      staticImport: true,
      insertTypesEntry: false,
      rollupTypes: false,
      compilerOptions: {
        declarationMap: false,
      },
    }),
  ],
  server: {
    fs: {
      allow: ['.', 'tests'],
    },
  },
});
