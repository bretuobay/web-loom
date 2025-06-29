import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { resolve } from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@web-loom/design-core': resolve(__dirname, '../../packages/design-core/src'),
      '@web-loom/store-core': resolve(__dirname, '../../packages/store-core/src'),
      '@web-loom/mvvm-core': resolve(__dirname, '../../packages/mvvm-core/src'),
      '@web-loom/query-core': resolve(__dirname, '../../packages/query-core/src'),
      '@web-loom/event-bus-core': resolve(__dirname, '../../packages/event-bus-core/src'),
      '@repo/shared': resolve(__dirname, '../../packages/shared/src'),
      '@repo/ui': resolve(__dirname, '../../packages/ui/src'),
      '@repo/view-models': resolve(__dirname, '../../packages/view-models/src'),
    },
  },
});
