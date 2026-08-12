import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { templateCoreLoom } from '@web-loom/template-core-vite';
import { createAliases } from '../../scripts/vite-alias';

export default defineConfig({
  server: {
    port: 5182,
    strictPort: true,
  },
  plugins: [templateCoreLoom()],
  resolve: {
    alias: {
      ...createAliases(__dirname),
      '@web-loom/template-core-vite-ssr': resolve(__dirname, '../../packages/template-core-vite-ssr/src'),
    },
  },
});
