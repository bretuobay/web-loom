import { defineConfig } from 'vite';
import { createAliases } from '../../scripts/vite-alias';

export default defineConfig({
  server: {
    port: 5182,
    strictPort: true,
  },
  resolve: {
    alias: createAliases(__dirname),
  },
});
