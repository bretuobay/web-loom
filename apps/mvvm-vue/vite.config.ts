import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path'; // Added for path resolution
import svgLoader from 'vite-svg-loader';

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), svgLoader({})],
  resolve: {
    alias: {
      '@repo/models': path.resolve(__dirname, '../../packages/models/src'),
      '@repo/view-models': path.resolve(__dirname, '../../packages/view-models/src'),
      // If you have specific file imports like '@repo/view-models/someFile',
      // you might not need a separate wildcard alias for Vite if the main alias works.
      // Vite's resolver can often handle subpaths if the main package path is aliased.
      // However, if direct imports like '@repo/view-models/src/someFile' are used
      // and not just '@repo/view-models', ensure those are also considered or handled
      // by your TypeScript paths and component imports.
    },
  },
});
