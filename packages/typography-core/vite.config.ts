import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    outDir: 'dist', // Explicitly set outDir
    lib: {
      entry: './src/index.ts',
      formats: ['es', 'umd'],
      name: 'TypographyCore', // For UMD global variable
      fileName: (format) => `typography-core.${format}.js`,
    },
    rollupOptions: {
      // No external dependencies for TypographyCore
      output: {
        // No globals needed as no externals
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
});
