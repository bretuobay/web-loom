import { defineConfig } from 'vite';
import { templateCorePrecompile } from '../../index.js';

// Path substring `__fixtures__/` is excluded by the plugin's own default `exclude` (a
// defensive default for real consumer apps). This fixture IS the thing under test, so it
// opts back in explicitly.
export default defineConfig({
  build: {
    outDir: 'dist',
    minify: false,
    lib: {
      entry: {
        'template-browser': './template-browser.ts',
        'template-ssr': './template-ssr.ts',
        'template-nonliteral': './template-nonliteral.ts',
      },
      formats: ['es'],
      fileName: (_format, entryName) => `${entryName}.js`,
    },
    rollupOptions: {
      external: ['@web-loom/template-core', '@web-loom/template-core/ssr', '@web-loom/template-core/compiler-node'],
    },
  },
  plugins: [templateCorePrecompile({ exclude: [/node_modules\//] })],
});
