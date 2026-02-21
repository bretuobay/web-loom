import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { createAliases } from '../../scripts/vite-alias';

// https://vite.dev/config/
export default defineConfig({
  cacheDir: 'node_modules/.vite',
  server: {
    port: 5174,
    strictPort: true,
  },
  plugins: [vue()],
  resolve: {
    alias: createAliases(__dirname),
  },
  optimizeDeps: {
    include: ['vue', 'vue-router', 'chart.js', 'vue-chartjs'],
  },
  build: {
    target: 'esnext',
    sourcemap: true,
  },
  define: {
    __VUE_OPTIONS_API__: true,
    __VUE_PROD_DEVTOOLS__: false,
  },
});
