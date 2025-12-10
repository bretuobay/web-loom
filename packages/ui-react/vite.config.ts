import { defineConfig } from 'vite';
import { resolve } from 'path';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    react(),
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
  resolve: {
    alias: {
      '@web-loom/design-core/design-system': resolve(__dirname, '../design-core/src/design-system'),
      '@web-loom/design-core': resolve(__dirname, '../design-core/src/index.ts'),
      '@web-loom/ui-core': resolve(__dirname, '../ui-core/src/index.ts'),
      '@web-loom/ui-patterns': resolve(__dirname, '../ui-patterns/src/index.ts'),
      '@web-loom/store-core': resolve(__dirname, '../store-core/src/index.ts'),
      '@web-loom/event-bus-core': resolve(__dirname, '../event-bus-core/src/index.ts'),
      '@repo/ui-react': resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
      },
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => {
        if (format === 'es') return `${entryName}.js`;
        if (format === 'cjs') return `${entryName}.cjs`;
        return `${entryName}.${format}.js`;
      },
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        '@web-loom/design-core',
        '@web-loom/ui-core',
        '@web-loom/ui-patterns',
        '@web-loom/store-core',
        '@web-loom/event-bus-core',
      ],
      output: {
        preserveModules: true,
        preserveModulesRoot: 'src',
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'jsxRuntime',
          '@web-loom/design-core': 'DesignCore',
          '@web-loom/ui-core': 'UICore',
          '@web-loom/ui-patterns': 'UIPatterns',
          '@web-loom/store-core': 'StoreCore',
          '@web-loom/event-bus-core': 'EventBusCore',
        },
      },
    },
    sourcemap: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false,
        pure_funcs: ['console.log'],
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      provider: 'v8',
    },
  },
});
