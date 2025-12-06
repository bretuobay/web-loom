import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  cacheDir: 'node_modules/.vite',
  optimizeDeps: {
    include: ['@web-loom/mvvm-core', '@web-loom/ui-core', '@web-loom/router-core'],
  },
});
