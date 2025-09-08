import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    outDir: 'dist', // Explicitly set outDir
    lib: {
      entry: './src/index.ts',
      formats: ['es', 'umd'],
      name: 'ProseScriber', // For UMD global variable
      fileName: (format) => `prose-scriber.${format}.js`,
    },
    rollupOptions: {
      // No external dependencies for ProseScriber
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
