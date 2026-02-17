import { defineConfig } from 'vite';
import { createAliases } from '../../scripts/vite-alias';

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: createAliases(__dirname),
  },
});
