import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { createAliases } from '../../scripts/vite-alias';

// External packages to pre-bundle (not workspace packages which are linked)
const optimizeDepsInclude = [
  'react',
  'react-dom',
];

export default defineConfig({
  server: {
    port: 5178,
    strictPort: true,
  },
  plugins: [react()],
  resolve: {
    alias: createAliases(__dirname),
  },
  optimizeDeps: {
    include: optimizeDepsInclude,
  },
  define: {
    __DEV__: process.env.NODE_ENV === 'development',
  },
});
