import { defineConfig } from 'vite';
import { createAliases } from '../../scripts/vite-alias';

export default defineConfig({
  server: {
    port: 5180,
    strictPort: true,
  },
  resolve: {
    alias: createAliases(__dirname),
  },
});
