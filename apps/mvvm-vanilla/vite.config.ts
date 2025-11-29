import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  optimizeDeps: {
    include: ['@web-loom/mvvm-core', '@web-loom/ui-core', '@web-loom/ui-patterns'],
  },
});
