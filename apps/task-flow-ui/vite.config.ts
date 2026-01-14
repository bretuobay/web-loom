import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  server: {
    port: 5178,
    strictPort: true,
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@web-loom/design-core': path.resolve(__dirname, '../../packages/design-core/src'),
      '@web-loom/design-core/design-system': path.resolve(
        __dirname,
        '../../packages/design-core/src/design-system'
      ),
    },
  },
});
